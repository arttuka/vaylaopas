import { Geometry } from 'geojson'
import { Pool, PoolClient } from 'pg'
import config from './config'
import {
  Lane,
  LaneCollection,
  LngLat,
  RawLane,
  Route,
  VertexCollection,
  Vertex,
} from '../common/lane'

const pool = new Pool(config.db)

const vars = (count: number, from: number = 1): string => {
  const arr = []
  for (let i = 0; i < count; i += 1) {
    arr.push(`$${i + from}`)
  }
  return `(${arr.join(',')})`
}

const formatLane = ({ geometry }: RawLane): Lane => ({
  type: 'Feature',
  geometry: JSON.parse(geometry),
  properties: {},
})

const asGeoJSON = (geometry: string): string =>
  `ST_AsGeoJSON(ST_Transform(${geometry}, 4326), 6)`

export const getLanes = async (ids: number[] = []): Promise<LaneCollection> => {
  let result
  if (ids.length) {
    result = await pool.query(
      `SELECT ${asGeoJSON('geom')} AS geometry FROM lane WHERE id in ${vars(
        ids.length
      )}`,
      ids
    )
  } else {
    result = await pool.query(
      `SELECT ${asGeoJSON('geom')} AS geometry FROM lane`
    )
  }
  const lanes = result.rows.map(formatLane)
  return {
    type: 'FeatureCollection',
    features: lanes,
  }
}

export const getVertices = async (
  ids: number[] = []
): Promise<VertexCollection> => {
  let result
  if (ids.length) {
    result = await pool.query(
      `SELECT ${asGeoJSON(
        'the_geom'
      )} AS geometry FROM lane_vertices_pgr WHERE id in ${vars(ids.length)}`,
      ids
    )
  } else {
    result = await pool.query(
      `SELECT ${asGeoJSON('the_geom')} AS geometry FROM lane_vertices_pgr`
    )
  }
  const vertices = result.rows.map(
    ({ geometry }): Vertex => ({
      type: 'Feature',
      geometry: JSON.parse(geometry),
      properties: {},
    })
  )
  return {
    type: 'FeatureCollection',
    features: vertices,
  }
}

export const getGaps = async (): Promise<VertexCollection> => {
  const result = await pool.query(
    `SELECT ${asGeoJSON(
      'the_geom'
    )} AS geometry FROM lane_vertices_pgr WHERE chk = 1`
  )
  const vertices = result.rows.map(
    ({ geometry }): Vertex => ({
      type: 'Feature',
      geometry: JSON.parse(geometry),
      properties: {},
    })
  )
  return {
    type: 'FeatureCollection',
    features: vertices,
  }
}

const getClosestVertexId = async (
  client: PoolClient,
  p: LngLat
): Promise<{ id: number; line: string }> => {
  const point = `ST_Transform(
    'SRID=4326;POINT(${p.lng} ${p.lat})'::geometry, 3067
  )`
  const result = await client.query(`
  SELECT id, ${asGeoJSON(`ST_MakeLine(${point}, the_geom)`)} AS line
  FROM lane_vertices_pgr
  ORDER BY the_geom <-> ${point} LIMIT 1`)
  return result.rows[0]
}

export const getRoute = async (from: LngLat, to: LngLat): Promise<Route> => {
  const client = await pool.connect()
  const start = await getClosestVertexId(client, from)
  const end = await getClosestVertexId(client, to)
  const result = await client.query(`
  SELECT length, ${asGeoJSON('geom')} AS geometry
  FROM lane
  WHERE id IN (
    SELECT edge FROM pgr_dijkstra(
      'SELECT id, source, target, length as cost, length as reverse_cost FROM lane',
      ${start.id}, ${end.id}
    )
  )`)
  const route: LaneCollection = {
    type: 'FeatureCollection',
    features: result.rows.map(formatLane),
  }
  const length = result.rows.reduce(
    (sum, { length }): number => sum + length,
    0
  )
  const startAndEnd: LaneCollection = {
    type: 'FeatureCollection',
    features: [
      formatLane({ geometry: start.line }),
      formatLane({ geometry: end.line }),
    ],
  }
  client.release()
  return {
    route,
    length,
    startAndEnd,
  }
}
