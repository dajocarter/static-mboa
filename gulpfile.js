// Require our dependencies
const gulp = require( 'gulp' );
const $ = require( 'gulp-load-plugins' )();
const merge = require( 'merge-stream' );
const spawn = require( 'child_process' ).spawn;
const autoprefixer = require( 'autoprefixer' );
const mqpacker = require( 'css-mqpacker' );
const cssnano = require( 'cssnano' );
const browserSync = require( 'browser-sync' );
const reload = browserSync.reload;

// Set assets paths.
const paths = {
  'css': [
    'node_modules/normalize.css/normalize.css',
    'node_modules/slick-carousel/slick/slick.css',
    'node_modules/slick-carousel/slick/slick-theme.css',
    // Add all npm packages first
    '_site/assets/*.css',
    '!_site/assets/project.min.css'
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
    'node_modules/jquery/dist/jquery.js',
    'node_modules/slick-carousel/slick/slick.js',
    // Add all npm packages first
    '_site/assets/*.js',
    '!_site/assets/project.min.js'
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
 * Copy font assets.
 *
 * https://www.npmjs.com/package/merge-stream
 */
gulp.task('assets', [ 'jekyll-build' ], () => {
  const toAssetsCss = gulp.src([
      'node_modules/slick-carousel/slick/ajax-loader.gif'
    ])
    .pipe(gulp.dest('_site/assets'));

  const toAssetsFonts = gulp.src([
      'node_modules/font-awesome/fonts/*',
      'node_modules/slick-carousel/slick/fonts/*'
    ])
    .pipe(gulp.dest('_site/assets/fonts'));

  merge(toAssetsCss, toAssetsFonts);
});

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
    .pipe( $.sourcemaps.init() )
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
    .pipe( $.concat( 'project.css' ) )
    .pipe( $.rename( { 'suffix': '.min' } ) )
    .pipe( $.sourcemaps.write( '.' ) )
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
gulp.task( 'concat', [ 'jekyll-build' ], () =>
  gulp.src( paths.scripts )

    // Deal with errors.
    .pipe( $.plumber( { 'errorHandler': handleErrors } ) )

    // Start a sourcemap.
    .pipe( $.sourcemaps.init() )

    // Concatenate partials into a single script.
    .pipe( $.concat( 'project.js' ) )

    // Append the sourcemap to project.js.
    .pipe( $.sourcemaps.write( '.' ) )

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
  gulp.src( '_site/assets/project.js' )
    .pipe( $.rename( { 'suffix': '.min' } ) )
    .pipe( $.uglify( { 'mangle': false } ) )
    .pipe( gulp.dest( '_site/assets' ) )
    .pipe($.notify( { message: 'uglify task complete' } ) )
);

/**
 * Rebuild Jekyll & do page reload
 */
gulp.task( 'jekyll-rebuild', [ 'jekyll-build' ], () => {
  reload();
});

/**
 * Wait for jekyll-build, then launch the Server
 *
 * https://www.npmjs.com/package/browser-sync
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
gulp.task( 'build', [ 'jekyll-build', 'css', 'js', 'img', 'assets' ] );
gulp.task( 'default', [ 'build', 'watch' ] );
