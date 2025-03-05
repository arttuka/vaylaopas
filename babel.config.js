module.exports = {
  env: {
    server: {
      presets: [
        ['@babel/preset-env', { targets: { node: 'current' } }],
        ['@babel/preset-react', { runtime: 'automatic' }],
        ['@babel/preset-typescript', { allExtensions: true, isTSX: true }],
      ],
    },
    browser: {
      presets: [
        ['@babel/preset-env', { modules: false, targets: { esmodules: true } }],
        ['@babel/preset-react', { runtime: 'automatic' }],
        ['@babel/preset-typescript', { allExtensions: true, isTSX: true }],
      ],
    },
  },
}
