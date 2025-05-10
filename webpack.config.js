const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const HandlebarsPlugin = require('handlebars-webpack-plugin');
const fs = require('fs');

// HTML 페이지 목록
const htmlPages = ['index', 'convert', 'qrcode', 'help', 'privacy', 'terms', 'timer', 'contact', 'text-to-qr'];

// 지원 언어 목록
const languages = ['en', 'zh', 'ja'];

// HTML 웹팩 플러그인 배열
const htmlPlugins = [];

// 페이지별 엔트리 포인트 매핑
const pageEntries = {
  'index': 'home',
  'convert': 'convert',
  'qrcode': 'qr-generator',
  'timer': 'timer',
  'text-to-qr': 'text-to-qr',
  // 콘텐츠 페이지는 기본 앱 코어 사용
  'help': 'content',
  'privacy': 'content',
  'terms': 'content',
  'contact': 'content'
};

// 기본 언어 (한국어 - ko) HTML 파일 생성
htmlPages.forEach(page => {
  const chunks = ['app-core', 'common-utils', 'vendors'];
  
  // 페이지별 특정 스크립트 추가
  if (pageEntries[page]) {
    chunks.push(pageEntries[page]);
  }
  
  // 모든 페이지에 템플릿 유틸리티 추가
  chunks.push('template-utils');

  htmlPlugins.push(
    new HtmlWebpackPlugin({
      template: `./${page}.html`,
      filename: `${page}.html`,
      chunks: chunks,
      minify: {
        collapseWhitespace: true,
        removeComments: true,
        removeRedundantAttributes: true,
        useShortDoctype: true
      }
    })
  );
});

// 다른 언어 HTML 파일 생성 (en, zh, ja) - 기본 템플릿에서 복사
languages.forEach(lang => {
  // 언어 디렉토리가 없으면 생성
  if (!fs.existsSync(path.resolve(__dirname, lang))) {
    fs.mkdirSync(path.resolve(__dirname, lang), { recursive: true });
  }

  htmlPages.forEach(page => {
    // 각 언어별 템플릿이 있는지 확인
    const langTemplateExists = fs.existsSync(path.resolve(__dirname, `${lang}/${page}.html`));
    const templatePath = langTemplateExists ? `./${lang}/${page}.html` : `./${page}.html`;
    
    const chunks = ['app-core', 'common-utils', 'vendors'];
    
    // 페이지별 특정 스크립트 추가
    if (pageEntries[page]) {
      chunks.push(pageEntries[page]);
    }
    
    // 모든 페이지에 템플릿 유틸리티 추가
    chunks.push('template-utils');
    
    htmlPlugins.push(
      new HtmlWebpackPlugin({
        template: templatePath, // 언어별 템플릿이 없으면 기본 템플릿 사용
        filename: `${lang}/${page}.html`,
        chunks: chunks,
        minify: {
          collapseWhitespace: true,
          removeComments: true,
          removeRedundantAttributes: true,
          useShortDoctype: true
        },
        templateParameters: {
          lang: lang,
          currentLang: lang
        }
      })
    );
  });
});

// 페이지별 엔트리 포인트 생성
const entries = {
  'app-core': './assets/js/core/app-core.js',
  'common-utils': './assets/js/utils/common-utils.js',
  'converter-core': './assets/js/core/converter-core.js',
  'qr-generator': './assets/js/qr-generator/qr-generator.js',
  'template-utils': './assets/js/utils/template-utils.js',
  // 페이지별 스크립트
  'home': './assets/js/pages/home.js',
  'convert': './assets/js/pages/convert.js',
  'timer': './assets/js/pages/timer.js',
  'text-to-qr': './assets/js/converters/file-to-qr-converter.js',
  // 콘텐츠 페이지 공통 스크립트
  'content': './assets/js/pages/content.js'
};

module.exports = {
  mode: 'production',
  entry: entries,
  output: {
    filename: 'assets/js/[name].[contenthash].js', // 캐싱 최적화를 위한 contenthash 추가
    path: path.resolve(__dirname, 'dist'),
    publicPath: './'
  },
  optimization: {
    runtimeChunk: 'single', // 런타임 코드를 별도 청크로 분리
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          compress: {
            drop_console: false, // 개발 중에는 콘솔 로그 유지
            drop_debugger: true
          },
          output: {
            comments: false
          }
        },
        parallel: true // 병렬 처리로 성능 향상
      })
    ],
    splitChunks: {
      cacheGroups: {
        vendors: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
          priority: -10
        },
        // 'common'에서 'shared'로 이름 변경 및 설정 수정하여 충돌 해결
        sharedModules: {
          name: 'shared-modules',
          chunks: 'all',
          minChunks: 2, // 최소 2개 이상의 청크에서 사용되는 모듈 추출
          priority: -20
        }
      }
    }
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
            cacheDirectory: true // 빌드 시간 단축을 위한 캐싱
          }
        }
      },
      {
        test: /\.css$/,
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader',
            options: {
              importLoaders: 1
            }
          },
          'postcss-loader' // Tailwind CSS와 같은 PostCSS 플러그인 지원
        ]
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'assets/images/[name].[hash][ext]'
        }
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'assets/fonts/[name].[hash][ext]'
        }
      },
      {
        test: /\.handlebars$/,
        loader: 'handlebars-loader'
      }
    ]
  },
  plugins: [
    new CleanWebpackPlugin(),
    new MiniCssExtractPlugin({
      filename: 'assets/css/[name].[contenthash].css'
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: 'assets/images',
          to: 'assets/images',
          noErrorOnMissing: true
        },
        {
          from: 'assets/css',
          to: 'assets/css',
          noErrorOnMissing: true
        },
        {
          from: 'assets/i18n',
          to: 'assets/i18n',
          noErrorOnMissing: true
        },
        {
          from: '.nojekyll',
          to: '.nojekyll',
          noErrorOnMissing: true
        },
        {
          from: 'CNAME',
          to: 'CNAME',
          noErrorOnMissing: true
        },
        {
          from: 'components/partials',
          to: 'components/partials',
          noErrorOnMissing: true
        }
      ]
    }),
    ...htmlPlugins
  ],
  devServer: {
    static: {
      directory: path.join(__dirname, './'),
    },
    compress: true,
    port: 9000,
    open: true,
    hot: true,
    client: {
      overlay: true, // 오류 발생 시 브라우저에 오버레이 표시
      progress: true // 로딩 진행 상황 표시
    }
  },
  resolve: {
    extensions: ['.js', '.handlebars', '.hbs', '.json'],
    alias: {
      '@core': path.resolve(__dirname, 'assets/js/core'),
      '@utils': path.resolve(__dirname, 'assets/js/utils'),
      '@converters': path.resolve(__dirname, 'assets/js/converters'),
      '@qr': path.resolve(__dirname, 'assets/js/qr-generator'),
      '@ui': path.resolve(__dirname, 'assets/js/ui'),
      '@templates': path.resolve(__dirname, 'components'),
      '@partials': path.resolve(__dirname, 'components/partials'),
      '@common': path.resolve(__dirname, 'assets/js/utils/common-utils.js')
    },
    // es6-promise-polyfill 모듈을 찾지 못할 때 처리할 방법 추가
    fallback: {
      "es6-promise-polyfill": false
    }
  },
  // 소스맵 설정 - 개발 모드에서만 상세 소스맵 활성화
  devtool: process.env.NODE_ENV === 'production' ? 'nosources-source-map' : 'eval-source-map'
}; 