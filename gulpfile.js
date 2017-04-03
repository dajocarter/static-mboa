// Require our dependencies
const gulp = require( 'gulp' );
const $ = require( 'gulp-load-plugins' )();
const merge = require( 'merge-stream' );
const autoprefixer = require( 'autoprefixer' );
const mqpacker = require( 'css-mqpacker' );
const cssnano = require( 'cssnano' );
const browserSync = require( 'browser-sync' );
const reload = browserSync.reload;

// Set assets paths.
const paths = {
  'html': [
    '_includes/*.html',
    '_layouts/*.html',
    '_posts/**/*.md',
    '_posts/**/*.markdown',
    '*.md',
    '*.markdown',
    '!node_modules/*'
  ],
  'images': {
    'src': '_uploads/*',
    'dist': '_site/uploads/*'
  },
  'sass': {
    'src': [ '_assets/scss/*.scss' ],
    'dist': '_site/assets'
  },
  'scripts': {
    'src': [
      'node_modules/jquery/dist/jquery.js',
      'node_modules/slick-carousel/slick/slick.js',
      // Add all npm packages first
      '_assets/js/**/*.js'
    ],
    'dist': '_site/assets'
  }
};

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
 * Build the Jekyll Site
 *
 * https://www.npmjs.com/package/gulp-shell
 */
function buildJekyll() {
  gulp.src( '' )
    .pipe($.run('bundle exec jekyll build'))
}

/**
 * Compile Sass and run stylesheet through PostCSS.
 *
 * https://www.npmjs.com/package/gulp-sass
 * https://www.npmjs.com/package/gulp-postcss
 * https://www.npmjs.com/package/autoprefixer
 * https://www.npmjs.com/package/css-mqpacker
 * https://www.npmjs.com/package/cssnano
 */
function buildCss() {
  gulp.src( paths.sass.src )
    .pipe( $.plumber( { 'errorHandler': handleErrors } ) )
    .pipe( $.sourcemaps.init() )
    .pipe( $.sass( {
      'includePaths': [
        // Include paths here to use @import without paths
        'node_modules/normalize.css/',
        'node_modules/slick-carousel/slick/'
      ],
      'errLogToConsole': true,
      'outputStyle': 'expanded' // Options: nested, expanded, compact, compressed
    } ) )
    .pipe( $.postcss( [
      autoprefixer( ),
      mqpacker( { 'sort': true } ),
      cssnano( { 'safe': true } )
    ] ) )
    .pipe( $.rename( {
      'basename': 'project',
      'suffix': '.min'
    } ) )
    .pipe( $.sourcemaps.write() )
    .pipe( gulp.dest( paths.sass.dist ) )
    .pipe( browserSync.stream() )
}

/**
 * Copy font assets.
 *
 * https://www.npmjs.com/package/merge-stream
 */
function buildAssets() {
  const toAssetsCss = gulp.src([
      'node_modules/slick-carousel/slick/ajax-loader.gif'
    ])
    .pipe(gulp.dest('_site/assets'));

  const toAssetsFonts = gulp.src([
      'node_modules/slick-carousel/slick/fonts/*'
    ])
    .pipe(gulp.dest('_site/assets/fonts'));

  merge(toAssetsCss, toAssetsFonts);
}

/**
 * Optimize images.
 *
 * https://www.npmjs.com/package/gulp-imagemin
 */
function buildImg() {
  gulp.src( paths.images.src )
    .pipe( $.plumber( { 'errorHandler': handleErrors } ) )
    .pipe( $.imagemin( [
      $.imagemin.gifsicle( { 'interlaced': true } ),
      $.imagemin.jpegtran( { 'progressive': true } ),
      $.imagemin.optipng( { 'optimizationLevel': 5 } ),
      $.imagemin.svgo( { plugins: [ { removeViewBox: true } ] } )
    ] ) )
    .pipe( gulp.dest( paths.images.dist ) )
    .pipe( browserSync.stream() )
}

/**
 * Concatenate and minify JavaScript.
 *
 * https://www.npmjs.com/package/gulp-sourcemaps
 * https://www.npmjs.com/package/gulp-concat
  * https://www.npmjs.com/package/gulp-uglify
 */
function buildJs() {
  gulp.src( paths.scripts.src )
    .pipe( $.plumber( { 'errorHandler': handleErrors } ) )
    .pipe( $.sourcemaps.init() )
    .pipe( $.concat( 'project.js' ) )
    .pipe( $.rename( { 'suffix': '.min' } ) )
    .pipe( $.uglify( { 'mangle': false } ) )
    .pipe( $.sourcemaps.write( ) )
    .pipe( gulp.dest( paths.scripts.dist ) )
    .pipe( browserSync.stream() )
}

/**
 * Wait for build, then launch the Server
 *
 * https://www.npmjs.com/package/browser-sync
 */
function watch() {
  // Kick off BrowserSync.
  browserSync({
    'server': {
        'baseDir': '_site'
    },
    'injectChanges': true,   // Auto inject changes instead of full reload.
    'watchOptions': {
      'debounceDelay': 1000  // Wait 1 second before injecting.
    }
  });

  // Run tasks when files change.
  gulp.watch( paths.html, [ 'rebuild' ] );
  gulp.watch( paths.images.src, [ 'img:serve' ] );
  gulp.watch( paths.sass.src, [ 'sass:serve' ] );
  gulp.watch( paths.scripts.src, [ 'js:serve' ] );
}

/**
 * Create individual tasks.
 */
gulp.task( 'jekyll:build', buildJekyll );
gulp.task( 'copy:build', [ 'jekyll:build' ], buildAssets);
gulp.task( 'sass:build', [ 'jekyll:build' ], buildCss );
gulp.task( 'img:build', [ 'jekyll:build' ], buildImg );
gulp.task( 'js:build', [ 'jekyll:build' ], buildJs );
gulp.task( 'build', [ 'img:build', 'sass:build', 'js:build', 'copy:build' ] );

gulp.task( 'sass:serve', buildCss );
gulp.task( 'img:serve', buildImg );
gulp.task( 'js:serve', buildJs );
gulp.task( 'serve', [ 'img:serve', 'sass:serve', 'js:serve', 'copy:build' ])

gulp.task( 'rebuild', [ 'build' ], reload );
gulp.task( 'watch', [ 'build' ], watch );
gulp.task( 'default', [ 'watch' ] );
