import express from 'express'
import * as path from 'path'

/* eslint-disable @typescript-eslint/no-var-requires */

const app = express()
const port = process.env.SERVER_PORT
  ? parseInt(process.env.SERVER_PORT, 10)
  : 8080

if (process.env.NODE_ENV === 'production') {
  app.use('/static', express.static(path.join(__dirname, 'public')))
  const router = require('./server')
  app.use(router())
} else {
  const webpack = require('webpack')
  const webpackConfig = require('../../webpack.config')
  const clientConfig = webpackConfig[0]
  const compiler = webpack(webpackConfig)
  const clientCompiler = compiler.compilers[0]

  app.use(
    require('webpack-dev-middleware')(compiler, {
      serverSideRender: false,
      noInfo: true,
      publicPath: clientConfig.output!.publicPath, //eslint-disable-line @typescript-eslint/no-non-null-assertion
    })
  )
  app.use(
    require('webpack-hot-middleware')(clientCompiler, {
      path: '/__webpack_hmr',
      heartbeat: 10 * 1000,
    })
  )
  app.use(require('webpack-hot-server-middleware')(compiler))
}

app.listen(port, (): void => console.log(`Listening on port ${port}`))
