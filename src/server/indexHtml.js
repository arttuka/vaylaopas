const indexHtml = (cfg, bundle) => `
<!DOCTYPE html>
<html lang="fi">
  <head>
    <meta charset="utf-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1.0, maximum-scale=1.0, shrink-to-fit=no, user-scalable=no"
    />
    <script crossorigin="anonymous" src="https://polyfill.io/v3/polyfill.min.js?features=Promise"></script>
    <link rel="stylesheet" href="https://unpkg.com/maplibre-gl/dist/maplibre-gl.css">
    <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Roboto:300,400,500">
    <style type="text/css">
      body {
        touch-action: none;
        -webkit-touch-callout: none;
        -moz-user-select: none;
        -webkit-user-select: none;
        -ms-user-select: none;
        user-select: none;
      }
    </style>
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

module.exports = { indexHtml }
