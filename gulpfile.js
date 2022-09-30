
const gulp = require('gulp')
const jshint = require('gulp-jshint')
const del = require('del')
const exec = require('child_process').exec


gulp.task('clean', function(){
     return del('dist/**', {force:true});
})

gulp.task('misc', () => 
    gulp.src(['LICENSE', 'package.json', 'README.md', 'package-lock.json', 'services.json'])
    .pipe(gulp.dest('dist'))
)

gulp.task('index', () =>
    gulp.src('index.js')
    .pipe(jshint())
    .pipe(jshint.reporter('default'))
    .pipe(gulp.dest('dist'))
)

gulp.task('js', () =>
    gulp.src('src/*.js')
    .pipe(jshint())
    .pipe(jshint.reporter('default'))
    .pipe(gulp.dest('dist/src'))
)

gulp.task('node-insta', (cb) => {
    exec('npm install --prefix ./dist', (err, stdout, stderr) => {
        console.log(stdout)
        console.log(stderr)
        cb(err)
    })
})
gulp.task('build', gulp.series('clean', 'misc', 'index', 'js', 'node-insta'));

gulp.task('node-insta-p', (cb) => {
    exec('npm ci --only=production --prefix ./dist', (err, stdout, stderr) => {
        console.log(stdout)
        console.log(stderr)
        cb(err)
    })
})
gulp.task('build-p', gulp.series('clean', 'misc', 'index', 'js', 'node-insta-p'));

module.exports = gulp
