const path = require('path');

module.exports = {
  devtool: 'sourcemap',
  // Necessary to fix a webpack bug
  resolve: {
    symlinks: false
  },
  entry:   ['babel-polyfill', './src/index.js'],
  output:  {
    path:     path.resolve(__dirname, 'dist'),
    filename: 'index.js'
  },
  module:  {
    rules: [
      {
        test:    /.jsx?$/,
        loader:  'babel-loader',
        exclude: /node_modules/,
        query:   {
          presets: ['es2015', 'react'],
          plugins: [
            'add-module-exports',
            'transform-class-properties',
            'transform-decorators-legacy'
          ]
        }
      }
    ]
  },
};
