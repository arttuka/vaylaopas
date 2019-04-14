import * as express from 'express'
import * as path from 'path'
import { loadData } from './data'
import { saveLanes, saveIntersections, getLanes, getIntersections } from './db'

const app = express()
const port = process.env.PORT || 5000

app.use(express.static(path.join(__dirname, '..', 'build', 'static')))
app.use(express.json())

app.get('/api/lanes', async (req, res): Promise<void> => {
  res.send(await getLanes())
})

app.get('/api/intersections', async (req, res): Promise<void> => {
  res.send(await getIntersections())
})

app.post('/api/update', (req, res): void => {
  setTimeout(async (): Promise<void> => {
    try {
      const { lanes, intersections } = await loadData()
      await saveLanes(lanes)
      await saveIntersections(intersections)
    } catch (err) {
      console.error(err.stack)
    }
  }, 1)
  res.send()
})

app.listen(port, (): void => console.log(`Listening on port ${port}`))
