'use strict';

var gulp   = require('gulp');
var jshint = require('gulp-jshint');
var jscs = require('gulp-jscs');
var istanbul = require('gulp-istanbul');
var mocha  = require('gulp-mocha');
var coveralls = require('gulp-coveralls');

var paths = {
  lint: ['./gulpfile.js', './lib/**/*.js'],
  watch: ['./gulpfile.js', './lib/**', './test/**/*.js', '!test/{temp,temp/**}'],
  tests: ['./test/**/*.js', '!test/{temp,temp/**}'],
  source: ['./lib/*.js', 'server.js']
};

gulp.task('lint', function () {
  return gulp.src(paths.lint)
    .pipe(jshint('.jshintrc'))
    .pipe(jscs())
    .pipe(jshint.reporter('jshint-stylish'));
});

gulp.task('istanbul', function (cb) {
  gulp.src(paths.source)
    .pipe(istanbul()) // Covering files
    .on('finish', function () {
      gulp.src(paths.tests, {cwd: __dirname})
        .pipe(mocha())
        .pipe(istanbul.writeReports()) // Creating the reports after tests runned
        .on('end', cb);
    });
});

gulp.task('coveralls', function() {
  gulp.src('test/coverage/**/lcov.info')
  .pipe(coveralls());
});

gulp.task('watch', function () {
  gulp.run('test');
  gulp.watch(paths.watch, ['test']);
});

gulp.task('default', ['test']);
gulp.task('test', ['lint', 'istanbul']);
