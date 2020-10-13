'use strict';

var gulp   = require('gulp');
var jshint = require('gulp-jshint');
var jscs = require('gulp-jscs');
var istanbul = require('gulp-istanbul');
var mocha  = require('gulp-mocha');
var coveralls = require('gulp-coveralls');
var del = require('del');

var paths = {
  lint: ['./gulpfile.js', './lib/**/*.js'],
  watch: ['./gulpfile.js', './lib/**', './test/**/*.js', '!test/{temp,temp/**}'],
  tests: ['./test/**/*.js', '!test/{temp,temp/**}'],
  source: ['./lib/*.js', 'server.js'],
  coverage: ['./coverage/**/lcov.info']
};

function clean() {
  return del('coverage/lcov.info');
}

function lint() {
  return gulp.src(paths.lint)
    .pipe(jshint('.jshintrc'))
    .pipe(jscs())
    .pipe(jshint.reporter('jshint-stylish'));
}

function preTest() {
  return gulp.src(paths.source)
    .pipe(istanbul()) // Covering files
    .pipe(istanbul.hookRequire());
}

function test() {
  return gulp.src(paths.source)
    .pipe(preTest())
    .pipe(mocha())
    // Creating the reports after tests ran
    .pipe(istanbul.writeReports());
}

function coverage() {
  return gulp.src(paths.coverage)
    .pipe(coveralls());
}

function watch() {
  gulp.watch(paths.watch, test);
}

var build = gulp.series(clean, gulp.parallel(lint));

module.exports.build = build;
module.exports.watch = watch;
module.exports.default = build;
