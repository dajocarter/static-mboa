// Require our dependencies
const gulp = require( 'gulp' );
const $ = require( 'gulp-load-plugins' )();
const merge = require( 'merge-stream' );
const del = require( 'del' );
const runSequence = require( 'run-sequence' );
const autoprefixer = require( 'autoprefixer' );
const mqpacker = require( 'css-mqpacker' );
const cssnano = require( 'cssnano' );
const browserSync = require( 'browser-sync' ).create();

/**
 * Handle errors and alert the user.
 */
function handleErrors () {
  const args = Array.prototype.slice.call( arguments );

  $.notify.onError( {
    'title': 'Task Failed <%= error.message %>',
    'message': 'See console.',
    'sound': 'Sosumi' // See: https://github.com/mikaelbr/node-notifier#all-notification-options-with-their-defaults
  } ).apply( this, args );

  $.util.beep(); // Beep 'sosumi' again.

  // Prevent the 'watch' task from stopping.
  this.emit( 'end' );
}

/**
 * Copy fonts and assets.
 *
 * https://www.npmjs.com/package/merge-stream
 */
gulp.task( 'build:fonts', () =>
  gulp.src([
      'node_modules/bootstrap/dist/fonts/*'
    ])
    .pipe(gulp.dest('assets/fonts'))
    .pipe(gulp.dest('_site/assets/fonts'))
);

gulp.task( 'clean:fonts', ( callback ) => {
  del([
    'assets/fonts',
    '_site/assets/fonts'
  ]);
  callback();
});

/**
 * Compile Sass and run stylesheet through PostCSS.
 *
 * https://www.npmjs.com/package/gulp-sass
 * https://www.npmjs.com/package/gulp-postcss
 * https://www.npmjs.com/package/autoprefixer
 * https://www.npmjs.com/package/css-mqpacker
 * https://www.npmjs.com/package/cssnano
 */
gulp.task( 'build:styles', () =>
  gulp.src( '_assets/scss/**/*.scss' )
    .pipe( $.plumber( { 'errorHandler': handleErrors } ) )
    .pipe( $.sourcemaps.init() )
    .pipe( $.sass( {
      'includePaths': [
        // Include paths here to use @import without paths
        'node_modules/bootstrap-sass/assets/stylesheets/'
      ],
      'errLogToConsole': true,
      'outputStyle': 'expanded' // Options: nested, expanded, compact, compressed
    } ) )
    .pipe( $.sourcemaps.write() )
    .pipe( $.postcss( [
      autoprefixer( { 'browsers': [
        "Android 2.3",
        "Android >= 4",
        "Chrome >= 20",
        "Firefox >= 24",
        "Explorer >= 8",
        "iOS >= 6",
        "Opera >= 12",
        "Safari >= 6"
      ] } ),
      mqpacker( { 'sort': true } ),
      cssnano( { 'safe': true } )
    ] ) )
    .pipe( $.rename( {
      'basename': 'project',
      'suffix': '.min'
    } ) )
    .pipe( gulp.dest( 'assets/css' ) )
    .pipe( gulp.dest( '_site/assets/css' ) )
    .pipe( browserSync.stream() )
);

gulp.task( 'clean:styles', ( callback ) => {
  del([
    'assets/css/main.min.css',
    '_site/assets/css/main.min.css'
  ]);
  callback();
});

/**
 * Optimize images.
 *
 * https://www.npmjs.com/package/gulp-imagemin
 */
gulp.task( 'build:images', () =>
  gulp.src( '_uploads/**/*' )
    .pipe( $.plumber( { 'errorHandler': handleErrors } ) )
    .pipe( $.imagemin( [
      $.imagemin.gifsicle( { 'interlaced': true } ),
      $.imagemin.jpegtran( { 'progressive': true } ),
      $.imagemin.optipng( { 'optimizationLevel': 5 } ),
      $.imagemin.svgo( { plugins: [ { removeViewBox: true } ] } )
    ] ) )
    .pipe( gulp.dest( '_uploads' ) )
    .pipe( gulp.dest( '_site/uploads' ) )
    .pipe( browserSync.stream() )
);

gulp.task( 'clean:images', ( callback ) => {
  del( [ '_site/uploads' ] );
  callback();
});

/**
 * Concatenate and minify JavaScript.
 *
 * https://www.npmjs.com/package/gulp-sourcemaps
 * https://www.npmjs.com/package/gulp-concat
  * https://www.npmjs.com/package/gulp-uglify
 */
gulp.task( 'build:scripts', () =>
  gulp.src( [
    // Add all npm packages first
    'node_modules/jquery-slim/dist/jquery.slim.js',
    // Load all bootstrap modules, or
    'node_modules/bootstrap-sass/assets/javascripts/bootstrap.js',
    // Turn on bootstrap modules as needed
    // 'node_modules/bootstrap-sass/assets/javascripts/bootstrap/affix.js',
    // 'node_modules/bootstrap-sass/assets/javascripts/bootstrap/alert.js',
    // 'node_modules/bootstrap-sass/assets/javascripts/bootstrap/button.js',
    // 'node_modules/bootstrap-sass/assets/javascripts/bootstrap/carousel.js',
    // 'node_modules/bootstrap-sass/assets/javascripts/bootstrap/collapse.js',
    // 'node_modules/bootstrap-sass/assets/javascripts/bootstrap/dropdown.js',
    // 'node_modules/bootstrap-sass/assets/javascripts/bootstrap/modal.js',
    // 'node_modules/bootstrap-sass/assets/javascripts/bootstrap/popover.js',
    // 'node_modules/bootstrap-sass/assets/javascripts/bootstrap/scrollspy.js',
    // 'node_modules/bootstrap-sass/assets/javascripts/bootstrap/tab.js',
    // 'node_modules/bootstrap-sass/assets/javascripts/bootstrap/tooltip.js',
    // 'node_modules/bootstrap-sass/assets/javascripts/bootstrap/transition.js',
    '_assets/js/**/*.js'
  ] )
    .pipe( $.plumber( { 'errorHandler': handleErrors } ) )
    .pipe( $.sourcemaps.init() )
    .pipe( $.concat( 'project.js' ) )
    .pipe( $.sourcemaps.write( ) )
    .pipe( $.rename( { 'suffix': '.min' } ) )
    .pipe( $.uglify( { 'mangle': false } ) )
    .pipe( gulp.dest( 'assets/js' ) )
    .pipe( gulp.dest( '_site/assets/js' ) )
    .pipe( browserSync.stream() )
);

gulp.task( 'clean:scripts', ( callback ) => {
  del([
    'assets/js/main.min.js',
    '_site/assets/js/main.min.js'
  ]);
  callback();
});

/**
 * Use Jekyll to build the site
 *
 * https://www.npmjs.com/package/gulp-shell
 */
gulp.task( 'build:jekyll', () =>
  gulp.src('')
    .pipe( $.plumber( { 'errorHandler': handleErrors } ) )
    .pipe($.run('bundle exec jekyll build'))
);

gulp.task( 'clean:jekyll', ( callback ) => {
  del( [ '_site' ] );
  callback();
});

/**
 * Culminating tasks
 *
 * https://www.npmjs.com/package/run-sequence
 */
gulp.task( 'clean', [
  'clean:jekyll',
  'clean:fonts',
  'clean:images',
  'clean:scripts',
  'clean:styles'
]);

gulp.task( 'build', ( callback ) =>
  runSequence(
    'clean',
    [ 'build:scripts', 'build:images', 'build:styles', 'build:fonts' ],
    'build:jekyll',
    callback
  )
);

/**
 * Server tasks
 *
 * https://www.npmjs.com/package/browser-sync
 */
gulp.task('build:jekyll:watch', ['build:jekyll'], ( callback ) => {
    browserSync.reload();
    callback();
});

gulp.task('build:scripts:watch', ['build:scripts'], ( callback ) => {
    browserSync.reload();
    callback();
});

gulp.task( 'serve', [ 'build' ], () => {
  // Kick off BrowserSync.
  browserSync.init({
    'server': {
        'baseDir': '_site'
    },
    'injectChanges': true,   // Auto inject changes instead of full reload.
    'ghostMode': false,      // Toggle to mirror clicks, reloads etc. (performance)
    'open': false,
    'watchOptions': {
      'debounceDelay': 1000  // Wait 1 second before injecting.
    }
  });

  // Watch site settings.
  gulp.watch(['_config.yml'], ['build:jekyll:watch']);

  // Watch .scss files; changes are piped to browserSync.
  gulp.watch('_assets/scss/**/*.scss', ['build:styles']);

  // Watch .js files.
  gulp.watch('_assets/js/**/*.js', ['build:scripts:watch']);

  // Watch image files; changes are piped to browserSync.
  gulp.watch('_uploads/**/*', ['build:images']);

  // Watch posts.
  gulp.watch('_posts/**/*.+(md|markdown|MD)', ['build:jekyll:watch']);

  // Watch html and markdown files.
  gulp.watch(['**/*.+(html|md|markdown|MD)', '!_site/**/*.*'], ['build:jekyll:watch']);

  // Watch RSS feed XML file.
  gulp.watch('feed.xml', ['build:jekyll:watch']);

  // Watch data files.
  gulp.watch('_data/**.*+(yml|yaml|csv|json)', ['build:jekyll:watch']);

  // Watch favicon.png.
  gulp.watch('favicon.png', ['build:jekyll:watch']);
});

gulp.task( 'default', [ 'serve' ] );
