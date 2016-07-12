const webpack = require('webpack');
const minimize = process.argv.indexOf('--minimize') !== -1;
const colors = require('colors');
const failPlugin = require('webpack-fail-plugin');

// Fail plugin will allow the webpack ts-loader to fail correctly when the TS compilation fails
var plugins = [failPlugin];

if (minimize) {
  plugins.push(new webpack.optimize.UglifyJsPlugin());
}


module.exports = {
  entry: {
    'CoveoJsSearch': ['./src/Dependencies.js', './src/Index.ts'],
    'CoveoJsSearch.Searchbox': './src/SearchboxIndex.ts'
  },
  output: {
    path: require('path').resolve('./bin/js'),
    filename: minimize ? '[name].min.js' : '[name].js',
    libraryTarget: 'umd',
    // See Index.ts as for why this need to be a temporary variable
    library: 'Coveo__temporary',
    publicPath : '/js/'
  },
  resolve: {
    extensions: ['', '.ts', '.js'],
    alias: {
      'l10n': __dirname + '/lib/l10n.min.js',
      'globalize': __dirname + '/lib/globalize.min.js',
      'modal-box': __dirname + '/node_modules/modal-box/bin/ModalBox.min.js',
      'fast-click': __dirname + '/lib/fastclick.min.js',
      'jstz': __dirname + '/lib/jstz.min.js',
      'magic-box': __dirname + '/node_modules/coveomagicbox/bin/MagicBox.min.js',
      'default-language': __dirname + '/src/strings/DefaultLanguage.js',
      'finally': __dirname + '/lib/finally.js',
      'underscore': __dirname + '/node_modules/underscore/underscore-min.js'
    }
  },
  devtool: 'source-map',
  module: {
    loaders: [
      { test: /\.ts$/, loader: 'ts-loader' }
    ]
  },
  plugins: plugins,
  bail: true
}
