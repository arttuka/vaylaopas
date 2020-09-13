/* eslint-disable @typescript-eslint/no-var-requires */
const TerserWebpackPlugin = require('terser-webpack-plugin')
const ManifestPlugin = require('webpack-manifest-plugin')
const { merge } = require('webpack-merge')
const path = require('path')
const common = require('./webpack.common.js')

const config = merge(common, {
  mode: 'production',
  devtool: 'source-map',
  output: {
    path: path.join(__dirname, 'dist/js'),
    filename: '[name].[contenthash:8].js',
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
    minimize: true,
    minimizer: [
      new TerserWebpackPlugin({
        sourceMap: true,
        terserOptions: {
          ecma: 2015,
        },
      }),
    ],
  },
  plugins: [
    new ManifestPlugin({
      fileName: path.join(__dirname, 'dist/server/manifest.json'),
    }),
  ],
})

module.exports = [config]
