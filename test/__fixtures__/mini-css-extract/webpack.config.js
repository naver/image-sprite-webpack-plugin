const path = require('path')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const ImageSpritePlugin = require('../../../dist/ImageSpritePlugin').default

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
        use: [MiniCssExtractPlugin.loader, 'css-loader'],
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
    new MiniCssExtractPlugin({
      filename: 'css/[name].css',
    }),
    new ImageSpritePlugin({
      outputFilename: 'sprite/sprite-[hash].png',
      padding: 5,
      log: false,
    }),
  ],
}
