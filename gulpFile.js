var gulp = require('gulp');
var uglify = require('gulp-uglify');
var gutil = require('gulp-util');
var clean = require('gulp-clean');
var concat = require('gulp-concat');
var watch = require('gulp-watch');
var runSequence = require('run-sequence');
var exec = require('child_process').exec;

gulp.task('copyEJS', function() {
    return gulp.src('views/**/*.ejs').pipe(gulp.dest('dist/views/'));
})

gulp.task('clean', function(){
     return gulp.src("dist", { read: false }).pipe(clean());
});

gulp.task('generateScripts', function() {
    return gulp.src('./client/scripts/*.js')
        .pipe(concat('appscripts.js'))
        .pipe(gulp.dest('./dist/client/scripts/'));
});

gulp.task('generateLibScripts', function() {
    return gulp.src('./client/lib/*.js')
        .pipe(concat('vendor.js'))
        .pipe(gulp.dest('./dist/client/lib/'));
});

gulp.task('copyServer', function() {
      return gulp.src('server/**').pipe(gulp.dest('dist/server/'));
});

gulp.task('nodestart', function (cb) {
  exec('node server/server.js', function (err, stdout, stderr) {
    console.log(stdout);
    console.log(stderr);
    cb(err);
  });
});

gulp.task('stream', function () {
    return watch('client/**/*.css', { ignoreInitial: false })
        .pipe(gulp.dest('build'));
});

gulp.task('default', ['clean','copyEJS','generateScripts','copyServer']);

gulp.task('build', function(callback) {
  runSequence('clean', ['copyEJS','generateScripts','copyServer'],['nodestart','stream']);
});