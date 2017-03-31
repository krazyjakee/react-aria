const { resolve } = require('path')

const config = {
  entry: {
    index: resolve(__dirname, 'src/index.js'),
  },

  output: {
    path: resolve(__dirname, 'dist'),
    publicPath: 'dist/',
    filename: 'react-aria.js',
    library: 'ReactARIA',
    libraryTarget: 'umd',
  },

  module: {
    rules: [
      {
        test: /\.(js|jsx)/,
        use: [{ loader: 'babel-loader' }],
      },
    ],
  },

  externals: {
    react: {
      root: 'React',
      commonjs2: 'react',
      commonjs: 'react',
      amd: 'react',
    },
    'react-dom': {
      root: 'ReactDOM',
      commonjs2: 'react-dom',
      commonjs: 'react-dom',
      amd: 'react-dom',
    },
  },
}

module.exports = config
