import { Pool, PoolClient } from 'pg'
import { LineString, Position } from 'geojson'
import config from './config'
import { Lane, Route, Waypoint, WaypointType } from '../common/types'
import { partition } from '../common/util'

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
  vertex: number | null
  i: number
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
  const result = await client.query(
    `
    WITH closest AS (
      SELECT id, source, target, ST_ClosestPoint(lane.geom, origin.geom) point, origin.geom origin
      FROM lane, (VALUES (${point})) origin(geom)
      ${depth ? `WHERE depth IS NULL OR depth >= ${depth}` : ''}
      ORDER BY lane.geom <-> origin.geom
      LIMIT 1
    )
    SELECT c.id AS lane, c.point, AsJSON(ST_MakeLine(c.origin, c.point)) AS geometry,
      CASE c.point
        WHEN s.the_geom THEN c.source
        WHEN t.the_geom THEN c.target
      END AS vertex,
      $3 AS i
    FROM closest c
    JOIN lane_vertices_pgr s ON c.source = s.id
    JOIN lane_vertices_pgr t ON c.target = t.id`,
    [lng, lat, -i]
  )
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

const escape = (sql: string): string => sql.replace(/'/g, "''")

const insertExtraLanes = async (
  client: PoolClient,
  endpoints: RouteEndpoint[]
): Promise<void> => {
  let lId = -10000
  const query = `
    INSERT INTO extra_lane (id, source, target, length, depth, height, geom)
    SELECT s.id, s.source, s.target, s.length, l.depth, l.height, s.geom
    FROM lane l,
    LATERAL split_linestring($1, $2, $3, l.geom, l.source, l.target, l.length, $4) AS s(id INT, source INT, target INT, length FLOAT, geom Geometry)
    WHERE l.id = $5
  `
  const filteredEndpoints = endpoints.filter(({ vertex }) => vertex === null)
  for (const { point, lane, i } of filteredEndpoints) {
    await client.query(query, [--lId, --lId, i, point, lane])
  }
}

const getRouteBetweenVertices = async (
  client: PoolClient,
  routeNumber: number,
  from: RouteEndpoint,
  to: RouteEndpoint,
  depth?: number,
  height?: number
): Promise<Route> => {
  assertNumber(depth)
  assertNumber(height)

  const settingsWhere = `
    WHERE true
    ${depth ? `AND depth IS NULL OR depth >= ${depth}` : ''}
    ${height ? `AND height IS NULL OR height >= ${height}` : ''}`

  const laneQuery = `
    SELECT id, source, target, length AS cost, length AS reverse_cost
    FROM lane
    ${settingsWhere}
    ${from.vertex === null ? `AND id <> ${from.lane}` : ''}
    ${to.vertex === null ? `AND id <> ${to.lane}` : ''}
    UNION
    SELECT id, source, target, length AS cost, length AS reverse_cost
    FROM extra_lane
    ${settingsWhere}`

  const query = `
    WITH ids AS (SELECT edge AS id, node, seq FROM pgr_dijkstra(
      '${escape(laneQuery)}', $1::bigint, $2::bigint, directed := false
    )),
    lanes AS (SELECT length, geom, node = source AS forward, ids.seq
              FROM lane JOIN ids ON lane.id = ids.id
              UNION
              SELECT length, geom, node = source AS forward, ids.seq
              FROM extra_lane e JOIN ids ON e.id = ids.id)
    SELECT SUM(length) AS length, AsJSON(ST_MakeLine(CASE WHEN forward THEN geom ELSE ST_Reverse(geom) END ORDER BY seq ASC)) AS geometry FROM lanes`

  const result = await client.query(query, [
    from.vertex || from.i,
    to.vertex || to.i,
  ])
  const { geometry, length } = result.rows[0]
  const startAndEnd = [
    formatLane(from.geometry, routeNumber),
    formatLane(to.geometry, routeNumber),
  ]

  if (length === null) {
    const route = formatLane(
      makeLinestring(
        startAndEnd[0].geometry.coordinates[1],
        startAndEnd[1].geometry.coordinates[1]
      ),
      routeNumber
    )
    return { route, startAndEnd, found: false, type: to.type }
  } else {
    const route = formatLane(JSON.parse(geometry), routeNumber)
    return { route, length, startAndEnd, found: true, type: to.type }
  }
}

export const getRoute = async (
  points: Waypoint[],
  depth?: number,
  height?: number
): Promise<Route[]> => {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    await client.query(
      'CREATE TEMPORARY TABLE extra_lane (id INT, source INT, target INT, length FLOAT, depth FLOAT, height FLOAT, geom Geometry) ON COMMIT DROP'
    )
    const endpoints = await Promise.all(
      points.map(
        (point, i): Promise<RouteEndpoint> =>
          getClosestPoint(client, i, point, depth)
      )
    )
    await insertExtraLanes(client, endpoints)
    return await Promise.all(
      partition(endpoints, 2, 1).map(
        ([from, to], index): Promise<Route> =>
          getRouteBetweenVertices(client, index, from, to, depth, height)
      )
    )
  } finally {
    await client.query('COMMIT')
    client.release()
  }
}
