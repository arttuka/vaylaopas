module.exports = {
  env: {
    server: {
      presets: [
        [
          '@babel/preset-env',
          {
            targets: {
              node: 'current',
            },
          },
        ],
        '@babel/preset-react',
        [
          '@babel/preset-typescript',
          {
            allExtensions: true,
            isTSX: true,
          },
        ],
      ],
    },
    browser: {
      presets: [
        [
          '@babel/preset-env',
          {
            modules: false,
            targets: {
              esmodules: true,
            },
          },
        ],
        '@babel/preset-react',
        [
          '@babel/preset-typescript',
          {
            allExtensions: true,
            isTSX: true,
          },
        ],
      ],
      plugins: [
        '@babel/plugin-proposal-class-properties',
        'react-hot-loader/babel',
      ],
    },
  },
}
