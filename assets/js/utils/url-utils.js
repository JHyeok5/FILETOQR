/**
 * url-utils.js - FileToQR URL 유틸리티
 * 버전: 1.0.0
 * 최종 업데이트: 2025-06-15
 * 
 * 이 유틸리티는 내부 링크 형식을 통일하고 URL 처리 기능을 제공합니다.
 */

const UrlUtils = (function() {
  'use strict';
  
  // 내부 페이지 목록
  const internalPages = [
    'index',
    'convert',
    'qrcode',
    'help',
    'privacy',
    'terms'
  ];
  
  // 확장자가 필요한 페이지 목록
  const pagesRequiringExtension = [
    'convert',
    'qrcode',
    'help',
    'privacy',
    'terms'
  ];
  
  /**
   * URL 정규화 - 모든 내부 URL이 동일한 형식을 가지도록 처리
   * @param {string} url - 원본 URL
   * @param {boolean} includeExtension - .html 확장자 포함 여부 (기본값: true)
   * @returns {string} 정규화된 URL
   */
  function normalizeUrl(url, includeExtension = true) {
    // 외부 URL인 경우 그대로 반환
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    
    // 해시태그 또는 쿼리스트링 분리
    let hash = '';
    let query = '';
    
    if (url.includes('#')) {
      const parts = url.split('#');
      url = parts[0];
      hash = '#' + parts[1];
    }
    
    if (url.includes('?')) {
      const parts = url.split('?');
      url = parts[0];
      query = '?' + parts[1];
    }
    
    // 확장자 제거 (있는 경우)
    if (url.endsWith('.html')) {
      url = url.substring(0, url.length - 5);
    }
    
    // 시작 슬래시 추가
    if (!url.startsWith('/')) {
      url = '/' + url;
    }
    
    // 페이지 이름 추출
    const pageName = url === '/' ? 'index' : url.substring(1);
    
    // 확장자 처리
    if (includeExtension && pagesRequiringExtension.includes(pageName)) {
      url = url + '.html';
    }
    
    // 쿼리스트링 및 해시태그 다시 추가
    return url + query + hash;
  }
  
  /**
   * 내부 URL인지 확인
   * @param {string} url - 확인할 URL
   * @returns {boolean} 내부 URL 여부
   */
  function isInternalUrl(url) {
    // 외부 URL인 경우
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return false;
    }
    
    // 현재 도메인의 URL인 경우
    if (url.startsWith('/')) {
      // 확장자 제거
      const cleanUrl = url.endsWith('.html') 
        ? url.substring(0, url.length - 5) 
        : url;
      
      // 쿼리스트링 및 해시태그 제거
      let pathOnly = cleanUrl;
      if (pathOnly.includes('?')) {
        pathOnly = pathOnly.split('?')[0];
      }
      if (pathOnly.includes('#')) {
        pathOnly = pathOnly.split('#')[0];
      }
      
      // 시작 슬래시 제거
      const pageName = pathOnly === '/' ? 'index' : pathOnly.substring(1);
      
      return internalPages.includes(pageName);
    }
    
    return false;
  }
  
  /**
   * 기본 URL 경로 가져오기
   * @returns {string} 기본 URL 경로
   */
  function getBasePath() {
    // script 태그에서 기본 경로 찾기
    const scripts = document.getElementsByTagName('script');
    for (const script of scripts) {
      if (script.src.includes('app-core.js')) {
        const url = new URL(script.src);
        return url.pathname.substring(0, url.pathname.indexOf('/assets/'));
      }
    }
    
    // meta 태그에서 기본 경로 찾기
    const baseTag = document.querySelector('base');
    if (baseTag && baseTag.href) {
      const baseUrl = new URL(baseTag.href);
      return baseUrl.pathname;
    }
    
    return '';
  }
  
  /**
   * 상대 URL 생성
   * @param {string} path - 대상 경로
   * @returns {string} 상대 URL
   */
  function getRelativeUrl(path) {
    const basePath = getBasePath();
    
    // 시작 슬래시 제거
    if (path.startsWith('/')) {
      path = path.substring(1);
    }
    
    // 기본 경로가 있는 경우에만 추가
    if (basePath && basePath !== '/') {
      // 끝 슬래시 처리
      const basePathWithSlash = basePath.endsWith('/') ? basePath : basePath + '/';
      return basePathWithSlash + path;
    }
    
    return path;
  }
  
  /**
   * 모든 내부 링크 표준화
   * @param {boolean} includeExtension - 확장자 포함 여부
   */
  function standardizeLinks(includeExtension = true) {
    const links = document.getElementsByTagName('a');
    const basePath = getBasePath();

    for (const link of links) {
      const href = link.getAttribute('href');
      if (!href) continue;
      
      // 내부 링크인 경우에만 처리
      if (isInternalUrl(href)) {
        // URL 정규화
        const normalizedUrl = normalizeUrl(href, includeExtension);
        // 상대 경로 변환
        const relativeUrl = getRelativeUrl(normalizedUrl);
        link.setAttribute('href', relativeUrl);
      }
    }
  }
  
  /**
   * URL 매개변수 가져오기
   * @param {string} name - 매개변수 이름
   * @param {string} url - URL (기본값: 현재 URL)
   * @returns {string|null} 매개변수 값 또는 null
   */
  function getUrlParameter(name, url = window.location.href) {
    name = name.replace(/[[\]]/g, '\\$&');
    const regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)');
    const results = regex.exec(url);
    
    if (!results) return null;
    if (!results[2]) return '';
    
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
  }
  
  /**
   * URL 매개변수 설정
   * @param {string} name - 매개변수 이름
   * @param {string} value - 매개변수 값
   * @param {string} url - URL (기본값: 현재 URL)
   * @returns {string} 업데이트된 URL
   */
  function setUrlParameter(name, value, url = window.location.href) {
    const regex = new RegExp('([?&])' + name + '=.*?(&|$)', 'i');
    const separator = url.indexOf('?') !== -1 ? '&' : '?';
    
    if (url.match(regex)) {
      return url.replace(regex, '$1' + name + '=' + encodeURIComponent(value) + '$2');
    } else {
      return url + separator + name + '=' + encodeURIComponent(value);
    }
  }
  
  // 공개 API
  return {
    normalizeUrl,
    isInternalUrl,
    standardizeLinks,
    getUrlParameter,
    setUrlParameter,
    getBasePath,
    getRelativeUrl
  };
})();

// 글로벌 네임스페이스에 등록
window.UrlUtils = UrlUtils;

export default UrlUtils; 