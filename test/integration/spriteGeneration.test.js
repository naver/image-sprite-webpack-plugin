const webpack = require('webpack');
const path = require('path');
const { createFsFromVolume, Volume } = require('memfs');

describe('Sprite Generation Integration', () => {
  function compile(configPath) {
    return new Promise((resolve, reject) => {
      const config = require(configPath);
      const compiler = webpack(config);
      const fs = createFsFromVolume(new Volume());

      // Join with real fs for reading source files
      compiler.inputFileSystem = require('fs');
      compiler.outputFileSystem = fs;

      compiler.run((err, stats) => {
        if (err) {
          return reject(err);
        }
        if (stats.hasErrors()) {
          return reject(new Error(stats.toString({ colors: true })));
        }
        resolve({ stats, fs });
      });
    });
  }

  describe('simple fixture (style-loader)', () => {
    const configPath = path.resolve(__dirname, '../__fixtures__/simple/webpack.config.js');

    test('should compile without errors', async () => {
      const { stats } = await compile(configPath);
      expect(stats.hasErrors()).toBe(false);
    });

    test('should generate sprite image', async () => {
      const { fs } = await compile(configPath);
      const files = fs.readdirSync('/');

      // Check dist folder exists
      const distPath = path.resolve(__dirname, '../__fixtures__/simple/dist');
      expect(fs.existsSync(distPath)).toBe(true);

      // Check sprite folder exists
      const spritePath = path.join(distPath, 'sprite');
      expect(fs.existsSync(spritePath)).toBe(true);

      // Check sprite file exists
      const spriteFiles = fs.readdirSync(spritePath);
      expect(spriteFiles.some(f => f.startsWith('sprite-') && f.endsWith('.png'))).toBe(true);
    });

    test('should generate bundle.js', async () => {
      const { fs } = await compile(configPath);
      const distPath = path.resolve(__dirname, '../__fixtures__/simple/dist');
      expect(fs.existsSync(path.join(distPath, 'bundle.js'))).toBe(true);
    });
  });

  describe('mini-css-extract fixture', () => {
    const configPath = path.resolve(__dirname, '../__fixtures__/mini-css-extract/webpack.config.js');

    test('should compile without errors', async () => {
      const { stats } = await compile(configPath);
      expect(stats.hasErrors()).toBe(false);
    });

    test('should generate sprite image', async () => {
      const { fs } = await compile(configPath);
      const distPath = path.resolve(__dirname, '../__fixtures__/mini-css-extract/dist');
      const spritePath = path.join(distPath, 'sprite');

      expect(fs.existsSync(spritePath)).toBe(true);

      const spriteFiles = fs.readdirSync(spritePath);
      expect(spriteFiles.some(f => f.startsWith('sprite-') && f.endsWith('.png'))).toBe(true);
    });

    test('should generate CSS file', async () => {
      const { fs } = await compile(configPath);
      const distPath = path.resolve(__dirname, '../__fixtures__/mini-css-extract/dist');
      const cssPath = path.join(distPath, 'css');

      expect(fs.existsSync(cssPath)).toBe(true);

      const cssFiles = fs.readdirSync(cssPath);
      expect(cssFiles.some(f => f.endsWith('.css'))).toBe(true);
    });

    test('should transform background URLs in CSS', async () => {
      const { fs } = await compile(configPath);
      const distPath = path.resolve(__dirname, '../__fixtures__/mini-css-extract/dist');
      const cssPath = path.join(distPath, 'css');

      const cssFiles = fs.readdirSync(cssPath).filter(f => f.endsWith('.css'));
      expect(cssFiles.length).toBeGreaterThan(0);

      const cssContent = fs.readFileSync(path.join(cssPath, cssFiles[0]), 'utf-8');

      // CSS should contain sprite URL
      expect(cssContent).toMatch(/url\([^)]*sprite[^)]*\.png[^)]*\)/);
    });
  });
});
