/* eslint-disable @typescript-eslint/no-var-requires */
const TerserWebpackPlugin = require('terser-webpack-plugin')
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')
const { merge } = require('webpack-merge')
const path = require('path')
const nodeExternals = require('webpack-node-externals')
require('@babel/register')

const makeConfig = (envName, config) =>
  merge(
    {
      resolve: {
        modules: ['./node_modules'],
        extensions: ['*', '.js', '.jsx', '.ts', '.tsx'],
      },
      mode: 'production',
      devtool: 'source-map',
      module: {
        rules: [
          {
            test: /\.tsx?$/,
            exclude: /node_modules/,
            use: {
              loader: 'babel-loader',
              options: {
                envName,
              },
            },
          },
        ],
      },
      optimization: {
        minimize: true,
        minimizer: [
          new TerserWebpackPlugin({
            terserOptions: {
              ecma: 2015,
            },
          }),
        ],
      },
      stats: 'minimal',
    },
    config
  )

module.exports = [
  makeConfig('browser', {
    entry: {
      bundle: ['./src/client/client.tsx'],
    },
    output: {
      filename: '[name].[contenthash:8].js',
      path: path.join(__dirname, 'dist/client'),
    },
    plugins: [
      new BundleAnalyzerPlugin({
        analyzerMode: 'disabled',
        generateStatsFile: true,
        statsFilename: '../stats.json',
        statsOptions: {
          all: false,
          assets: true,
        },
      }),
    ],
  }),
  makeConfig('server', {
    entry: {
      server: ['./src/server/server.ts'],
    },
    output: {
      filename: '[name].js',
      path: path.join(__dirname, 'dist/server'),
    },
    externalsPresets: { node: true },
    externals: [nodeExternals()],
  }),
]
