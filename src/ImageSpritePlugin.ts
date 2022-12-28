/**
 * image-sprite-webpack-plugin
 *
 * Copyright (c) 2018 ~ 2023 NAVER Corp.
 * Licensed under the MIT
 */

import crypto from 'crypto';
import os from 'os';
import path from 'path';
import css from 'css';
import Spritesmith from 'spritesmith';
import Vinyl from 'vinyl';
import { Compiler } from 'webpack';

export class ImageSpritePlugin {
  apply(compiler: Compiler) {
    compiler.hooks.run.tap('ImageSpritePlugin', (compilation) => {
      console.log('ImageSpritePlugin compiler.hooks.run');
    });
  }
}
