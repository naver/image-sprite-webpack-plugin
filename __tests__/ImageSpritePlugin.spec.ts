import path from 'path';
import webpack from 'webpack';
import { ImageSpritePlugin } from '../src/ImageSpritePlugin';
import { compile } from './helpers';

const CONFIG: webpack.Configuration = {
  entry: path.resolve(__dirname, 'fixtures/main.js'),
  output: {
    path: path.resolve(__dirname, 'output/assets'),
    publicPath: '/assets/',
    filename: 'bundle.js',
  },
  plugins: [new ImageSpritePlugin({})],
};

describe('Sprite image creations', () => {
  it('should generate the expected files', async () => {
    const compiler = webpack(CONFIG);
    const stats = await compile(compiler);
    expect(stats).toBeTruthy();
  });
});
