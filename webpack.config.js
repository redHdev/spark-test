const UnusedWebpackPlugin = require('unused-webpack-plugin');

module.exports = {
  plugins: [
    new UnusedWebpackPlugin({
      directories: [path.join(__dirname, 'src')],
      exclude: ['*.test.ts'],
    }),
  ],
};
