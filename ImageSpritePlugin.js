/**
 * image-sprite-webpack-plugin
 *
 * Copyright (c) 2018 NAVER Corp.
 * Licensed under the MIT
 */

const chalk = require('chalk');
const css = require('css');
const figures = require('figures');
const fs = require('fs-extra');
const path = require('path');
const Spritesmith = require('spritesmith');
const Vinyl = require('vinyl');
const parenthesis = /url\(([^)]+)\)/;
const logPrefix = chalk.green.bold('[image-sprite]');
const okPrefix = chalk.green.bold('[image-sprite] ' + figures.tick);
const warnPrefix = chalk.yellow.bold('[image-sprite] ' + figures.cross);

let useLog = true;

const logger = {
    log(...args) {
        if (useLog) console.log(logPrefix, ...args);
    },
    nl() {
        if (useLog) console.log('\n');
    },
    ok(...args) {
        if (useLog) console.log(okPrefix, ...args);
    },
    warn(...args) {
        if (useLog) console.warn(warnPrefix, chalk.yellow.bold(args.join(' ')));
    }
};

class ImageSpritePlugin {

    constructor(option) {
        this.extensions = option.extensions
            || ['png', 'jpg', 'jpeg', 'gif'];
        this.extensions = this.extensions.map((extension) => {
            return '.' + extension;
        });
        this.fs = fs;
        this.isWDS = false;
        this.padding = option.padding || 0;
        this.suffix = option.suffix || '';
        this.outputPath = option.outputPath;
        this.outputFilename = option.outputFilename || '/sprite/sprite.png';
        this.compress = typeof option.compress === 'undefined'
            ? false : !!option.compress;
        this.indent = (typeof option.indent === 'undefined'
            || !!option.indent.trim()) ? '  ' : option.indent;
        this.commentOrigin = !!option.commentOrigin;
        useLog = typeof option.log === 'undefined'
            ? true : !!option.log;
    }

    apply(compiler) {
        compiler.plugin('done', (stats) => {
            logger.nl();
            const compilation = stats.compilation;

            /*
             * assets = {
             *   'js/some-image-resource.js': RawSource {
             *     _value: '...'
             *   },
             *   'img/some-image-resource.png': RawSource {
             *     _value: <Buffer 89 50 4e ...>,
             *     existsAt: '/path/to/this/image',
             *     emitted: true
             *   }
             * }
             */
            this.publicPath = compilation.outputOptions.publicPath;
            const assets = compilation.assets;
            const assetNames = Reflect.ownKeys(assets);
            this.DIST_DIR = this.outputPath || compiler.outputPath;
            /*
             * compilation.compiler = {
             *   '_plugins',
             *   'outputPath',
             *   'outputFileSystem',
             *   'inputFileSystem',
             *   'recordsInputPath',
             *   'recordsOutputPath',
             *   'records',
             *   'fileTimestamps',
             *   'contextTimestamps',
             *   'resolvers',
             *   'parser',
             *   'options',
             *   'context',
             *   'watchFileSystem',
             *   'name',
             *   'dependencies',
             *   '_lastCompilationFileDependencies',
             *   '_lastCompilationContextDependencies'
             * }
             */
            if (compiler.outputFileSystem.constructor.name === 'MemoryFileSystem') {
                logger.log(`MemoryFileSystem found.`);
                this.fs = compiler.outputFileSystem;
                this.isWDS = true;
            }
            /*
             * with wds
             * compiler.outputFileSystem = <MemoryFileSystem> {
             *   data: {
             *     'F:': {'': true, home: [Object]}
             *   }
             * }
             */
            /*
             * with webpack
             * compiler.outputFileSystem = <NodeOutputFileSystem> {
             *   mkdirp: { [Function: mkdirP]
             *     mkdirP: [Circular],
             *     mkdirp: [Circular],
             *     sync: [Function: sync]
             *   },
             *   mkdir: [Function: bound ],
             *   rmdir: [Function: bound ],
             *   unlink: [Function: bound ],
             *   writeFile: [Function: bound ],
             *   join: [Function: bound join]
             * }
             */
            /*
             * sources = [
             *   '/local-dist-path/img/some-image-resource-1.png',
             *   '/local-dist-path/img/some-image-resource-2.jpg',
             *   ...
             * ]
             */
            const sources = this.getSpriteSources(assetNames, assets);
            if (!sources || sources.length === 0) {
                logger.warn('There is no image to make sprite.\n');
                return;
            }
            this.createSprite(sources, (coordinates) => {
                this.extractCss(assetNames, coordinates);
            });
        });
    }

    createSprite(sources, callback) {
        logger.log('Creating sprite image from ...\n');
        sources.forEach((source) => {
            if (source instanceof Vinyl) {
                logger.log(source.path);
            } else {
                logger.log(source);
            }
        });
        logger.nl();
        Spritesmith.run({
            src: sources,
            padding: this.padding
        }, (err, result) => {
            if (err) {
                logger.warn(err);
            } else if (result && result.image) {
                const spritedPath = path.join(this.DIST_DIR, this.outputFilename);
                logger.nl();
                logger.log('Writing', spritedPath, '...');
                try {
                    const spritedDir = path.dirname(spritedPath);
                    if (this.isWDS) {
                        this.fs.mkdirpSync(spritedDir);
                    } else {
                        this.fs.ensureDirSync(spritedDir);
                    }
                    this.fs.writeFileSync(
                        spritedPath,
                        result.image
                    );
                    logger.ok(spritedPath, 'written.\n');
                    callback(result.coordinates);
                } catch (e) {
                    logger.warn(e);
                }
            }
        });
    }

    extractCss(assetNames, coordinates) {
        logger.log(`Searching .css assets ...\n`);
        let found = 0;
        if (!Array.isArray(assetNames)) {
            return;
        }
        assetNames.forEach((assetName) => {
            if (path.extname(assetName) === '.css') {
                const cssPath = path.join(this.DIST_DIR, assetName);
                this.updateCss(cssPath, coordinates);
                found++;
            }
        });
        if (!found) {
            logger.warn("no .css file found. 'image-sprite-webpack-plugin' "
                + "should be used with 'ExtractTextPlugin' and 'css-loader'.");
        }
    }

    getSpriteSources(assetNames, assets) {
        logger.log(`Filtering ${this.extensions.join(', ')} ...`);
        const sources = [];
        if (!Array.isArray(assetNames)) {
            return sources;
        }
        assetNames.forEach((assetName) => {
            if (this.extensions.indexOf(path.extname(assetName)) > -1) {
                const p = path.join(this.DIST_DIR, assetName);
                if (this.isWDS) {
                    sources.push(new Vinyl({
                        path: p,
                        contents: assets[assetName]._value
                    }));
                } else {
                    sources.push(p);
                }
            }
        });
        return sources;
    }

    updateCss(cssPath, coordinates) {
        logger.ok(cssPath, 'found, start updating css ...\n');

        let converted = 0;
        let bgImgCount = 0;
        const publicPath = this.publicPath;
        const style = this.fs.readFileSync(cssPath, 'utf8');
        const ast = css.parse(style, {
            source: cssPath
        });
        let outputFilename = this.publicPath + this.outputFilename + this.suffix;
        ast.stylesheet.rules.forEach((rule) => {
            if (rule.type === 'rule' && Array.isArray(rule.declarations)) {
                rule.declarations.forEach((decl, i) => {
                    const decValue = decl.value;
                    /*
                     * decValue top
                     * decValue transparent
                     * decValue inline-block
                     * decValue 13px
                     * decValue 1px 4px 0 0
                     * decValue url(/assets/img/8799179d3eb.png) no-repeat 0 0
                     */
                    if (decl.property === 'background' && decValue.includes('url(')) {
                        if (!decValue.includes('no-repeat')) {
                            logger.warn(`${decValue} skipped. It should use <repeat-style> as 'no-repeat'`);
                        } else if (!decValue.includes(' 0 0')) {
                            logger.warn(`${decValue} skipped. It should use <position> as '0 0'`);
                        } else {
                            let url = parenthesis.exec(decValue)[1];

                            if (url.startsWith(publicPath)) {
                                url = url.replace(publicPath, '');
                            }

                            const key = path.join(this.DIST_DIR, url);
                            /*
                             * coordinates = {
                             *   '/local-dist-path/img/some-image-resource-1.png': {
                             *     x: 563,
                             *     y: 187,
                             *     width: 19,
                             *     height: 19
                             *   },
                             *   '/local-dist-path/img/some-image-resource-2.jpg': {
                             *     x: 563,
                             *     y: 245,
                             *     width: 19,
                             *     height: 19
                             *   },
                             *   ...
                             * }
                             */
                            const pos = coordinates[key];
                            if (pos) {
                                const newVal = 'url(' + outputFilename + ') no-repeat '
                                    + (pos.x ? '-' + pos.x + 'px' : 0)
                                    + ' '
                                    + (pos.y ? '-' + pos.y + 'px' : 0);
                                logger.ok(
                                    chalk.white(decValue),
                                    chalk.green('→'),
                                    chalk.white(newVal)
                                );
                                rule.declarations[i].value = newVal
                                    + (this.commentOrigin ? `\n${this.indent}/* ${decValue} */` : '');
                                converted++;
                            } else {
                                logger.warn(`${key} not found in sprite map.`,
                                    "Please check your webpack config's path,",
                                    'publicPath or file-loader config.');
                            }
                        }
                        bgImgCount++;
                    }
                });
            }
        });
        const cssString = css.stringify(ast, {
            indent: this.indent,
            compress: this.compress
        });
        logger.nl();
        if (converted) {
            this.fs.writeFileSync(cssPath, cssString, 'utf8');
            logger.ok(cssPath, `updated. (${converted}/${bgImgCount})\n`);
        } else {
            logger.log(cssPath, 'is not updated.\n');
        }
    }
}

module.exports = ImageSpritePlugin;
