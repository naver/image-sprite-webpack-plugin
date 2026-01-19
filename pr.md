# feat: migrate to webpack 5

## Summary

This PR migrates the image-sprite-webpack-plugin from webpack 4 to webpack 5, including:

- **Updated dependencies** to support webpack 5 ecosystem (webpack-sources v3, chalk v4, etc.)
- **Migrated plugin API** from deprecated `additionalAssets` hook to `processAssets` hook with `PROCESS_ASSETS_STAGE_ADDITIONAL`
- **Replaced asset manipulation** from direct assignment (`compilation.assets[key] =`) to proper methods (`emitAsset()`, `updateAsset()`)
- **Adapted to Set-based collections** for `compilation.modules`, `compilation.chunks`, and `chunk.files`
- **Removed deprecated `on.js` helper** in favor of direct webpack hooks API
- **Added comprehensive test suite** with Jest (47 tests: 22 unit + 18 logger + 7 integration)
- **Created new webpack 5 examples** replacing the old webpack 4 examples

## Breaking Changes

- **Minimum webpack version**: Now requires webpack 5.x (`peerDependencies: "webpack": "^5.0.0"`)
- Webpack 4 is no longer supported

## Changes

### Core Plugin (`src/ImageSpritePlugin.js`)

| Change | Before (webpack 4) | After (webpack 5) |
|--------|-------------------|-------------------|
| Hook | `additionalAssets` | `processAssets` with `PROCESS_ASSETS_STAGE_ADDITIONAL` |
| Emit asset | `compilation.assets[key] = source` | `compilation.emitAsset(key, source)` |
| Update asset | `compilation.assets[key] = source` | `compilation.updateAsset(key, source)` |
| Modules | `compilation.modules` (Array) | `[...compilation.modules]` (Set) |
| Chunks | `compilation.chunks` (Array) | `[...compilation.chunks]` (Set) |
| Chunk files | `chunk.files` (Array) | `[...chunk.files]` (Set) |
| Module request | `module.rawRequest` | `module.userRequest \|\| module.resource` |

### Dependencies (`package.json`)

```diff
- "webpack-sources": "^1.1.0"
+ "webpack-sources": "^3.2.3"

- "chalk": "^2.3.2"
+ "chalk": "^4.1.2"

- "figures": "^2.0.0"
+ "figures": "^3.2.0"

- "vinyl": "^2.1.0"
+ "vinyl": "^3.0.0"

peerDependencies:
- "webpack": "^3.0.0 || ^4.0.0"
+ "webpack": "^5.0.0"
```

### Test Suite

- `test/unit/ImageSpritePlugin.test.js` - Constructor options, helper methods
- `test/unit/Logger.test.js` - Logging functionality
- `test/integration/spriteGeneration.test.js` - End-to-end sprite generation with memfs

### Examples

| Removed (webpack 4) | Added (webpack 5) |
|---------------------|-------------------|
| `webpack4-cssloader-single-chunk` | `webpack5-cssloader-single-chunk` |
| `webpack4-extract-text-single-chunk` | `webpack5-mini-css-extract-multiple-chunks` |
| `webpack4-mini-css-extract-multiple-chunks` | |
| `webpack4-mini-css-extract-multiple-chunks-svg` | |

## Test Plan

- [x] All 47 unit and integration tests pass (`npm test`)
- [x] `webpack5-cssloader-single-chunk` example builds successfully
- [x] `webpack5-mini-css-extract-multiple-chunks` example builds successfully
- [x] Sprite images are generated correctly
- [x] CSS background URLs are transformed to sprite coordinates

## How to Test

```bash
# Run tests
npm install
npm test

# Test examples
cd examples/webpack5-cssloader-single-chunk
npm install && npm run build

cd ../webpack5-mini-css-extract-multiple-chunks
npm install && npm run build
```
