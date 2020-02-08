import { Client, QueryResult } from 'pg'
import config from '../server/config'
import { Index } from '../common/types'
import { addMany, mapBy } from '../common/util'
import manualLanes from './manualLanes.json'
import obstructions from './obstructions.json'

const client = new Client(config.db)
const tableFrom = 'lane_tmp'
const tableTmp = 'lane_single'
const verticesTmp = `${tableTmp}_vertices_pgr`
const tableTo = 'lane'
const verticesTo = `${tableTo}_vertices_pgr`
const tolerance = 10

interface Intersection {
  id?: number
  laneIds: Set<number>
  point: string
}

interface SavedIntersection extends Intersection {
  id: number
}

const isSaved = (i: Intersection): i is SavedIntersection => i.id !== undefined

type IntersectionIndex = Index<SavedIntersection>

interface Lane {
  id: number
  intersections: Set<number>
}

type LaneIndex = Index<Lane>

const dropTable = (table: string): Promise<QueryResult> =>
  client.query(`DROP TABLE IF EXISTS ${table}`)

const createTable = async (table: string): Promise<void> => {
  await dropTable(table)
  await dropTable(`${table}_vertices_pgr`)
  await client.query(`
    CREATE TABLE ${table} (
      id serial PRIMARY KEY,
      segment integer,
      jnro integer,
      jnropart integer,
      name varchar(254),
      depth real,
      height real,
      length real,
      source integer,
      target integer
    )`)
  await client.query(
    `SELECT AddGeometryColumn('public', '${table}', 'geom', '3067', 'LINESTRING', 2)`
  )
}

const createTables = async (): Promise<void> => {
  try {
    await createTable(tableTmp)
    await client.query(`
      INSERT INTO ${tableTmp}
      (jnro, jnropart, name, depth, geom)
      SELECT jnro, ROW_NUMBER() OVER (PARTITION BY jnro) AS jnropart, name, depth, geom
      FROM (
        SELECT
          jnro::integer AS jnro, vay_nimisu AS name,
          COALESCE(kulkusyv1::real, kulkusyv2::real, kulkusyv3::real) AS depth,
          (ST_Dump(geom)).geom AS geom
        FROM ${tableFrom}
      ) parts
      ORDER BY jnro ASC
    `)
    await dropTable(tableFrom)
    await client.query(
      `SELECT pgr_createTopology('${tableTmp}', ${tolerance}, 'geom', 'id')`
    )
    await createTable(tableTo)
    await client.query(`
      CREATE TABLE ${verticesTo} (
        id serial8 PRIMARY KEY,
        cnt int,
        chk int,
        ein int,
        eout int
      )
    `)
    await client.query(`
      SELECT AddGeometryColumn('public', '${verticesTo}', 'the_geom', '3067', 'POINT', 2)
    `)
    await client.query(`
      INSERT INTO ${verticesTo} (id, the_geom)
      SELECT id, the_geom
      FROM ${verticesTmp}
    `)
    const maxId = (
      await client.query(`SELECT MAX(id) + 1 AS maxid FROM ${verticesTo}`)
    ).rows[0].maxid
    await client.query(`
      ALTER SEQUENCE ${verticesTo}_id_seq
      RESTART WITH ${maxId}
    `)
    await client.query(`
      ALTER TABLE ${tableTo}
      ADD CONSTRAINT ${tableTo}_source_fkey FOREIGN KEY(source) REFERENCES ${verticesTo}(id),
      ADD CONSTRAINT ${tableTo}_target_fkey FOREIGN KEY(target) REFERENCES ${verticesTo}(id)
    `)
  } catch (err) {
    console.error('Error creating tables')
    throw err
  }
}

const getLanes = async (): Promise<LaneIndex> => {
  const result = await client.query(`SELECT id FROM ${tableTmp}`)
  return mapBy(
    result.rows,
    ({ id }): number => id,
    ({ id }): Lane => ({
      id,
      intersections: new Set(),
    })
  )
}

const getEndpoints = async (): Promise<IntersectionIndex> => {
  const result = await client.query(`
    SELECT v.id, v.the_geom AS point
    FROM ${verticesTmp} v
  `)
  return mapBy(
    result.rows,
    ({ id }): number => id,
    ({ id, point }): SavedIntersection => ({
      id,
      point,
      laneIds: new Set(),
    })
  )
}

const findGaps = async (vertexId: number): Promise<number[]> => {
  try {
    const result = await client.query(
      `
      SELECT l.id
      FROM ${tableTmp} l, ${verticesTmp} v
      WHERE v.id = $1
      AND l.source != $1
      AND l.target != $1
      AND ST_DWithin(l.geom, v.the_geom, ${tolerance})`,
      [vertexId]
    )
    return result.rows.map(({ id }): number => id)
  } catch (err) {
    console.error(`Error finding gaps near vertex ${vertexId}`)
    throw err
  }
}

const findIntersections = async (
  laneId: number,
  index: IntersectionIndex
): Promise<Intersection[]> => {
  try {
    const result = await client.query(
      `
      WITH intersections AS (
        SELECT b.id AS id_b, a.source AS a_source, a.target AS a_target, b.source AS b_source, b.target AS b_target,
        (ST_Dump(Endpoints(ST_Intersection(a.geom, b.geom)))).geom AS point
        FROM ${tableTmp} a
        JOIN ${tableTmp} b
        ON a.id = $1
        AND b.id < $1
        AND ST_Intersects(a.geom, b.geom)
      )
      SELECT ARRAY_AGG(DISTINCT id_b) AS laneids, point, v.id
      FROM intersections i
      JOIN ${verticesTmp} sa ON a_source = sa.id
      JOIN ${verticesTmp} ta ON a_target = ta.id
      JOIN ${verticesTmp} sb ON b_source = sb.id
      JOIN ${verticesTmp} tb ON b_target = tb.id
      LEFT JOIN ${verticesTo} v ON (
        ST_DWithin(point, v.the_geom, ${tolerance})
        AND v.id NOT IN (a_source, a_target, b_source, b_target)
      )
      WHERE NOT ST_DWithin(point, sa.the_geom, ${tolerance})
      AND NOT ST_DWithin(point, ta.the_geom, ${tolerance})
      AND NOT ST_DWithin(point, sb.the_geom, ${tolerance})
      AND NOT ST_DWithin(point, tb.the_geom, ${tolerance})
      GROUP BY point, v.id
      ORDER BY point ASC`,
      [laneId]
    )
    return result.rows.map(
      ({ laneids, point, id }): Intersection => {
        if (id) {
          const intersection = index[id]
          addMany(intersection.laneIds, laneId, ...laneids)
          return intersection
        }
        return {
          point,
          laneIds: new Set([laneId, ...laneids]),
        }
      }
    )
  } catch (err) {
    console.log(`Error intersecting lane ${laneId}`)
    throw err
  }
}

const saveIntersection = async (
  i: Intersection
): Promise<SavedIntersection> => {
  try {
    const result = await client.query(
      `INSERT INTO ${verticesTo} (the_geom) VALUES ($1) RETURNING id`,
      [i.point]
    )
    i.id = result.rows[0].id
    return i as SavedIntersection
  } catch (err) {
    console.error(
      `Error saving intersection ${i.id} between ${i.laneIds} with geom ${i.point}`
    )
    throw err
  }
}

const saveLane = async (l: Lane): Promise<void> => {
  const placeholders = ['l.source', 'l.target']
  for (let i = 0; i < l.intersections.size; i += 1) {
    placeholders.push(`$${i + 2}`)
  }
  const query = `
    WITH distances AS (
      SELECT id, ROW_NUMBER() OVER (ORDER BY distance ASC) AS num, distance
      FROM (
        SELECT v.id, ST_LineLocatePoint(l.geom, v.the_geom) AS distance
        FROM ${tableTmp} l, ${verticesTo} v
        WHERE l.id = $1 AND v.id IN (${placeholders.join(',')})
      ) AS d
      ORDER BY distance ASC
    )
    INSERT INTO ${tableTo} (segment, source, target, length, geom, jnro, jnropart, name, depth, height)
    SELECT 
      "from".num AS segment, "from".id AS source, "to".id AS target, ST_Length(ST_LineSubstring(l.geom, "from".distance, "to".distance)) AS length, ST_LineSubstring(l.geom, "from".distance, "to".distance) AS geom,
      l.jnro, l.jnropart, l.name, l.depth, l.height
    FROM distances AS "from"
    JOIN distances AS "to" ON "from".num + 1 = "to".num
    JOIN ${tableTmp} l ON l.id = $1
`
  try {
    await client.query(query, [l.id, ...Array.from(l.intersections)])
  } catch (err) {
    console.error(`Error saving lane ${l.id}`)
    throw err
  }
}

const point = ([lng, lat]: number[]): string => `ST_Transform(
  'SRID=4326;POINT(${lng} ${lat})'::geometry, 3067
)`

const getClosestVertex = async (p: number[]): Promise<number> => {
  const result = await client.query(`
    SELECT id
    FROM ${verticesTo}
    ORDER BY the_geom <-> ${point(p)}
    LIMIT 1
  `)
  return result.rows[0].id
}

const saveManualLanes = async (): Promise<void> => {
  for (const lane of manualLanes) {
    const { depth, points } = lane
    const source = await getClosestVertex(points[0])
    const target = await getClosestVertex(points[points.length - 1])
    const line = `ST_MakeLine(Array[${[
      's.the_geom',
      ...points.slice(1, -1).map(point),
      't.the_geom',
    ].join(',')}])`
    const query = `
      INSERT INTO ${tableTo}
        (jnro, name, source, target, length, geom, depth)
      SELECT
        -1 AS jnro,
        'manual_' || s.id || '_' || t.id AS name,
        s.id AS source,
        t.id AS target,
        ST_Length(${line}) AS length,
        ${line} AS geom,
        $1 as depth
      FROM ${verticesTo} s
      JOIN ${verticesTo} t
      ON s.id = $2
      AND t.id = $3`
    try {
      const result = await client.query(query, [depth, source, target])
      if (result.rowCount !== 1) {
        console.error(`Error inserting manual lane from ${source} to ${target}`)
      }
    } catch (err) {
      console.error(
        `Error saving manual lane from ${source} to ${target}`,
        query
      )
      throw err
    }
  }
}

const saveObstructions = async (): Promise<void> => {
  for (const o of obstructions) {
    const { height, points } = o
    const line = `ST_MakeLine(Array[${points.map(point).join(',')}])`
    const query = `
      UPDATE ${tableTo}
      SET height = $1
      WHERE ST_Intersects(geom, ${line})`
    try {
      const result = await client.query(query, [height])
      if (result.rowCount === 0) {
        console.error(`Error inserting obstruction ${JSON.stringify(o)}`)
      }
    } catch (err) {
      console.error(`Error saving obstruction ${JSON.stringify(o)}`)
      throw err
    }
  }
}

const splitLanesAtObstructions = async (): Promise<Intersection[]> => {
  const result: Intersection[] = []
  for (const { points } of obstructions) {
    const query = `
      WITH obstruction AS (
        SELECT ST_MakeLine(Array[${points.map(point).join(',')}]) AS geom
      ),
      intersections AS (
        SELECT
          lane.id,
          lane.geom,
          ${tolerance} / ST_Length(lane.geom) AS distance_diff,
          ST_LineLocatePoint(lane.geom, ST_Intersection(lane.geom, obstruction.geom)) AS distance
        FROM ${tableTmp} AS lane, obstruction
        WHERE ST_Intersects(lane.geom, obstruction.geom)
      )
      SELECT
        id,
        ST_LineInterpolatePoint(geom, distance - distance_diff) AS p1,
        ST_LineInterpolatePoint(geom, distance + distance_diff) AS p2
      FROM intersections`
    try {
      for (const { id, p1, p2 } of (await client.query(query)).rows) {
        result.push({
          point: p1,
          laneIds: new Set([id]),
        })
        result.push({
          point: p2,
          laneIds: new Set([id]),
        })
      }
    } catch (err) {
      console.error(
        `Error splitting lanes at obstruction ${JSON.stringify(points)}`
      )
      throw err
    }
  }
  return result
}

const convert = async (): Promise<void> => {
  try {
    await client.connect()
    await client.query('BEGIN')
    await createTables()
    const intersections: IntersectionIndex = await getEndpoints()
    const lanes: LaneIndex = await getLanes()

    let count = 0
    const progress = (): void => {
      count -= 1
      if (count % 100 === 0) {
        console.log(count)
      }
    }

    count = Object.values(intersections).length
    console.log(`Processing ${count} vertices`)
    for (const { id, laneIds } of Object.values(intersections)) {
      progress()
      ;(await findGaps(id)).forEach((laneId): void => {
        lanes[laneId].intersections.add(id)
        laneIds.add(laneId)
      })
    }

    count = obstructions.length
    console.log(`Processing ${count} obstructions`)
    for (const intersection of await splitLanesAtObstructions()) {
      progress()
      const saved = await saveIntersection(intersection)
      intersections[saved.id] = saved
      intersection.laneIds.forEach((id): void => {
        lanes[id].intersections.add(saved.id)
      })
    }

    count = Object.values(lanes).length
    console.log(`Processing ${count} lanes`)
    for (const lane of Object.values(lanes).sort(
      (l1, l2): number => l1.id - l2.id
    )) {
      progress()
      for (const intersection of await findIntersections(
        lane.id,
        intersections
      )) {
        let intersectionId: number
        if (isSaved(intersection)) {
          intersectionId = intersection.id
        } else {
          const saved = await saveIntersection(intersection)
          intersections[saved.id] = saved
          intersectionId = saved.id
        }
        intersection.laneIds.forEach((id): void => {
          lanes[id].intersections.add(intersectionId)
        })
      }
    }

    count = Object.values(lanes).length
    console.log(`Saving ${count} lanes`)
    for (const lane of Object.values(lanes).sort(
      (l1, l2): number => l1.id - l2.id
    )) {
      progress()
      await saveLane(lane)
    }
    await saveManualLanes()
    await saveObstructions()
    await dropTable(tableTmp)
    await dropTable(verticesTmp)
    console.log('All done!')
    await client.query('COMMIT')
  } catch (err) {
    console.error('Error while processing', err)
    await client.query('ROLLBACK')
  } finally {
    await client.end()
  }
}

convert()
