/**
 * url-utils.js - FileToQR URL 유틸리티
 * 버전: 1.3.5
 * 최종 업데이트: 2025-07-28
 * 
 * 이 모듈은 URL과 관련된 유틸리티 함수를 제공합니다.
 * - URL 매개변수 처리
 * - 다국어 URL 경로 처리
 * - 내부 페이지 URL 관리
 */

import Config from '../core/config.js';

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
   * @param {string} [url=window.location.href] - 기본 URL
   * @returns {string} 업데이트된 URL
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
   * @param {string} [url=window.location.href] - 기본 URL
   * @returns {string} 업데이트된 URL
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
   * @param {string} [url=window.location.href] - 분석할 URL
   * @returns {string|null} 언어 코드 또는 null (찾지 못한 경우)
   */
  getLanguageFromUrl(url = window.location.href) {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/').filter(part => part);
      const supportedLangs = Config.LANGUAGE_CONFIG.supportedLanguages;
      
      if (pathParts.length > 0 && supportedLangs.includes(pathParts[0])) {
        return pathParts[0];
      }
      
      return null;
    } catch (error) {
      console.error('URL에서 언어 추출 중 오류:', error);
      return null;
    }
  },
  
  /**
   * 현재 URL의 언어 버전 URL 생성
   * @param {string} lang - 언어 코드
   * @param {string} [url=window.location.href] - 기본 URL
   * @returns {string} 언어 버전 URL
   */
  getLanguageUrl(lang, url = window.location.href) {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/').filter(part => part);
      const currentLang = this.getLanguageFromUrl(url);
      const defaultLang = Config.LANGUAGE_CONFIG.defaultLanguage;
      
      // 언어 코드가 지원되지 않는 경우 기본 언어 사용
      if (!Config.isSupportedLanguage(lang)) {
        console.warn(`지원하지 않는 언어: ${lang}, 기본 언어(${defaultLang})로 대체`);
        lang = defaultLang;
      }
      
      // 새 경로 파트 배열 생성
      let newPathParts = [...pathParts];
      
      // 현재 URL에 언어 코드가 있는 경우
      if (currentLang) {
        // 첫 번째 경로 파트를 언어 코드로 교체
        newPathParts[0] = lang;
      } else {
        // 언어 코드가 기본 언어가 아닌 경우, 경로 맨 앞에 추가
        if (lang !== defaultLang) {
          newPathParts.unshift(lang);
        }
      }
      
      // 기본 언어로 전환하고 현재 언어가 있는 경우
      if (lang === defaultLang && currentLang) {
        // 기본 언어 코드 제거 (첫 번째 경로 파트)
        newPathParts.shift();
      }
      
      // 새 경로 생성
      urlObj.pathname = '/' + newPathParts.join('/');
      
      return urlObj.toString();
    } catch (error) {
      console.error('언어 URL 생성 중 오류:', error, {
        lang, url, 
        currentLang: this.getLanguageFromUrl(url)
      });
      return url; // 오류 발생 시 원래 URL 반환
    }
  },

  /**
   * i18n 다국어 URL을 생성하는 함수
   * @param {string} path - 페이지 경로 (예: 'index.html', 'convert.html')
   * @param {string} [lang=null] - 언어 코드 (null이면 현재 언어 사용)
   * @param {Object} [options={}] - 추가 옵션
   * @returns {string} 생성된 URL
   */
  getI18nUrl(path, lang = null, options = {}) {
    try {
      const defaultOptions = {
        absolute: false,
        defaultLang: Config.LANGUAGE_CONFIG.defaultLanguage,
        useBaseUrl: true
      };
      
      const opts = { ...defaultOptions, ...options };
      
      // 현재 언어 확인 - 우선순위에 따라 결정
      let currentLang;
      
      if (lang) {
        // 1. 명시적 언어 코드가 제공된 경우
        currentLang = lang;
      } else if (window.FileToQR && window.FileToQR.i18n && typeof window.FileToQR.i18n.getCurrentLang === 'function') {
        // 2. i18n 모듈에서 현재 언어를 가져올 수 있는 경우
        currentLang = window.FileToQR.i18n.getCurrentLang();
      } else {
        // 3. URL에서 언어를 추출하거나 기본값 사용
        currentLang = this.getLanguageFromUrl() || opts.defaultLang;
      }
      
      // 시작 및 끝 슬래시 제거
      const cleanPath = path.replace(/^\/|\/$/g, '');
      
      let urlPath;
      
      // 기본 언어인 경우 언어 경로 없음 (선택적으로 설정 가능)
      if (currentLang === opts.defaultLang && !opts.alwaysIncludeLang) {
        urlPath = `/${cleanPath}`;
      } else {
        urlPath = `/${currentLang}/${cleanPath}`;
      }
      
      // 절대 URL 요청 시
      if (opts.absolute) {
        const baseUrl = window.location.origin;
        return `${baseUrl}${urlPath}`;
      }
      
      // 기본 URL 사용 여부
      if (opts.useBaseUrl) {
        const basePath = this.getBasePath();
        // 첫 슬래시 제거하여 상대 경로와 연결
        const relPath = urlPath.replace(/^\//, '');
        return `${basePath}${relPath}`;
      }
      
      return urlPath;
    } catch (error) {
      console.error('i18n URL 생성 중 오류:', error, { path, lang, options });
      return path; // 오류 발생 시 원래 경로 반환
    }
  },
  
  /**
   * 페이지 ID로 URL 생성
   * @param {string} pageId - 페이지 ID
   * @param {string} [lang=null] - 언어 코드 (null이면 현재 언어 사용)
   * @param {Object} [options={}] - 추가 옵션
   * @returns {string} 페이지 URL
   */
  getPageUrl(pageId, lang = null, options = {}) {
    try {
      const pagePath = Config.getPagePath(pageId);
      if (!pagePath) {
        console.warn(`알 수 없는 페이지 ID: ${pageId}`);
        return '/';
      }
      
      return this.getI18nUrl(pagePath, lang, options);
    } catch (error) {
      console.error('페이지 URL 생성 중 오류:', error, { pageId, lang, options });
      return '/'; // 오류 발생 시 홈페이지로 이동
    }
  },
  
  /**
   * 현재 페이지의 다른 언어 버전 URL 가져오기
   * @param {string} lang - 언어 코드
   * @returns {string} 현재 페이지의 다른 언어 URL
   */
  getAlternateURL(lang) {
    return this.getLanguageUrl(lang);
  },
  
  /**
   * 기본 경로 가져오기 - 상대 경로 계산을 위한 함수
   * @returns {string} 기본 경로
   */
  getBasePath() {
    try {
      // 현재 URL 경로 분석
      const currentPath = window.location.pathname;
      const pathParts = currentPath.split('/').filter(part => part);
      const supportedLangs = Config.LANGUAGE_CONFIG.supportedLanguages;
      
      // 기본값은 상대 경로 './'
      let basePath = './';
      
      // URL에 언어 코드가 포함된 경우 - 상위 디렉토리로 이동
      if (pathParts.length > 0 && supportedLangs.includes(pathParts[0])) {
        basePath = '../';
      }
      
      // 추가적인 중첩 깊이가 있는 경우 (언어 코드 이후에 추가 디렉토리)
      if (pathParts.length > 1) {
        const additionalDepth = pathParts.length - (supportedLangs.includes(pathParts[0]) ? 1 : 0);
        if (additionalDepth > 0) {
          // 추가 깊이에 따라 '../' 추가
          basePath = '../'.repeat(additionalDepth + (basePath === '../' ? 0 : 1));
        }
      }
      
      return basePath;
    } catch (error) {
      console.error('기본 경로 계산 중 오류:', error);
      return './'; // 오류 발생 시 현재 디렉토리 반환
    }
  },
  
  /**
   * 주어진 URL이 외부 URL인지 확인
   * @param {string} url - 확인할 URL
   * @returns {boolean} 외부 URL 여부
   */
  isExternalUrl(url) {
    try {
      // 상대 URL인 경우 내부로 판단
      if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('//')) {
        return false;
      }
      
      // 호스트명 비교
      const currentHost = window.location.hostname;
      const urlObj = new URL(url, window.location.origin);
      
      return urlObj.hostname !== currentHost;
    } catch (error) {
      console.warn('URL 검증 중 오류 발생:', error);
      return false;
    }
  },
  
  /**
   * URL 경로에서 페이지 ID 추출
   * @param {string} [url=window.location.href] - 분석할 URL
   * @returns {string} 페이지 ID
   */
  getPageIdFromUrl(url = window.location.href) {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/').filter(part => part);
      const supportedLangs = Config.LANGUAGE_CONFIG.supportedLanguages;
      
      // 언어 코드가 있는 경우 건너뜀
      let startIdx = 0;
      if (pathParts.length > 0 && supportedLangs.includes(pathParts[0])) {
        startIdx = 1;
      }
      
      // 파일명 추출 (경로의 마지막 부분)
      if (pathParts.length > startIdx) {
        const fileName = pathParts[pathParts.length - 1];
        // .html 확장자가 있으면 제거
        const pageId = fileName.replace(/\.html$/, '');
        return pageId;
      }
      
      // 기본값 반환
      return 'index';
    } catch (error) {
      console.error('페이지 ID 추출 중 오류:', error);
      return 'index';
    }
  }
};

// 전역 객체에 등록
window.FileToQR.utils = window.FileToQR.utils || {};
window.FileToQR.utils.url = UrlUtils;

// Export for ES modules
export default UrlUtils; 