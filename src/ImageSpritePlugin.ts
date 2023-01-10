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

type ImageSpritePluginExtension = 'png' | 'jpg' | 'jpeg' | 'gif';

type ImageSpritePluginOptions = {
  commentOrigin?: boolean;
  compress?: boolean;
  extensions?: ImageSpritePluginExtension[];
  indent?: string;
  outputFilename?: string;
  outputPath?: string;
  padding?: number;
  suffix?: string;
};

const PLUGIN_NAME = 'image-sprite-webpack-plugin';

export class ImageSpritePlugin {
  private _commentOrigin: boolean;
  private _compress: boolean;
  private _extensions = ['.png', '.jpg', '.jpeg', '.gif'];
  private _indent: string;
  private _outputFilename: string;
  private _outputPath?: string;
  private _padding;
  private _suffix;

  private _DIST_DIR = '';
  private _publicPath = '';
  private _outFileCache: string | null = null;
  private _chunkMap: Record<string, string> = {};
  private _coordinates: any = null; // TODO any
  private _cssAstMap: Record<string, any[]> = {}; // TODO any
  private _imageAssetCandidates: Record<string, any[]> = {}; // TODO any
  private _sprite: any = null; // TODO any

  constructor(option: ImageSpritePluginOptions) {
    if (option.extensions) {
      this._extensions = option.extensions.map((extension) => {
        return `.${extension}`;
      });
    }
    this._padding = option.padding || 0;
    this._suffix = option.suffix || '';
    this._outputPath = option.outputPath;
    this._outputFilename = option.outputFilename || '/sprite/sprite-[hash].png';
    this._compress = !!option.compress;
    this._indent =
      typeof option.indent === 'undefined' || !!option.indent.trim()
        ? '  '
        : option.indent;
    this._commentOrigin = !!option.commentOrigin;
  }

  apply(compiler: Compiler) {
    const pluginClassName = this.constructor.name;
    compiler.hooks.thisCompilation.tap(pluginClassName, (compilation) => {
      const logger = compilation.getLogger(PLUGIN_NAME);
      logger.info('ImageSpritePlugin compiler.hooks.thisCompilation.tap');
    });
  }
}
