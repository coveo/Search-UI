const gulp = require('gulp');
const shell = require('gulp-shell');

gulp.task('compile', shell.task([
  'node node_modules/webpack/bin/webpack.js'
]))