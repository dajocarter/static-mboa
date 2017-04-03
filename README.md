# siteleaf-boilerplate

A Jekyll boilerplate for using Siteleaf as a CMS and Netlify as a host.

## Gulp commands

`gulp clean`: Cleans all assets directories (`assets` and `_site/assets`)

`gulp build`: Optimizes assets and then uses Jekyll to generate static website

`gulp serve`: Generates the static website and uses BrowserSync to watch for changes, run the appopriate Gulp tasks, and inject the changes

`gulp`: Defaults to `gulp serve`

## npm and Bower support

To use a sass-related npm/bower package, look for the Gulp task named `build:styles` and add the path of the vendor's scss file(s) to the `includePaths` option of the `$.sass` pipe.

To use a js-related npm/bower package, look for the Gulp task named `build:scripts` and add the path of the vendor's js file(s) to the `gulp.src` array.
