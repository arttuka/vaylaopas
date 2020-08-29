import { Pool, PoolClient } from 'pg'
import { LineString, Position } from 'geojson'
import config from './config'
import { Lane, Route, Waypoint, WaypointType } from '../common/types'
import { pick, range } from '../common/util'

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

const getClosestPoint = async (
  client: PoolClient,
  i: number,
  p: Waypoint,
  depth?: number
): Promise<RouteEndpoint> => {
  const { lng, lat, type } = p
  const point = `ST_Transform(
    ST_SetSRID(ST_MakePoint($1, $2), 4326),
    3067
  )`
  const query = `
    SELECT c.id AS lane, c.point, AsJSON(ST_MakeLine(c.origin, c.point)) AS geometry,
      CASE c.point
        WHEN s.the_geom THEN c.source
        WHEN t.the_geom THEN c.target
        ELSE $3
      END AS vertex
    FROM (
      SELECT id, source, target, ST_ClosestPoint(l.geom, origin.geom) point, origin.geom origin
      FROM lane l, (VALUES (${point})) origin(geom)
      ${depth ? `WHERE depth IS NULL OR depth >= ${depth}` : ''}
      ORDER BY l.geom <-> origin.geom
      LIMIT 1
    ) c
    JOIN lane_vertices_pgr s ON c.source = s.id
    JOIN lane_vertices_pgr t ON c.target = t.id`
  const result = await client.query(query, [lng, lat, -i])
  const { geometry, ...endpoint } = result.rows[0]
  return {
    ...endpoint,
    geometry: JSON.parse(geometry),
    type,
  }
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
      SELECT array_agg(p.id) AS vertex_ids, array_agg(p.point) AS points, p.laneid, l.geom, l.source, l.target, l.length, l.depth, l.height
      FROM UNNEST($1::INT[], $2::INT[], $3::TEXT[]) p(id, laneid, point)
      JOIN lane l ON p.laneid = l.id
      GROUP BY p.laneid, l.geom, l.source, l.target, l.length, l.depth, l.height
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
  const settingsWhere =
    depth || height
      ? `${depth ? `depth IS NULL OR depth >= ${depth}` : ''}
         ${depth && height ? 'AND' : ''}
         ${height ? `height IS NULL OR height >= ${height}` : ''}`
      : ''

  const vertexIds = pick(endpoints, 'vertex')

  const laneQuery = `
    SELECT id, source, target, length AS cost, length AS reverse_cost
    FROM lane
    WHERE NOT EXISTS (SELECT 1 FROM extra_lane WHERE laneid = lane.id)
    ${settingsWhere && `AND ${settingsWhere}`}
    UNION
    SELECT id, source, target, length AS cost, length AS reverse_cost
    FROM extra_lane
    ${settingsWhere && `WHERE ${settingsWhere}`}`

  const vertexQuery = `UNNEST(
    ARRAY[${vertexIds.slice(0, -1).join(',')}]::INT[],
    ARRAY[${vertexIds.slice(1).join(',')}]::INT[],
    ARRAY[${range(vertexIds.length - 1).join(',')}]::INT[]
  )`

  const result = await client.query(`
    WITH ids AS (
      SELECT edge AS id, node, seq, start_vid, end_vid
      FROM pgr_dijkstra(
        '${laneQuery}',
        'SELECT source, target FROM ${vertexQuery} v(source, target)',
        directed := false
      )
    ),
    lanes AS (SELECT length, geom, node = source AS forward, ids.seq, ids.start_vid, ids.end_vid
              FROM lane l JOIN ids ON l.id = ids.id
              UNION
              SELECT length, geom, node = source AS forward, ids.seq, ids.start_vid, ids.end_vid
              FROM extra_lane e JOIN ids ON e.id = ids.id)
    SELECT
      COUNT(length) > 0 AS found, SUM(length) AS length,
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
    const endpoints = await Promise.all(
      points.map(
        (point, i): Promise<RouteEndpoint> =>
          getClosestPoint(client, i + 1, point, depth)
      )
    )
    await insertExtraLanes(client, endpoints)
    return getRouteBetweenVertices(client, endpoints, depth, height)
  } finally {
    await client.query('COMMIT')
    client.release()
  }
}
