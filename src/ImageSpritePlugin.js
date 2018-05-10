/**
 * image-sprite-webpack-plugin
 *
 * Copyright (c) 2018 NAVER Corp.
 * Licensed under the MIT
 */

const crypto = require('crypto');
const css = require('css');
const os = require('os');
const path = require('path');
const Spritesmith = require('spritesmith');
const Vinyl = require('vinyl');
const { RawSource, ReplaceSource, SourceMapSource } = require('webpack-sources');
const Logger = require('./Logger');
const on = require('./on');

const lineBreak = /\\r?\\n|\\r/g;
const logger = new Logger();
const parenthesis = /url\(([^)]+)\)/;
const CWD = process.cwd();
const EOL = os.EOL.replace('\r', '\\r').replace('\n', '\\n');
const PSEUDO_CLASS = '.__ISWP__';

function forEachDeclaration(ast, callback) {
    ast.stylesheet.rules.forEach((rule) => {
        if (rule.type === 'rule' && Array.isArray(rule.declarations)) {
            rule.declarations.forEach((decl, i) => {
                callback(decl, i);
            });
        }
    });
}

function getAssetNameFromModule(module) {
    if (module.buildInfo && module.buildInfo.assets) {
        return Object.keys(module.buildInfo.assets)[0];
    }
    return Object.keys(module.assets)[0];
}

function getBackgroundShorthand(url) {
    return `url(${url}) no-repeat 0 0`;
}

function getCssBlock(source, occurrence) {
    const start = source.lastIndexOf('{', occurrence);
    const end = source.indexOf('}', occurrence);
    const cssBlock = source.substring(start, end + 1);
    return {
        cssBlock,
        start,
        end
    };
}

function getPosition(coord) {
    return (coord.x ? '-' + coord.x + 'px' : 0)
        + ' '
        + (coord.y ? '-' + coord.y + 'px' : 0);
}

function hasDeclaration(declarations, property, value) {
    return declarations.some((declaration) => {
        return (declaration.property === property)
            && (declaration.value === value);
    });
}

function isCss(fileName) {
    if (typeof fileName === 'string') {
        return path.extname(fileName) === '.css';
    }
    return false;
}

function isConcatSource(asset) {
    return asset.children && Array.isArray(asset.children);
}

function warnInvalidResource(url) {
    logger.warn(`'${url}' is not supported yet.`);
}

function warnPosition(url, shorthand = true) {
    const what = shorthand ? '<position>' : "'background-position'";
    logger.error(`'${url}' skipped. Please use ${what} as '0 0'`);
}

function warnRepeatStyle(url, shorthand = true) {
    const what = shorthand ? '<repeat-style>' : "'background-repeat'";
    logger.error(`'${url}' skipped. Please use ${what} as 'no-repeat'`);
}

function warnShorthand(url) {
    logger.warn(`Shorthand properties preferred : background-image: url('${url}')`);
}

class ImageSpritePlugin {

    constructor(option) {
        this._extensions = option.extensions
            || ['png', 'jpg', 'jpeg', 'gif'];
        this._extensions = this._extensions.map((extension) => {
            return '.' + extension;
        });
        this._padding = option.padding || 0;
        this._suffix = option.suffix || '';
        this._outputPath = option.outputPath;
        this._outputFilename = option.outputFilename || '/sprite/sprite-[hash].png';
        this._compress = typeof option.compress === 'undefined'
            ? false : !!option.compress;
        this._indent = (typeof option.indent === 'undefined'
            || !!option.indent.trim()) ? '  ' : option.indent;
        this._commentOrigin = !!option.commentOrigin;
        this._DIST_DIR = null;
        this._publicPath = null;
        this._outFileCache = null;
        this._chunkMap = {};
        this._coordinates = null;
        this._cssAstMap = {};
        this._imageAssetCandidates = {};
        this._sprite = null;
        logger.use(typeof option.log === 'undefined'
            ? true : !!option.log);
    }

    apply(compiler) {
        on(compiler, 'thisCompilation', 'tap', (compilation) => {

            this._DIST_DIR = this._outputPath
                ? path.resolve(CWD, this._outputPath)
                : compiler.outputPath;
            this._publicPath = compilation.outputOptions.publicPath;

            // Create additional assets for the compilation
            on(compilation, 'additionalAssets', 'tapAsync', (callback) => {
                this.createSprite(compilation, (sprite, coordinates) => {
                    if (sprite && coordinates) {
                        this.updateSprite(sprite, coordinates);
                        const source = new RawSource(sprite);
                        const outFile = this.getOutFileName();
                        compilation.assets[outFile] = source;
                        logger.ok(logger.emp(outFile),
                            `(${source.source().length} bytes) created.\n`);
                        if (this.isInlineCss(compilation)) {
                            this.transformJs(compilation);
                        } else {
                            this.transformCss(compilation);
                        }
                        logger.nl();
                    }
                    callback();
                });
            });
        });
    }

    addBackgroundComment(declaration, index, url, shorthand = true) {
        if (this._commentOrigin && declaration.parent) {
            declaration.parent.declarations.splice(index + 1, 0, {
                comment: shorthand
                    ? ` background: url(${url}) no-repeat 0 0; `
                    : ` background-image: url(${url}); `,
                type: 'comment'
            });
        }
    }

    addPositionComment(declaration, index) {
        if (this._commentOrigin && declaration.parent) {
            declaration.parent.declarations.splice(index + 1, 0, {
                comment: ' background-position: 0 0; ',
                type: 'comment'
            });
        }
    }

    /**
     * @param {string} assetName
     * @param {()} asset
     */
    createCssAstMap(assetName, asset) {
        if (isConcatSource(asset)) {
            if (!this._cssAstMap[assetName]) {
                this._cssAstMap[assetName] = [];
            }
            asset.children.forEach((/*SourceMapSource*/childAsset, i) => {
                this._cssAstMap[assetName][i] = css.parse(
                    childAsset.source(), { source: `source${i}.css` });
            });
        } else {
            this._cssAstMap[assetName] = css.parse(asset.source(), {
                source: path.join(this._DIST_DIR, assetName)
            });
        }
    }

    /**
     * Creates a sprite sheet then run the given callback
     * @param {Compilation} compilation
     * @param {Function} callback
     */
    createSprite(compilation, callback) {
        const images = this.getSpriteSources(compilation);
        if (images.length === 0) {
            callback(null, null);
            return;
        }
        logger.nl();
        logger.log('Creating sprite image from ...\n');
        images.forEach((img) => {
            logger.desc(img.path);
        });
        logger.nl();
        Spritesmith.run({
            src: images,
            padding: this._padding
        }, (err, result) => {
            if (err) {
                logger.error(err);
            } else if (result) {
                const { image, coordinates } = result;
                callback(image, coordinates);
            }
        });
    }

    eachCssAssets(compilation, callback) {
        const { assets } = compilation;
        Object.keys(assets).forEach((assetName) => {
            if (isCss(assetName)) {
                callback(assetName, assets[assetName]);
            }
        });
    }

    eachImageAssets(compilation, callback) {
        const { assets } = compilation;
        Object.keys(assets).forEach((assetName) => {
            if (this.isImage(assetName)) {
                callback(assetName, assets[assetName]);
            }
        });
    }

    /**
     * @return {Array<Chunk>}
     */
    getChangedChunks(compilation) {
        return compilation.chunks.filter((chunk) => {
            const oldHash = this._chunkMap[chunk.name];
            this._chunkMap[chunk.name] = chunk.hash;
            return chunk.hash !== oldHash;
        });
    }

    /**
     * @return {object} coordinates
     * @property {number} x
     * @property {number} y
     * @property {number} width
     * @property {number} height
     */
    getCoordinates(module) {
        const url = getAssetNameFromModule(module);
        const assetPath = path.join(this._DIST_DIR, url);
        return this._coordinates[assetPath];
    }

    /**
     * @param {object} ast - a result from css.parse()
     * @return {string}
     */
    getCssSource(ast, eol) {
        return css.stringify(ast, {
            indent: this._indent,
            compress: this._compress
        }) + (!this._compress && eol ? (os.EOL + os.EOL) : '');
    }

    /**
     * @param {Compilation} compilation
     * @return {object} - Candidates for images that can generate sprites.
     */
    getImageAssetCandidates(compilation) {
        this.eachImageAssets(compilation, (assetName, asset) => {
            this._imageAssetCandidates[assetName] = asset;
        });
        return this._imageAssetCandidates;
    }

    /**
     * @param {Compilation} compilation
     * @return {Array<NormalModule>}
     */
    getImageModules(compilation) {
        // imageModules exists only inline mode
        return compilation.modules.filter((module) => {
            return this.isImage(module.rawRequest);
        });
    }

    /**
     * @param {string} decValue
     * @return {object}
     * @property {string} url
     * @property {string} local - local path
     */
    getImagePathFromStyle(decValue) {
        let url = parenthesis.exec(decValue)[1];
        if (url.startsWith(this._publicPath)) {
            url = url.substr(this._publicPath.length);
        }
        return {
            url: this._publicPath + url,
            local: path.join(this._DIST_DIR, url)
        };
    }

    /**
     * @param {object} ast - a result from css.parse()
     * @return {Array<string>}
     */
    getImagesFromCssAst(ast) {
        const result = [];
        const publicPath = this._publicPath;
        forEachDeclaration(ast, (decl) => {
            const decValue = decl.value;
            if (decl.property === 'background' && decValue.includes('url(')) {
                if (!decValue.includes('no-repeat')) {
                    warnRepeatStyle(decValue);
                } else if (!decValue.includes(' 0 0')) {
                    warnPosition(decValue);
                } else {
                    let url = parenthesis.exec(decValue)[1];
                    if (url.startsWith(publicPath)) {
                        url = url.replace(publicPath, '');
                    }
                    result.push(url);
                }
            } else if (decl.property === 'background-image' && decValue.includes('url(')) {
                const { declarations } = decl.parent;
                if (!hasDeclaration(declarations, 'background-repeat', 'no-repeat')) {
                    warnRepeatStyle(decValue, false);
                } else if (!hasDeclaration(declarations, 'background-position', '0 0')) {
                    warnPosition(decValue, false);
                } else {
                    let url = parenthesis.exec(decValue)[1];
                    if (url.startsWith(publicPath)) {
                        url = url.replace(publicPath, '');
                    }
                    result.push(url);
                    warnShorthand(url);
                }
            }
        });
        return result;
    }

    getOutFileName() {
        if (this._outFileCache) {
            return this._outFileCache;
        }
        const hex = this._sprite.toString('hex');
        this._outFileCache = this._outputFilename.replace(
            '[hash]',
            crypto.createHash('md5').update(hex).digest('hex')
        );
        return this._outFileCache;
    }

    getOutFilePath() {
        return this._publicPath + this.getOutFileName() + this._suffix;
    }

    /**
     * @return {Set<string>}
     */
    getSpriteSourceSetFromAst(ast, candidates) {
        const sources = new Set();
        const pathsInCss = this.getImagesFromCssAst(ast);
        pathsInCss.forEach((imgAssetPath) => {
            if (candidates[imgAssetPath]) {
                sources.add(imgAssetPath);
            }
        });
        return sources;
    }

    /**
     * @return {Array<Vinyl>}
     */
    getSpriteSources(compilation) {
        const sources = [];
        if (this.isInlineCss(compilation)) {
            this.eachImageAssets(compilation, (assetName, /*RawSource*/asset) => {
                sources.push(new Vinyl({
                    path: path.join(this._DIST_DIR, assetName),
                    contents: asset.source()
                }));
            });
            return sources;
        }
        return this.getSpriteSourcesFromCssAssets(compilation);
    }

    /**
     * Images from candidates which found in parsed css.
     * @return Array<Vinyl>
     */
    getSpriteSourcesFromCssAssets(compilation) {
        const sources = [];
        let imgPathUnion = new Set();
        const candidates = this.getImageAssetCandidates(compilation);
        this.eachCssAssets(compilation, (cssAssetName, /*ConcatSource*/cssAsset) => {
            this.createCssAstMap(cssAssetName, cssAsset);
            if (isConcatSource(cssAsset)
                && Array.isArray(this._cssAstMap[cssAssetName])) {
                this._cssAstMap[cssAssetName].forEach((ast) => {
                    const /*Set*/ childSources = this.getSpriteSourceSetFromAst(ast, candidates);
                    imgPathUnion = new Set([...imgPathUnion, ...childSources]);
                });
            } else {
                const ast = this._cssAstMap[cssAssetName];
                const /*Set*/ childSources = this.getSpriteSourceSetFromAst(ast, candidates);
                imgPathUnion = new Set([...imgPathUnion, ...childSources]);
            }
        });
        imgPathUnion.forEach((imgAssetPath) => {
            sources.push(new Vinyl({
                contents: candidates[imgAssetPath].source(),
                path: path.join(this._DIST_DIR, imgAssetPath)
            }));
        });
        return sources;
    }

    /**
     * @return {Array<{name: string, asset: CachedSource}>}
     */
    getTranformTargets(compilation) {
        const result = [];
        const { assets } = compilation;
        const changes = this.getChangedChunks(compilation).map((chunk) => {
            return chunk.files;
        });
        Object.keys(assets).forEach((assetName) => {
            const basename = path.basename(assetName);
            changes.forEach((files) => {
                if (files.includes(basename)
                    && !basename.includes('.hot-update.js')) {
                    result.push({
                        name: assetName,
                        asset: assets[assetName]
                    });
                }
            });
        });
        return result;
    }

    isImage(fileName) {
        if (typeof fileName === 'string') {
            return this._extensions.includes(path.extname(fileName));
        }
        return false;
    }

    isInlineCss(compilation) {
        return compilation.modules.some((module) => {
            return this.isImage(module.rawRequest);
        });
    }

    /**
     * @param {string} block
     */
    parseCssBlock(block) {
        const propertyMap = {};
        const code = block.replace(lineBreak, '');
        const ast = css.parse(PSEUDO_CLASS + code);
        const { declarations } = ast.stylesheet.rules[0];
        declarations.forEach((decl, i) => {
            propertyMap[decl.property] = {
                declaration: decl,
                index: i
            };
        });
        return {
            ast,
            propertyMap
        };
    }

    transformCss(compilation) {
        this.eachCssAssets(compilation, (assetName, asset) => {
            this.transformCssAsset(assetName, asset, compilation);
        });
    }

    /**
     * @param {string} assetName
     * @param {object} asset
     * @param {Compilation} compilation
     */
    transformCssAsset(assetName, asset, compilation) {
        logger.nl();
        logger.log(`transforming css asset ${assetName} ...`);
        logger.nl();
        const obj = this._cssAstMap[assetName];
        if (Array.isArray(obj)) {
            obj.forEach((ast, i) => {
                this.updateCssAst(ast);
                const cssSource = this.getCssSource(ast, true);
                const child = asset.children[i];
                asset.children[i] = new SourceMapSource(
                    cssSource, null, child._sourceMap);
            });
        } else {
            this.updateCssAst(obj);
            const cssSource = this.getCssSource(obj, true);
            compilation.assets[assetName] = new SourceMapSource(
                cssSource, assetName, asset.map());
        }
    }

    transformJs(compilation) {
        const imageModules = this.getImageModules(compilation);
        this.getTranformTargets(compilation).forEach((target) => {
            this.transformJsAsset(target.asset, target.name, compilation, imageModules);
        });
    }

    /**
     * @param {CachedSource} asset
     * @param {string} name
     * @param {Compilation} compilation
     * @param {Array<NormalModule>} imageModules
     */
    transformJsAsset(asset, name, compilation, imageModules) {
        logger.nl();
        logger.log(`transforming js asset ${name} ...`);
        logger.nl();
        const replaceable = new ReplaceSource(asset, name);
        imageModules.forEach((mod) => {
            this.updateJsBackgroundShorthand(compilation, replaceable, name, mod);
            this.updateJsBackgroundImage(compilation, replaceable, name, mod);
        });
        compilation.assets[name] = replaceable;
    }

    updateCssAst(ast) {
        forEachDeclaration(ast, (decl, i) => {
            const decValue = decl.value;
            if (decl.property === 'background'
                && decValue.includes('url(')
                && decValue.includes('no-repeat')
                && decValue.includes(' 0 0')) {
                this.updateCssBackgroundShorthand(decl, i);
            } else if (decl.parent && decl.property === 'background-image'
                && decValue.includes('url(')
                && hasDeclaration(decl.parent.declarations, 'background-repeat', 'no-repeat')
                && hasDeclaration(decl.parent.declarations, 'background-position', '0 0')) {
                this.updateCssBackgroundImage(decl, i);
            }
        });
    }

    /**
     * Updates background-image styles in css sources.
     * @param {CssDeclaration} decl - See https://github.com/reworkcss/css
     * @param {number} index - order of the declaration.
     */
    updateCssBackgroundImage(decl, index) {
        const decValue = decl.value;
        const { declarations } = decl.parent;
        const { url, local } = this.getImagePathFromStyle(decValue);
        const coord = this._coordinates[local];
        if (!coord) {
            warnInvalidResource(url);
            return;
        }
        const newVal = 'url(' + this.getOutFilePath() + ')';
        decl.value = newVal;
        logger.transformOk(decValue, newVal);
        const newPos = getPosition(coord);
        let indexPos = 0;
        declarations.some((declaration, i) => {
            if (declaration.property === 'background-position') {
                indexPos = i;
                declaration.value = newPos;
                return true;
            }
            return false;
        });
        logger.transformOk('background-position: 0 0', `background-position: ${newPos}`);
        this.addBackgroundComment(decl, index, url, false);
        this.addPositionComment(decl, indexPos + 1);
    }

    /**
     * Updates shorthand background styles in css sources.
     * @param {CssDeclaration} decl - See https://github.com/reworkcss/css
     * @param {number} index - order of the declaration.
     */
    updateCssBackgroundShorthand(decl, index) {
        const decValue = decl.value;
        const { url, local } = this.getImagePathFromStyle(decValue);
        const coord = this._coordinates[local];
        if (!coord) {
            warnInvalidResource(url);
            return;
        }
        const newVal = 'url(' + this.getOutFilePath() + ') no-repeat ' + getPosition(coord);
        decl.value = newVal;
        logger.transformOk(decValue, newVal);
        this.addBackgroundComment(decl, index, url);
    }

    /**
     * Updates background-image styles in js sources.
     * @param {Compilation} compilation
     * @param {ReplaceSource} replaceable
     * @param {string} name
     * @param {NormalModule} module
     */
    updateJsBackgroundImage(compilation, replaceable, name, module) {
        let source = replaceable.original().source();
        const syntax = new RegExp(
            `__webpack_require__\\([^)]*(${module.id})(\\")?\\)`, 'g');
        let occurrence = source.search(syntax);
        while (occurrence > -1) {
            const { start, end, cssBlock } = getCssBlock(source, occurrence);
            const { ast, propertyMap } = this.parseCssBlock(cssBlock);
            const bgImage = propertyMap['background-image'];
            const bgRepeat = propertyMap['background-repeat'];
            const bgPosition = propertyMap['background-position'];
            if (bgImage) {
                const { rawRequest } = module;
                if (!bgRepeat || (bgRepeat && bgRepeat.declaration.value !== 'no-repeat')) {
                    warnRepeatStyle(rawRequest, false);
                } else if (!bgPosition || (bgPosition && bgPosition.declaration.value !== '0 0')) {
                    warnPosition(rawRequest, false);
                } else if (bgRepeat && bgPosition) {
                    const coord = this.getCoordinates(module);
                    if (!coord) {
                        warnInvalidResource(rawRequest);
                        return;
                    }
                    warnShorthand(rawRequest);
                    const newImgVal = `url(${this.getOutFilePath()})`;
                    bgImage.declaration.value = newImgVal;
                    const newPosVal = getPosition(coord);
                    bgPosition.declaration.value = newPosVal;
                    const origin = getAssetNameFromModule(module);
                    this.addBackgroundComment(bgImage.declaration, bgImage.index, origin, false);
                    this.addPositionComment(bgPosition.declaration, bgPosition.index + 1);
                    const cssSource = this.getCssSource(ast);
                    const toBe = cssSource.replace(PSEUDO_CLASS, '').replace(/\n/g, EOL);
                    replaceable.replace(start, end, toBe);
                    logger.transformOk(getBackgroundShorthand(rawRequest), newImgVal);
                    logger.transformOk('background-position: 0 0', `background-position: ${newPosVal}`);
                }
            }
            source = source.substr(end);
            occurrence = source.search(syntax);
        }
    }

    /**
     * Updates shorthand background styles in js sources.
     * @param {Compilation} compilation
     * @param {ReplaceSource} replaceable
     * @param {string} name
     * @param {NormalModule} module
     */
    updateJsBackgroundShorthand(compilation, replaceable, name, module) {
        let source = replaceable.original().source();
        const syntax = new RegExp(
            `__webpack_require__\\([^)]*(${module.id})(\\")?\\)`, 'g');
        let occurrence = source.search(syntax);
        while (occurrence > -1) {
            const { start, end, cssBlock } = getCssBlock(source, occurrence);
            const { ast, propertyMap } = this.parseCssBlock(cssBlock);
            if (propertyMap['background']) {
                const { declaration, index } = propertyMap['background'];
                const { rawRequest } = module;
                if (!declaration.value.includes('no-repeat')) {
                    warnRepeatStyle(rawRequest);
                } else if (!declaration.value.includes(' 0 0')) {
                    warnPosition(rawRequest);
                } else {
                    const coord = this.getCoordinates(module);
                    if (!coord) {
                        warnInvalidResource(rawRequest);
                        return;
                    }
                    const newVal = `url(${this.getOutFilePath()}) no-repeat ${getPosition(coord)}`;
                    declaration.value = newVal;
                    const origin = getAssetNameFromModule(module);
                    this.addBackgroundComment(declaration, index, origin);
                    const cssSource = this.getCssSource(ast);
                    const toBe = cssSource.replace(PSEUDO_CLASS, '').replace(/\n/g, EOL);
                    replaceable.replace(start, end, toBe);
                    logger.transformOk(getBackgroundShorthand(rawRequest), newVal);
                }
            }
            source = source.substr(end);
            occurrence = source.search(syntax);
        }
    }

    updateSprite(sprite, coordinates) {
        this._outFileCache = null;
        this._sprite = sprite;
        this._coordinates = coordinates;
    }
}

module.exports = ImageSpritePlugin;
