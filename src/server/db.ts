import { Pool } from 'pg'
import config from './config'
import { Lane, LaneCollection, VertexCollection, Vertex } from '../common/lane'

const pool = new Pool(config.db)

const vars = (count: number, from: number = 1): string => {
  const arr = []
  for (let i = 0; i < count; i += 1) {
    arr.push(`$${i + from}`)
  }
  return `(${arr.join(',')})`
}

export const getLanes = async (ids: number[] = []): Promise<LaneCollection> => {
  const client = await pool.connect()
  let result
  if (ids.length) {
    result = await client.query(
      `SELECT gid, ST_AsGeoJSON(ST_Transform(geom, 4326), 6) AS geometry FROM lane WHERE gid in ${vars(
        ids.length
      )}`,
      ids
    )
  } else {
    result = await client.query(
      'SELECT gid, ST_AsGeoJSON(ST_Transform(geom, 4326), 6) AS geometry FROM lane'
    )
  }
  const lanes = result.rows.map(
    ({ gid, geometry }): Lane => ({
      type: 'Feature',
      geometry: JSON.parse(geometry),
      properties: { gid },
    })
  )
  client.release()
  return {
    type: 'FeatureCollection',
    features: lanes,
  }
}

export const getVertices = async (
  ids: number[] = []
): Promise<VertexCollection> => {
  const client = await pool.connect()
  let result
  if (ids.length) {
    result = await client.query(
      `SELECT ST_AsGeoJSON(ST_Transform(the_geom, 4326), 6) AS geometry FROM lane_vertices_pgr WHERE id in ${vars(
        ids.length
      )}`,
      ids
    )
  } else {
    result = await client.query(
      'SELECT ST_AsGeoJSON(ST_Transform(the_geom, 4326), 6) AS geometry FROM lane_vertices_pgr'
    )
  }
  const vertices = result.rows.map(
    ({ geometry }): Vertex => ({
      type: 'Feature',
      geometry: JSON.parse(geometry),
      properties: {},
    })
  )
  client.release()
  return {
    type: 'FeatureCollection',
    features: vertices,
  }
}

export const getGaps = async (): Promise<VertexCollection> => {
  const client = await pool.connect()
  const result = await client.query(
    'SELECT ST_AsGeoJSON(ST_Transform(the_geom, 4326), 6) AS geometry FROM lane_vertices_pgr WHERE chk = 1'
  )
  const vertices = result.rows.map(
    ({ geometry }): Vertex => ({
      type: 'Feature',
      geometry: JSON.parse(geometry),
      properties: {},
    })
  )
  client.release()
  return {
    type: 'FeatureCollection',
    features: vertices,
  }
}
