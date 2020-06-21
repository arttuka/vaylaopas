/* eslint-disable-next-line @typescript-eslint/explicit-function-return-type */
const indexHtml = (cfg, bundle) => `
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
      const clientConfig = ${JSON.stringify(cfg)}
    </script>
    ${bundle !== undefined ? `<script src="${bundle}"></script>` : ''}
  </body>
</html>
`

export default indexHtml
