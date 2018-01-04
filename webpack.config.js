const LodashModuleReplacementPlugin = require('lodash-webpack-plugin');
const { resolve } = require('path');
const webpack = require('webpack');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

module.exports = {
  entry: {
    cachemap: './src/index.ts',
    'cachemap.min': './src/index.ts',
    'default-cachemap': './src/default-cachemap/index.ts',
    'default-cachemap.min': './src/default-cachemap/index.ts',
    'worker-cachemap': './src/worker-cachemap/index.ts',
    'worker-cachemap.min': './src/worker-cachemap/index.ts',
  },
  output: {
    filename: '[name].js',
    library: 'Cachemap',
    libraryTarget: 'umd',
  },
  module: {
    rules: [{
      include: [
        resolve(__dirname, 'src'),
        resolve(__dirname, 'test'),
      ],
      test: /\.tsx?$/,
      use: [{
        loader: 'awesome-typescript-loader',
        options: {
          babelCore: '@babel/core',
          transpileOnly: true,
          useBabel: true,
        },
      }],
    }, {
      test: /.worker\.js$/,
      use: {
        loader: 'worker-loader',
      },
    }],
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
  },
  plugins: [
    new webpack.EnvironmentPlugin({
      TEST_ENV: !!process.env.TEST_ENV,
      WEB_ENV: true,
    }),
    new webpack.LoaderOptionsPlugin({
      debug: true,
    }),
    new webpack.SourceMapDevToolPlugin({
      filename: '[name].js.map',
      test: /\.(tsx?|jsx?)$/,
    }),
    new webpack.optimize.UglifyJsPlugin({
      include: /\.min\.js$/,
      sourceMap: true,
    }),
    new BundleAnalyzerPlugin({
      analyzerMode: 'disabled',
      generateStatsFile: true,
      statsFilename: './bundle/stats.json',
    }),
    new LodashModuleReplacementPlugin(),
  ],
};
