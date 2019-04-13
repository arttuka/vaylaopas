import * as express from 'express'
import * as path from 'path'
import { default as data, initializeData } from './data'

initializeData()
const app = express()
const port = process.env.PORT || 5000

app.use(express.static(path.join(__dirname, '..', 'build', 'static')))
app.use(express.json())

app.get('/api/data', (req, res) => {
  res.send(data)
})

app.listen(port, () => console.log(`Listening on port ${port}`))
