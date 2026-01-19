const ImageSpritePlugin = require('../../dist/ImageSpritePlugin').default;

describe('ImageSpritePlugin', () => {
  describe('constructor', () => {
    test('should set default extensions', () => {
      const plugin = new ImageSpritePlugin({});
      expect(plugin._extensions).toContain('.png');
      expect(plugin._extensions).toContain('.jpg');
      expect(plugin._extensions).toContain('.jpeg');
      expect(plugin._extensions).toContain('.gif');
    });

    test('should accept custom extensions', () => {
      const plugin = new ImageSpritePlugin({ extensions: ['svg', 'webp'] });
      expect(plugin._extensions).toContain('.svg');
      expect(plugin._extensions).toContain('.webp');
      expect(plugin._extensions).not.toContain('.png');
    });

    test('should set default padding to 0', () => {
      const plugin = new ImageSpritePlugin({});
      expect(plugin._padding).toBe(0);
    });

    test('should accept custom padding', () => {
      const plugin = new ImageSpritePlugin({ padding: 10 });
      expect(plugin._padding).toBe(10);
    });

    test('should set default outputFilename', () => {
      const plugin = new ImageSpritePlugin({});
      expect(plugin._outputFilename).toBe('/sprite/sprite-[hash].png');
    });

    test('should accept custom outputFilename', () => {
      const plugin = new ImageSpritePlugin({ outputFilename: 'css/sprite-[hash].png' });
      expect(plugin._outputFilename).toBe('css/sprite-[hash].png');
    });

    test('should set default compress to false', () => {
      const plugin = new ImageSpritePlugin({});
      expect(plugin._compress).toBe(false);
    });

    test('should accept compress option', () => {
      const plugin = new ImageSpritePlugin({ compress: true });
      expect(plugin._compress).toBe(true);
    });

    test('should set default commentOrigin to false', () => {
      const plugin = new ImageSpritePlugin({});
      expect(plugin._commentOrigin).toBe(false);
    });

    test('should accept commentOrigin option', () => {
      const plugin = new ImageSpritePlugin({ commentOrigin: true });
      expect(plugin._commentOrigin).toBe(true);
    });

    test('should set default suffix to empty string', () => {
      const plugin = new ImageSpritePlugin({});
      expect(plugin._suffix).toBe('');
    });

    test('should accept custom suffix', () => {
      const plugin = new ImageSpritePlugin({ suffix: '?v=123' });
      expect(plugin._suffix).toBe('?v=123');
    });
  });

  describe('isImage', () => {
    test('should return true for supported image extensions', () => {
      const plugin = new ImageSpritePlugin({});
      expect(plugin.isImage('test.png')).toBe(true);
      expect(plugin.isImage('test.jpg')).toBe(true);
      expect(plugin.isImage('test.jpeg')).toBe(true);
      expect(plugin.isImage('test.gif')).toBe(true);
    });

    test('should return false for non-image files', () => {
      const plugin = new ImageSpritePlugin({});
      expect(plugin.isImage('test.css')).toBe(false);
      expect(plugin.isImage('test.js')).toBe(false);
      expect(plugin.isImage('test.html')).toBe(false);
    });

    test('should return false for unsupported image types by default', () => {
      const plugin = new ImageSpritePlugin({});
      expect(plugin.isImage('test.svg')).toBe(false);
      expect(plugin.isImage('test.webp')).toBe(false);
    });

    test('should handle custom extensions', () => {
      const plugin = new ImageSpritePlugin({ extensions: ['svg', 'webp'] });
      expect(plugin.isImage('test.svg')).toBe(true);
      expect(plugin.isImage('test.webp')).toBe(true);
      expect(plugin.isImage('test.png')).toBe(false);
    });

    test('should return false for non-string input', () => {
      const plugin = new ImageSpritePlugin({});
      expect(plugin.isImage(null)).toBe(false);
      expect(plugin.isImage(undefined)).toBe(false);
      expect(plugin.isImage(123)).toBe(false);
    });
  });

  describe('getOutFileName', () => {
    test('should replace [hash] with MD5 hash', () => {
      const plugin = new ImageSpritePlugin({ outputFilename: 'sprite-[hash].png' });
      plugin._sprite = Buffer.from('test sprite content');
      const fileName = plugin.getOutFileName();
      expect(fileName).toMatch(/^sprite-[a-f0-9]{32}\.png$/);
    });

    test('should cache the output filename', () => {
      const plugin = new ImageSpritePlugin({ outputFilename: 'sprite-[hash].png' });
      plugin._sprite = Buffer.from('test sprite content');
      const fileName1 = plugin.getOutFileName();
      const fileName2 = plugin.getOutFileName();
      expect(fileName1).toBe(fileName2);
    });

    test('should produce different hashes for different content', () => {
      const plugin1 = new ImageSpritePlugin({ outputFilename: 'sprite-[hash].png' });
      const plugin2 = new ImageSpritePlugin({ outputFilename: 'sprite-[hash].png' });
      plugin1._sprite = Buffer.from('content 1');
      plugin2._sprite = Buffer.from('content 2');
      const fileName1 = plugin1.getOutFileName();
      const fileName2 = plugin2.getOutFileName();
      expect(fileName1).not.toBe(fileName2);
    });
  });

  describe('getOutFilePath', () => {
    test('should combine publicPath, filename, and suffix', () => {
      const plugin = new ImageSpritePlugin({
        outputFilename: 'sprite-[hash].png',
        suffix: '?v=123',
      });
      plugin._publicPath = '/assets/';
      plugin._sprite = Buffer.from('test');
      const filePath = plugin.getOutFilePath();
      expect(filePath).toMatch(/^\/assets\/sprite-[a-f0-9]{32}\.png\?v=123$/);
    });
  });

  describe('apply', () => {
    test('should be a function', () => {
      const plugin = new ImageSpritePlugin({});
      expect(typeof plugin.apply).toBe('function');
    });
  });
});
