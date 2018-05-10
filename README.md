# image-sprite-webpack-plugin

> A webpack plugin that generates spritesheets from your stylesheets.
 
## Input

* `width`, `height` and `background` properties are mandatory to create a sprite.
* [Shorthand properties](https://developer.mozilla.org/en-US/docs/Web/CSS/Shorthand_properties) are recommended.

```css
h1.logo {
    width: 240px;
    height: 80px;
    background: url(./img/logo.png) no-repeat 0 0;
    font-size: 0;
}

span.itemPicture {
    display: inline-block;
    background-image: url(./img/item-picture.png);
    background-repeat: no-repeat;
    background-position: 0 0;
    width: 36px;
    height: 36px;
}
```

## Output

```css
h1.logo {
  width: 240px;
  height: 80px;
  background: url(/css/sprite.png) no-repeat 0 -20px;
  /* background: url(/img/logo.png) no-repeat 0 0 */
  font-size: 0;
}

span.itemPicture {
  display: inline-block;
  background-image: url(/css/sprite.png);
  /* background-image: url(/img/item-picture.png) */
  background-repeat: no-repeat;
  background-position: -100px -90px;
  /* background-position: 0 0 */
  width: 36px;
  height: 36px;
}
```

## Install

```bash
npm install -D image-sprite-webpack-plugin
```

## Example

### Production build

```js
const ImageSpritePlugin = require('image-sprite-webpack-plugin');

new ImageSpritePlugin({
    commentOrigin: false,
    compress: true,
    extensions: ['gif', 'png'],
    indent: '',
    log: true,
    //outputPath: './public',
    outputFilename: 'css/sprite-[hash].png',
    padding: 10,
    suffix: '' + Date.now() // do not need to use it with a outputFilename's [hash].
})
```

```bash
git clone this repository
cd examples/webpack4-cssloader-single-chunk
npm i
npm run build
```

### Webpack dev server

```js
const ImageSpritePlugin = require('image-sprite-webpack-plugin');

new ImageSpritePlugin({
    commentOrigin: true,
    compress: false,
    extensions: ['gif', 'png'],
    indent: '  ',
    log: true,
    //outputPath: './public',
    outputFilename: 'css/sprite.png',
    padding: 10,
    suffix: ''
})
```

```bash
git clone this repository
cd examples/webpack4-cssloader-single-chunk
npm i
npm start
```

## More Examples

* [webpack2 + css-loader](https://github.com/naver/image-sprite-webpack-plugin/tree/master/examples/webpack2-cssloader-single-chunk) (Supports Hot Module Reload)
* [webpack3 + css-loader](https://github.com/naver/image-sprite-webpack-plugin/tree/master/examples/webpack3-cssloader-single-chunk) (Supports Hot Module Reload)
* [webpack3 + css-loader + extract-text + multiple chunks](https://github.com/naver/image-sprite-webpack-plugin/tree/master/examples/webpack3-extract-text-multiple-chunks) (recommended in production env.)
* [webpack4 + css-loader](https://github.com/naver/image-sprite-webpack-plugin/tree/master/examples/webpack4-cssloader-single-chunk) (Supports Hot Module Reload)
* [webpack4 + css-loader + extract-text4.x(beta) + single chunk](https://github.com/naver/image-sprite-webpack-plugin/tree/master/examples/webpack4-extract-text-single-chunk) (Works, but not recommended.)
* [webpack4 + css-loader + mini-css-extract + multiple chunks](https://github.com/naver/image-sprite-webpack-plugin/tree/master/examples/webpack4-mini-css-extract-multiple-chunks) (with webpack4, this option is recommended.)
* [webpack4 + css-loader + mini-css-extract + multiple chunks + svg](https://github.com/naver/image-sprite-webpack-plugin/tree/master/examples/webpack4-mini-css-extract-multiple-chunks-svg) (svgs are not supported yet.)

## NPM Commands in Examples

Each example has the following command.

* Creates a production build.

	```bash
	npm run build
	```

* Starts webpack-dev-server

	```bash
	npm start
	```

* Creates a production build with node inspector. (with chrome://inspect/#devices)

	```bash
	npm run build-debug
	```

* Starts webpack-dev-server with node inspector. (with chrome://inspect/#devices)

	```bash
	npm run start-debug
	```

## Dependency

* This plugin requires [css-loader](https://github.com/webpack-contrib/css-loader) to handle CssModule.
* It is also recommended that you use a [file-loader](https://github.com/webpack-contrib/file-loader) to automatically move and access image resource files.

## Compatibility

* Tested on webpack2, webpack3 and webpack4
* Works fine with [mini-css-extract-plugin](https://github.com/webpack-contrib/mini-css-extract-plugin) on webpack4 (See [example](https://github.com/naver/image-sprite-webpack-plugin/tree/master/examples/webpack4-mini-css-extract-multiple-chunks))
* Works with [extract-text-webpack-plugin](https://github.com/webpack-contrib/extract-text-webpack-plugin)
	* Works with webpack3 + extract-text-webpack-plugin 3.x
	* Works with webpack4 + extract-text-webpack-plugin 4.x
* As you would know, [extract-text-webpack-plugin](https://github.com/webpack-contrib/extract-text-webpack-plugin) and [mini-css-extract-plugin](https://github.com/webpack-contrib/mini-css-extract-plugin) do not support HMR not yet. So using with these plugins is recommended on a production env.

## Options

|Name|Type|Default|Description|
|:--|:--|:-----|:----------|
|**commentOrigin**|{Boolean}|`false`|Shows the original image resource url with a comment. ![image](https://user-images.githubusercontent.com/7447396/39823778-bb47a324-53e8-11e8-8fc5-484c13363040.png)|
|**compress**|{Boolean}|`false`|Compress the output css|
|**extensions**|{Array}|`['png', 'jpg', 'jpeg', 'gif']`|File extensions to be converted with the spritesheets|
|**indent**|{String}|`'  '` (2 spaces)|The indentation for css output source|
|**log**|{Boolean}|`true`|Enable/disable message logging|
|**outputPath**|{String}|webpack config's `outputPath`|Describes spritesheets file's output path|
|**outputFilename**|{String}|`'/sprite/sprite-[hash].png'`|A sprite image filename|
|**padding**|{Number}|`0`|Padding to use between images|
|**suffix**|{String}|`''`|A suffix for `outputFilename`|

## Bug Report

If you find a bug, please report to us posting [issues](https://github.com/naver/image-sprite-webpack-plugin/issues) on GitHub.

## License
image-sprite-webpack-plugin is released under the MIT license.

```
Copyright (c) 2018 NAVER Corp.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.  IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
```