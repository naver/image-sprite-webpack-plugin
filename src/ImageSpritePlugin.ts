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
import {
  AssetInfo,
  Compilation,
  Compiler,
  NormalModule,
  PathData,
} from 'webpack';
import { Logger } from './Logger';

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

type MapOptions = {
  columns?: boolean;
  module?: boolean;
};

type Source = {
  size(): number;
  map(options?: MapOptions): Record<any, any>;
  sourceAndMap(options?: MapOptions): {
    source: string | Buffer;
    map: Record<any, any>;
  };
  updateHash(hash: any): void;
  source(): string | Buffer;
  buffer(): Buffer;
};

const CWD = process.cwd();
const PLUGIN_NAME = 'image-sprite-webpack-plugin';

export class ImageSpritePlugin {
  private _commentOrigin: boolean;
  private _compress: boolean;
  private _extensions = ['.png', '.jpg', '.jpeg', '.gif'];
  private _indent: string;
  private _logger: Logger = new Logger();
  private _outputFilename: string;
  private _outputPath?: string;
  private _padding;
  private _suffix;

  private _DIST_DIR = '';
  private _publicPath?:
    | string
    | ((pathData: PathData, assetInfo?: AssetInfo | undefined) => string);

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
      this._logger = compilation.getLogger(PLUGIN_NAME);
      // logger.info('ImageSpritePlugin compiler.hooks.thisCompilation.tap');

      this._DIST_DIR = this._outputPath
        ? path.resolve(CWD, this._outputPath)
        : compiler.outputPath;
      this._publicPath = compilation.outputOptions.publicPath;

      // Create additional assets for the compilation
      compilation.hooks.additionalAssets.tapAsync(
        pluginClassName,
        (callback) => {
          this.createSprite(compilation, (sprite, coordinates) => {
            if (sprite && coordinates) {
              // TODO
              console.log('sprite', sprite);
              console.log('coordinates', coordinates);
            }
            callback();
          });
        }
      );
    });
  }

  /**
   * Creates a sprite sheet then run the given callback
   * @param {Compilation} compilation
   * @param {Function} callback
   */
  createSprite(
    compilation: Compilation,
    callback: (image?: Buffer, coordinates?: Spritesmith.Coordinates) => void
  ) {
    const { _logger: logger } = this;
    const images = this.getSpriteSources(compilation);
    if (images.length === 0) {
      logger.log('no images to make a sprite');
      callback();
      return;
    }
    logger.log('Creating sprite image from ...');
    images.forEach((img) => {
      logger.log(img.path);
    });
    Spritesmith.run(
      {
        src: images,
        padding: this._padding,
      },
      (err, result) => {
        if (err) {
          logger.error(err);
          callback();
        } else if (result) {
          const { image, coordinates } = result;
          callback(image, coordinates);
        }
      }
    );
  }

  eachImageAssets(
    compilation: Compilation,
    callback: (assetName: string, asset: Source) => void
  ) {
    const { assets } = compilation;
    Object.keys(assets).forEach((assetName) => {
      if (this.isImage(assetName)) {
        callback(assetName, assets[assetName]);
      }
    });
  }

  getSpriteSources(compilation: Compilation): Vinyl[] {
    const sources: Vinyl[] = [];
    if (this.isInlineCss(compilation)) {
      this.eachImageAssets(compilation, (assetName, asset) => {
        sources.push(
          new Vinyl({
            path: path.join(this._DIST_DIR, assetName),
            contents: asset.buffer(),
          })
        );
      });
      return sources;
    }
    // TODO
    // return this.getSpriteSourcesFromCssAssets(compilation);
    return [];
  }

  isImage(fileName: string) {
    if (typeof fileName === 'string') {
      return this._extensions.includes(path.extname(fileName));
    }
    return false;
  }

  isInlineCss(compilation: Compilation) {
    return [...compilation.modules].some((module) => {
      return this.isImage((module as NormalModule).rawRequest);
    });
  }
}
