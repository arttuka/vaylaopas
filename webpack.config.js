const path = require('path')
const CopyPlugin = require('copy-webpack-plugin');
const webpack = require('webpack')

const isProduction = process.env.NODE_ENV === 'production'
const mode = isProduction ? 'production' : 'development'
const devtool = isProduction ? false : 'inline-source-map';

const clientModeConfig = {
  development: {
    plugins: [
      new webpack.HotModuleReplacementPlugin()
    ]
  },
  production: {}
}

const serverModeConfig = {
  development: {
    plugins: [
      new CopyPlugin([
        { from: './config.json', to: './' }
      ]),
      new webpack.HotModuleReplacementPlugin()
    ]
  },
  production: {}
}

module.exports = [{
  ...clientModeConfig[mode],
  mode,
  devtool,
  target: 'web',
  entry: {
    client: './src/client/client.tsx'
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: 'ts-loader',
        exclude: /node_modules/,
        options: {
          compilerOptions: {
            "sourceMap": !isProduction,
          }
        }
      }
    ]
  },
  resolve: {
    extensions: [ '.js', '.ts', '.tsx' ],
  },
  output: {
    filename: '[name].js',
    publicPath: '/static/',
    chunkFilename: '[name].js',
    path: path.resolve(__dirname, 'dist', 'public')
  },
  optimization: {
    splitChunks: {
      chunks: 'initial',
      cacheGroups: {
        vendors: {
          chunks: 'all',
          test: /[\\/]node_modules[\\/]/,
          name: 'vendor'
        }
      }
    }
  }
}, {
  ...serverModeConfig[mode],
  mode,
  devtool,
  target: 'node',
  entry: './src/server/server.ts',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      }
    ]
  },
  resolve: {
    extensions: [ '.js', '.ts', '.tsx' ]
  },
  output: {
    filename: 'server.js',
    path: path.resolve(__dirname, 'dist')
  },
  node: {
    __dirname: false,
    __filename: false,
  }
}]
