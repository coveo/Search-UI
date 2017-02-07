const gulp = require('gulp');
const concat = require('gulp-concat');
const replace = require('gulp-replace');
const fs = require('fs');
const runsequence = require('run-sequence');
const footer = require('gulp-footer');

gulp.task('definitions', function (done) {
  runsequence('externalDefs', 'internalDefs', 'cleanDefs', done);
});

gulp.task('cleanDefs', function () {
  return gulp.src('bin/ts/CoveoJsSearch.d.ts')
      .pipe(replace(/import.*$/gm, ''))
      .pipe(replace(/(declare module )(.*)( {$)/gm, '$1Coveo$3'))
      .pipe(replace(/export =.+;$/gm, ''))
      .pipe(replace(/export .+ from .+$/gm, ''))
      .pipe(replace(/export (?:default )?(.*)$/gm, '$1'))
      .pipe(replace(/private .+;$/gm, ''))
      .pipe(replace(/\t[A-Za-z]+;$/gm, ''))
      .pipe(replace(/\n\t\s*(\n\t\s*)/g, '$1'))
      .pipe(footer('declare module "coveo-search-ui" {\n\texport = Coveo;\n}'))
      .pipe(gulp.dest('bin/ts/'));
});

gulp.task('externalDefs', function () {
  return gulp.src([
    './lib/es6-promise/index.d.ts',
    './lib/modal-box/index.d.ts',
    './lib/magic-box/index.d.ts',
    './node_modules/@types/d3/index.d.ts',
    './node_modules/@types/fastclick/index.d.ts',
    './lib/globalize/index.d.ts',
    './lib/jstimezonedetect/index.d.ts',
    './lib/coveoanalytics/index.d.ts'
      ])
      .pipe(concat('Externals.d.ts'))
      .pipe(gulp.dest('./bin/ts'));
});

gulp.task('internalDefs', function () {
  return require('dts-generator').default({
    name: 'Coveo',
    project: './',
    baseDir: './src/',
    out: 'bin/ts/CoveoJsSearch.d.ts',
    externs: ['Externals.d.ts'],
    verbose: true,
    exclude: ['lib/**/*.d.ts', 'node_modules/**/*.d.ts', 'typings/**/*.d.ts', 'src/*.ts', 'bin/**/*.d.ts', 'test/lib/**/*.d.ts', 'test/Test.ts']
  });
})
