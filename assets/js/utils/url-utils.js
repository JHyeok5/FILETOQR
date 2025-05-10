/**
 * url-utils.js - FileToQR URL 유틸리티
 * 버전: 1.0.1
 * 최종 업데이트: 2025-07-15
 * 
 * 이 모듈은 URL과 관련된 유틸리티 함수를 제공합니다.
 * - URL 매개변수 처리
 * - 상대 경로 및 절대 경로 변환
 * - 다국어 URL 경로 처리
 */

// 전역 객체 설정
window.FileToQR = window.FileToQR || {};
window.FileToQR.utils = window.FileToQR.utils || {};

/**
 * URL 유틸리티 모듈
 */
const UrlUtils = {
  /**
   * URL 쿼리 매개변수를 객체로 변환
   * @param {string} [url=window.location.href] - 분석할 URL (기본값: 현재 URL)
   * @returns {Object} 쿼리 매개변수 객체
   * 
   * @example
   * // URL: https://example.com?name=John&age=30
   * const params = UrlUtils.getQueryParams();
   * // 결과: { name: 'John', age: '30' }
   */
  getQueryParams(url = window.location.href) {
    const params = {};
    const queryString = url.split('?')[1];
    
    if (!queryString) return params;
    
    const searchParams = new URLSearchParams(queryString);
    for (const [key, value] of searchParams.entries()) {
      params[key] = value;
    }
    
    return params;
  },
  
  /**
   * URL에 쿼리 매개변수 추가 또는 업데이트
   * @param {Object} params - 추가할 매개변수 객체
   * @param {string} [url=window.location.href] - 기본 URL (기본값: 현재 URL)
   * @returns {string} 업데이트된 URL
   * 
   * @example
   * // 기존 URL: https://example.com?name=John
   * const newUrl = UrlUtils.updateQueryParams({ age: 30, city: 'New York' });
   * // 결과: https://example.com?name=John&age=30&city=New%20York
   */
  updateQueryParams(params, url = window.location.href) {
    const urlObj = new URL(url);
    
    for (const [key, value] of Object.entries(params)) {
      urlObj.searchParams.set(key, value);
    }
    
    return urlObj.toString();
  },
  
  /**
   * URL에서 쿼리 매개변수 제거
   * @param {Array<string>} paramsToRemove - 제거할 매개변수 이름 배열
   * @param {string} [url=window.location.href] - 기본 URL (기본값: 현재 URL)
   * @returns {string} 업데이트된 URL
   * 
   * @example
   * // 기존 URL: https://example.com?name=John&age=30&city=New%20York
   * const newUrl = UrlUtils.removeQueryParams(['age', 'city']);
   * // 결과: https://example.com?name=John
   */
  removeQueryParams(paramsToRemove, url = window.location.href) {
    const urlObj = new URL(url);
    
    paramsToRemove.forEach(param => {
      urlObj.searchParams.delete(param);
    });
    
    return urlObj.toString();
  },
  
  /**
   * URL에서 언어 코드 추출
   * @param {string} [url=window.location.href] - 분석할 URL (기본값: 현재 URL)
   * @param {Array<string>} [supportedLangs=['ko', 'en', 'zh', 'ja']] - 지원 언어 목록
   * @returns {string|null} 언어 코드 또는 null (찾지 못한 경우)
   * 
   * @example
   * // URL: https://example.com/en/index.html
   * const lang = UrlUtils.getLanguageFromUrl();
   * // 결과: 'en'
   */
  getLanguageFromUrl(url = window.location.href, supportedLangs = ['ko', 'en', 'zh', 'ja']) {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/').filter(part => part);
    
    if (pathParts.length > 0 && supportedLangs.includes(pathParts[0])) {
      return pathParts[0];
    }
    
    return null;
  },
  
  /**
   * 현재 URL의 언어 버전 URL 생성
   * @param {string} lang - 언어 코드
   * @param {string} [url=window.location.href] - 기본 URL (기본값: 현재 URL)
   * @param {string} [defaultLang='ko'] - 기본 언어 코드
   * @returns {string} 언어 버전 URL
   * 
   * @example
   * // 현재 URL: https://example.com/en/index.html
   * const jaUrl = UrlUtils.getLanguageUrl('ja');
   * // 결과: https://example.com/ja/index.html
   */
  getLanguageUrl(lang, url = window.location.href, defaultLang = 'ko') {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/').filter(part => part);
    const currentLang = this.getLanguageFromUrl(url) || defaultLang;
    
    // 경로에 언어 코드가 있는 경우
    if (currentLang && currentLang !== defaultLang) {
      // 첫 번째 부분이 현재 언어 코드인 경우
      if (pathParts[0] === currentLang) {
        // 기본 언어로 변경하는 경우 언어 코드 제거
        if (lang === defaultLang) {
          urlObj.pathname = '/' + pathParts.slice(1).join('/');
        } else {
          // 다른 언어로 변경
          pathParts[0] = lang;
          urlObj.pathname = '/' + pathParts.join('/');
        }
      }
    } else {
      // 경로에 언어 코드가 없고, 기본 언어가 아닌 경우 언어 코드 추가
      if (lang !== defaultLang) {
        urlObj.pathname = '/' + lang + urlObj.pathname;
      }
    }
    
    return urlObj.toString();
  },

  /**
   * i18n 다국어 URL을 생성하는 함수
   * @param {string} path - 페이지 경로 (예: 'index.html', 'convert.html')
   * @param {string} [lang=null] - 언어 코드 (null이면 현재 언어 사용)
   * @param {Object} [options={}] - 추가 옵션
   * @param {boolean} [options.absolute=false] - 절대 URL 반환 여부
   * @param {string} [options.defaultLang='ko'] - 기본 언어 코드
   * @returns {string} 생성된 URL
   * 
   * @example
   * // 현재 언어: 'en'
   * const url = UrlUtils.getI18nUrl('convert.html');
   * // 결과: '/en/convert.html'
   * 
   * @example
   * // 다른 언어로 URL 생성
   * const url = UrlUtils.getI18nUrl('convert.html', 'ja');
   * // 결과: '/ja/convert.html'
   */
  getI18nUrl(path, lang = null, options = {}) {
    const defaultOptions = {
      absolute: false,
      defaultLang: 'ko'
    };
    
    const opts = { ...defaultOptions, ...options };
    
    // 현재 언어 확인
    const currentLang = lang || (window.FileToQR && window.FileToQR.i18n ? 
      window.FileToQR.i18n.getCurrentLang() : 
      this.getLanguageFromUrl() || opts.defaultLang);
    
    // 경로에서 시작 슬래시 제거
    const cleanPath = path.startsWith('/') ? path.substring(1) : path;
    
    // 기본 언어인 경우 언어 경로 없음
    const urlPath = currentLang === opts.defaultLang ? 
      `/${cleanPath}` : 
      `/${currentLang}/${cleanPath}`;
    
    // 절대 URL 요청 시
    if (opts.absolute) {
      const baseUrl = window.location.origin;
      return `${baseUrl}${urlPath}`;
    }
    
    return urlPath;
  },
  
  /**
   * 네비게이션 링크 생성 함수 (i18n 지원)
   * @param {string} key - i18n URL 키 (urls.home, urls.convert 등)
   * @param {Object} [options={}] - 추가 옵션
   * @returns {string} 생성된 URL
   * 
   * @example
   * // i18n 설정: urls.convert = '/en/convert.html'
   * const url = UrlUtils.getNavUrl('urls.convert');
   * // 결과: '/en/convert.html'
   */
  getNavUrl(key, options = {}) {
    // i18n 지원 확인
    if (window.FileToQR && window.FileToQR.i18n && typeof window.FileToQR.i18n.t === 'function') {
      return window.FileToQR.i18n.t(key, options);
    }
    
    // i18n 없는 경우 기본 URL 반환
    console.warn('i18n 모듈이 초기화되지 않았습니다. 기본 URL을 사용합니다.');
    
    // 키에서 페이지 이름 추출
    const pageMatches = key.match(/urls\.(\w+)$/);
    if (pageMatches && pageMatches[1]) {
      const pageName = pageMatches[1];
      
      // 기본 페이지 매핑
      const pageUrls = {
        home: 'index.html',
        convert: 'convert.html',
        qrcode: 'qrcode.html',
        timer: 'timer.html',
        help: 'help.html',
        contact: 'contact.html',
        privacy: 'privacy.html',
        terms: 'terms.html'
      };
      
      if (pageUrls[pageName]) {
        return this.getI18nUrl(pageUrls[pageName]);
      }
    }
    
    // 기본값 반환
    return '/';
  }
};

// 전역 객체에 등록
window.FileToQR.utils.url = UrlUtils;

// Export for ES modules
export default UrlUtils; 