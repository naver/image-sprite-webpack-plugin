const path = require('path');
const fs = require('fs');

// Simulate the transformJsWebpack5CssLoader logic
const sourceFile = '/Users/hw.shim/home/iswp/examples/webpack5-cssloader-single-chunk/public/assets/bundle-937948c86c5e8d883479.js';
if (!fs.existsSync(sourceFile)) {
  console.log('File not found:', sourceFile);
  process.exit(1);
}
const source = fs.readFileSync(sourceFile, 'utf8');

const moduleIdToAsset = {
  '234': 'img/logo-a4fb33f93efe38215d2c.png',
  '630': 'img/b-check-8fa005d117596511293b.png',
  '635': 'img/item-picture-d61efd00abe5ee59d165.png',
  '827': 'img/b-check-ok-961fc31e393003c87510.png',
  '963': 'img/item-article-c83902a6c7975253049a.png'
};

// Find URL patterns
const urlPattern = /([a-zA-Z_$][a-zA-Z0-9_$]*)=new URL\(t\((\d+)\)/g;
const urlVarToModuleId = {};
let urlMatch;
while ((urlMatch = urlPattern.exec(source)) !== null) {
  const urlVar = urlMatch[1];
  const moduleId = urlMatch[2];
  if (moduleIdToAsset[moduleId]) {
    urlVarToModuleId[urlVar] = moduleId;
  }
}
console.log('urlVarToModuleId:', urlVarToModuleId);

// Find getUrl patterns
const getUrlPattern = /([a-zA-Z_$][a-zA-Z0-9_$]*)=[a-zA-Z_$][a-zA-Z0-9_$]*\(\)\(([a-zA-Z_$][a-zA-Z0-9_$]*)\)/g;
const cssVarToModuleId = {};
let getUrlMatch;
while ((getUrlMatch = getUrlPattern.exec(source)) !== null) {
  const cssVar = getUrlMatch[1];
  const urlVar = getUrlMatch[2];
  if (urlVarToModuleId[urlVar]) {
    cssVarToModuleId[cssVar] = urlVarToModuleId[urlVar];
  }
}
console.log('cssVarToModuleId:', cssVarToModuleId);

// Find CSS patterns
const cssVars = Object.keys(cssVarToModuleId).join('|');
console.log('cssVars:', cssVars);

const bgShorthandPattern = new RegExp(
  `url\\(\\$\\{(${cssVars})\\}\\)\\s*no-repeat\\s+0\\s+0`,
  'g',
);
console.log('Pattern:', bgShorthandPattern);

let match;
let count = 0;
while ((match = bgShorthandPattern.exec(source)) !== null) {
  console.log('Found match:', match[0], 'at index:', match.index);
  count++;
}
console.log('Total matches:', count);
