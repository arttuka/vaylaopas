import * as express from 'express'
import * as path from 'path'
import { vaylat, intersections, initializeData } from './data'

initializeData()
const app = express()
const port = process.env.PORT || 5000

app.use(express.static(path.join(__dirname, '..', 'build', 'static')))
app.use(express.json())

app.get('/api/vaylat', (req, res) => {
  res.send(vaylat)
})

app.get('/api/intersections', (req, res) => {
  res.send(intersections)
})

app.listen(port, () => console.log(`Listening on port ${port}`))
