import express, { RequestHandler } from 'express'
import * as path from 'path'
import config from './config'
import { getRoute } from './db'
import { Waypoints } from '../common/types'
import indexHtml from './indexHtml'

const wrapAsync = (handler: RequestHandler): RequestHandler => (
  req,
  res,
  next
): void => {
  Promise.resolve(handler(req, res, next)).catch(next)
}

const app = express()
app.use(express.json())
app.use(
  '/static',
  express.static(path.join(__dirname, 'public'), {
    maxAge: 86400000,
  })
)

app.get('/', (req, res): void => {
  res.send(indexHtml(config.client))
})

interface RouteParams {
  points: Waypoints
  depth?: number
  height?: number
}

app.post(
  '/api/route',
  wrapAsync(
    async (req, res): Promise<void> => {
      const { points, depth, height }: RouteParams = req.body
      res.send(await getRoute(points, depth, height))
    }
  )
)

export default app
