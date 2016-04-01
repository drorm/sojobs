module.exports = function(grunt) {

var srcFiles = ['Gruntfile.js', 'app.js', 'dash/**/*.js', 'account/**/*.js', 'search/**/*.js', 'listing/**/*.js'];

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    jshint: {
      options: {
        jshintrc: '.jshintrc'
      },
      client: srcFiles
    },
    jscs: {
      src: srcFiles,
      options: {
        verbose: true, // If you need output with rule names http://jscs.info/overview.html#verbose
        requireCurlyBraces: [ "if" ]
      }
    },
    concat: {
      dist: {
        src: [ 
          "node_modules/jquery/dist/jquery.js",
          "node_modules/angular/angular.js",
          "node_modules/angular-animate/angular-animate.js",
          "node_modules/icheck/icheck.js",
          "node_modules/api-check/dist/api-check.js",
          "node_modules/angular-formly/dist/formly.js",
          "node_modules/angular-formly-templates-bootstrap/dist/angular-formly-templates-bootstrap.js",
          "node_modules/angular-ui-grid/ui-grid.js",
          "node_modules/angular-ui-bootstrap/dist/ui-bootstrap-tpls.js",
          "node_modules/angular-resource/angular-resource.js",
          "node_modules/angular-ui-router/release/angular-ui-router.js",
          "node_modules/angular-messages/angular-messages.js",
          "node_modules/angular-confirm/angular-confirm.js",
          "node_modules/angular-busy/angular-busy.js",
          "node_modules/angular-gravatar/build/angular-gravatar.js",
          "node_modules/angular-cookies/angular-cookies.js",
          "node_modules/angular-sanitize/angular-sanitize.js",
          "node_modules/lodash/lodash.js",
          "misc/modernizr.js",
          "app.js",
          "sparrow/misc/lb-services.js",
          "sparrow/account/account.js",
          "sparrow/account/auth.js",
          "sparrow/dash/smodel.js",
          "sparrow/dash/dialog.js",
          "sparrow/AdminLTE/dist/js/app.js",
          "sparrow/dash/modelService.js",
          "search/search.js",
          "listing/listing.js",
          "misc/utils.js"
        ],
        dest: 'sparrow/dist/sparrow.js',
      }
    },
   shell: {
        lbservices: {
            command: 'lb-ng ../server/server.js sparrow/misc/lb-services.js'
        }
    },
    watch: {
      src: {
        files: srcFiles,
        tasks: ['concat'],
      },
    }
  });

  // Load the plugin that provides the tasks.
  require('load-grunt-tasks')(grunt);

  // Default task(s).
  grunt.registerTask('default', ['jshint', 'jscs', 'shell', 'concat']);

};
