module.exports = {
  entry: {
    bundle: ['./src/client/client.tsx'],
  },
  resolve: {
    modules: ['./node_modules'],
    extensions: ['*', '.js', '.jsx', '.ts', '.tsx'],
    alias: {
      'react-dom': '@hot-loader/react-dom',
    },
  },
  stats: {
    errorDetails: true,
  },
}
