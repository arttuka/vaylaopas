import { Pool, PoolClient } from 'pg'
import { LineString } from 'geojson'
import config from './config'
import { Lane, LngLat, Route } from '../common/lane'
import { partition } from '../common/util'

const pool = new Pool(config.db)

const formatLane = (geometry: LineString, routeNumber: number): Lane => ({
  type: 'Feature',
  geometry,
  properties: {
    route: routeNumber,
  },
})

interface RouteEndpoint {
  id: number
  geometry: LineString
}

const getClosestVertex = async (
  client: PoolClient,
  p: LngLat
): Promise<RouteEndpoint> => {
  const point = `ST_Transform(
    'SRID=4326;POINT(${p.lng} ${p.lat})'::geometry, 3067
  )`
  const result = await client.query(`
    SELECT id, AsJSON(ST_MakeLine(${point}, the_geom)) AS geometry
    FROM lane_vertices_pgr
    ORDER BY the_geom <-> ${point} LIMIT 1
  `)
  const { id, geometry } = result.rows[0]
  return {
    id,
    geometry: JSON.parse(geometry),
  }
}

const getRouteBetweenVertices = async (
  client: PoolClient,
  from: RouteEndpoint,
  to: RouteEndpoint,
  routeNumber: number
): Promise<Route> => {
  const result = await client.query(`
  SELECT length, AsJSON(geom) AS geometry
  FROM lane
  WHERE id IN (
    SELECT edge FROM pgr_dijkstra(
      'SELECT id, source, target, length AS cost, length AS reverse_cost FROM lane',
      ${from.id}, ${to.id}
    )
  )`)
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

export const getRoute = async (points: LngLat[]): Promise<Route[]> => {
  const client = await pool.connect()
  try {
    const endpoints = await Promise.all(
      points.map(
        (point): Promise<RouteEndpoint> => getClosestVertex(client, point)
      )
    )
    return await Promise.all(
      partition(endpoints, 2, 1).map(
        ([from, to], i): Promise<Route> =>
          getRouteBetweenVertices(client, from, to, i)
      )
    )
  } finally {
    client.release()
  }
}
