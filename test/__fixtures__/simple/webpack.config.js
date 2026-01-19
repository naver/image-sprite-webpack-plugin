const path = require('path');
const ImageSpritePlugin = require('../../../dist/ImageSpritePlugin').default;

module.exports = {
  mode: 'production',
  entry: path.join(__dirname, 'src/main.js'),
  output: {
    path: path.resolve(__dirname, 'dist'),
    publicPath: '/',
    filename: 'bundle.js',
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.png$/,
        type: 'asset/resource',
        generator: {
          filename: 'img/[name][ext]',
        },
      },
    ],
  },
  plugins: [
    new ImageSpritePlugin({
      outputFilename: 'sprite/sprite-[hash].png',
      padding: 5,
      log: false,
    }),
  ],
};
