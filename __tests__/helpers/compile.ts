import webpack from 'webpack';

export function compile(compiler: webpack.Compiler) {
  return new Promise<webpack.Stats>((resolve, reject) => {
    compiler.run((error, stats) => {
      if (error) {
        return reject(error);
      }
      if (!stats) {
        return reject(new Error('Empty stats'));
      }
      return resolve(stats);
    });
  });
}
