/* eslint-disable @typescript-eslint/no-var-requires */
const TerserWebpackPlugin = require('terser-webpack-plugin')
const merge = require('webpack-merge')
const path = require('path')
const common = require('./webpack.common.js')

const config = merge(common, {
  mode: 'production',
  output: {
    path: path.join(__dirname, 'dist'),
    filename: '[name].js',
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
  optimization: {
    minimizer: [
      new TerserWebpackPlugin({
        test: /\.m?js$/i,
        terserOptions: {
          ecma: 6,
        },
      }),
    ],
  },
})

module.exports = [config]
