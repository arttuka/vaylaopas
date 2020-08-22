import express, { RequestHandler } from 'express'
import config from './config'
import { getRoute } from './db'
import { RouteNotFoundError, Waypoint } from '../common/types'
import indexHtml from './indexHtml'

const wrapAsync = (handler: RequestHandler): RequestHandler => (
  req,
  res,
  next
): void => {
  Promise.resolve(handler(req, res, next)).catch(next)
}

const index = indexHtml(config.client, `/js/${config.server.bundle}`)

const app = express()
app.use(express.json())
app.use(
  '/js',
  express.static('./dist/js', {
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
  wrapAsync(
    async (req, res): Promise<void> => {
      const { points, depth, height }: RouteParams = req.body
      try {
        res.send(await getRoute(points, depth, height))
      } catch (err) {
        if (err instanceof RouteNotFoundError) {
          res.status(404)
          res.send()
        } else {
          throw err
        }
      }
    }
  )
)

export default app
