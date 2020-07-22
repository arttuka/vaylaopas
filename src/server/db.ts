import { Pool, PoolClient } from 'pg'
import { LineString, Point } from 'geojson'
import config from './config'
import { Lane, Route, Waypoint, Waypoints, WaypointType } from '../common/types'
import { partition, range, takeUntil } from '../common/util'

const pool = new Pool(config.db)
const [lIdFrom1, lIdFrom2, vIdFrom, lIdTo1, lIdTo2, vIdTo] = range(6, 1000000)

const formatLane = (geometry: LineString, routeNumber: number): Lane => ({
  type: 'Feature',
  geometry,
  properties: {
    route: routeNumber,
  },
})

interface RouteEndpoint {
  lane: number
  vertex: number | null
  geometry: LineString
  point: Point
  type: WaypointType
}

const getClosestPoint = async (
  client: PoolClient,
  p: Waypoint
): Promise<RouteEndpoint> => {
  const { lng, lat, type } = p
  const point = `ST_Transform(
    ST_SetSRID(ST_MakePoint($1, $2), 4326),
    3067
  )`
  const result = await client.query(
    `
    WITH closest AS (
      SELECT id, source, target, ST_ClosestPoint(geom, ${point}) point FROM lane
      ORDER BY geom <-> ${point}
      LIMIT 1
    )
    SELECT c.id AS lane, c.point, AsJSON(ST_MakeLine(${point}, c.point)) AS geometry,
      CASE c.point
        WHEN s.the_geom THEN c.source
        WHEN t.the_geom THEN c.target
      END AS vertex
    FROM closest c
    JOIN lane_vertices_pgr s ON c.source = s.id
    JOIN lane_vertices_pgr t ON c.target = t.id`,
    [lng, lat]
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

const extraLaneQuery = (
  lId1: number,
  lId2: number,
  vId: number,
  point: Point,
  laneId: number
): string => `
  SELECT s.id, s.source, s.target, s.length, l.depth, l.height, s.geom
  FROM lane l,
  LATERAL split_linestring(${lId1}, ${lId2}, ${vId}, l.geom, l.source, l.target, l.length, '${point}') AS s(id int, source int, target int, length float, geom geometry)
  WHERE l.id = ${laneId}
`

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
  let extraLanesSql = ''
  if (from.vertex === null || to.vertex === null) {
    const query = [
      from.vertex === null &&
        extraLaneQuery(lIdFrom1, lIdFrom2, vIdFrom, from.point, from.lane),
      to.vertex === null &&
        extraLaneQuery(lIdTo1, lIdTo2, vIdTo, to.point, to.lane),
    ]
      .filter((x) => !!x)
      .join(' UNION ')
    const result = await client.query(query)
    extraLanesSql = `(values ${result.rows
      .map(
        ({ id, source, target, length, depth, height, geom }) =>
          `(${id}, ${source}, ${target}, ${length}, ${depth}::FLOAT, ${height}::FLOAT, '${geom}'::GEOMETRY(LINESTRING))`
      )
      .join(',')}) e(id, source, target, length, depth, height, geom)`
  }
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
    ${
      extraLanesSql &&
      `UNION SELECT id, source, target, length AS cost, length AS reverse_cost FROM ${extraLanesSql} ${settingsWhere}`
    }`

  const query = `
    WITH ids AS (SELECT edge AS id FROM pgr_dijkstra(
      '${escape(laneQuery)}', $1::bigint, $2::bigint
    ))
    SELECT length, AsJSON(geom) AS geometry
    FROM lane JOIN ids ON lane.id = ids.id
    ${
      extraLanesSql &&
      `UNION SELECT length, AsJSON(geom) AS geometry FROM ${extraLanesSql} JOIN ids ON e.id = ids.id`
    }`
  const result = await client.query(query, [
    from.vertex || vIdFrom,
    to.vertex || vIdTo,
  ])
  const route = result.rows.map(
    ({ geometry }): Lane => formatLane(JSON.parse(geometry), routeNumber)
  )
  const length = result.rows.reduce(
    (sum, { length }): number => sum + length,
    0
  )
  const startAndEnd = [
    formatLane(from.geometry, routeNumber),
    formatLane(to.geometry, routeNumber),
  ]
  return { route, length, startAndEnd }
}

const mergeRoutes = (r1: Route, r2: Route): Route => ({
  route: [...r1.route, ...r2.route],
  startAndEnd: [r1.startAndEnd[0], r2.startAndEnd[1]],
  length: r1.length + r2.length,
})

const getRouteSegment = async (
  client: PoolClient,
  routeNumber: number,
  endpoints: RouteEndpoint[],
  depth?: number,
  height?: number
): Promise<Route> => {
  const routes = await Promise.all(
    partition(endpoints, 2, 1).map(
      ([from, to]): Promise<Route> =>
        getRouteBetweenVertices(client, routeNumber, from, to, depth, height)
    )
  )
  return routes.reduce(mergeRoutes)
}

const splitEndpoints = (endpoints: RouteEndpoint[]): RouteEndpoint[][] => {
  const result: RouteEndpoint[][] = []
  let points = endpoints
  while (points.length > 1) {
    const [p, ...rest] = points
    const ps = takeUntil(rest, (e) => e.type === 'destination')
    result.push([p, ...ps])
    points = points.slice(ps.length)
  }
  return result
}

export const getRoute = async (
  points: Waypoints,
  depth?: number,
  height?: number
): Promise<Route[]> => {
  const client = await pool.connect()
  try {
    const endpoints = await Promise.all(
      points.map(
        (point): Promise<RouteEndpoint> => getClosestPoint(client, point)
      )
    )
    const segments = splitEndpoints(endpoints)
    return await Promise.all(
      segments.map(
        (segment, index): Promise<Route> =>
          getRouteSegment(client, index, segment, depth, height)
      )
    )
  } finally {
    client.release()
  }
}
