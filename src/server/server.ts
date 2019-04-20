import express from 'express'
import * as path from 'path'
import { getLanes, getVertices, getGaps } from './db'

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

if (process.env.NODE_ENV === 'production') {
  app.use('/static', express.static(path.join(__dirname, 'public')))
} else {
  const webpack = require('webpack') // eslint-disable-line @typescript-eslint/no-var-requires
  const webpackConfig = require('../../webpack.config') //eslint-disable-line @typescript-eslint/no-var-requires
  const clientConfig = webpackConfig[0]
  const compiler = webpack(webpackConfig)
  const clientCompiler = compiler.compilers[0]

  app.use(
    require('webpack-dev-middleware')(compiler, {
      noInfo: true,
      publicPath: clientConfig.output.publicPath,
    })
  )
  app.use(
    require('webpack-hot-middleware')(clientCompiler, {
      path: '/__webpack_hmr',
      heartbeat: 10 * 1000,
    })
  )
}

app.get('/', (req, res): express.Response => res.send(html))

app.use(express.json())

app.get(
  '/api/lane',
  async (req, res): Promise<express.Response> => {
    const { ids } = req.query
    return res.send(
      await getLanes(
        ids ? ids.split(',').map((id: string): number => parseInt(id, 10)) : []
      )
    )
  }
)

app.get(
  '/api/vertex',
  async (req, res): Promise<express.Response> => {
    const { ids } = req.query
    return res.send(
      await getVertices(
        ids ? ids.split(',').map((id: string): number => parseInt(id, 10)) : []
      )
    )
  }
)

app.get(
  '/api/vertex/gaps',
  async (req, res): Promise<express.Response> => res.send(await getGaps())
)

app.listen(port, (): void => console.log(`Listening on port ${port}`))
