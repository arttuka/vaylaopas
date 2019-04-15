import express from 'express'
import * as path from 'path'
import { loadData } from './data'
import { saveLanes, saveIntersections, getLanes, getIntersections } from './db'

const app = express()
const port = process.env.PORT || 5000

const html = `
<!DOCTYPE html>
<html lang="fi">
  <head>
    <meta charset="utf-8" />
    <script crossorigin="anonymous" src="https://polyfill.io/v3/polyfill.min.js?features=Promise"></script>
    <link rel="stylesheet" href="https://api.tiles.mapbox.com/mapbox-gl-js/v0.53.1/mapbox-gl.css" />
    <style type="text/css">
      body {
        margin: 0;
        padding: 0;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
          'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
          sans-serif;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      }

      code {
        font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New',
          monospace;
      }
    </style>
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1, shrink-to-fit=no"
    />
    <title>Väyläopas</title>
  </head>
  <body>
    <div id="root"></div>
    <script src="/static/vendor.js" async></script>
    <script src="/static/client.js" async></script>
  </body>
</html>
`

app.get('/', (req, res): express.Response => {
  return res.send(html)
})

app.use('/static', express.static(path.join(__dirname, 'public')))
app.use(express.json())

app.get('/api/lanes', async (req, res): Promise<express.Response> => {
  return res.send(await getLanes())
})

app.get('/api/intersections', async (req, res): Promise<express.Response> => {
  return res.send(await getIntersections())
})

app.post('/api/update', (req, res): express.Response => {
  setTimeout(async (): Promise<void> => {
    try {
      const { lanes, intersections } = await loadData()
      await saveLanes(lanes)
      await saveIntersections(intersections)
    } catch (err) {
      console.error(err.stack)
    }
  }, 1)
  return res.send()
})

app.listen(port, (): void => console.log(`Listening on port ${port}`))
