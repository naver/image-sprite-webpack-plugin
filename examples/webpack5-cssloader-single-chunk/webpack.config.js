const HtmlWebpackPlugin = require('html-webpack-plugin')
const path = require('path')
const ImageSpritePlugin = require('image-sprite-webpack-plugin')

const IS_DEV = process.env.NODE_ENV === 'development'

module.exports = {
  mode: IS_DEV ? 'development' : 'production',
  entry: path.join(__dirname, '/src/main.js'),
  output: {
    path: IS_DEV
      ? path.resolve(__dirname, 'public')
      : path.resolve(__dirname, 'public/assets'),
    publicPath: IS_DEV ? '/' : '/assets/',
    filename: IS_DEV ? 'bundle.js' : 'bundle-[contenthash].js',
    clean: true,
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: 'babel-loader',
      },
      {
        test: /\.(png|gif|jpg)$/,
        type: 'asset/resource',
        generator: {
          filename: 'img/[name]-[hash][ext]',
        },
      },
      {
        test: /\.css$/,
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: {
              modules: true,
              sourceMap: true,
            },
          },
        ],
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: __dirname + '/src/main.html',
      filename: IS_DEV ? 'index.html' : '../index.html',
    }),
    new ImageSpritePlugin({
      commentOrigin: IS_DEV,
      compress: !IS_DEV,
      extensions: ['gif', 'png'],
      log: true,
      outputFilename: 'css/sprite-[hash].png',
      padding: 10,
      suffix: IS_DEV ? '' : '?' + Date.now(),
    }),
  ],
  resolve: {
    extensions: ['.js', '.jsx'],
  },
  devServer: {
    static: {
      directory: path.join(__dirname, 'public'),
    },
    historyApiFallback: true,
    hot: true,
    port: 3000,
  },
  devtool: IS_DEV ? 'source-map' : false,
}
