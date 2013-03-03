/*jshint node:true*/
'use strict';
var url = require('url');
var util = require('util');

// # Globbing
// for performance reasons we're only matching one level down:
// 'test/spec/{,*/}*.js'
// use this if you want to match all subfolders:
// 'test/spec/**/*.js'

module.exports = function (grunt) {
    // load all grunt tasks
    require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);

    // configurable paths
    var yeomanConfig = {
        app: '_attachments',
        dist: 'dist/_attachments'
    };

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        yeoman: yeomanConfig,
        clean: {
            dist: ['.tmp', '<%= yeoman.dist %>/*'],
            server: '.tmp'
        },
        watch: {
            js: {
                files: ['Gruntfile.js', '.jshintrc', '<%= yeoman.app %>/script/*.js'],
                tasks: ['jshint', 'couchapp'],
                spawn: true
            },
            html: {
                files: ['<%= yeoman.app %>/partials/*.html', '<%= yeoman.app %>/index.html'],
                tasks: ['couchapp'],
                spawn: true
            },
            css: {
                files: '<%= yeoman.app %>/style/*.css',
                tasks: ['couchapp'],
                spawn: true
            }
        },
        jshint: {
            options: {
                jshintrc: '.jshintrc'
            },
            all: [
                'Gruntfile.js',
                '<%= yeoman.app %>/scripts/{,*/}*.js',
                '!<%= yeoman.app %>/vendor/*',
                '!<%= yeoman.app %>/scripts/vendor/*',
                'test/spec/{,*/}*.js'
            ]
        },
        mocha: {
            all: {
                options: {
                    run: true,
                    urls: ['http://localhost:<%= connect.options.port %>/index.html']
                }
            }
        },
        compass: {
            options: {
                sassDir: '<%= yeoman.app %>/styles',
                cssDir: '.tmp/styles',
                imagesDir: '<%= yeoman.app %>/img',
                javascriptsDir: '<%= yeoman.app %>/scripts',
                fontsDir: '<%= yeoman.app %>/styles/fonts',
                importPath: '<%= yeoman.app %>/components',
                relativeAssets: true
            },
            dist: {},
            server: {
                options: {
                    debugInfo: true
                }
            }
        },
        // not used since Uglify task does concat,
        // but still available if needed
        /*concat: {
            dist: {}
        },*/
        uglify: {
            options: {
                banner: '/*! <%= pkg.name %> - v<%= pkg.version %> - ' +
                        '<%= grunt.template.today("yyyy-mm-dd") %> */'
            }
        },
        useminPrepare: {
            html: '<%= yeoman.app %>/index.html',
            options: {
                dest: '<%= yeoman.dist %>'
            }
        },
        usemin: {
            html: ['<%= yeoman.dist %>/{,*/}*.html'],
            css: ['<%= yeoman.dist %>/styles/{,*/}*.css'],
            options: {
                dirs: ['<%= yeoman.dist %>']
            }
        },
        imagemin: {
            dist: {
                files: [{
                    expand: true,
                    cwd: '<%= yeoman.app %>/img',
                    src: '{,*/}*.{png,jpg,jpeg}',
                    dest: '<%= yeoman.dist %>/img'
                }]
            }
        },
        cssmin: {
            dist: {
                files: {
                    '<%= yeoman.dist %>/styles/main.css': [
                        '.tmp/styles/{,*/}*.css',
                        '<%= yeoman.app %>/styles/{,*/}*.css'
                    ]
                }
            }
        },
        copy: {
            dist: {
                files: [
                    {
                        expand: true,
                        dot: true,
                        cwd: '<%= yeoman.app %>',
                        dest: '<%= yeoman.dist %>',
                        src: [
                            'index.html',
                            'partials/*.html',
                            '*.{ico,txt}',
                            'img/*.gif',
                            'vendor/bootstrap/img/*.png',
                            '.htaccess'
                        ]
                    },
                    {
                        expand: true,
                        dot: true,
                        cwd: '<%= yeoman.app %>/../',
                        dest: '<%= yeoman.dist %>/../',
                        src: [
                            '*.{ico,txt}',
                            '.couchappignore',
                            'couchapp.json',
                            '.couchapprc',
                            '.ericaignore',
                            '_id',
                            'language',
                            'LICENSE',
                            'README.md'
                        ]
                    }
                ]
            }
        },
        compress: {
            dist: {
                options: {
                    archive: '<%= pkg.name %>-<%= pkg.version %>.tar.gz'
                },
                files: [
                    {expand: true, cwd: 'dist/', src: ['**', '.*'], dest: ''}
                ]
            }
        }

    });

    grunt.renameTask('regarde', 'watch');

    /* Push up to couchdb server for dev test */
    grunt.registerTask('couchapp', 'deploy couchapp', function () {
        var done = this.async();

        var urlOptions = {
            protocol: process.env.COUCHAPP_PROTOCOL || 'http',
            hostname: process.env.COUCHAPP_SERVER || 'localhost',
            port: process.env.COUCHAPP_PORT || '5984',
            pathname: process.env.COUCHAPP_PATH || '/acralyzer'
        };
        if (process.env.COUCHAPP_AUTH) {
            urlOptions.auth = process.env.COUCHAPP_AUTH;
        }

        if (grunt.file.exists('.couchapp_deploy'))
        {
            urlOptions = grunt.util._.merge(
                urlOptions,
                grunt.file.readJSON('.couchapp_deploy')
            );
        }

        var spawnOpts = {
            cmd: 'couchapp',
            args: ['push', url.format(urlOptions)]
        };
        grunt.verbose.writeln('Now Running' + util.inspect(spawnOpts).cyan);

        grunt.util.spawn(spawnOpts, function (err, res/*, code*/) {
            grunt.log.ok();
            grunt.log.write(res.stderr);
            done();
        });
    });

    grunt.registerTask('test', [
        'clean:server',
//        'compass',
        'mocha'
    ]);

    grunt.registerTask('build', [
        'clean:dist',
//        'compass:dist',
        'useminPrepare',
        'imagemin',
        'concat',
        'cssmin',
        'uglify',
        'copy',
        'usemin'
    ]);

    grunt.registerTask('default', [
        'jshint',
        'test'
    ]);
};
