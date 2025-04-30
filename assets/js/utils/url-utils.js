/**
 * url-utils.js - FileToQR URL 유틸리티
 * 버전: 1.0.0
 * 최종 업데이트: 2023-06-15
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
    
    // 루트 경로 처리
    if (url === '/' || url === '/index') {
      return includeExtension ? '/index.html' + query + hash : '/' + query + hash;
    }
    
    // 확장자 추가 (필요한 경우)
    if (includeExtension) {
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
   * 모든 내부 링크 표준화
   * 페이지 내의 모든 내부 링크를 동일한 형식으로 변경
   * @param {boolean} includeExtension - .html 확장자 포함 여부 (기본값: true)
   */
  function standardizeLinks(includeExtension = true) {
    // 모든 앵커 태그 선택
    const links = document.querySelectorAll('a[href]');
    
    links.forEach(link => {
      const href = link.getAttribute('href');
      
      // 내부 링크인 경우만 처리
      if (
        href && 
        (href.startsWith('/') || 
         !href.startsWith('http://') && 
         !href.startsWith('https://') && 
         !href.startsWith('#'))
      ) {
        const normalizedHref = normalizeUrl(href, includeExtension);
        link.setAttribute('href', normalizedHref);
      }
    });
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
    setUrlParameter
  };
})();

// 글로벌 네임스페이스에 등록
window.UrlUtils = UrlUtils;

export default UrlUtils; 