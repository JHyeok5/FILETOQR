/**
 * i18n-utils.js - FileToQR 다국어 지원 유틸리티
 * 버전: 1.1.0
 * 최종 업데이트: 2025-06-10
 * 
 * 이 모듈은 다국어 지원을 위한 핵심 기능을 제공합니다:
 * - 언어 리소스 로드
 * - 언어 전환
 * - 문자열 번역
 * - 날짜 및 시간 형식 지원
 * - RTL 언어 지원
 */

import { Promise } from 'es6-promise-polyfill';
import PathUtils from './path-utils.js';

// 언어 리소스 캐시
let translations = {};
let currentLanguage = 'ko';
let defaultLanguage = 'ko';
let supportedLanguages = ['ko', 'en', 'zh', 'ja'];
let loadedLanguages = [];
let rtlLanguages = ['ar', 'he'];

// 현재 언어 getter
export const getCurrentLang = () => currentLanguage;
export const getDefaultLang = () => defaultLanguage;
export const getSupportedLangs = () => supportedLanguages;
export const isRTL = (lang) => rtlLanguages.includes(lang || currentLanguage);
export const getDirectionForLang = (lang) => isRTL(lang) ? 'rtl' : 'ltr';

/**
 * 다국어 지원 초기화
 * @param {Object} options 초기화 옵션
 * @param {string} [options.defaultLang='ko'] 기본 언어
 * @param {Array<string>} [options.supportedLangs=['ko', 'en', 'zh', 'ja']] 지원 언어 목록
 * @param {boolean} [options.detectBrowserLang=true] 브라우저 언어 감지 여부
 * @param {boolean} [options.useSavedLang=true] 저장된 언어 사용 여부
 * @param {Array<string>} [options.rtlLanguages=['ar', 'he']] RTL 언어 목록
 * @returns {Promise<boolean>} 초기화 성공 여부
 */
export async function init(options = {}) {
  try {
    // 옵션 설정
    defaultLanguage = options.defaultLang || 'ko';
    supportedLanguages = options.supportedLangs || ['ko', 'en', 'zh', 'ja'];
    rtlLanguages = options.rtlLanguages || ['ar', 'he'];
    
    // 언어 감지 순서:
    // 1. URL 경로에서 언어 감지
    // 2. 저장된 언어
    // 3. 브라우저 언어
    // 4. 기본 언어
    
    let detectedLang = null;
    
    // 1. URL 경로에서 언어 감지
    if (typeof window !== 'undefined') {
      const urlLang = detectLanguageFromURL();
      if (urlLang && supportedLanguages.includes(urlLang)) {
        detectedLang = urlLang;
        console.log(`URL에서 언어 감지: ${urlLang}`);
      }
    }
    
    // 2. 저장된 언어 불러오기
    if (!detectedLang && options.useSavedLang !== false && typeof localStorage !== 'undefined') {
      const savedLang = localStorage.getItem('fileToQR_lang');
      if (savedLang && supportedLanguages.includes(savedLang)) {
        detectedLang = savedLang;
        console.log(`저장된 언어 불러옴: ${savedLang}`);
      }
    }
    
    // 3. 브라우저 언어 감지
    if (!detectedLang && options.detectBrowserLang !== false && typeof navigator !== 'undefined') {
      const browserLang = navigator.language.split('-')[0];
      if (supportedLanguages.includes(browserLang)) {
        detectedLang = browserLang;
        console.log(`브라우저 언어 감지: ${browserLang}`);
      }
    }
    
    // 최종 선택된 언어 설정 (기본값은 defaultLanguage)
    currentLanguage = detectedLang || defaultLanguage;
    console.log(`현재 언어 설정: ${currentLanguage}`);
    
    // 언어 리소스 로드
    await loadLanguageResource(currentLanguage);
    
    // 언어 방향 설정
    setDocumentDirection(currentLanguage);
    
    // 메타 태그 업데이트
    updateMetaTags();
    
    // 초기화 완료
    return true;
  } catch (error) {
    console.error('다국어 지원 초기화 실패:', error);
    return false;
  }
}

/**
 * URL 경로에서 언어 코드 감지
   * @returns {string|null} 감지된 언어 코드 또는 null
 */
function detectLanguageFromURL() {
  if (typeof window === 'undefined') return null;
  
  // URL 경로 분석
  const pathParts = window.location.pathname.split('/').filter(p => p);
  
  // 첫 번째 경로 부분이 지원 언어 중 하나인지 확인
  if (pathParts.length > 0 && supportedLanguages.includes(pathParts[0])) {
    return pathParts[0];
    }
    
    return null;
}

/**
 * 지정된 언어로 URL 업데이트
 * @param {string} lang 언어 코드
 * @returns {string} 업데이트된 URL
 */
export function getLocalizedURL(lang) {
  if (typeof window === 'undefined') return '';
  
  const currentURL = window.location.href;
  const currentPath = window.location.pathname;
  const pathParts = currentPath.split('/').filter(p => p);
  
  // 첫 번째 부분이 언어 코드인지 확인
  const hasLangInPath = pathParts.length > 0 && supportedLanguages.includes(pathParts[0]);
  
  // 현재 URL 분석
  const urlObject = new URL(currentURL);
  const pathWithoutLang = hasLangInPath ? 
    '/' + pathParts.slice(1).join('/') : 
    currentPath;
  
  // 기본 언어인 경우 경로에서 언어 코드 제거
  if (lang === defaultLanguage) {
    urlObject.pathname = pathWithoutLang;
    return urlObject.toString();
  }
  
  // 다른 언어인 경우 경로에 언어 코드 추가
  urlObject.pathname = '/' + lang + pathWithoutLang;
  
  return urlObject.toString();
}

/**
 * 현재 페이지의 다른 언어 버전 URL을 반환
 * @param {string} lang 언어 코드
 * @returns {string} 현재 페이지의 다른 언어 URL
 */
export function getAlternateURL(lang) {
  if (typeof window === 'undefined') return '';
  
  return getLocalizedURL(lang);
}

/**
 * 언어 리소스를 로드한다
 * @param {string} lang 언어 코드
 * @returns {Promise<Object>} 언어 리소스
 */
async function loadLanguageResource(lang) {
  // 이미 로드된 경우 재사용
  if (translations[lang]) {
    console.log(`이미 로드된 언어 리소스 사용: ${lang}`);
    return translations[lang];
  }
  
  try {
    console.log(`언어 리소스 로드 중: ${lang}`);
    
    // 요청 URL 생성
    const url = `/assets/i18n/${lang}.json`;
    
    // 리소스 가져오기
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`언어 리소스 로드 실패 (${response.status}): ${lang}`);
    }
    
    // JSON 파싱
    const resource = await response.json();
    
    // 언어 리소스 저장
    translations[lang] = resource;
    loadedLanguages.push(lang);
    
    console.log(`언어 리소스 로드 완료: ${lang}`);
    return resource;
  } catch (error) {
    console.error(`언어 리소스 로드 중 오류: ${lang}`, error);
    
    // 기본 언어가 아닌 경우, 기본 언어 리소스 로드
    if (lang !== defaultLanguage) {
      console.log(`기본 언어(${defaultLanguage}) 리소스 사용`);
      return loadLanguageResource(defaultLanguage);
    }
    
    // 기본 언어 로드 실패 시 빈 객체 반환
    return {};
  }
}

/**
 * 언어 변경
 * @param {string} lang 변경할 언어 코드
 * @returns {Promise<boolean>} 변경 성공 여부
 */
export async function changeLanguage(lang) {
  try {
    // 지원하지 않는 언어인 경우
    if (!supportedLanguages.includes(lang)) {
      console.warn(`지원하지 않는 언어: ${lang}, 기본 언어(${defaultLanguage})로 대체`);
      lang = defaultLanguage;
    }
    
    // 현재 언어와 같으면 무시
    if (lang === currentLanguage) {
      console.log(`이미 ${lang} 언어를 사용 중`);
      return true;
    }
    
    // 언어 리소스 로드
    await loadLanguageResource(lang);
    
    // 현재 언어 변경
    currentLanguage = lang;
    
    // 로컬 스토리지에 저장
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('fileToQR_lang', lang);
    }
    
    // 언어 방향 설정
    setDocumentDirection(lang);
    
    // 페이지 번역 적용
    applyTranslations();
    
    console.log(`언어 변경 완료: ${lang}`);
    return true;
    } catch (error) {
    console.error('언어 변경 실패:', error);
    return false;
  }
}

/**
 * 문서의 방향을 언어에 따라 설정
 * @param {string} lang 언어 코드
 */
function setDocumentDirection(lang) {
  if (typeof document === 'undefined') return;
  
  const dir = isRTL(lang) ? 'rtl' : 'ltr';
  document.documentElement.dir = dir;
  document.body.dir = dir;
  
  // RTL 언어일 경우 RTL 스타일시트 로드
  if (isRTL(lang)) {
    if (!document.getElementById('rtl-stylesheet')) {
      const rtlLink = document.createElement('link');
      rtlLink.id = 'rtl-stylesheet';
      rtlLink.rel = 'stylesheet';
      rtlLink.href = '/assets/css/rtl.css';
      document.head.appendChild(rtlLink);
    }
  } else {
    // LTR 언어일 경우 RTL 스타일시트 제거
    const rtlLink = document.getElementById('rtl-stylesheet');
    if (rtlLink) {
      rtlLink.remove();
    }
  }
}

/**
 * 지정된 언어로 페이지 이동
 * @param {string} lang 이동할 언어 코드
 */
export function navigateToLanguage(lang) {
  try {
    // 지원하지 않는 언어인 경우
    if (!supportedLanguages.includes(lang)) {
      console.warn(`지원하지 않는 언어: ${lang}`);
      return;
    }
    
    console.log(`언어 변경: ${currentLanguage} → ${lang}`);
    
    // URL 유틸리티를 사용하여 다국어 URL 생성
    if (window.FileToQR && window.FileToQR.utils && window.FileToQR.utils.url) {
      const languageUrl = window.FileToQR.utils.url.getLanguageUrl(lang);
      console.log(`이동할 URL: ${languageUrl}`);
      
      // 페이지 이동
      window.location.href = languageUrl;
    } else {
      // 이전 방식: 현재 URL에서 언어 경로 직접 수정
      const currentUrl = window.location.href;
      const alternateUrl = getAlternateURL(lang);
      console.log(`이동할 URL: ${alternateUrl}`);
      
      // 페이지 이동
      window.location.href = alternateUrl;
    }
  } catch (error) {
    console.error('언어 변경 중 오류 발생:', error);
  }
}

/**
 * 페이지의 모든 번역 적용
 */
export function applyTranslations() {
    if (typeof document === 'undefined') return;
    
  // data-i18n 속성이 있는 모든 요소 찾기
  const elements = document.querySelectorAll('[data-i18n]');
  
  elements.forEach(el => {
    const key = el.getAttribute('data-i18n');
    const translated = translate(key);
    
    if (translated) {
      // placeholder 속성이 있는 경우
      if (el.hasAttribute('placeholder')) {
        el.setAttribute('placeholder', translated);
      }
      // title 속성이 있는 경우
      else if (el.hasAttribute('title')) {
        el.setAttribute('title', translated);
      }
      // value 속성이 있는 경우 (input 등)
      else if (el.hasAttribute('value')) {
        el.setAttribute('value', translated);
      }
      // 그 외의 경우 내용 교체
      else {
        el.textContent = translated;
      }
    }
  });
  
  // 이벤트 발생
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('languageChanged', {
      detail: { language: currentLanguage }
    }));
  }
}

/**
 * 메타 태그 업데이트
 */
export function updateMetaTags() {
    if (typeof document === 'undefined') return;
    
  // hreflang 태그 업데이트
  const hreflangTags = document.querySelectorAll('link[rel="alternate"][hreflang]');
  const hasHreflangTags = hreflangTags.length > 0;
  
  if (!hasHreflangTags) {
    // hreflang 태그 없으면 생성
    supportedLanguages.forEach(lang => {
      const link = document.createElement('link');
      link.rel = 'alternate';
      link.hreflang = lang;
      link.href = getAlternateURL(lang);
      document.head.appendChild(link);
    });
    
    // x-default 언어 태그 추가
    const defaultLink = document.createElement('link');
    defaultLink.rel = 'alternate';
    defaultLink.hreflang = 'x-default';
    defaultLink.href = getAlternateURL(defaultLanguage);
    document.head.appendChild(defaultLink);
  }
  
  // 메타 태그 등 업데이트
  updateMetaDescriptions();
}

/**
 * 메타 설명 태그 업데이트
 */
function updateMetaDescriptions() {
  if (typeof document === 'undefined') return;
  
  // 현재 언어의 메타 정보 가져오기
  const metaInfo = translate('meta');
  
  if (!metaInfo) return;
  
  // 제목 업데이트
  if (metaInfo.title) {
    document.title = metaInfo.title;
  }
  
  // 설명 업데이트
  if (metaInfo.description) {
    const descTag = document.querySelector('meta[name="description"]');
    if (descTag) {
      descTag.setAttribute('content', metaInfo.description);
    } else {
      const meta = document.createElement('meta');
      meta.name = 'description';
      meta.content = metaInfo.description;
      document.head.appendChild(meta);
    }
  }
  
  // 키워드 업데이트
  if (metaInfo.keywords) {
    const keywordsTag = document.querySelector('meta[name="keywords"]');
    if (keywordsTag) {
      keywordsTag.setAttribute('content', metaInfo.keywords);
    } else {
      const meta = document.createElement('meta');
      meta.name = 'keywords';
      meta.content = metaInfo.keywords;
      document.head.appendChild(meta);
    }
  }
}

/**
 * 텍스트 번역
 * @param {string} key 번역 키
 * @param {Object} [params={}] 대체 파라미터
 * @param {string} [lang=currentLanguage] 언어 코드
 * @returns {string} 번역된 문자열 또는 키 자체
 */
export function translate(key, params = {}, lang = currentLanguage) {
  if (!key) return '';
  
  // 현재 언어 번역 없으면 기본 언어 사용
  const langData = translations[lang] || translations[defaultLanguage] || {};
  
  // 중첩 키 지원 (예: 'header.title')
  let value = key.split('.').reduce((obj, k) => obj && obj[k], langData);
  
  // 없으면 키 그대로 반환
  if (value === undefined || value === null) {
    console.warn(`번역 키 없음: ${key}`);
    return key;
  }
  
  // 파라미터 대체
  if (params && typeof value === 'string') {
    Object.keys(params).forEach(param => {
      value = value.replace(new RegExp(`{{${param}}}`, 'g'), params[param]);
    });
  }
  
  return value;
}

/**
 * 날짜 형식화
 * @param {Date|string|number} date 날짜 객체 또는 timestamp
 * @param {string} [format='short'] 형식 (short, medium, long, full)
 * @param {string} [lang=currentLanguage] 언어 코드
 * @returns {string} 형식화된 날짜
 */
export function formatDate(date, format = 'short', lang = currentLanguage) {
  if (!date) return '';
  
  try {
    // Date 객체로 변환
    const dateObj = typeof date === 'string' || typeof date === 'number' 
      ? new Date(date) 
      : date;
    
    if (isNaN(dateObj.getTime())) {
      console.warn('유효하지 않은 날짜:', date);
      return String(date);
    }
    
    // Intl API로 날짜 형식화
    const options = {
      short: { year: 'numeric', month: 'numeric', day: 'numeric' },
      medium: { year: 'numeric', month: 'short', day: 'numeric' },
      long: { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' },
      full: { 
        year: 'numeric', month: 'long', day: 'numeric', 
        weekday: 'long', hour: 'numeric', minute: 'numeric' 
      }
    };
    
    return new Intl.DateTimeFormat(getLangLocale(lang), options[format] || options.short).format(dateObj);
  } catch (error) {
    console.error('날짜 형식화 오류:', error);
    return String(date);
  }
}

/**
 * 상대적 시간 표시
 * @param {Date|string|number} date 날짜 객체 또는 timestamp
 * @param {string} [lang=currentLanguage] 언어 코드
 * @returns {string} 상대적 시간 문자열
 */
export function relativeTime(date, lang = currentLanguage) {
  if (!date) return '';
  
  try {
    const dateObj = typeof date === 'string' || typeof date === 'number' 
      ? new Date(date) 
      : date;
    
    if (isNaN(dateObj.getTime())) {
      console.warn('유효하지 않은 날짜:', date);
      return String(date);
    }
    
    const now = new Date();
    const diff = now.getTime() - dateObj.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const months = Math.floor(days / 30);
    const years = Math.floor(months / 12);
    
    // 상대적 시간을 위한 번역 키
    const timeKeys = {
      justNow: 'time.just_now',
      minutesAgo: 'time.minutes_ago',
      hoursAgo: 'time.hours_ago',
      daysAgo: 'time.days_ago',
      monthsAgo: 'time.months_ago',
      yearsAgo: 'time.years_ago'
    };
    
    if (seconds < 60) {
      return translate(timeKeys.justNow, {}, lang);
    } else if (minutes < 60) {
      return translate(timeKeys.minutesAgo, { count: minutes }, lang);
    } else if (hours < 24) {
      return translate(timeKeys.hoursAgo, { count: hours }, lang);
    } else if (days < 30) {
      return translate(timeKeys.daysAgo, { count: days }, lang);
    } else if (months < 12) {
      return translate(timeKeys.monthsAgo, { count: months }, lang);
    } else {
      return translate(timeKeys.yearsAgo, { count: years }, lang);
    }
  } catch (error) {
    console.error('상대적 시간 계산 오류:', error);
    return String(date);
  }
}

/**
 * 언어 코드에 맞는 로케일 문자열 반환
 * @param {string} lang 언어 코드
 * @returns {string} 로케일 문자열
 */
function getLangLocale(lang) {
  const localeMap = {
    ko: 'ko-KR',
    en: 'en-US',
    zh: 'zh-CN',
    ja: 'ja-JP',
    ar: 'ar-SA',
    he: 'he-IL'
  };
  
  return localeMap[lang] || lang;
}

/**
 * 복수형 문자열 반환
 * @param {string} key 번역 키
 * @param {number} count 수량
 * @param {string} [lang=currentLanguage] 언어 코드
 * @returns {string} 복수형 문자열
 */
export function plural(key, count, lang = currentLanguage) {
  if (!key) return '';
  
  const langData = translations[lang] || translations[defaultLanguage] || {};
  
  // 중첩 키 객체 찾기
  const keyObj = key.split('.').reduce((obj, k) => obj && obj[k], langData);
  
  if (!keyObj || typeof keyObj !== 'object') {
    console.warn(`복수형 키 없음: ${key}`);
    return key;
  }
  
  // 언어별 복수형 규칙
  let form = 'other';
  
  // 한국어, 일본어, 중국어: 복수형 구분 없음
  if (['ko', 'ja', 'zh'].includes(lang)) {
    form = 'other';
  }
  // 영어: 1=one, 그 외=other
  else if (lang === 'en') {
    form = count === 1 ? 'one' : 'other';
  }
  // 아랍어: 복잡한 복수형 규칙
  else if (lang === 'ar') {
    if (count === 0) form = 'zero';
    else if (count === 1) form = 'one';
    else if (count === 2) form = 'two';
    else if (count >= 3 && count <= 10) form = 'few';
    else if (count >= 11 && count <= 99) form = 'many';
    else form = 'other';
  }
  
  // 해당 복수형이 있으면 사용, 없으면 other, 그것도 없으면 키 그대로
  return keyObj[form] || keyObj.other || key;
}

// 모듈 기본 내보내기
export default {
  init,
  translate,
  changeLanguage,
  formatDate,
  relativeTime,
  plural,
  getCurrentLang,
  getDefaultLang,
  getSupportedLangs,
  isRTL,
  getDirectionForLang,
  applyTranslations,
  updateMetaTags,
  getLocalizedURL,
  getAlternateURL,
  navigateToLanguage
}; 