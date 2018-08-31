const gulp      = require('gulp')
const watch     = require('gulp-watch')
const del       = require('del')
const base64    = require('gulp-base64')
const rename    = require('gulp-rename')
const less      = require('gulp-less')
const sass      = require('gulp-sass')
const plumber   = require('gulp-plumber')
const imgMin    = require('gulp-imagemin')
const webpack   = require('webpack')
const webpackStream = require('webpack-stream')
let isBuild = false

// css gulp handle func
const cssType = {
  less: less,
  sass: sass,
  wxss: ''
}

// output dir
const distDir = './dist'

// color style 
const colorStyle = {
  'blue': ['\x1B[34m', '\x1B[39m'],
  'green': ['\x1B[32m', '\x1B[39m']
};

// resources dir
const srcDir = {
  npm: './src/npm/*.js',
  js: [
    './src/**/*.js',
    '!src/npm/*.js'
  ],
  views: './src/**/*.{html,wxml}',
  wxss: './src/**/*.wxss',
  json: './src/**/*.json',
  image: [
    `./src/**/**/*.{png,jpg,jpeg,svg,gif}`,
    `!src/**/_*/*.{png,jpg,jpeg,svg,gif}`,
    `!src/**/_*.{png,jpg,jpeg,svg,gif}`
  ],
  less: [
    `./src/**/*.less`,
    `!src/**/_*/*.less`,
    `!src/**/_*.less`,
    `!src/less/*.less`
  ],
  sass: [
    `./src/**/*.scss`,
    `!src/**/_*/*.scss`,
    `!src/**/_*.scss`,
    `!src/scss/*.scss`
  ]
}

// webpack config to pack npm
const webpackConfig = {
  output: {
    filename: 'index.js',
    libraryTarget: 'commonjs2'
  },
  module: {
    rules: [{ 
      test: /\.js$/, 
      loader: 'babel-loader'
    }]
  },
  mode: 'production',
  optimization: {
    minimize: true
  }
}

gulp.task('npm', () => {
  npm()
})
gulp.task('npm:watch', () => {
  watch(srcDir.npm, { event: ['add', 'change', 'unlink'] }, () => {
    npm()
  })
})

gulp.task('image', () => {
  image()
})
gulp.task('image:watch', () => {
  watch(srcDir.image, { event: ['add', 'change', 'unlink'] }, () => {
    image()
  })
})

gulp.task('json', () => {
  json()
})
gulp.task('json:watch', () => {
  watch([srcDir.json], { event: ['add', 'change', 'unlink'] }, () => {
    json()
  })
})

gulp.task('js', () => {
  js()
})
gulp.task('js:watch', () => {
  watch(srcDir.js, { event: ['add', 'change', 'unlink'] }, (file) => {
    js(file)
  })
})

gulp.task('wxss', () => {
  compileCss('wxss', srcDir.wxss, distDir)
})
gulp.task('wxss:watch', () => {
  watch([srcDir.wxss], { event: ['add', 'change', 'unlink'] }, (file) => {
    compileCss('wxss', srcDir.wxss, distDir, file)
  })
})

gulp.task('less', () => {
  compileCss('less', srcDir.less, distDir)
})
gulp.task('less:watch', () => {
  watch(srcDir.less, { event: ['add', 'change', 'unlink'] }, function (file) {
    compileCss('less', srcDir.less, distDir, file)
  })
})

gulp.task('sass', () => {
  compileCss('sass', srcDir.sass, distDir)
})
gulp.task('sass:watch', () => {
  watch(srcDir.sass, { event: ['add', 'change', 'unlink'] }, function (file) {
    compileCss('sass', srcDir.sass, distDir, file)
  })
})

gulp.task('views', () => {
  views()
})
gulp.task('views:watch', () => {
  watch([srcDir.views], { event: ['add', 'change', 'unlink'] }, (file) => {
    views(file)
  })
})

gulp.task('clean', () => {
  del([
    './dist'
  ])
})

// development下编译
gulp.task('dev', () => {
  gulp.start(['npm', 'npm:watch', 'image', 'image:watch', 'json', 'json:watch', 'js', 'js:watch',
    'wxss', 'wxss:watch', 'less', 'less:watch', 'sass', 'sass:watch', 'views', 'views:watch'])
})

// product下编译
gulp.task('build', () => {
  isBuild = true
  console.log('\n')
  console.log(colorStyle['blue'][0] + '> Starting building...' + colorStyle['blue'][1])
  console.log('\n')
  gulp.start(['npm', 'image', 'json', 'js', 'wxss', 'less', 'sass', 'views'], function () {
    console.log(colorStyle['green'][0] + '> Build success' + colorStyle['green'][1])
  })
})

/**
 * [pack common npm package]
 * 
 */
function npm() {
  return gulp.src(srcDir.npm)
    .pipe(webpackStream(webpackConfig), webpack)
    .pipe(gulp.dest(distDir + '/npm'))
    .on('end', () => {
      console.log(colorStyle['green'][0] + '> Npm package complite!' + colorStyle['green'][1])
    })
}

/**
 * [compileWxss compile less or sass or wxss file]
 */
function compileCss(type, src, dist, file) {
  let cssHandleFn = cssType[type]
  let compile = cssHandleFn ? gulp.src(src).pipe(plumber()).pipe(cssHandleFn()) : gulp.src(src).pipe(plumber());
  return compile
    .pipe(base64({
      extensions: [/\.png#datauri$/i, /\.jpg#datauri$/i],
      maxImageSize: 10 * 1024
    }))
    .pipe(rename({ extname: '.wxss' }))
    .pipe(gulp.dest(dist))
    .on('end', () => {
      if (file) {
        console.log('\n')
        console.log(colorStyle['green'][0] + '> WXSS Complite: ' + colorStyle['green'][1] + file.path + ' to wxss complite!')
      } else {
        console.log(colorStyle['green'][0] + '> ' + type + ' to wxss complite!' + colorStyle['green'][1])
      }
    })
}

// 编译image文件
function image() {
  gulp.src(srcDir.image)
    .pipe(imgMin({progressive: true}))
    .pipe(gulp.dest(distDir))
    .on('end', () => {
      console.log(colorStyle['green'][0] + '> Image complite!' + colorStyle['green'][1])
    })
}

// 编译json
function json() {
  gulp.src(srcDir.json)
    .pipe(gulp.dest(distDir))
    .on('end', () => {
      console.log(colorStyle['green'][0] + '> Json complite!' + colorStyle['green'][1])
    })
}

// 编译js
function js(file) {
  return gulp.src(srcDir.js)
    .pipe(gulp.dest(distDir))
    .on('end', () => {
      if (file) {
        console.log('\n')
        console.log(colorStyle['green'][0] + '> JS Complite: ' + colorStyle['green'][1] + file.path + ' complite!')
      } else {
        console.log(colorStyle['green'][0] + '> JS complite!' + colorStyle['green'][1])
      }
    })
}

// 编译html、wxml文件成wxml
function views(file) {
  return gulp.src(srcDir.views)
    .pipe(rename({ extname: '.wxml' }))
    .pipe(gulp.dest(distDir))
    .on('end', () => {
      if (file) {
        console.log('\n')
        console.log(colorStyle['green'][0] + '> Wxml Complite: ' + colorStyle['green'][1] + file.path + ' complite!')
      } else {
        console.log(colorStyle['green'][0] + '> Wxml complite!' + colorStyle['green'][1])
      }
    })
}


