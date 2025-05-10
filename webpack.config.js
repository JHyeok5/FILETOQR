const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const HandlebarsPlugin = require('handlebars-webpack-plugin');

// HTML 페이지 목록
const htmlPages = ['index', 'convert', 'qrcode', 'help', 'privacy', 'terms', 'timer', 'contact'];

// 지원 언어 목록
const languages = ['en', 'zh', 'ja'];

module.exports = {
  mode: 'production',
  entry: {
    'app-core': './assets/js/core/app-core.js',
    'converter-core': './assets/js/core/converter-core.js',
    'qr-generator': './assets/js/qr-generator/qr-generator.js',
    'convert': './assets/js/pages/convert.js',
    'template-utils': './assets/js/utils/template-utils.js'
  },
  output: {
    filename: 'assets/js/[name].bundle.js',
    path: path.resolve(__dirname, 'dist'),
    publicPath: './'
  },
  optimization: {
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          compress: {
            drop_console: false,
            drop_debugger: true
          },
          output: {
            comments: false
          }
        }
      })
    ],
    splitChunks: {
      chunks: 'all',
      name: 'vendors'
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
            presets: ['@babel/preset-env']
          }
        }
      },
      {
        test: /\.css$/,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader'
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
        }
      ]
    }),
    // 기본 언어 (한국어 - ko) HTML 파일 생성
    ...htmlPages.map(page => {
      return new HtmlWebpackPlugin({
        template: `./${page}.html`,
        filename: `${page}.html`,
        chunks: ['app-core', 'vendors', page, 'template-utils'],
        minify: {
          collapseWhitespace: true,
          removeComments: true,
          removeRedundantAttributes: true,
          removeScriptTypeAttributes: true,
          removeStyleLinkTypeAttributes: true,
          useShortDoctype: true
        }
      });
    }),
    
    // 다른 언어 HTML 파일 생성 (en, zh, ja)
    ...languages.flatMap(lang => {
      return htmlPages.map(page => {
        return new HtmlWebpackPlugin({
          template: `./${lang}/${page}.html`,
          filename: `${lang}/${page}.html`,
          chunks: ['app-core', 'vendors', page, 'template-utils'],
          minify: {
            collapseWhitespace: true,
            removeComments: true,
            removeRedundantAttributes: true,
            removeScriptTypeAttributes: true,
            removeStyleLinkTypeAttributes: true,
            useShortDoctype: true
          }
        });
      });
    })
  ],
  devServer: {
    static: {
      directory: path.join(__dirname, './'),
    },
    compress: true,
    port: 9000,
    open: true,
    hot: true
  },
  resolve: {
    extensions: ['.js', '.handlebars', '.hbs'],
    alias: {
      '@core': path.resolve(__dirname, 'assets/js/core'),
      '@utils': path.resolve(__dirname, 'assets/js/utils'),
      '@converters': path.resolve(__dirname, 'assets/js/converters'),
      '@qr': path.resolve(__dirname, 'assets/js/qr-generator'),
      '@ui': path.resolve(__dirname, 'assets/js/ui'),
      '@templates': path.resolve(__dirname, 'components'),
      '@partials': path.resolve(__dirname, 'components/partials')
    }
  }
}; 