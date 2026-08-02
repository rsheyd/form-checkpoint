var gulp = require('gulp');
var eslint = require('gulp-eslint');
var zip = require('gulp-zip');

var JS = [
  'background.js',
  'content_scripts/form-snapshot.js',
  'content_scripts/checkpoint-storage.js',
  'content_scripts/snapshot-text.js',
  'templates/template-table.js',
  'popup/checkpoint-actions.js',
  'popup/popup.js'
];
var RELEASE_FILES = [
  'LICENSE',
  'PRIVACY.md',
  'artwork/icons/icon-16.png',
  'artwork/icons/icon-32.png',
  'artwork/icons/icon-48.png',
  'artwork/icons/icon-128.png',
  'background.js',
  'content_scripts/checkpoint-storage.js',
  'content_scripts/form-snapshot.js',
  'content_scripts/snapshot-text.js',
  'css/bootstrap.min.css',
  'js/jquery.min.js',
  'manifest.json',
  'popup/checkpoint-actions.js',
  'popup/popup.html',
  'popup/popup.js',
  'templates/template-table.js',
  'templates/templates.css',
  'templates/templates.html'
];

gulp.task('eslint', function () {
  return gulp.src(JS)
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError());
});

gulp.task('zip', function () {
  var version = require('./package.json').version;
  return gulp.src(RELEASE_FILES, { base: '.' })
    .pipe(zip('form-checkpoint-' + version + '.zip'))
    .pipe(gulp.dest('dist'));
});
