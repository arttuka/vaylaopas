const path = require("path")
const webpack = require("webpack")
const nodeExternals = require("webpack-node-externals")

const isProduction = process.env.NODE_ENV === "production"
const mode = isProduction ? "production" : "development"
const devtool = isProduction ? false : "inline-source-map"

const clientModeConfig = {
  development: {
    entry: {
      client: [
        "webpack-hot-middleware/client?path=/__webpack_hmr&timeout=20000",
        "./src/client/client.tsx"
      ]
    },
    plugins: [new webpack.HotModuleReplacementPlugin()]
  },
  production: {
    entry: {
      client: "./src/client/client.tsx"
    }
  }
}

const serverModeConfig = {
  development: {
    plugins: [
      new webpack.HotModuleReplacementPlugin()
    ]
  },
  production: {}
}

module.exports = [
  {
    name: "client",
    ...clientModeConfig[mode],
    mode,
    devtool,
    target: "web",
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          loader: "ts-loader",
          exclude: /node_modules/,
          options: {
            compilerOptions: {
              sourceMap: !isProduction
            }
          }
        }
      ]
    },
    resolve: {
      extensions: [".js", ".json", ".ts", ".tsx"]
    },
    output: {
      filename: "[name].js",
      publicPath: "/static/",
      chunkFilename: "[name].js",
      path: path.resolve(__dirname, "dist", "public")
    },
    optimization: {
      splitChunks: {
        chunks: "initial",
        cacheGroups: {
          vendors: {
            chunks: "all",
            test: /[\\/]node_modules[\\/]/,
            name: "vendor"
          }
        }
      }
    }
  },
  {
    name: "server",
    ...serverModeConfig[mode],
    mode,
    devtool,
    target: "node",
    externals: [nodeExternals()],
    entry: "./src/server/server.ts",
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: "ts-loader",
          exclude: /node_modules/
        },
        {
          test: /\.(html)$/,
          use: {
            loader: "html-loader",
            options: {
              attrs: [":data-src"]
            }
          }
        }
      ]
    },
    resolve: {
      extensions: [".js", ".json", ".ts", ".tsx"]
    },
    output: {
      filename: "server.js",
      path: path.resolve(__dirname, "dist")
    },
    node: {
      __dirname: false,
      __filename: false
    }
  }
]
