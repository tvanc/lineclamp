// Gulp plugin setup
const gulp        = require('gulp'),

      // Compiles SCSS files
      webpack     = require('webpack-stream'),
      browserSync = require('browser-sync').create(),

      // Notifies of errors
      notify      = require("gulp-notify");

const TASK_SERVE = 'serve',
      TASK_BUILD = 'build';

// Default gulp action when gulp is run ==================================================
gulp.task('default', [TASK_SERVE]);

// Start BrowserSync server ==============================================================
gulp.task(TASK_SERVE, [TASK_BUILD], () => {
  // Create the server
  browserSync.init({
    files:  [],
    server: {
      baseDir: './'
    },
    startPath: 'test/index.html'
  });

  gulp.watch('./src/index.js', [TASK_BUILD]);
  gulp.watch('./test/*', () => {
    browserSync.reload();
  });
});

// Lint, transpile, concat, and minify js ================================================
gulp.task(TASK_BUILD, () => {
  return gulp.src('src/index.js')
    .pipe(webpack(require('./webpack.js')))
    .on('error', handleErrors)
    .pipe(gulp.dest('./dist'))
    .pipe(browserSync.stream());
});


/**
 * Send error mesages to notification center with gulp-notify
 */
function handleErrors () {
  const args = Array.prototype.slice.call(arguments);

  notify.onError({
    title:   "Compile Error",
    message: "<%= error %>"
  }).apply(this, args);

  // Keep gulp from hanging on this task
  this.emit('end');
}
