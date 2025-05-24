module.exports = {
  content: [
    './*.html',
    './assets/js/**/*.js',
    './components/**/*.html',
    './ko/*.html',
    './ja/*.html',
    './zh/*.html',
    './en/*.html'
  ],
  theme: {
    extend: {},
  },
  plugins: [
    require('tailwindcss-animate'),
  ],
}; 