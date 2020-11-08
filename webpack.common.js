module.exports = {
  entry: {
    bundle: ['./src/client/client.tsx'],
  },
  resolve: {
    modules: ['./node_modules'],
    extensions: ['*', '.js', '.jsx', '.ts', '.tsx'],
  },
  stats: {
    errorDetails: true,
  },
}
