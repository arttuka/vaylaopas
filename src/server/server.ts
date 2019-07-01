import express, { RequestHandler, Router } from 'express'
import config from './config'
import { getRoute } from './db'
import { LngLat } from '../common/types'

const wrapAsync = (handler: RequestHandler): RequestHandler => (
  req,
  res,
  next
): void => {
  Promise.resolve(handler(req, res, next)).catch(next)
}

const html = `
<!DOCTYPE html>
<html lang="fi">
  <head>
    <meta charset="utf-8" />
    <script crossorigin="anonymous" src="https://polyfill.io/v3/polyfill.min.js?features=Promise"></script>
    <link rel="stylesheet" href="https://api.tiles.mapbox.com/mapbox-gl-js/v1.0.0/mapbox-gl.css">
    <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Roboto:300,400,500">
    <style type="text/css">
      body {
        margin: 0;
        padding: 0;
        width: 100%;
        position: fixed;
        overflow: hidden;
        font-family: 'Roboto', 'Helvetica Neue', sans-serif;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        -webkit-touch-callout: none;
        -moz-user-select: none;
        -webkit-user-select: none;
        -ms-user-select: none;
        user-select: none;
      }
      .mapboxgl-marker label {
        position: absolute;
        width: 32px;
        line-height: 32px;
        text-align: center;
        color: white;
        font-weight: bold;
        font-size: 24px;
        font-family: 'Roboto', 'Helvetica Neue', sans-serif;
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
    <script>
      const clientConfig = ${JSON.stringify(config.client)}
    </script>
    <script src="/static/vendor.js" async></script>
    <script src="/static/client.js" async></script>
  </body>
</html>
`

const router = Router()
router.use(express.json())

router.get('/', (req, res): void => {
  res.send(html)
})

interface RouteParams {
  points: LngLat[]
  depth?: number
  height?: number
}

router.post(
  '/api/route',
  wrapAsync(
    async (req, res): Promise<void> => {
      const { points, depth, height }: RouteParams = req.body
      res.send(await getRoute(points, depth, height))
    }
  )
)

module.exports = (): RequestHandler => router
