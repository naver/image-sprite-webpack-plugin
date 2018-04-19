# image-sprite-webpack-plugin

> A webpack plugin that generates spritesheets from your stylesheets.
> This plugin is based on https://github.com/Ensighten/spritesmith.
 
## Input
 
```css
h1.logo {
    width: 240px;
    height: 80px;
    background: url(./img/logo.png) no-repeat 0 0;
    font-size: 0;
}

span.itemPicture {
    display: inline-block;
    background: url(./img/item-picture.png) no-repeat 0 0;
    width: 36px;
    height: 36px;
}
```

## Output

```css
h1.logo {
  width: 240px;
  height: 80px;
  background: url(/css/sprite.png) no-repeat 0 0
  /* url(/img/logo.png) no-repeat 0 0 */;
  font-size: 0;
}

span.itemPicture {
  display: inline-block;
  background: url(/css/sprite.png) no-repeat 0 -90px
  /* url(/img/item-picture.png) no-repeat 0 0 */;
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
    outputFilename: 'css/sprite.png',
    padding: 10,
    suffix: '?' + Date.now()
})
```

```
git clone this repository
npm i
cd example
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

```
git clone this repository
npm i
cd example
npm i
npm start
```

## Dependency

This plugin utilizes [ExtractTextPlugin](https://github.com/webpack-contrib/extract-text-webpack-plugin) and [css-loader](https://github.com/webpack-contrib/css-loader) to parse .css assets.

## Options

|Name|Type|Default|Description|
|:--|:--|:-----|:----------|
|**commentOrigin**|{Boolean}|`false`|Shows the original image resource url with a comment|
|**compress**|{Boolean}|`false`|Compress the output css|
|**extensions**|{Array}|`['png', 'jpg', 'jpeg', 'gif']`|File extensions to be converted with the spritesheets|
|**indent**|{String}|`'  '` (2 spaces)|The indentation for css output source|
|**log**|{Boolean}|`true`|Enable/disable message logging|
|**outputPath**|{String}|webpack config's `outputPath`|Describes spritesheets file's output path|
|**outputFilename**}|{String|`'/sprite/sprite.png'`|A sprite image filename|
|**padding**|{Number}|`0`|Padding to use between images|
|**suffix**|{String}|`''`|A suffix for `outputFilename`|

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