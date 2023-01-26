import path from 'path';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import webpack from 'webpack';
import { ImageSpritePlugin } from '../src/ImageSpritePlugin';
import { compile } from './helpers';

const CONFIG: webpack.Configuration = {
  bail: true,
  entry: path.resolve(__dirname, 'fixtures/react/src/main.jsx'),
  mode: 'none',
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              '@babel/preset-env',
              ['@babel/preset-react', { runtime: 'automatic' }],
            ],
          },
        },
      },
      {
        test: /\.(png|gif|jpg)$/,
        type: 'asset/resource',
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
  output: {
    path: path.resolve(__dirname, 'output/react/assets'),
    publicPath: '/assets/',
    filename: 'bundle.js',
    assetModuleFilename: 'images/[hash][ext][query]',
  },
  plugins: [
    new ImageSpritePlugin({}),
    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: path.resolve(__dirname, 'fixtures/react/src/main.html'),
    }),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
    }),
  ],
  resolve: {
    extensions: ['.js', '.jsx'],
    modules: ['node_modules'],
  },
};

describe('With react', () => {
  it('should generate the expected files', async () => {
    const compiler = webpack(CONFIG);
    const stats = await compile(compiler);
    expect(stats).toBeTruthy();
  });

  it('should run with no errors or warnings', async () => {
    const compiler = webpack(CONFIG);
    const stats = await compile(compiler);
    const { errors, warnings } = stats.compilation;
    expect([...errors, ...warnings].length).toBe(0);
  });
});
