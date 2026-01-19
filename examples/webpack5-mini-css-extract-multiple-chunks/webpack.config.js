const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const path = require('path')
const { ImageSpritePlugin } = require('image-sprite-webpack-plugin')

const IS_DEV = process.env.NODE_ENV === 'development'

module.exports = {
  mode: IS_DEV ? 'development' : 'production',
  entry: {
    main: path.join(__dirname, '/src/main.js'),
    more: ['some-npm-package'],
  },
  output: {
    path: IS_DEV
      ? path.resolve(__dirname, 'public')
      : path.resolve(__dirname, 'public/assets'),
    publicPath: IS_DEV ? '/' : '/assets/',
    filename: IS_DEV ? '[name].js' : '[name]-[contenthash].js',
    chunkFilename: IS_DEV ? '[name].js' : '[name]-[contenthash].js',
    clean: true,
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        include: [
          path.resolve(__dirname, 'src'),
          path.resolve(__dirname, 'some-npm-package'),
          path.resolve(__dirname, 'node_modules/some-npm-package'),
        ],
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
          MiniCssExtractPlugin.loader,
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
  optimization: {
    splitChunks: {
      cacheGroups: {
        vendors: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
        },
      },
    },
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: IS_DEV ? 'css/[name].css' : 'css/[name]-[contenthash].css',
      chunkFilename: IS_DEV ? 'css/[name].css' : 'css/[name]-[contenthash].css',
    }),
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
    port: 3001,
  },
  devtool: IS_DEV ? 'source-map' : false,
}
