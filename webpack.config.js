const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');

// HTML 페이지 목록
const htmlPages = ['index', 'convert', 'qrcode', 'help', 'privacy', 'terms'];

module.exports = {
  mode: 'production',
  entry: {
    'app': './assets/js/core/app-core.js'
  },
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist/js'),
    publicPath: '/dist/js/'
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
      cacheGroups: {
        vendors: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all'
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
            presets: [
              ['@babel/preset-env', {
                modules: false, // ES 모듈을 그대로 유지
                useBuiltIns: 'usage',
                corejs: 3,
                targets: {
                  browsers: [
                    'last 2 versions',
                    'not dead',
                    'not < 2%'
                  ]
                }
              }]
            ],
            plugins: [
              '@babel/plugin-transform-runtime'
            ]
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
    ...htmlPages.map(page => {
      return new HtmlWebpackPlugin({
        template: `./${page}.html`,
        filename: `${page}.html`,
        chunks: ['app', 'vendors'],
        minify: {
          collapseWhitespace: true,
          removeComments: true,
          removeRedundantAttributes: true,
          removeScriptTypeAttributes: true,
          removeStyleLinkTypeAttributes: true,
          useShortDoctype: true
        }
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
    extensions: ['.js'],
    // 절대 경로 별칭 설정
    alias: {
      '@core': path.resolve(__dirname, 'assets/js/core/'),
      '@utils': path.resolve(__dirname, 'assets/js/utils/'),
      '@converters': path.resolve(__dirname, 'assets/js/converters/'),
      '@qr': path.resolve(__dirname, 'assets/js/qr-generator/'),
      '@ui': path.resolve(__dirname, 'assets/js/ui/')
    }
  }
}; 