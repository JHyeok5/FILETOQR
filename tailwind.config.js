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
  plugins: [],
};
// [설명] content 배열에 실제 서비스의 모든 HTML/JS 경로를 포함시켜, 사용되는 Tailwind 클래스만 빌드 결과에 포함합니다. 