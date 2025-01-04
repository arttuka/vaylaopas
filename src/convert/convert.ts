import { Client, QueryResult } from 'pg'
import config from '../server/config'
import { Index } from '../common/types'
import { addMany, mapBy, range } from '../common/util'
import manualLanes from './manualLanes.json'
import obstructions from './obstructions.json'

const client = new Client(config.db)
const tableFrom = 'lane_tmp'
const tableTmp = 'lane_single'
const verticesTmp = `${tableTmp}_vertices_pgr`
const tableTo = 'lane'
const verticesTo = `${tableTo}_vertices_pgr`
const tolerance = 20

type Intersection = {
  id?: number
  laneIds: Set<number>
  point: string
}

type SavedIntersection = Intersection & {
  id: number
}

const isSaved = (i: Intersection): i is SavedIntersection => i.id !== undefined

const toIntersection = ({
  id,
  laneids,
  point,
}: {
  id?: number | null
  laneids?: number[]
  point: string
}): Intersection => ({
  id: id ?? undefined,
  laneIds: new Set(laneids || []),
  point,
})

type IntersectionIndex = Index<SavedIntersection>

type Lane = {
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
  await client.query(
    `CREATE INDEX ${table}_geom_idx ON ${table} USING GIST(geom)`
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
          (SELECT MAX(d) FROM UNNEST(STRING_TO_ARRAY(syvyydet, ', ')::real[]) AS d(d)) AS depth,
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
        id serial PRIMARY KEY
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
    result.rows.map(toIntersection).filter(isSaved),
    ({ id }): number => id
  )
}

const findGaps = async (): Promise<Intersection[]> => {
  try {
    const result = await client.query(
      `
      WITH gaps AS (
        SELECT CASE WHEN ST_Contains(l.geom, v.the_geom) THEN v.id ELSE null END id,
                l.id l_id,
                ST_ClosestPoint(l.geom, v.the_geom) point
        FROM ${tableTmp} l
        JOIN ${verticesTmp} v
        ON l.source <> v.id
        AND l.target <> v.id
        AND ST_DWithin(l.geom, v.the_geom, ${tolerance})
      )
      SELECT id, array_agg(l_id) laneids, point
      FROM gaps
      GROUP BY id, point
      ORDER BY id, point`
    )
    return result.rows.map(toIntersection)
  } catch (err) {
    console.error(`Error finding gaps`)
    throw err
  }
}

const findIntersections = async (): Promise<Intersection[]> => {
  const result = await client.query(`
    SELECT array_agg(distinct l.id) laneids, point.geom AS point
    FROM ${tableTmp} a
    JOIN ${tableTmp} b ON a.id < b.id AND ST_Intersects(a.geom, b.geom),
    LATERAL ST_Dump(Endpoints(ST_Intersection(a.geom, b.geom))) point,
    LATERAL (VALUES (a.id), (b.id)) l(id)
    WHERE NOT EXISTS (SELECT 1 FROM ${verticesTo} WHERE ST_DWithin(the_geom, point.geom, ${tolerance}))
    GROUP BY point.geom
    ORDER BY point.geom
  `)
  return result.rows.map(toIntersection)
}

const groupIntersections = async (): Promise<void> => {
  await client.query(`
    INSERT INTO ${tableTo} (jnro, name, length, source, target, geom)
    SELECT
      -2 AS jnro,
      'connect_' || v1.id || '_' || v2.id AS name,
      ST_Distance(v1.the_geom, v2.the_geom) AS length,
      v1.id AS source,
      v2.id AS target,
      ST_MakeLine(v1.the_geom, v2.the_geom) AS geom
    FROM ${verticesTo} v1
    JOIN ${verticesTo} v2 ON v1.id < v2.id AND ST_DWithin(v1.the_geom, v2.the_geom, ${tolerance})
    ORDER BY v1.id, v2.id
  `)
}

const saveIntersection = async (
  i: Intersection
): Promise<SavedIntersection> => {
  try {
    const result = await client.query(
      `INSERT INTO ${verticesTo} (the_geom) VALUES ($1) RETURNING id`,
      [i.point]
    )
    return { ...i, id: result.rows[0].id }
  } catch (err) {
    console.error(
      `Error saving intersection ${i.id} between ${i.laneIds} with geom ${i.point}`
    )
    throw err
  }
}

const saveLane = async (l: Lane): Promise<void> => {
  const placeholders = [
    'l.target',
    ...range(l.intersections.size).map((i) => `$${i + 2}`),
  ]
  const query = `
    INSERT INTO ${tableTo} (segment, source, target, length, geom, jnro, jnropart, name, depth, height)
    SELECT
      ROW_NUMBER() OVER (ORDER BY distance ASC) AS segment,
      LAG(d.id, 1, l.source) OVER (ORDER BY distance ASC) AS source,
      d.id AS target,
      ST_Length(ST_LineSubstring(l.geom, LAG(d.distance, 1, 0.0) OVER (ORDER BY distance ASC), distance)) AS length,
      ST_LineSubstring(l.geom, LAG(d.distance, 1, 0.0) OVER (ORDER BY distance ASC), distance) AS geom,
      l.jnro, l.jnropart, l.name, l.depth, l.height
    FROM ${tableTmp} l,
    LATERAL (
      SELECT split.id,
      split.id <> LAG(split.id, 1, l.source) OVER (ORDER BY distance asc)
        OR ST_Length(l.geom) * (distance - LAG(distance, 1, 0.0) OVER (ORDER BY distance asc)) > ${tolerance} AS include,
      distance
      FROM (
        SELECT v.id, ST_LineLocatePoint(l.geom, v.the_geom) AS distance
        FROM ${verticesTo} v
        WHERE v.id IN (${placeholders.join(',')})
        UNION
        (VALUES (l.target, 1.0))
        UNION
        SELECT l.source AS id, 1.0 - ST_LineLocatePoint(ST_Reverse(l.geom), v.the_geom) AS distance
        FROM ${verticesTo} v
        WHERE v.id = l.source
      ) AS split
    ) AS d
    WHERE l.id = $1 AND include
    ORDER BY distance ASC
  `
  try {
    await client.query(query, [l.id, ...Array.from(l.intersections)])
  } catch (err) {
    console.error(`Error saving lane ${l.id}`)
    console.error(query)
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
        ST_Length(line) AS length,
        line AS geom,
        $1 as depth
      FROM ${verticesTo} s,
      ${verticesTo} t,
      LATERAL (VALUES (${line})) line(line)
      WHERE s.id = $2
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
    const query = `
      UPDATE ${tableTo}
      SET height = $1
      WHERE ST_Intersects(geom, ST_MakeLine(${points.map(point).join(',')}))`
    try {
      const result = await client.query(query, [height])
      if (result.rowCount === 0) {
        console.error(`No lane found at obstruction ${JSON.stringify(o)}`)
      }
    } catch (err) {
      console.error(`Error saving obstruction ${JSON.stringify(o)}`)
      throw err
    }
  }
}

const splitLanesAtObstructions = async (): Promise<Intersection[]> => {
  const query = `
    WITH intersections AS (
      SELECT
        lane.id,
        lane.geom,
        ${tolerance} / ST_Length(lane.geom) AS distance_diff,
        ST_Intersection(lane.geom, obstruction.geom) AS point,
        ST_LineLocatePoint(lane.geom, ST_Intersection(lane.geom, obstruction.geom)) AS distance
      FROM ${tableTmp} AS lane
      JOIN (VALUES ${obstructions
        .map(({ points }) => `(ST_MakeLine(${points.map(point).join(',')}))`)
        .join(', ')}) AS obstruction(geom)
      ON ST_Intersects(lane.geom, obstruction.geom)
    )
    SELECT ARRAY[id] AS laneids, ST_LineInterpolatePoint(geom, distance - diff) AS point
    FROM intersections,
    LATERAL UNNEST(ARRAY[distance_diff, -distance_diff]) AS diff`
  try {
    return (await client.query(query)).rows.map(toIntersection)
  } catch (err) {
    console.error(`Error splitting lanes at obstructions`)
    throw err
  }
}

const removeUnnecessaryVertices = async (): Promise<void> => {
  await client.query(`
    DELETE FROM ${verticesTo} v
    WHERE NOT EXISTS (
      SELECT 1 FROM ${tableTo}
      WHERE source = v.id OR target = v.id
    )
  `)
}

const convert = async (): Promise<void> => {
  try {
    await client.connect()
    await client.query('BEGIN')
    await createTables()
    const intersections: IntersectionIndex = await getEndpoints()
    const lanes: LaneIndex = await getLanes()

    const saveIntersections = async (is: Intersection[]): Promise<void> => {
      for (const intersection of is) {
        try {
          let intersectionId: number
          if (isSaved(intersection)) {
            addMany(
              intersections[intersection.id].laneIds,
              ...intersection.laneIds
            )
            intersectionId = intersection.id
          } else {
            const saved = await saveIntersection(intersection)
            intersections[saved.id] = saved
            intersectionId = saved.id
          }
          intersection.laneIds.forEach((id): void => {
            lanes[id].intersections.add(intersectionId)
          })
        } catch (err) {
          console.error(
            `Error saving intersection ${JSON.stringify(intersection)}`
          )
          throw err
        }
      }
    }

    const gaps = await findGaps()
    console.log(`Processing ${Object.values(gaps).length} gaps`)
    await saveIntersections(gaps)

    const splits = await splitLanesAtObstructions()
    console.log(`Processing ${splits.length} splits at obstructions`)
    await saveIntersections(splits)

    const newIntersections = await findIntersections()
    console.log(`Processing ${newIntersections.length} intersections`)
    await saveIntersections(newIntersections)

    console.log(`Saving ${Object.values(lanes).length} lanes`)
    for (const lane of Object.values(lanes).sort(
      (l1, l2): number => l1.id - l2.id
    )) {
      await saveLane(lane)
    }
    await saveManualLanes()
    await saveObstructions()
    console.log('Grouping intersections')
    await groupIntersections()
    await removeUnnecessaryVertices()
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
