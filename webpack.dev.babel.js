import HtmlWebpackPlugin from 'html-webpack-plugin'
import merge from 'webpack-merge'
import config from './config.json'
import indexHtml from './src/server/indexHtml'
import common from './webpack.common'

const { server: serverConfig, client: clientConfig } = config
const { host, port, devserverPort } = serverConfig

module.exports = merge(common, {
  mode: 'development',
  devtool: 'inline-source-map',
  stats: 'minimal',
  devServer: {
    hot: true,
    compress: true,
    host: '0.0.0.0',
    port: devserverPort,
    public: `${host}:${devserverPort}`,
    historyApiFallback: true,
    proxy: {
      '/api': {
        target: `http://${host}:${port}`,
      },
    },
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
          },
        },
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
  ],
})
