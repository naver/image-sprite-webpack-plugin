import { Compiler } from 'webpack';

export class ImageSpritePlugin {
  apply(compiler: Compiler) {
    compiler.hooks.run.tap('ImageSpritePlugin', (compilation) => {
      console.log('ImageSpritePlugin compiler.hooks.run');
    });
  }
}
