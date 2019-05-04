import { Client, QueryResult } from 'pg'
import config from './config'
import { addMany } from '../common/util'

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

interface IntersectionDict {
  [key: number]: SavedIntersection
}

interface Lane {
  id: number
  intersections: Set<number>
}

interface LaneDict {
  [key: number]: Lane
}

const dropTable = (table: string): Promise<QueryResult> =>
  client.query(`DROP TABLE IF EXISTS ${table}`)

const createTable = async (table: string): Promise<void> => {
  await dropTable(table)
  await dropTable(`${table}_vertices_pgr`)
  await client.query(`
    CREATE TABLE ${table} (
      id serial PRIMARY KEY,
      old_id integer,
      segment integer,
      jnro integer,
      vay_nimisu varchar(254),
      vay_nimiru varchar(254),
      tila numeric,
      vaylalaji numeric,
      valaistus numeric,
      kulkusyv1 numeric,
      kulkusyv2 numeric,
      kulkusyv3 numeric,
      merial_nr numeric,
      seloste_al varchar(254),
      seloste_pa varchar(254),
      diaarinro varchar(254),
      vahv_pvm date,
      vayla_lk varchar(254),
      irrotus_pv varchar(254),
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
      (jnro, vay_nimisu, vay_nimiru, tila, vaylalaji, valaistus, kulkusyv1, kulkusyv2, kulkusyv3, merial_nr, seloste_al, seloste_pa, diaarinro, vahv_pvm, vayla_lk, irrotus_pv, geom)
      SELECT jnro::integer, vay_nimisu, vay_nimiru, tila, vaylalaji, valaistus, kulkusyv1, kulkusyv2, kulkusyv3, merial_nr, seloste_al, seloste_pa, diaarinro, vahv_pvm, vayla_lk, irrotus_pv, (ST_Dump(geom)).geom AS geom
      FROM ${tableFrom}
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
    const maxId = (await client.query(
      `SELECT MAX(id) + 1 AS maxid FROM ${verticesTo}`
    )).rows[0].maxid
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

const getLanes = async (): Promise<LaneDict> => {
  const result = await client.query(`SELECT id FROM ${tableTmp}`)
  const ret: LaneDict = {}
  result.rows.forEach(
    ({ id }): void => {
      ret[id] = {
        id,
        intersections: new Set(),
      }
    }
  )
  return ret
}

const getEndpoints = async (): Promise<IntersectionDict> => {
  const result = await client.query(`
    SELECT v.id, v.the_geom AS point
    FROM ${verticesTmp} v
  `)
  const ret: IntersectionDict = {}
  result.rows.forEach(
    ({ id, point }): void => {
      ret[id] = {
        id,
        point,
        laneIds: new Set(),
      }
    }
  )
  return ret
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
      AND ST_DWithin(l.geom, v.the_geom, ${tolerance});`,
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
  iDict: IntersectionDict
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
      GROUP BY point, v.id;`,
      [laneId]
    )
    return result.rows.map(
      ({ laneids, point, id }): Intersection => {
        if (id) {
          const intersection = iDict[id]
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
      `Error saving intersection ${i.id} between ${i.laneIds} with geom ${
        i.point
      }`
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
    INSERT INTO ${tableTo} (old_id, segment, source, target, length, geom, jnro, vay_nimisu, vay_nimiru, tila, vaylalaji, valaistus, kulkusyv1, kulkusyv2, kulkusyv3, merial_nr, seloste_al, seloste_pa, diaarinro, vahv_pvm, vayla_lk, irrotus_pv)
    SELECT 
      l.id AS old_id, "from".num AS segment, "from".id AS source, "to".id AS target, ST_Length(ST_LineSubstring(l.geom, "from".distance, "to".distance)) AS length, ST_LineSubstring(l.geom, "from".distance, "to".distance) AS geom,
      l.jnro, l.vay_nimisu, l.vay_nimiru, l.tila, l.vaylalaji, l.valaistus, l.kulkusyv1, l.kulkusyv2, l.kulkusyv3, l.merial_nr, l.seloste_al, l.seloste_pa, l.diaarinro, l.vahv_pvm, l.vayla_lk, l.irrotus_pv
    FROM distances AS "from"
    JOIN distances AS "to" ON "from".num + 1 = "to".num
    JOIN ${tableTmp} l ON l.id = $1;
`
  try {
    await client.query(query, [l.id, ...Array.from(l.intersections)])
  } catch (err) {
    console.error(`Error saving lane ${l.id}`)
    throw err
  }
}

const convert = async (): Promise<void> => {
  try {
    await client.connect()
    await client.query('BEGIN')
    await createTables()
    const intersections: IntersectionDict = await getEndpoints()
    const lanes: LaneDict = await getLanes()

    let count = 0
    const progress = (): void => {
      count -= 1
      if (count % 100 === 0) {
        console.log(count)
      }
    }

    count = Object.values(intersections).length
    console.log(`Processing ${count} vertices`)
    for (const intersection of Object.values(intersections)) {
      progress()
      ;(await findGaps(intersection.id)).forEach(
        (laneId): void => {
          lanes[laneId].intersections.add(intersection.id)
          intersections[intersection.id].laneIds.add(laneId)
        }
      )
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
        intersection.laneIds.forEach(
          (id): void => {
            lanes[id].intersections.add(intersectionId)
          }
        )
      }
    }

    count = Object.values(lanes).length
    console.log(`Saving ${count} lanes`)
    for (const lane of Object.values(lanes)) {
      progress()
      await saveLane(lane)
    }
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
