import HtmlWebpackPlugin from 'html-webpack-plugin'
import ReactRefreshWebpackPlugin from '@pmmmwh/react-refresh-webpack-plugin'
import config from './config.json'
import { indexHtml } from './src/server/indexHtml'

const { server: serverConfig, client: clientConfig } = config
const { host, port, devserverPort } = serverConfig

module.exports = {
  mode: 'development',
  entry: {
    bundle: ['./src/client/client.tsx'],
  },
  resolve: {
    modules: ['./node_modules'],
    extensions: ['*', '.js', '.jsx', '.ts', '.tsx'],
  },
  devtool: 'eval-source-map',
  stats: 'errors-warnings',
  devServer: {
    hot: true,
    compress: true,
    host: '0.0.0.0',
    port: devserverPort,
    historyApiFallback: true,
    proxy: [
      {
        context: ['/api'],
        target: `http://${host}:${port}`,
      },
    ],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            envName: 'browser',
            plugins: [['react-refresh/babel', { skipEnvCheck: true }]],
          },
        },
      },
      {
        test: /\.js$/,
        enforce: 'pre',
        use: ['source-map-loader'],
      },
    ],
  },
  output: {
    publicPath: '/',
  },
  plugins: [
    new HtmlWebpackPlugin({
      filename: 'index.html',
      /* eslint-disable-next-line @typescript-eslint/explicit-function-return-type */
      templateContent: () => indexHtml(clientConfig),
    }),
    new ReactRefreshWebpackPlugin(),
  ],
}
