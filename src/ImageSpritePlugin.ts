/**
 * image-sprite-webpack-plugin
 *
 * Copyright (c) 2018 NAVER Corp.
 * Licensed under the MIT
 */

import crypto from 'crypto'
import css from 'css'
import os from 'os'
import path from 'path'
import Spritesmith from 'spritesmith'
import Vinyl from 'vinyl'
import { RawSource, ReplaceSource, SourceMapSource } from 'webpack-sources'
import { Compilation, Compiler, NormalModule, sources } from 'webpack'
import Logger from './Logger'
import type {
  CssStylesheet,
  CssDeclaration,
  CssRule,
  SpritesmithCoordinates,
  ImageSpritePluginOptions,
  CssBlockInfo,
  ImagePathInfo,
  ParsedCssBlock,
  TransformTarget,
  ConcatSourceLike,
  SourceMapSourceLike,
} from './types'

const lineBreak = /\r?\n|\r/g
const logger = new Logger()
const parenthesis = /url\(([^)]+)\)/
const CWD = process.cwd()
const EOL = os.EOL.replace('\r', '\\r').replace('\n', '\\n')
const PSEUDO_CLASS = '.__ISWP__'

function forEachDeclaration(
  ast: CssStylesheet,
  callback: (decl: CssDeclaration, index: number) => void,
): void {
  ast.stylesheet.rules.forEach(rule => {
    if (rule.type === 'rule' && Array.isArray(rule.declarations)) {
      rule.declarations.forEach((decl, i) => {
        if (decl.type === 'declaration') {
          callback(decl as CssDeclaration, i)
        }
      })
    }
  })
}

function getAssetNameFromModule(module: NormalModule): string | null {
  // webpack 5: module.assets is deprecated, use buildInfo.assets only
  const buildInfo = module.buildInfo as
    | { assets?: Record<string, unknown> }
    | undefined
  if (buildInfo && buildInfo.assets) {
    return Object.keys(buildInfo.assets)[0]
  }
  return null
}

function getBackgroundShorthand(url: string): string {
  return `url(${url}) no-repeat 0 0`
}

function getCssBlock(source: string, occurrence: number): CssBlockInfo {
  const start = source.lastIndexOf('{', occurrence)
  const end = source.indexOf('}', occurrence)
  const cssBlock = source.substring(start, end + 1)
  return {
    cssBlock,
    start,
    end,
  }
}

function getPosition(coord: SpritesmithCoordinates): string {
  return (
    (coord.x ? '-' + coord.x + 'px' : '0') +
    ' ' +
    (coord.y ? '-' + coord.y + 'px' : '0')
  )
}

function hasDeclaration(
  declarations: (
    | CssDeclaration
    | { type: string; property?: string; value?: string }
  )[],
  property: string,
  value: string,
): boolean {
  return declarations.some(declaration => {
    return (
      declaration.type === 'declaration' &&
      (declaration as CssDeclaration).property === property &&
      (declaration as CssDeclaration).value === value
    )
  })
}

function isCss(fileName: string | unknown): boolean {
  if (typeof fileName === 'string') {
    return path.extname(fileName) === '.css'
  }
  return false
}

function isConcatSource(asset: sources.Source): asset is ConcatSourceLike {
  const concatAsset = asset as ConcatSourceLike
  return (
    concatAsset.children !== undefined && Array.isArray(concatAsset.children)
  )
}

function warnInvalidResource(url: string): void {
  logger.warn(`'${url}' is not supported yet.`)
}

function warnPosition(url: string, shorthand = true): void {
  const what = shorthand ? '<position>' : "'background-position'"
  logger.error(`'${url}' skipped. Please use ${what} as '0 0'`)
}

function warnRepeatStyle(url: string, shorthand = true): void {
  const what = shorthand ? '<repeat-style>' : "'background-repeat'"
  logger.error(`'${url}' skipped. Please use ${what} as 'no-repeat'`)
}

function warnShorthand(url: string): void {
  logger.warn(
    `Shorthand properties preferred : background-image: url('${url}')`,
  )
}

class ImageSpritePlugin {
  private _extensions: string[]
  private _padding: number
  private _suffix: string
  private _outputPath: string | undefined
  private _outputFilename: string
  private _compress: boolean
  private _indent: string
  private _commentOrigin: boolean
  private _DIST_DIR: string | null = null
  private _publicPath: string | null = null
  private _outFileCache: string | null = null
  private _chunkMap: Record<string, string | undefined> = {}
  private _coordinates: Record<string, SpritesmithCoordinates> | null = null
  private _cssAstMap: Record<string, CssStylesheet | CssStylesheet[]> = {}
  private _imageAssetCandidates: Record<string, sources.Source> = {}
  private _sprite: Buffer | null = null

  constructor(option: ImageSpritePluginOptions) {
    this._extensions = option.extensions || ['png', 'jpg', 'jpeg', 'gif']
    this._extensions = this._extensions.map(extension => {
      return '.' + extension
    })
    this._padding = option.padding || 0
    this._suffix = option.suffix || ''
    this._outputPath = option.outputPath
    this._outputFilename = option.outputFilename || '/sprite/sprite-[hash].png'
    this._compress =
      typeof option.compress === 'undefined' ? false : !!option.compress
    this._indent =
      typeof option.indent === 'undefined' || !!option.indent.trim()
        ? '  '
        : option.indent
    this._commentOrigin = !!option.commentOrigin
    logger.use(typeof option.log === 'undefined' ? true : !!option.log)
  }

  apply(compiler: Compiler): void {
    const pluginName = 'ImageSpritePlugin'

    compiler.hooks.thisCompilation.tap(pluginName, compilation => {
      this._DIST_DIR = this._outputPath
        ? path.resolve(CWD, this._outputPath)
        : compiler.outputPath
      this._publicPath = (compilation.outputOptions.publicPath as string) || '/'

      // webpack 5: use processAssets hook (additionalAssets is deprecated)
      compilation.hooks.processAssets.tapAsync(
        {
          name: pluginName,
          stage: Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL,
        },
        (assets, callback) => {
          this.createSprite(compilation, (sprite, coordinates) => {
            if (sprite && coordinates) {
              this.updateSprite(sprite, coordinates)
              const source = new RawSource(sprite)
              const outFile = this.getOutFileName()
              // webpack 5: use emitAsset instead of direct assignment
              compilation.emitAsset(outFile, source)
              logger.ok(
                logger.emp(outFile),
                `(${source.source().length} bytes) created.\n`,
              )
              if (this.isInlineCss(compilation)) {
                this.transformJs(compilation)
              } else {
                this.transformCss(compilation)
              }
              logger.nl()
            }
            callback()
          })
        },
      )
    })
  }

  private addBackgroundComment(
    declaration: CssDeclaration,
    index: number,
    url: string,
    shorthand = true,
  ): void {
    if (this._commentOrigin && declaration.parent) {
      declaration.parent.declarations.splice(index + 1, 0, {
        type: 'comment',
        comment: shorthand
          ? ` background: url(${url}) no-repeat 0 0; `
          : ` background-image: url(${url}); `,
      } as unknown as CssDeclaration)
    }
  }

  private addPositionComment(declaration: CssDeclaration, index: number): void {
    if (this._commentOrigin && declaration.parent) {
      declaration.parent.declarations.splice(index + 1, 0, {
        type: 'comment',
        comment: ' background-position: 0 0; ',
      } as unknown as CssDeclaration)
    }
  }

  private createCssAstMap(assetName: string, asset: sources.Source): void {
    if (isConcatSource(asset)) {
      if (!this._cssAstMap[assetName]) {
        this._cssAstMap[assetName] = []
      }
      asset.children!.forEach((childAsset: sources.Source, i: number) => {
        ;(this._cssAstMap[assetName] as CssStylesheet[])[i] = css.parse(
          childAsset.source().toString(),
          { source: `source${i}.css` },
        )
      })
    } else {
      this._cssAstMap[assetName] = css.parse(asset.source().toString(), {
        source: path.join(this._DIST_DIR!, assetName),
      })
    }
  }

  private createSprite(
    compilation: Compilation,
    callback: (
      sprite: Buffer | null,
      coordinates: Record<string, SpritesmithCoordinates> | null,
    ) => void,
  ): void {
    const images = this.getSpriteSources(compilation)
    if (images.length === 0) {
      callback(null, null)
      return
    }
    logger.nl()
    logger.log('Creating sprite image from ...\n')
    images.forEach(img => {
      logger.desc(img.path)
    })
    logger.nl()
    Spritesmith.run(
      {
        src: images,
        padding: this._padding,
      },
      (
        err: Error | null,
        result:
          | {
              image: Buffer
              coordinates: Record<string, SpritesmithCoordinates>
            }
          | undefined,
      ) => {
        if (err) {
          logger.error(err)
        } else if (result) {
          const { image, coordinates } = result
          callback(image, coordinates)
        }
      },
    )
  }

  private eachCssAssets(
    compilation: Compilation,
    callback: (assetName: string, asset: sources.Source) => void,
  ): void {
    const { assets } = compilation
    Object.keys(assets).forEach(assetName => {
      if (isCss(assetName)) {
        callback(assetName, assets[assetName])
      }
    })
  }

  private eachImageAssets(
    compilation: Compilation,
    callback: (assetName: string, asset: sources.Source) => void,
  ): void {
    const { assets } = compilation
    Object.keys(assets).forEach(assetName => {
      if (this.isImage(assetName)) {
        callback(assetName, assets[assetName])
      }
    })
  }

  private getChangedChunks(
    compilation: Compilation,
  ): Array<{ name?: string | null; hash?: string; files: Set<string> }> {
    // webpack 5: compilation.chunks is a Set, convert to Array
    const chunks = compilation.chunks ? [...compilation.chunks] : []

    return chunks.filter(chunk => {
      const oldHash = this._chunkMap[chunk.name || '']
      this._chunkMap[chunk.name || ''] = chunk.hash
      return chunk.hash !== oldHash
    })
  }

  private getCoordinates(
    module: NormalModule,
  ): SpritesmithCoordinates | undefined {
    const url = getAssetNameFromModule(module)
    if (!url) {
      return undefined
    }
    const assetPath = path.join(this._DIST_DIR!, url)
    return this._coordinates?.[assetPath]
  }

  private getCssSource(ast: CssStylesheet, eol?: boolean): string {
    return (
      css.stringify(ast, {
        indent: this._indent,
        compress: this._compress,
      }) + (!this._compress && eol ? os.EOL + os.EOL : '')
    )
  }

  private getImageAssetCandidates(
    compilation: Compilation,
  ): Record<string, sources.Source> {
    this.eachImageAssets(compilation, (assetName, asset) => {
      this._imageAssetCandidates[assetName] = asset
    })
    return this._imageAssetCandidates
  }

  private getImageModules(compilation: Compilation): NormalModule[] {
    // webpack 5: compilation.modules is a Set, convert to Array
    const modules = compilation.modules ? [...compilation.modules] : []

    return modules.filter((module): module is NormalModule => {
      // webpack 5: rawRequest may not exist, use userRequest or resource
      const normalModule = module as NormalModule
      const request =
        normalModule.rawRequest ||
        normalModule.userRequest ||
        normalModule.resource ||
        ''
      return this.isImage(request)
    }) as NormalModule[]
  }

  private getImagePathFromStyle(decValue: string): ImagePathInfo {
    const match = parenthesis.exec(decValue)
    let url = match ? match[1] : ''
    if (url.startsWith(this._publicPath!)) {
      url = url.substr(this._publicPath!.length)
    }
    return {
      url: this._publicPath + url,
      local: path.join(this._DIST_DIR!, url),
    }
  }

  private getImagesFromCssAst(ast: CssStylesheet): string[] {
    const result: string[] = []
    const publicPath = this._publicPath!
    forEachDeclaration(ast, decl => {
      const decValue = decl.value
      if (decl.property === 'background' && decValue.includes('url(')) {
        if (!decValue.includes('no-repeat')) {
          warnRepeatStyle(decValue)
        } else if (!decValue.includes(' 0 0')) {
          warnPosition(decValue)
        } else {
          const match = parenthesis.exec(decValue)
          let url = match ? match[1] : ''
          if (url.startsWith(publicPath)) {
            url = url.replace(publicPath, '')
          }
          result.push(url)
        }
      } else if (
        decl.property === 'background-image' &&
        decValue.includes('url(')
      ) {
        const { declarations } = decl.parent!
        if (!hasDeclaration(declarations, 'background-repeat', 'no-repeat')) {
          warnRepeatStyle(decValue, false)
        } else if (
          !hasDeclaration(declarations, 'background-position', '0 0')
        ) {
          warnPosition(decValue, false)
        } else {
          const match = parenthesis.exec(decValue)
          let url = match ? match[1] : ''
          if (url.startsWith(publicPath)) {
            url = url.replace(publicPath, '')
          }
          result.push(url)
          warnShorthand(url)
        }
      }
    })
    return result
  }

  private getOutFileName(): string {
    if (this._outFileCache) {
      return this._outFileCache
    }
    const hex = this._sprite!.toString('hex')
    this._outFileCache = this._outputFilename.replace(
      '[hash]',
      crypto.createHash('md5').update(hex).digest('hex'),
    )
    return this._outFileCache
  }

  private getOutFilePath(): string {
    return this._publicPath + this.getOutFileName() + this._suffix
  }

  private getSpriteSourceSetFromAst(
    ast: CssStylesheet,
    candidates: Record<string, sources.Source>,
  ): Set<string> {
    const sources = new Set<string>()
    const pathsInCss = this.getImagesFromCssAst(ast)
    pathsInCss.forEach(imgAssetPath => {
      if (candidates[imgAssetPath]) {
        sources.add(imgAssetPath)
      }
    })
    return sources
  }

  private getSpriteSources(compilation: Compilation): Vinyl[] {
    const sources: Vinyl[] = []
    if (this.isInlineCss(compilation)) {
      this.eachImageAssets(compilation, (assetName, asset) => {
        const content = asset.source()
        sources.push(
          new Vinyl({
            path: path.join(this._DIST_DIR!, assetName),
            contents: Buffer.isBuffer(content) ? content : Buffer.from(content),
          }),
        )
      })
      return sources
    }
    return this.getSpriteSourcesFromCssAssets(compilation)
  }

  private getSpriteSourcesFromCssAssets(compilation: Compilation): Vinyl[] {
    const sources: Vinyl[] = []
    let imgPathUnion = new Set<string>()
    const candidates = this.getImageAssetCandidates(compilation)
    this.eachCssAssets(compilation, (cssAssetName, cssAsset) => {
      this.createCssAstMap(cssAssetName, cssAsset)
      const astOrAsts = this._cssAstMap[cssAssetName]
      if (isConcatSource(cssAsset) && Array.isArray(astOrAsts)) {
        astOrAsts.forEach(ast => {
          const childSources = this.getSpriteSourceSetFromAst(ast, candidates)
          imgPathUnion = new Set([...imgPathUnion, ...childSources])
        })
      } else {
        const ast = astOrAsts as CssStylesheet
        const childSources = this.getSpriteSourceSetFromAst(ast, candidates)
        imgPathUnion = new Set([...imgPathUnion, ...childSources])
      }
    })
    imgPathUnion.forEach(imgAssetPath => {
      const content = candidates[imgAssetPath].source()
      sources.push(
        new Vinyl({
          contents: Buffer.isBuffer(content) ? content : Buffer.from(content),
          path: path.join(this._DIST_DIR!, imgAssetPath),
        }),
      )
    })
    return sources
  }

  private getTranformTargets(compilation: Compilation): TransformTarget[] {
    const result: TransformTarget[] = []
    const { assets } = compilation
    const changes = this.getChangedChunks(compilation).map(chunk => {
      // webpack 5: chunk.files is a Set, convert to Array
      return [...chunk.files]
    })
    Object.keys(assets).forEach(assetName => {
      const basename = path.basename(assetName)
      changes.forEach(files => {
        if (files.includes(basename) && !basename.includes('.hot-update.js')) {
          result.push({
            name: assetName,
            asset: assets[assetName],
          })
        }
      })
    })
    return result
  }

  private isImage(fileName: string | unknown): boolean {
    if (typeof fileName === 'string') {
      return this._extensions.includes(path.extname(fileName))
    }
    return false
  }

  private isInlineCss(compilation: Compilation): boolean {
    // Check if there are CSS assets (mini-css-extract-plugin or extract-text-webpack-plugin)
    // If CSS assets exist, CSS is NOT inline (extracted to separate files)
    const { assets } = compilation
    const hasCssAssets = Object.keys(assets).some(assetName => isCss(assetName))

    // If there are CSS assets, CSS is extracted (not inline)
    // If there are no CSS assets, CSS is inline in JS (style-loader)
    return !hasCssAssets
  }

  private parseCssBlock(block: string): ParsedCssBlock {
    const propertyMap: Record<
      string,
      { declaration: CssDeclaration; index: number }
    > = {}
    const code = block.replace(lineBreak, '')
    const ast = css.parse(PSEUDO_CLASS + code) as CssStylesheet
    const { declarations } = ast.stylesheet.rules[0] as CssRule
    declarations.forEach((decl, i) => {
      if (decl.type === 'declaration') {
        const declaration = decl as CssDeclaration
        propertyMap[declaration.property] = {
          declaration,
          index: i,
        }
      }
    })
    return {
      ast,
      propertyMap,
    }
  }

  private transformCss(compilation: Compilation): void {
    this.eachCssAssets(compilation, (assetName, asset) => {
      this.transformCssAsset(assetName, asset, compilation)
    })
  }

  private transformCssAsset(
    assetName: string,
    asset: sources.Source,
    compilation: Compilation,
  ): void {
    logger.nl()
    logger.log(`transforming css asset ${assetName} ...`)
    logger.nl()
    const obj = this._cssAstMap[assetName]
    if (Array.isArray(obj)) {
      const concatAsset = asset as ConcatSourceLike
      obj.forEach((ast, i) => {
        this.updateCssAst(ast)
        const cssSource = this.getCssSource(ast, true)
        const child = concatAsset.children![i] as SourceMapSourceLike
        concatAsset.children![i] = new SourceMapSource(
          cssSource,
          '',
          child._sourceMap as string,
        )
      })
    } else {
      this.updateCssAst(obj)
      const cssSource = this.getCssSource(obj, true)
      // webpack 5: use updateAsset instead of direct assignment
      const sourceMap = typeof asset.map === 'function' ? asset.map() : null
      compilation.updateAsset(
        assetName,
        new SourceMapSource(
          cssSource,
          assetName,
          sourceMap as unknown as string,
        ),
      )
    }
  }

  private transformJs(compilation: Compilation): void {
    const imageModules = this.getImageModules(compilation)
    this.getTranformTargets(compilation).forEach(target => {
      this.transformJsAsset(
        target.asset,
        target.name,
        compilation,
        imageModules,
      )
    })
  }

  private transformJsAsset(
    asset: sources.Source,
    name: string,
    compilation: Compilation,
    imageModules: NormalModule[],
  ): void {
    logger.nl()
    logger.log(`transforming js asset ${name} ...`)
    logger.nl()
    const replaceable = new ReplaceSource(asset, name)
    imageModules.forEach(mod => {
      this.updateJsBackgroundShorthand(compilation, replaceable, name, mod)
      this.updateJsBackgroundImage(compilation, replaceable, name, mod)
    })
    // webpack 5: use updateAsset instead of direct assignment
    compilation.updateAsset(name, replaceable)
  }

  private updateCssAst(ast: CssStylesheet): void {
    forEachDeclaration(ast, (decl, i) => {
      const decValue = decl.value
      if (
        decl.property === 'background' &&
        decValue.includes('url(') &&
        decValue.includes('no-repeat') &&
        decValue.includes(' 0 0')
      ) {
        this.updateCssBackgroundShorthand(decl, i)
      } else if (
        decl.parent &&
        decl.property === 'background-image' &&
        decValue.includes('url(') &&
        hasDeclaration(
          decl.parent.declarations,
          'background-repeat',
          'no-repeat',
        ) &&
        hasDeclaration(decl.parent.declarations, 'background-position', '0 0')
      ) {
        this.updateCssBackgroundImage(decl, i)
      }
    })
  }

  private updateCssBackgroundImage(decl: CssDeclaration, index: number): void {
    const decValue = decl.value
    const { declarations } = decl.parent!
    const { url, local } = this.getImagePathFromStyle(decValue)
    const coord = this._coordinates?.[local]
    if (!coord) {
      warnInvalidResource(url)
      return
    }
    const newVal = 'url(' + this.getOutFilePath() + ')'
    decl.value = newVal
    logger.transformOk(decValue, newVal)
    const newPos = getPosition(coord)
    let indexPos = 0
    declarations.some((declaration, i) => {
      if (
        declaration.type === 'declaration' &&
        (declaration as CssDeclaration).property === 'background-position'
      ) {
        indexPos = i
        ;(declaration as CssDeclaration).value = newPos
        return true
      }
      return false
    })
    logger.transformOk(
      'background-position: 0 0',
      `background-position: ${newPos}`,
    )
    this.addBackgroundComment(decl, index, url, false)
    this.addPositionComment(decl, indexPos + 1)
  }

  private updateCssBackgroundShorthand(
    decl: CssDeclaration,
    index: number,
  ): void {
    const decValue = decl.value
    const { url, local } = this.getImagePathFromStyle(decValue)
    const coord = this._coordinates?.[local]
    if (!coord) {
      warnInvalidResource(url)
      return
    }
    const newVal =
      'url(' + this.getOutFilePath() + ') no-repeat ' + getPosition(coord)
    decl.value = newVal
    logger.transformOk(decValue, newVal)
    this.addBackgroundComment(decl, index, url)
  }

  private updateJsBackgroundImage(
    compilation: Compilation,
    replaceable: ReplaceSource,
    name: string,
    module: NormalModule,
  ): void {
    let source = replaceable.original().source().toString()
    const syntax = new RegExp(
      `__webpack_require__\\([^)]*(${module.id})(\\")?\\)`,
      'g',
    )
    let occurrence = source.search(syntax)
    while (occurrence > -1) {
      const { start, end, cssBlock } = getCssBlock(source, occurrence)
      const { ast, propertyMap } = this.parseCssBlock(cssBlock)
      const bgImage = propertyMap['background-image']
      const bgRepeat = propertyMap['background-repeat']
      const bgPosition = propertyMap['background-position']
      if (bgImage) {
        // webpack 5: rawRequest may not exist, use userRequest or resource
        const rawRequest =
          module.rawRequest || module.userRequest || module.resource || ''
        if (
          !bgRepeat ||
          (bgRepeat && bgRepeat.declaration.value !== 'no-repeat')
        ) {
          warnRepeatStyle(rawRequest, false)
        } else if (
          !bgPosition ||
          (bgPosition && bgPosition.declaration.value !== '0 0')
        ) {
          warnPosition(rawRequest, false)
        } else if (bgRepeat && bgPosition) {
          const coord = this.getCoordinates(module)
          if (!coord) {
            warnInvalidResource(rawRequest)
            return
          }
          warnShorthand(rawRequest)
          const newImgVal = `url(${this.getOutFilePath()})`
          bgImage.declaration.value = newImgVal
          const newPosVal = getPosition(coord)
          bgPosition.declaration.value = newPosVal
          const origin = getAssetNameFromModule(module)
          this.addBackgroundComment(
            bgImage.declaration,
            bgImage.index,
            origin || '',
            false,
          )
          this.addPositionComment(bgPosition.declaration, bgPosition.index + 1)
          const cssSource = this.getCssSource(ast)
          const toBe = cssSource.replace(PSEUDO_CLASS, '').replace(/\n/g, EOL)
          replaceable.replace(start, end, toBe)
          logger.transformOk(getBackgroundShorthand(rawRequest), newImgVal)
          logger.transformOk(
            'background-position: 0 0',
            `background-position: ${newPosVal}`,
          )
        }
      }
      source = source.substr(end)
      occurrence = source.search(syntax)
    }
  }

  private updateJsBackgroundShorthand(
    compilation: Compilation,
    replaceable: ReplaceSource,
    name: string,
    module: NormalModule,
  ): void {
    let source = replaceable.original().source().toString()
    const syntax = new RegExp(
      `__webpack_require__\\([^)]*(${module.id})(\\")?\\)`,
      'g',
    )
    let occurrence = source.search(syntax)
    while (occurrence > -1) {
      const { start, end, cssBlock } = getCssBlock(source, occurrence)
      const { ast, propertyMap } = this.parseCssBlock(cssBlock)
      if (propertyMap['background']) {
        const { declaration, index } = propertyMap['background']
        // webpack 5: rawRequest may not exist, use userRequest or resource
        const rawRequest =
          module.rawRequest || module.userRequest || module.resource || ''
        if (!declaration.value.includes('no-repeat')) {
          warnRepeatStyle(rawRequest)
        } else if (!declaration.value.includes(' 0 0')) {
          warnPosition(rawRequest)
        } else {
          const coord = this.getCoordinates(module)
          if (!coord) {
            warnInvalidResource(rawRequest)
            return
          }
          const newVal = `url(${this.getOutFilePath()}) no-repeat ${getPosition(coord)}`
          declaration.value = newVal
          const origin = getAssetNameFromModule(module)
          this.addBackgroundComment(declaration, index, origin || '')
          const cssSource = this.getCssSource(ast)
          const toBe = cssSource.replace(PSEUDO_CLASS, '').replace(/\n/g, EOL)
          replaceable.replace(start, end, toBe)
          logger.transformOk(getBackgroundShorthand(rawRequest), newVal)
        }
      }
      source = source.substr(end)
      occurrence = source.search(syntax)
    }
  }

  private updateSprite(
    sprite: Buffer,
    coordinates: Record<string, SpritesmithCoordinates>,
  ): void {
    this._outFileCache = null
    this._sprite = sprite
    this._coordinates = coordinates
  }
}

export default ImageSpritePlugin
