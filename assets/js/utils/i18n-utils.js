/**
 * i18n-utils.js - FileToQR 다국어 지원 유틸리티
 * 버전: 1.0.0
 * 최종 업데이트: 2025-07-15
 * 
 * 이 모듈은 FileToQR 웹사이트의 다국어 지원 기능을 제공합니다.
 * - 언어 감지 및 설정
 * - 번역 로드 및 적용
 * - 템플릿과 함께 사용할 수 있는 헬퍼 함수
 */

import { Promise } from 'es6-promise-polyfill';
import PathUtils from './path-utils.js';

/**
 * FileToQR 다국어 지원 모듈
 */
const I18nUtils = {
  /**
   * 현재 설정된 언어 코드
   * @type {string}
   */
  currentLang: 'ko',

  /**
   * 지원하는 언어 목록
   * @type {Array<string>}
   */
  supportedLangs: ['ko', 'en', 'zh', 'ja'],

  /**
   * 번역 데이터 저장소
   * @type {Object}
   * @private
   */
  _translations: {},

  /**
   * RTL 방향 사용 언어 목록
   * @type {Array<string>}
   */
  rtlLangs: ['ar', 'he', 'fa', 'ur'],

  /**
   * 기본 언어 코드
   * @type {string}
   */
  defaultLang: 'ko',

  /**
   * 언어 로케일 매핑
   * @type {Object}
   */
  langLocales: {
    'ko': 'ko-KR',
    'en': 'en-US',
    'zh': 'zh-CN',
    'ja': 'ja-JP'
  },

  /**
   * i18n 유틸리티 초기화
   * @param {Object} options - 초기화 옵션
   * @param {string} [options.defaultLang='ko'] - 기본 언어
   * @param {Array<string>} [options.supportedLangs=['ko', 'en', 'zh', 'ja']] - 지원하는 언어 배열
   * @param {boolean} [options.detectBrowserLang=true] - 브라우저 언어 자동 감지 여부
   * @param {boolean} [options.useSavedLang=true] - 저장된 언어 사용 여부
   * @returns {Promise<void>} 초기화 완료 Promise
   */
  async init(options = {}) {
    this.defaultLang = options.defaultLang || 'ko';
    this.supportedLangs = options.supportedLangs || ['ko', 'en', 'zh', 'ja'];
    const detectBrowserLang = options.detectBrowserLang !== false;
    const useSavedLang = options.useSavedLang !== false;
    
    // 1. 로컬 스토리지에서 저장된 언어 확인
    let userLang = null;
    if (useSavedLang) {
      userLang = this.getSavedLanguage();
    }
    
    // 2. 저장된 언어가 없으면 브라우저 언어 감지
    if (!userLang && detectBrowserLang) {
      userLang = this.detectBrowserLanguage();
    }
    
    // 3. 유효한 언어가 없으면 기본 언어 사용
    if (!this.isValidLanguage(userLang)) {
      userLang = this.defaultLang;
    }
    
    // 4. 언어 설정 및 번역 데이터 로드
    await this.setLanguage(userLang);
    
    // 5. 초기 페이지에 번역 적용
    this.applyTranslations();
    
    // 6. RTL 지원 설정
    this.applyTextDirection();
    
    console.log(`i18n 유틸리티 초기화 완료. 현재 언어: ${this.currentLang}`);
    
    return Promise.resolve();
  },

  /**
   * 로컬 스토리지에서 저장된 언어 불러오기
   * @returns {string|null} 저장된 언어 코드 또는 null
   * @private
   */
  getSavedLanguage() {
    if (typeof window !== 'undefined' && window.localStorage) {
      return localStorage.getItem('fileToQR_lang');
    }
    return null;
  },

  /**
   * 브라우저 언어 감지 (지원하는 언어 중에서 가장 적합한 것 선택)
   * @returns {string|null} 감지된 언어 코드 또는 null
   * @private
   */
  detectBrowserLanguage() {
    if (typeof window === 'undefined' || !window.navigator) {
      return null;
    }
    
    // 브라우저 언어 가져오기
    const browserLang = (navigator.language || navigator.userLanguage || '').toLowerCase();
    
    // 완전 일치 확인
    if (this.supportedLangs.includes(browserLang)) {
      return browserLang;
    }
    
    // 부분 일치 확인 (예: en-US -> en)
    const langPrefix = browserLang.split('-')[0];
    if (this.supportedLangs.includes(langPrefix)) {
      return langPrefix;
    }
    
    return null;
  },

  /**
   * 언어 코드가 지원되는지 확인
   * @param {string} lang - 언어 코드
   * @returns {boolean} 지원되는 언어인지 여부
   * @private
   */
  isValidLanguage(lang) {
    return lang !== null && this.supportedLangs.includes(lang);
  },

  /**
   * 언어 설정 및 번역 데이터 로드
   * @param {string} lang - 언어 코드
   * @returns {Promise<Object>} 번역 데이터 Promise
   */
  async setLanguage(lang) {
    if (!this.isValidLanguage(lang)) {
      console.warn(`지원되지 않는 언어: ${lang}, 기본 언어를 사용합니다: ${this.defaultLang}`);
      lang = this.defaultLang;
    }
    
    try {
      // 번역 데이터가 이미 로드되어 있는지 확인
      if (!this._translations[lang]) {
        // 번역 데이터 로드
        const translations = await this.loadTranslations(lang);
        this._translations[lang] = translations;
      }
      
      // 현재 언어 업데이트
      this.currentLang = lang;
      
      // 로컬 스토리지에 언어 저장
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('fileToQR_lang', lang);
      }
      
      // RTL 적용
      this.applyTextDirection();
      
      // 현재 페이지에 번역 적용
      this.applyTranslations();
      
      // 이벤트 발생
      this.dispatchLanguageChangeEvent(lang);
      
      console.log(`언어 변경됨: ${lang}`);
      
      return this._translations[lang];
    } catch (error) {
      console.error(`언어 설정 중 오류 발생: ${error.message}`);
      return Promise.reject(error);
    }
  },

  /**
   * 언어 변경 이벤트 디스패치
   * @param {string} lang - 변경된 언어 코드
   * @private
   */
  dispatchLanguageChangeEvent(lang) {
    if (typeof window !== 'undefined' && typeof window.CustomEvent === 'function') {
      const event = new CustomEvent('languageChange', {
        detail: {
          language: lang,
          translations: this._translations[lang]
        }
      });
      window.dispatchEvent(event);
    }
  },

  /**
   * 번역 데이터 로드
   * @param {string} lang - 언어 코드
   * @returns {Promise<Object>} 번역 데이터 Promise
   * @private
   */
  async loadTranslations(lang) {
    try {
      console.log(`${lang} 언어 번역 데이터 로드 중...`);
      
      // 다양한 가능성 있는 경로 패턴 시도
      const langFilePaths = [
        `/assets/i18n/${lang}.json`,
        `assets/i18n/${lang}.json`,
        `./assets/i18n/${lang}.json`,
        `../assets/i18n/${lang}.json`
      ];
      
      // 파일 로드 시도
      let response = null;
      let translationData = null;
      
      for (const path of langFilePaths) {
        try {
          response = await fetch(path);
          if (response.ok) {
            translationData = await response.json();
            console.log(`번역 데이터 로드 성공: ${path}`);
            break;
          }
        } catch (err) {
          console.warn(`경로에서 번역 파일 로드 실패: ${path}`);
        }
      }
      
      // 모든 경로 시도 실패
      if (!translationData) {
        console.error(`언어 ${lang}에 대한 번역 파일을 로드할 수 없습니다.`);
        throw new Error(`Translation file for ${lang} not found`);
      }
      
      return translationData;
    } catch (error) {
      console.error(`번역 데이터 로드 실패: ${error.message}`);
      throw error;
    }
  },

  /**
   * 텍스트 방향 적용 (LTR/RTL)
   * @private
   */
  applyTextDirection() {
    if (typeof document === 'undefined') return;
    
    // 현재 언어에 따라 텍스트 방향 설정
    const isRtl = this.rtlLangs.includes(this.currentLang);
    const dir = isRtl ? 'rtl' : 'ltr';
    
    // HTML 요소에 dir 속성 설정
    document.documentElement.setAttribute('dir', dir);
    document.documentElement.setAttribute('lang', this.currentLang);
    
    // RTL 클래스 추가/제거
    if (isRtl) {
      document.documentElement.classList.add('rtl');
    } else {
      document.documentElement.classList.remove('rtl');
    }
    
    console.log(`텍스트 방향 설정: ${dir}`);
  },

  /**
   * 현재 언어로 페이지의 번역 적용
   * data-i18n 속성이 있는 요소에 번역 적용
   */
  applyTranslations() {
    if (typeof document === 'undefined') return;
    
    const translations = this._translations[this.currentLang];
    if (!translations) {
      console.warn(`현재 언어(${this.currentLang})의 번역 데이터가 없습니다.`);
      return;
    }
    
    // data-i18n 속성이 있는 모든 요소에 번역 적용
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(element => {
      const key = element.getAttribute('data-i18n');
      const value = this.getTranslation(key);
      
      if (value) {
        // HTML 속성에 따라 번역 적용
        if (element.tagName === 'INPUT' && element.type === 'placeholder') {
          element.placeholder = value;
        } else if (element.tagName === 'META' && element.name === 'description') {
          element.content = value;
        } else if (element.tagName === 'IMG' && element.hasAttribute('alt')) {
          element.alt = value;
        } else {
          element.textContent = value;
        }
      }
    });
    
    // data-i18n-attr 속성이 있는 모든 요소에 속성 번역 적용
    // 형식: data-i18n-attr="title:common.actions.close"
    const attrElements = document.querySelectorAll('[data-i18n-attr]');
    attrElements.forEach(element => {
      const attrValue = element.getAttribute('data-i18n-attr');
      if (!attrValue || !attrValue.includes(':')) return;
      
      // 속성과 키 분리
      const [attr, key] = attrValue.split(':');
      if (!attr || !key) return;
      
      const value = this.getTranslation(key);
      if (value) {
        element.setAttribute(attr, value);
      }
    });
    
    console.log('페이지에 번역 적용 완료');
  },

  /**
   * 번역 키에 해당하는 번역 가져오기
   * @param {string} key - 번역 키 (예: 'common.actions.save')
   * @param {Object} [params] - 치환할 파라미터
   * @returns {string} 번역된 문자열 또는 키 자체
   */
  getTranslation(key, params = {}) {
    const translations = this._translations[this.currentLang];
    if (!translations) {
      return key;
    }
    
    // 점 표기법으로 중첩된 객체 접근
    const keys = key.split('.');
    let value = translations;
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        console.warn(`번역 키 찾을 수 없음: ${key}`);
        return key;
      }
    }
    
    // 문자열이 아닌 경우
    if (typeof value !== 'string') {
      console.warn(`번역 값이 문자열이 아닙니다: ${key}`);
      return key;
    }
    
    // 파라미터 치환
    let result = value;
    if (params && Object.keys(params).length > 0) {
      Object.keys(params).forEach(paramKey => {
        const paramValue = params[paramKey];
        result = result.replace(new RegExp(`{{${paramKey}}}`, 'g'), paramValue);
      });
    }
    
    return result;
  },

  /**
   * 번역 함수 (단축 별칭)
   * @param {string} key - 번역 키
   * @param {Object} [params] - 치환할 파라미터
   * @returns {string} 번역된 문자열
   */
  t(key, params) {
    return this.getTranslation(key, params);
  },

  /**
   * 날짜 포맷팅 (국제화)
   * @param {Date|string|number} date - 포맷팅할 날짜 (Date 객체, ISO 문자열, 타임스탬프)
   * @param {Object} options - 포맷팅 옵션
   * @param {string} [options.format='medium'] - 미리 정의된 포맷 (short, medium, long, full)
   * @param {string} [options.locale] - 특정 로케일 지정 (지정하지 않으면 현재 언어 사용)
   * @param {Object} [options.formatOptions] - Intl.DateTimeFormat 옵션 직접 지정
   * @returns {string} 포맷팅된 날짜 문자열
   */
  formatDate(date, options = {}) {
    // 날짜 객체로 변환
    let dateObj;
    if (date instanceof Date) {
      dateObj = date;
    } else if (typeof date === 'string' || typeof date === 'number') {
      dateObj = new Date(date);
    } else {
      dateObj = new Date();
    }
    
    if (isNaN(dateObj.getTime())) {
      console.error('유효하지 않은 날짜:', date);
      return String(date);
    }
    
    // 로케일 설정
    const locale = options.locale || this.langLocales[this.currentLang] || this.currentLang;
    
    // 미리 정의된 포맷 스타일
    const presetFormats = {
      short: { dateStyle: 'short' },
      medium: { dateStyle: 'medium' },
      long: { dateStyle: 'long' },
      full: { dateStyle: 'full' },
      shortTime: { timeStyle: 'short' },
      mediumTime: { timeStyle: 'medium' },
      longTime: { timeStyle: 'long' },
      shortDateTime: { dateStyle: 'short', timeStyle: 'short' },
      mediumDateTime: { dateStyle: 'medium', timeStyle: 'short' },
      longDateTime: { dateStyle: 'long', timeStyle: 'medium' },
      fullDateTime: { dateStyle: 'full', timeStyle: 'long' }
    };
    
    // 포맷 옵션 설정
    let formatOptions;
    if (options.formatOptions) {
      // 직접 옵션 지정
      formatOptions = options.formatOptions;
    } else if (options.format && presetFormats[options.format]) {
      // 미리 정의된 포맷 사용
      formatOptions = presetFormats[options.format];
    } else {
      // 기본 포맷 (중간 길이)
      formatOptions = presetFormats.medium;
    }
    
    // Intl API 사용하여 포맷팅
    try {
      const formatter = new Intl.DateTimeFormat(locale, formatOptions);
      return formatter.format(dateObj);
    } catch (error) {
      console.error('날짜 포맷팅 오류:', error);
      return String(date);
    }
  },

  /**
   * 숫자 포맷팅 (국제화)
   * @param {number} number - 포맷팅할 숫자
   * @param {Object} options - 포맷팅 옵션
   * @param {string} [options.style='decimal'] - 스타일 (decimal, currency, percent, unit)
   * @param {string} [options.currency] - 통화 코드 (예: 'KRW', 'USD')
   * @param {string} [options.locale] - 특정 로케일 지정
   * @param {Object} [options.formatOptions] - Intl.NumberFormat 옵션 직접 지정
   * @returns {string} 포맷팅된 숫자 문자열
   */
  formatNumber(number, options = {}) {
    if (isNaN(number)) {
      console.error('유효하지 않은 숫자:', number);
      return String(number);
    }
    
    // 로케일 설정
    const locale = options.locale || this.langLocales[this.currentLang] || this.currentLang;
    
    // 미리 정의된 포맷 스타일
    const presetFormats = {
      decimal: { style: 'decimal' },
      percent: { style: 'percent' },
      currency: { style: 'currency', currency: options.currency || 'USD' },
      compact: { notation: 'compact' },
      scientific: { notation: 'scientific' },
      // 파일 크기 포맷팅을 위한 옵션
      bytes: { style: 'unit', unit: 'byte', unitDisplay: 'narrow' },
    };
    
    // 포맷 옵션 설정
    let formatOptions;
    if (options.formatOptions) {
      // 직접 옵션 지정
      formatOptions = options.formatOptions;
    } else if (options.style && presetFormats[options.style]) {
      // 미리 정의된 포맷 사용
      formatOptions = presetFormats[options.style];
    } else {
      // 기본 십진수 포맷
      formatOptions = presetFormats.decimal;
    }
    
    // 추가 옵션 병합
    if (options.minimumFractionDigits !== undefined) {
      formatOptions.minimumFractionDigits = options.minimumFractionDigits;
    }
    if (options.maximumFractionDigits !== undefined) {
      formatOptions.maximumFractionDigits = options.maximumFractionDigits;
    }
    
    // Intl API 사용하여 포맷팅
    try {
      const formatter = new Intl.NumberFormat(locale, formatOptions);
      return formatter.format(number);
    } catch (error) {
      console.error('숫자 포맷팅 오류:', error);
      return String(number);
    }
  },

  /**
   * 상대적 시간 포맷팅 (예: '3일 전', '2분 후')
   * @param {Date|string|number} date - 포맷팅할 날짜/시간
   * @param {Object} options - 포맷팅 옵션
   * @param {Date|string|number} [options.relativeTo=now] - 기준 시간 (기본값: 현재)
   * @param {string} [options.locale] - 특정 로케일 지정
   * @param {Object} [options.formatOptions] - Intl.RelativeTimeFormat 옵션
   * @returns {string} 상대적 시간 문자열
   */
  formatRelativeTime(date, options = {}) {
    // 날짜 객체로 변환
    let dateObj;
    if (date instanceof Date) {
      dateObj = date;
    } else if (typeof date === 'string' || typeof date === 'number') {
      dateObj = new Date(date);
    } else {
      return '';
    }
    
    if (isNaN(dateObj.getTime())) {
      console.error('유효하지 않은 날짜:', date);
      return String(date);
    }
    
    // 기준 시간 설정
    let relativeToObj;
    const relativeTo = options.relativeTo || new Date();
    if (relativeTo instanceof Date) {
      relativeToObj = relativeTo;
    } else if (typeof relativeTo === 'string' || typeof relativeTo === 'number') {
      relativeToObj = new Date(relativeTo);
    } else {
      relativeToObj = new Date();
    }
    
    // 로케일 설정
    const locale = options.locale || this.langLocales[this.currentLang] || this.currentLang;
    
    // 기본 포맷 옵션
    const formatOptions = Object.assign({
      numeric: 'auto',
      style: 'long'
    }, options.formatOptions || {});
    
    // 시간차 계산 (밀리초)
    const diff = dateObj.getTime() - relativeToObj.getTime();
    
    // 적절한 시간 단위 선택
    let unit, value;
    
    const SECOND = 1000;
    const MINUTE = 60 * SECOND;
    const HOUR = 60 * MINUTE;
    const DAY = 24 * HOUR;
    const WEEK = 7 * DAY;
    const MONTH = 30 * DAY;
    const YEAR = 365 * DAY;
    
    if (Math.abs(diff) < MINUTE) {
      unit = 'second';
      value = Math.round(diff / SECOND);
    } else if (Math.abs(diff) < HOUR) {
      unit = 'minute';
      value = Math.round(diff / MINUTE);
    } else if (Math.abs(diff) < DAY) {
      unit = 'hour';
      value = Math.round(diff / HOUR);
    } else if (Math.abs(diff) < WEEK) {
      unit = 'day';
      value = Math.round(diff / DAY);
    } else if (Math.abs(diff) < MONTH) {
      unit = 'week';
      value = Math.round(diff / WEEK);
    } else if (Math.abs(diff) < YEAR) {
      unit = 'month';
      value = Math.round(diff / MONTH);
    } else {
      unit = 'year';
      value = Math.round(diff / YEAR);
    }
    
    // Intl API 사용하여 포맷팅
    try {
      const formatter = new Intl.RelativeTimeFormat(locale, formatOptions);
      return formatter.format(value, unit);
    } catch (error) {
      console.error('상대 시간 포맷팅 오류:', error);
      
      // 폴백: 기본 포맷팅된 날짜 반환
      return this.formatDate(date);
    }
  },

  /**
   * 다국어 지원 메타 태그 업데이트
   * SEO 및 공유를 위한 태그들 업데이트
   */
  updateMetaTags() {
    if (typeof document === 'undefined') return;
    
    const title = this.t('common.title');
    const description = this.t('common.description');
    
    // 타이틀 업데이트
    document.title = title;
    
    // 메타 설명 업데이트
    let metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', description);
    } else {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      metaDesc.setAttribute('content', description);
      document.head.appendChild(metaDesc);
    }
    
    // Open Graph 및 Twitter 카드 태그 업데이트
    const metaTags = {
      'og:title': title,
      'og:description': description,
      'twitter:title': title,
      'twitter:description': description
    };
    
    // 각 메타 태그 업데이트
    Object.keys(metaTags).forEach(key => {
      let meta = document.querySelector(`meta[property="${key}"]`);
      if (!meta) {
        meta = document.querySelector(`meta[name="${key}"]`);
      }
      
      if (meta) {
        meta.setAttribute('content', metaTags[key]);
      }
    });
    
    // hreflang 태그 추가/업데이트
    this.updateHreflangTags();
    
    console.log('메타 태그 업데이트 완료');
  },

  /**
   * hreflang 태그 업데이트 (언어별 URL 제공)
   * @private
   */
  updateHreflangTags() {
    if (typeof document === 'undefined') return;
    
    // 기존 hreflang 태그 제거
    const existingTags = document.querySelectorAll('link[rel="alternate"][hreflang]');
    existingTags.forEach(tag => tag.parentNode.removeChild(tag));
    
    // 현재 페이지 파일명 가져오기
    const currentPage = this.getCurrentPageFilename();
    
    // 베이스 URL (언어 없는 버전)
    const baseUrl = window.location.origin;
    
    // 새 hreflang 태그 생성
    const head = document.querySelector('head');
    
    // 지원하는 각 언어에 대한 hreflang 태그 추가
    this.supportedLangs.forEach(lang => {
      const link = document.createElement('link');
      link.rel = 'alternate';
      link.hreflang = lang;
      
      // 기본 언어는 별도 경로 세그먼트 없이 설정 가능 (설정에 따라)
      const langPath = (lang === this.defaultLang && !this.alwaysIncludeDefaultLang) 
        ? currentPage 
        : `/${lang}/${currentPage}`;
      
      link.href = `${baseUrl}${langPath}`;
      head.appendChild(link);
    });
    
    // x-default hreflang 태그 추가 (보통 기본 언어 페이지로 설정)
    const defaultLink = document.createElement('link');
    defaultLink.rel = 'alternate';
    defaultLink.hreflang = 'x-default';
    defaultLink.href = `${baseUrl}/${currentPage}`;
    head.appendChild(defaultLink);
  },

  /**
   * URL에서 언어 코드 부분 제거
   * @param {string} url - URL 경로
   * @returns {string} 언어 코드가 제거된 URL
   * @private
   */
  removeLanguageFromUrl(url) {
    const parsedUrl = new URL(url, window.location.origin);
    const pathSegments = parsedUrl.pathname.split('/').filter(segment => segment);
    
    // 첫 번째 세그먼트가 지원하는 언어 코드인지 확인
    if (pathSegments.length > 0 && this.supportedLangs.includes(pathSegments[0])) {
      // 언어 세그먼트 제거
      pathSegments.shift();
      
      // 새 경로 생성
      let newPath = '/' + pathSegments.join('/');
      if (newPath === '/') {
        newPath = '/index.html';
      } else if (!newPath.endsWith('.html')) {
        newPath = newPath + '.html';
      }
      
      parsedUrl.pathname = newPath;
    }
    
    return parsedUrl.toString();
  },

  /**
   * URL에서 언어 코드 추출
   * @param {string} url - 처리할 URL
   * @returns {string|null} URL에서 추출한 언어 코드 또는 null
   */
  getLanguageFromUrl(url) {
    const parsedUrl = new URL(url, window.location.origin);
    const pathSegments = parsedUrl.pathname.split('/').filter(segment => segment);
    
    // 첫 번째 세그먼트가 지원하는 언어 코드인지 확인
    if (pathSegments.length > 0 && this.supportedLangs.includes(pathSegments[0])) {
      return pathSegments[0];
    }
    
    return null;
  },

  /**
   * 현재 언어에 맞는 URL 생성
   * @param {string} path - 기본 경로 (예: 'about.html')
   * @param {string} [lang] - 언어 코드 (기본값: 현재 언어)
   * @returns {string} 지역화된 URL
   */
  getLocalizedUrl(path, lang) {
    const targetLang = lang || this.currentLang;
    
    // 기본 경로 정규화
    let normalizedPath = path;
    if (!normalizedPath.startsWith('/')) {
      normalizedPath = '/' + normalizedPath;
    }
    
    // 이미 언어 코드가 포함된 경로인지 확인하고 제거
    const pathSegments = normalizedPath.split('/').filter(segment => segment);
    if (pathSegments.length > 0 && this.supportedLangs.includes(pathSegments[0])) {
      pathSegments.shift();
      normalizedPath = '/' + pathSegments.join('/');
    }
    
    // 기본 언어인 경우 언어 경로 세그먼트 생략 (선택적)
    if (targetLang === this.defaultLang && !this.alwaysIncludeDefaultLang) {
      return normalizedPath;
    }
    
    // 언어 코드 추가
    return `/${targetLang}${normalizedPath}`;
  },

  /**
   * URL 구조를 기반으로 현재 페이지 파일명 가져오기
   * @returns {string} 현재 페이지 파일명 (예: 'index.html')
   */
  getCurrentPageFilename() {
    const path = window.location.pathname;
    const pathSegments = path.split('/').filter(segment => segment);
    
    // 경로가 비어있거나 '/'로 끝나는 경우 'index.html' 반환
    if (pathSegments.length === 0 || path.endsWith('/')) {
      return 'index.html';
    }
    
    // 마지막 세그먼트 가져오기
    const lastSegment = pathSegments[pathSegments.length - 1];
    
    // 파일 확장자가 없는 경우 '.html' 추가
    if (!lastSegment.includes('.')) {
      return lastSegment + '.html';
    }
    
    return lastSegment;
  },

  /**
   * 고급 브라우저 언어 감지
   * 브라우저 설정, URL, localStorage를 모두 고려하여 최적의 언어 감지
   * @returns {string} 감지된 언어 코드
   */
  detectPreferredLanguage() {
    // 1. URL에서 언어 확인
    const urlLang = this.getLanguageFromUrl(window.location.href);
    if (this.isValidLanguage(urlLang)) {
      return urlLang;
    }
    
    // 2. localStorage에서 저장된 언어 확인
    const savedLang = this.getSavedLanguage();
    if (this.isValidLanguage(savedLang)) {
      return savedLang;
    }
    
    // 3. 브라우저 선호 언어 목록 확인
    if (typeof window !== 'undefined' && window.navigator) {
      // navigator.languages: 사용자 선호 언어 배열 (최신 브라우저)
      if (navigator.languages && navigator.languages.length) {
        for (const lang of navigator.languages) {
          const langCode = lang.split('-')[0].toLowerCase();
          if (this.supportedLangs.includes(langCode)) {
            return langCode;
          }
        }
      }
      
      // navigator.language: 사용자 기본 언어 (대부분의 브라우저)
      if (navigator.language) {
        const langCode = navigator.language.split('-')[0].toLowerCase();
        if (this.supportedLangs.includes(langCode)) {
          return langCode;
        }
      }
      
      // navigator.userLanguage, navigator.browserLanguage: IE용 (레거시)
      const fallbackLang = (navigator.userLanguage || navigator.browserLanguage || '').split('-')[0].toLowerCase();
      if (this.supportedLangs.includes(fallbackLang)) {
        return fallbackLang;
      }
    }
    
    // 4. 유효한 언어를 찾지 못한 경우 기본 언어 반환
    return this.defaultLang;
  },

  /**
   * 문서의 언어 속성 및 방향 업데이트
   */
  updateDocumentLanguage() {
    if (typeof document === 'undefined') return;
    
    // 문서의 lang 속성 업데이트
    document.documentElement.lang = this.currentLang;
    
    // RTL 언어인 경우 dir 속성 설정
    const isRTL = this.rtlLangs.includes(this.currentLang);
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    
    // 루트에 데이터 속성 추가
    document.documentElement.setAttribute('data-language', this.currentLang);
  },

  /**
   * 언어 변경 후 필요한 모든 업데이트 수행
   * @private
   */
  _performLanguageChangeUpdates() {
    // 문서 언어 및 방향 업데이트
    this.updateDocumentLanguage();
    
    // HTML 메타데이터 업데이트
    this.updateMetaTags();
    
    // hreflang 태그 업데이트
    this.updateHreflangTags();
    
    // 페이지 콘텐츠 번역 적용
    this.applyTranslations();
  },

  /**
   * 언어 변경 후 필요한 모든 업데이트 수행
   * @private
   */
  _performLanguageChangeUpdates() {
    // 문서 언어 및 방향 업데이트
    this.updateDocumentLanguage();
    
    // HTML 메타데이터 업데이트
    this.updateMetaTags();
    
    // hreflang 태그 업데이트
    this.updateHreflangTags();
    
    // 페이지 콘텐츠 번역 적용
    this.applyTranslations();
  }
};

// 글로벌 네임스페이스에 등록
if (typeof window !== 'undefined') {
  window.FileToQR = window.FileToQR || {};
  window.FileToQR.i18n = I18nUtils;
  
  // 단축 함수 등록
  window.t = function(key, params) {
    return I18nUtils.t(key, params);
  };
}

export default I18nUtils; 