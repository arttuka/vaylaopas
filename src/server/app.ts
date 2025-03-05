import express from 'express'
import * as fs from 'fs'
import * as path from 'path'
import config from './config'
import { getRoute } from './db/db'
import { Waypoint } from '../common/types'

const indexPath = path.resolve('./dist/client/index.html')
const index = fs.existsSync(indexPath)
  ? fs.readFileSync(indexPath, 'utf-8')
  : undefined

const app = express()
app.use(express.json())
app.use('/js', express.static('./dist/client', { maxAge: 86400000 }))

app.get('/', (req, res): void => {
  res.send(index)
})

type RouteParams = { points: Waypoint[]; depth?: number; height?: number }

app.get('/api/config', (req, res): void => {
  res.json(config.client)
})

app.post('/api/route', async (req, res, next): Promise<void> => {
  const { points, depth, height }: RouteParams = req.body
  try {
    res.send(await getRoute(points, depth, height))
  } catch (error) {
    next(error)
  }
})

export default app
