import express from 'express'
import config from './config'
import { getRoute, addMapLoad } from './db'
import { Waypoint } from '../common/types'
import indexHtml from './indexHtml'

const index = indexHtml(config.client, `/js/${config.server.bundle}`)

const app = express()
app.use(express.json())
app.use(
  '/js',
  express.static('./dist/client', {
    maxAge: 86400000,
  })
)

app.get('/', (req, res): void => {
  res.send(index)
})

interface RouteParams {
  points: Waypoint[]
  depth?: number
  height?: number
}

app.post(
  '/api/route',
  async (req, res, next): Promise<void> => {
    const { points, depth, height }: RouteParams = req.body
    try {
      res.send(await getRoute(points, depth, height))
    } catch (error) {
      next(error)
    }
  }
)

app.post(
  '/api/map-load',
  async (req, res, next): Promise<void> => {
    try {
      await addMapLoad()
      res.send()
    } catch (error) {
      next(error)
    }
  }
)

export default app
