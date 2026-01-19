process.env.NODE_ENV = 'development';
const webpack = require('webpack');
const config = require('./webpack.config.js');

const compiler = webpack(config);

compiler.hooks.thisCompilation.tap('DebugPlugin', compilation => {
  compilation.hooks.processAssets.tap(
    { name: 'DebugPlugin', stage: 100 },
    () => {
      const modules = [...compilation.modules];
      const imageModules = modules.filter(m => {
        const req = m.rawRequest || m.userRequest || m.resource || '';
        return /\.(png|jpg|gif)$/.test(req);
      });
      
      console.log('\n=== Image Module IDs (Development) ===');
      imageModules.forEach(mod => {
        const buildInfo = mod.buildInfo;
        const filename = buildInfo && buildInfo.filename;
        console.log('  mod.id:', JSON.stringify(mod.id));
        console.log('  filename:', filename);
        console.log('---');
      });
    }
  );
});

compiler.run((err, stats) => {
  if (err) console.error(err);
  compiler.close(() => {});
});
