
module.exports = function(grunt) {

var srcFiles = ['Gruntfile.js', 'server/**/*.js', 'test/**/*.js', 'listing/**/*.js'];

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    jshint: {
      options: {
        jshintrc: '.jshintrc'
      },
      server: srcFiles
    },
    jscs: {
    src: srcFiles,
    options: {
        verbose: true, // If you need output with rule names http://jscs.info/overview.html#verbose
        requireCurlyBraces: [ "if" ]
    }
  },
  mochaTest: {
    test: {
      options: {
        reporter: 'spec',
        quiet: false, // Optionally suppress output to standard out (defaults to false)
        clearRequireCache: false // Optionally clear the require cache before running tests (defaults to false)
      },
      src: ['server/test/**/*.js']
    }
  },
  shell: {
    clientGrunt: {
      command: 'npm install && grunt',
      options: {
        execOptions: {
          cwd: 'client'
        }
      }
    }
  }

  });

  // Load the plugin that provides the "uglify" task.
  grunt.loadNpmTasks("grunt-jscs");
	grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-mocha-test');
  grunt.loadNpmTasks('grunt-shell');


  // Default task(s).
  grunt.registerTask('default', ['jshint', 'jscs', 'mochaTest', 'shell']);

};
