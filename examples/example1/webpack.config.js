const path = require('path');
const { ImageSpritePlugin } = require('../../dist/cjs/ImageSpritePlugin');

const config = {
  entry: path.resolve(__dirname, 'src/main.js'),
  mode: 'production',
  output: {
    path: path.resolve(__dirname, 'output/assets'),
    publicPath: '/assets/',
    filename: 'bundle.js',
  },
  plugins: [new ImageSpritePlugin({})],
};

module.exports = config;
