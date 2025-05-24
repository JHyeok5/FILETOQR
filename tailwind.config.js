module.exports = {
  content: [
    './*.html',
    './ko/*.html',
    './en/*.html',
    './ja/*.html',
    './zh/*.html',
    './components/**/*.html',
    './assets/js/**/*.js',
    // 아래는 추가적으로 포함될 수 있는 경로 예시 (필요시 주석 해제)
    // './docs/**/*.md',
    // './assets/css/**/*.css',
  ],
  safelist: [
    { pattern: /bg-(blue|purple|pink|green|red|yellow|slate|gray|white|black)-(50|100|200|300|400|500|600|700|800|900)/ },
    { pattern: /text-(blue|purple|pink|green|red|yellow|slate|gray|white|black)-(50|100|200|300|400|500|600|700|800|900)/ },
    { pattern: /border-(blue|purple|pink|green|red|yellow|slate|gray|white|black)-(50|100|200|300|400|500|600|700|800|900)/ },
    { pattern: /(flex|grid|gap|space|rounded|shadow|container|mx|my|px|py|pt|pb|pl|pr|mt|mb|ml|mr|w|h|max-w|max-h|min-w|min-h|items|justify|order|z|overflow|hidden|block|inline|absolute|relative|sticky|fixed|transition|duration|ease|animate|scale|rotate|skew|translate|opacity|visible|hidden|sr-only|antialiased|font|leading|tracking|text|underline|decoration|truncate|whitespace|break|object|aspect|bg|from|via|to|ring|focus|hover|active|disabled|group|peer|first|last|even|odd|file|placeholder|dark|sm|md|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl|10xl)/ },
  ],
  theme: {
    extend: {},
  },
  plugins: [
    require('tailwindcss-animate'),
  ],
}; 