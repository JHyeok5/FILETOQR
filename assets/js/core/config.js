/**
 * config.js - FileToQR 애플리케이션 설정
 * 버전: 1.1.0
 * 최종 업데이트: 2025-07-26
 * 
 * 이 모듈은 애플리케이션 전반에서 사용되는 설정과 상수를 제공합니다.
 * - 지원 언어 목록
 * - 기본 언어 설정
 * - 페이지 경로 정보
 * - 기타 앱 상수
 */

// 전역 객체 설정
window.FileToQR = window.FileToQR || {};
window.FileToQR.config = window.FileToQR.config || {};

/**
 * 애플리케이션 버전
 */
export const APP_VERSION = '2.0.0';

/**
 * 지원 언어 설정
 */
export const LANGUAGE_CONFIG = {
  // 지원하는 언어 목록
  supportedLanguages: ['ko', 'en', 'zh', 'ja'],
  
  // 기본 언어 (언어를 감지할 수 없는 경우 사용)
  defaultLanguage: 'ko',
  
  // RTL(오른쪽에서 왼쪽) 언어 목록
  rtlLanguages: ['ar', 'he']
};

/**
 * 페이지 관련 설정
 */
export const PAGE_CONFIG = {
  // 기본 페이지 목록 및 HTML 파일명
  pages: {
    home: 'index.html',
    convert: 'convert.html',
    qrcode: 'qrcode.html',
    timer: 'timer.html',
    help: 'help.html',
    contact: 'contact.html',
    privacy: 'privacy.html',
    terms: 'terms.html'
  },
  
  // i18n 경로 키와 페이지 매핑
  i18nKeys: {
    'home': 'urls.home',
    'convert': 'urls.convert',
    'qrcode': 'urls.qrcode',
    'timer': 'urls.timer',
    'help': 'urls.help',
    'contact': 'urls.contact',
    'privacy': 'urls.privacy',
    'terms': 'urls.terms'
  }
};

/**
 * UI 관련 설정
 */
export const UI_CONFIG = {
  // 링크 표준화 설정
  linkStandardization: {
    includeExtension: true
  },
  
  // 로딩 설정
  loading: {
    minDisplayTime: 500, // 로딩 표시 최소 시간(ms)
    fadeOutTime: 300     // 페이드 아웃 시간(ms)
  }
};

/**
 * 경로 관련 설정
 */
export const PATH_CONFIG = {
  i18n: '/assets/i18n/',
  components: '/components/',
  partials: '/components/partials/',
  assets: '/assets/'
};

/**
 * 저장소 관련 설정
 */
export const STORAGE_CONFIG = {
  // 로컬 스토리지 키 목록
  keys: {
    language: 'fileToQR_lang',
    theme: 'fileToQR_theme',
    lastVisit: 'fileToQR_lastVisit'
  }
};

// 설정 객체 생성
const Config = {
  APP_VERSION,
  LANGUAGE_CONFIG,
  PAGE_CONFIG,
  UI_CONFIG,
  PATH_CONFIG,
  STORAGE_CONFIG,
  
  /**
   * 현재 언어가 RTL 언어인지 확인
   * @param {string} lang - 언어 코드
   * @returns {boolean} RTL 언어 여부
   */
  isRTL(lang) {
    return LANGUAGE_CONFIG.rtlLanguages.includes(lang);
  },
  
  /**
   * 지원하는 언어인지 확인
   * @param {string} lang - 언어 코드
   * @returns {boolean} 지원 언어 여부
   */
  isSupportedLanguage(lang) {
    return LANGUAGE_CONFIG.supportedLanguages.includes(lang);
  },
  
  /**
   * 페이지 ID로 HTML 파일 경로 가져오기
   * @param {string} pageId - 페이지 ID
   * @returns {string} HTML 파일 경로
   */
  getPagePath(pageId) {
    return PAGE_CONFIG.pages[pageId] || null;
  },
  
  /**
   * 페이지 ID로 i18n URL 키 가져오기
   * @param {string} pageId - 페이지 ID
   * @returns {string} i18n URL 키
   */
  getPageI18nKey(pageId) {
    return PAGE_CONFIG.i18nKeys[pageId] || null;
  },
  
  /**
   * 파일 경로에서 페이지 ID 추출
   * @param {string} path - 파일 경로
   * @returns {string|null} 페이지 ID 또는 null
   */
  getPageIdFromPath(path) {
    const cleanPath = path.endsWith('.html') ? path.slice(0, -5) : path;
    
    for (const [id, pagePath] of Object.entries(PAGE_CONFIG.pages)) {
      const pageCleanPath = pagePath.endsWith('.html') ? pagePath.slice(0, -5) : pagePath;
      if (cleanPath === pageCleanPath) {
        return id;
      }
    }
    
    return null;
  }
};

// 전역 객체에 등록
window.FileToQR.config = Config;

// Export for ES modules
export default Config; 