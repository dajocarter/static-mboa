// Require our dependencies
const gulp = require( 'gulp' );
const $ = require( 'gulp-load-plugins' )();
const spawn = require( 'child_process' ).spawn;
const autoprefixer = require( 'autoprefixer' );
const mqpacker = require( 'css-mqpacker' );
const cssnano = require( 'cssnano' );
const browserSync = require( 'browser-sync' );
const reload = browserSync.reload;

// Set assets paths.
const paths = {
  'css': [
    '_site/assets/*.css',
    '!_site/assets/*.min.css'
  ],
  'html': [
    '_includes/*.html',
    '_layouts/*.html',
    '_posts/**/*.md',
    '*.md',
    '!node_modules/*'
  ],
  'images': '_site/uploads/*',
  'sass': 'assets/*.scss',
  'scripts': [
    'assets/*.js',
    '!assets/*.min.js'
  ]
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
 * Optimize and minify css.
 *
 * https://www.npmjs.com/package/gulp-postcss
 * https://www.npmjs.com/package/autoprefixer
 * https://www.npmjs.com/package/css-mqpacker
 * https://www.npmjs.com/package/cssnano
 */
gulp.task( 'postcss', ['jekyll-build'], () =>
  gulp.src( paths.css )
    .pipe( $.plumber( { 'errorHandler': handleErrors } ) )
    // Parse with PostCSS plugins.
    .pipe( $.postcss( [
      autoprefixer( ),
      mqpacker( {
        'sort': true
      } ),
      cssnano( {
        'safe': true // Use safe optimizations.
      } )
    ] ) )
    .pipe( $.rename( { 'suffix': '.min' } ) )
    .pipe( gulp.dest( '_site/assets' ) )
    .pipe( browserSync.stream() )
    .pipe($.notify( { message: 'postcss task complete' } ) )
);

/**
 * Optimize images.
 *
 * https://www.npmjs.com/package/gulp-imagemin
 */
gulp.task( 'imagemin', [ 'jekyll-build' ], () =>
  gulp.src( paths.images )
    .pipe( $.plumber( { 'errorHandler': handleErrors } ) )
    .pipe( $.imagemin( [
      $.imagemin.gifsicle( { 'interlaced': true } ),
      $.imagemin.jpegtran( { 'progressive': true } ),
      $.imagemin.optipng( { 'optimizationLevel': 5 } ),
      $.imagemin.svgo( { plugins: [ { removeViewBox: true } ] } )
    ] ) )
    .pipe( gulp.dest( '_site/uploads' ) )
    .pipe($.notify( { message: 'imagemin task complete' } ) )
);

/**
 * Concatenate and transform JavaScript.
 *
 * https://www.npmjs.com/package/gulp-concat
 * https://www.npmjs.com/package/gulp-sourcemaps
 */
gulp.task( 'concat', () =>
  gulp.src( paths.scripts )

    // Deal with errors.
    .pipe( $.plumber( { 'errorHandler': handleErrors } ) )

    // Start a sourcemap.
    .pipe( $.sourcemaps.init() )

    // Concatenate partials into a single script.
    .pipe( $.concat( 'project.js' ) )

    // Append the sourcemap to project.js.
    .pipe( $.sourcemaps.write() )

    // Save project.js
    .pipe( gulp.dest( '_site/assets' ) )
    .pipe( browserSync.stream() )
    .pipe($.notify( { message: 'concat task complete' } ) )
);

/**
  * Minify compiled JavaScript.
  *
  * https://www.npmjs.com/package/gulp-uglify
  */
gulp.task( 'uglify', [ 'concat' ], () =>
  gulp.src( paths.scripts )
    .pipe( $.rename( { 'suffix': '.min' } ) )
    .pipe( $.uglify( { 'mangle': false } ) )
    .pipe( gulp.dest( '_site/assets' ) )
    .pipe($.notify( { message: 'uglify task complete' } ) )
);


/**
 * Process tasks and reload browsers on file changes.
 *
 * https://www.npmjs.com/package/browser-sync
 */

/**
 * Build the Jekyll Site
 *
 * https://nodejs.org/api/child_process.html#child_process_child_process_spawn_command_args_options
 */
gulp.task( 'jekyll-build', (done) => {
  $.notify( { message: 'Building Jekyll' } );
  spawn( 'bundle', [ 'exec', 'jekyll', 'build', '--incremental' ], { stdio: 'inherit' } )
    .on( 'close', done );
});

/**
 * Rebuild Jekyll & do page reload
 */
gulp.task( 'jekyll-rebuild', [ 'jekyll-build' ], () => {
  reload();
});

/**
 * Wait for jekyll-build, then launch the Server
 */
gulp.task( 'watch', [ 'jekyll-build' ], () => {
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
  gulp.watch( paths.css, [ 'css' ] );
  gulp.watch( paths.html, [ 'rebuild' ] );
  gulp.watch( paths.images, [ 'img' ] );
  gulp.watch( paths.sass, [ 'rebuild' ] );
  gulp.watch( paths.scripts, [ 'js' ] );
});

/**
 * Create individual tasks.
 */
gulp.task( 'rebuild', [ 'jekyll-rebuild' ] );
gulp.task( 'img', [ 'imagemin' ] );
gulp.task( 'js', [ 'uglify' ] );
gulp.task( 'css', [ 'postcss' ] );
gulp.task( 'build', [ 'jekyll-build', 'css', 'js', 'img' ] );
gulp.task( 'default', [ 'build', 'watch' ] );
