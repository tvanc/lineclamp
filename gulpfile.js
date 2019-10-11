// Gulp plugin setup
const gulp        = require('gulp');
const browserSync = require('browser-sync').create();

// Start BrowserSync server ====================================================
gulp.task('watch', () => {
  // Create the server
  browserSync.init({
    files:     [],
    server:    {
      baseDir: './',
    },
    startPath: 'test/index.html',
  });

  gulp.watch(
    ['./test/*', './src/index.js'],
    () => browserSync.reload()
  );
});

// Default gulp action when gulp is run ========================================
gulp.task('default', gulp.series('watch'));
