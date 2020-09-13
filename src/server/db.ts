import { Pool, PoolClient } from 'pg'
import { LineString, Position } from 'geojson'
import config from './config'
import { Lane, Route, Waypoint, WaypointType } from '../common/types'
import { spreadIf, partition, pick, range } from '../common/util'

const pool = new Pool(config.db)

const formatLane = (geometry: LineString, routeNumber: number): Lane => ({
  type: 'Feature',
  geometry,
  properties: {
    route: routeNumber,
  },
})

const makeLinestring = (p1: Position, p2: Position): LineString => ({
  type: 'LineString',
  coordinates: [p1, p2],
})

interface RouteEndpoint {
  lane: number
  vertex: number
  geometry: LineString
  point: string
  type: WaypointType
}

const getClosestPoints = async (
  client: PoolClient,
  points: Waypoint[],
  depth?: number
): Promise<RouteEndpoint[]> => {
  const query = `
    SELECT l.id AS lane, l.point, AsJSON(ST_MakeLine(origin.geom, l.point)) AS geometry, origin.type,
      CASE l.point
        WHEN s.the_geom THEN l.source
        WHEN t.the_geom THEN l.target
        ELSE -(origin.seq + 1)
      END AS vertex
    FROM (
      SELECT ST_Transform(
              ST_SetSRID(
                ST_MakePoint(UNNEST($1::FLOAT[]), UNNEST($2::FLOAT[])),
                4326
              ),
              3067
            ) AS geom, UNNEST($3::TEXT[]) AS type, UNNEST($4::INT[]) AS seq
      ) origin,
      LATERAL (
        SELECT id, source, target, ST_ClosestPoint(geom, origin.geom) point
        FROM lane
        ${depth ? `WHERE depth IS NULL OR depth >= $5` : ''}
        ORDER BY geom <-> origin.geom
        LIMIT 1
      ) l
      JOIN lane_vertices_pgr s ON l.source = s.id
      JOIN lane_vertices_pgr t ON l.target = t.id
    ORDER BY origin.seq
  `

  const result = await client.query(query, [
    pick(points, 'lng'),
    pick(points, 'lat'),
    pick(points, 'type'),
    range(points.length),
    ...spreadIf(depth),
  ])

  return result.rows.map(({ geometry, ...endpoint }) => ({
    geometry: JSON.parse(geometry),
    ...endpoint,
  }))
}

const assertNumber = (n?: number): void => {
  if (n !== undefined && typeof n !== 'number') {
    throw new Error(`Expected ${n} to be a number, got ${typeof n}`)
  }
}

const insertExtraLanes = async (
  client: PoolClient,
  endpoints: RouteEndpoint[]
): Promise<void> => {
  const query = `
    INSERT INTO extra_lane (id, laneid, source, target, length, depth, height, geom)
    SELECT s.id, p.laneid, s.source, s.target, s.length, p.depth, p.height, s.geom
    FROM (
      SELECT array_agg(p.id) AS vertex_ids, array_agg(p.point) AS points, l.id AS laneid, l.geom, l.source, l.target, l.length, l.depth, l.height
      FROM UNNEST($1::INT[], $2::INT[], $3::TEXT[]) p(id, laneid, point)
      JOIN lane l ON p.laneid = l.id
      GROUP BY l.id
    ) AS p,
    LATERAL split_linestring(p.vertex_ids, p.points, p.geom, p.source, p.target, p.length) AS s(id INT, source INT, target INT, length FLOAT, geom Geometry)`
  const filteredEndpoints = endpoints.filter(({ vertex }) => vertex < 0)
  await client.query(query, [
    pick(filteredEndpoints, 'vertex'),
    pick(filteredEndpoints, 'lane'),
    pick(filteredEndpoints, 'point'),
  ])
}

const getRouteBetweenVertices = async (
  client: PoolClient,
  endpoints: RouteEndpoint[],
  depth?: number,
  height?: number
): Promise<Route[]> => {
  const settingsWhere = [
    ...spreadIf(depth, `depth IS NULL OR depth >= ${depth}`),
    ...spreadIf(height, `height IS NULL OR height >= ${height}`),
  ].join(' AND ')

  const laneQuery = `
    SELECT id, source, target, length AS cost
    FROM lane
    WHERE NOT EXISTS (SELECT 1 FROM extra_lane WHERE laneid = lane.id)
    ${settingsWhere && `AND ${settingsWhere}`}
    UNION ALL
    SELECT id, source, target, length AS cost
    FROM extra_lane
    ${settingsWhere && `WHERE ${settingsWhere}`}`

  const vertexQuery = `(VALUES ${partition(endpoints, 2, 1)
    .map(([from, to], i) => `(${from.vertex}, ${to.vertex}, ${i})`)
    .join(',')})`

  const result = await client.query(`
    WITH ids AS (
      SELECT edge AS id, node, seq, start_vid, end_vid
      FROM pgr_dijkstra(
        '${laneQuery}',
        'SELECT source, target FROM ${vertexQuery} v(source, target)',
        directed := false
      )
    ),
    lanes AS (
      SELECT length, geom, node = source AS forward, ids.seq, ids.start_vid, ids.end_vid
      FROM lane l JOIN ids ON l.id = ids.id
      UNION ALL
      SELECT length, geom, node = source AS forward, ids.seq, ids.start_vid, ids.end_vid
      FROM extra_lane e JOIN ids ON e.id = ids.id
    )
    SELECT COUNT(length) > 0 AS found, SUM(length) AS length,
           AsJSON(ST_MakeLine(CASE WHEN forward THEN geom ELSE ST_Reverse(geom) END ORDER BY seq ASC)) AS geometry
    FROM ${vertexQuery} v(v_from, v_to, num)
    LEFT JOIN lanes ON start_vid = v_from AND end_vid = v_to
    GROUP BY num
    ORDER BY num ASC`)

  return result.rows.map(({ geometry, length, found }, i) => {
    const from = endpoints[i]
    const to = endpoints[i + 1]
    const route = formatLane(
      found
        ? JSON.parse(geometry)
        : makeLinestring(
            from.geometry.coordinates[1],
            to.geometry.coordinates[1]
          ),
      i
    )
    return {
      route,
      startAndEnd: [formatLane(from.geometry, i), formatLane(to.geometry, i)],
      found,
      type: to.type,
      length: length || undefined,
    }
  })
}

export const getRoute = async (
  points: Waypoint[],
  depth?: number,
  height?: number
): Promise<Route[]> => {
  assertNumber(depth)
  assertNumber(height)
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    await client.query(
      'CREATE TEMPORARY TABLE extra_lane (id INT, laneid INT, source INT, target INT, length FLOAT, depth FLOAT, height FLOAT, geom Geometry) ON COMMIT DROP'
    )
    const endpoints = await getClosestPoints(client, points, depth)
    await insertExtraLanes(client, endpoints)
    return getRouteBetweenVertices(client, endpoints, depth, height)
  } finally {
    await client.query('COMMIT')
    client.release()
  }
}
