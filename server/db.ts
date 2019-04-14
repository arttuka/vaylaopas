import { groupBy, Dictionary } from 'lodash'
import { Pool, QueryResult } from 'pg'
import config from './config'
import { Lane, Intersection, Coordinate } from '../common/lane'

const pool = new Pool(config.db)

export const saveLanes = async (lanes: Lane[]): Promise<void> => {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    await Promise.all(lanes.map(async (lane): Promise<void> => {
      await client.query(
        'INSERT INTO lane(id, laneId, depth) VALUES ($1, $2, $3)',
        [lane.id, lane.laneid, lane.depth]
      )
      await Promise.all(lane.coordinates.map((c, i): Promise<QueryResult> =>
        client.query(
          'INSERT INTO coordinate(lane, index, x, y) VALUES ($1, $2, $3, $4)',
          [lane.id, i, c.x, c.y],
        )
      ))
    }))
    await client.query('COMMIT')
  } catch (err) {
    console.log(err)
  } finally {
    client.release()
  }
}

export const saveIntersections = async (intersections: Intersection[]): Promise<void> => {
  console.log(`saving ${intersections.length} intersections to db`)
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    await Promise.all(intersections.map(async (is): Promise<void> => {
      await client.query(
        'INSERT INTO intersection(id, x, y) VALUES ($1, $2, $3)',
        [is.id, is.x, is.y],
      )
      await Promise.all(Array.from(is.lanes).map((laneId): Promise<QueryResult> =>
        client.query(
          'INSERT INTO lane_intersection(lane, intersection) VALUES ($1, $2)',
          [laneId, is.id]
        )))
    }))
    await client.query('COMMIT')
  } catch (err) {
    console.log(err)
    await client.query('ROLLBACK')
  } finally {
    client.release()
  }
}

export const getLanes = async (): Promise<Lane[]> => {
  const client = await pool.connect()
  const coordinates: Dictionary<Coordinate[]> = groupBy(
    (await client.query('SELECT * FROM coordinate ORDER BY lane ASC, index ASC')).rows,
    'lane')
  const lanes = (await client.query('SELECT * FROM lane')).rows.map((lane): Lane => ({
    ...lane,
    coordinates: coordinates[lane.id],
  }))
  return lanes
}

export const getIntersections = async (): Promise<Intersection[]> => {
  const client = await pool.connect()
  const intersectionLanes: Dictionary<{ intersection: number; lane: number }[]> = groupBy(
    (await client.query('SELECT * FROM lane_intersection')).rows,
    'intersection',
  )
  const intersections = (await client.query('SELECT * FROM intersection')).rows.map((i): Intersection => ({
    ...i,
    lanes: new Set(intersectionLanes[i.id].map((il): number => il.lane)),
  }))
  return intersections
}
