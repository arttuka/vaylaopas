import { groupBy } from 'lodash'
import { Pool } from 'pg'
import config from './config'
import { Lane, Intersection } from '../common/lane'

const pool = new Pool(config.db)

export const saveLanes = async (lanes: Lane[]): Promise<void> => {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    await Promise.all(lanes.map(async (lane) => {
      await client.query(
        'INSERT INTO lane(id, laneId, depth) VALUES ($1, $2, $3)',
        [lane.id, lane.laneId, lane.depth]
      )
      await Promise.all(lane.coordinates.map((c, i) =>
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
    await Promise.all(intersections.map(async (is) => {
      await client.query(
        'INSERT INTO intersection(id, x, y) VALUES ($1, $2, $3)',
        [is.id, is.x, is.y],
      )
      await Promise.all(Array.from(is.lanes).map(laneId =>
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
  const coordinates = groupBy(
    (await client.query('SELECT * FROM coordinate ORDER BY lane ASC, index ASC')).rows,
    'lane')
  const lanes = (await client.query('SELECT * FROM lane')).rows.map(lane => ({
    ...lane,
    coordinates: coordinates[lane.id].map(({ x, y }) => ({ x, y }))
  }))
  return lanes
}

export const getIntersections = async (): Promise<Intersection[]> => {
  const client = await pool.connect()
  const intersectionLanes = groupBy(
    (await client.query('SELECT * FROM lane_intersection')).rows,
    'intersection',
  )
  const intersections = (await client.query('SELECT * FROM intersection')).rows.map(i => ({
    ...i,
    lanes: new Set(intersectionLanes[i.id].map(il => il.lane)),
  }))
  return intersections
}
