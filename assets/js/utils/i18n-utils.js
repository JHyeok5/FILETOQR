/**
 * i18n-utils.js - FileToQR 다국어 지원 유틸리티
 * 버전: 1.2.0
 * 최종 업데이트: 2025-07-20
 * 
 * 이 모듈은 다국어 지원 관련 유틸리티 함수를 제공합니다.
 * - 언어 코드 감지 및 관리
 * - 텍스트 번역
 * - 다국어 경로 처리
 */

// 의존성
import UrlUtils from './url-utils.js';

// 전역 객체 설정
window.FileToQR = window.FileToQR || {};
window.FileToQR.i18n = window.FileToQR.i18n || {};

/**
 * 중첩 객체에서 dot notation(예: 'tips.scan.desc')으로 값 탐색
 * @param {Object} obj - 탐색할 객체
 * @param {string} path - 'a.b.c' 형태의 경로
 * @returns {*} 탐색된 값 또는 undefined
 */
function getNested(obj, path) {
  return path.split('.').reduce((o, k) => (o || {})[k], obj);
}

/**
 * 다국어 지원(i18n) 유틸리티 모듈
 */
const I18nUtils = {
  // 내부 상태
  state: {
    currentLang: '',
    translations: {},
    defaultLang: 'ko',
    supportedLangs: ['ko', 'en', 'zh', 'ja'],
    isLoaded: false
  },
  
  /**
   * i18n 초기화 함수
   * @param {Object} [options={}] - 초기화 옵션
   * @returns {Promise<boolean>} 초기화 성공 여부
   */
  async init(options = {}) {
    try {
      console.log('i18n 초기화 시작:', options);
      
      // 구성 옵션 설정
      const defaultOptions = {
        defaultLang: window.FileToQR.config.LANGUAGE_CONFIG.defaultLanguage || 'ko',
        supportedLangs: window.FileToQR.config.LANGUAGE_CONFIG.supportedLanguages || ['ko', 'en', 'zh', 'ja'],
        loadTranslations: true,
        updateElements: true
      };
      
      const opts = { ...defaultOptions, ...options };
      
      // 내부 상태 업데이트
      this.state.defaultLang = opts.defaultLang;
      this.state.supportedLangs = opts.supportedLangs;
      
      // 현재 언어 감지 (URL에서 언어 코드 추출)
      this.detectCurrentLanguage();
      console.log('감지된 현재 언어:', this.state.currentLang);
      
      // 번역 데이터 로드
      if (opts.loadTranslations) {
        await this.loadTranslations();
      }
      
      // 페이지 요소 번역 적용
      if (opts.updateElements) {
        this.updatePageElements();
      }
      
      // 상태 표시: 초기화 완료
      this.state.isLoaded = true;
      console.log('i18n 초기화 완료');
      
      return true;
    } catch (error) {
      console.error('i18n 초기화 오류:', error);
      return false;
    }
  },
  
  /**
   * 현재 언어 감지 및 설정
   * 우선순위: URL 매개변수 > URL 경로 > 저장된 설정 > 브라우저 설정 > 기본값
   */
  detectCurrentLanguage() {
    try {
      let detectedLang = null;
      
      // 1. URL 매개변수에서 언어 코드 확인 (예: ?lang=ko)
      const urlParams = new URLSearchParams(window.location.search);
      const paramLang = urlParams.get('lang');
      
      if (paramLang && this.state.supportedLangs.includes(paramLang)) {
        detectedLang = paramLang;
        console.log('URL 매개변수에서 언어 감지:', detectedLang);
      }
      
      // 2. URL 경로에서 언어 코드 확인 (예: /ko/index.html)
      if (!detectedLang) {
        const pathLang = UrlUtils.getLanguageFromUrl();
        if (pathLang && this.state.supportedLangs.includes(pathLang)) {
          detectedLang = pathLang;
          console.log('URL 경로에서 언어 감지:', detectedLang);
        }
      }
      
      // 3. 로컬 스토리지에서 언어 설정 확인
      if (!detectedLang) {
        const storedLang = localStorage.getItem('filetoqr_language');
        if (storedLang && this.state.supportedLangs.includes(storedLang)) {
          detectedLang = storedLang;
          console.log('저장된 설정에서 언어 감지:', detectedLang);
        }
      }
      
      // 4. 브라우저 설정 확인
      if (!detectedLang) {
        const browserLang = navigator.language.split('-')[0];
        if (this.state.supportedLangs.includes(browserLang)) {
          detectedLang = browserLang;
          console.log('브라우저 설정에서 언어 감지:', detectedLang);
        }
      }
      
      // 5. 감지된 언어가 없으면 기본 언어 사용
      if (!detectedLang) {
        detectedLang = this.state.defaultLang;
        console.log('기본 언어 사용:', detectedLang);
      }
      
      // 감지된 언어 설정
      this.state.currentLang = detectedLang;
      localStorage.setItem('filetoqr_language', detectedLang);
      document.documentElement.lang = detectedLang;
      
      // 언어에 따른 텍스트 방향 설정
      const isRTL = ['ar', 'he', 'fa', 'ur'].includes(detectedLang);
      document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
      
      return detectedLang;
    } catch (error) {
      console.error('언어 감지 중 오류:', error);
      // 오류 발생 시 기본 언어 사용
      this.state.currentLang = this.state.defaultLang;
      return this.state.defaultLang;
    }
  },
  
  /**
   * 현재 언어 가져오기
   * @returns {string} 현재 언어 코드
   */
  getCurrentLang() {
    return this.state.currentLang || this.state.defaultLang;
  },
  
  /**
   * 현재 언어 설정
   * @param {string} langCode - 언어 코드
   * @param {boolean} [reload=false] - 페이지 새로고침 여부
   * @returns {boolean} 설정 성공 여부
   */
  setLanguage(langCode, reload = false) {
    try {
      // 지원하지 않는 언어인 경우 거부
      if (!this.state.supportedLangs.includes(langCode)) {
        console.warn(`지원하지 않는 언어: ${langCode}`);
        return false;
      }
      
      // 이미 같은 언어로 설정된 경우 중복 작업 방지
      if (this.state.currentLang === langCode) {
        console.log('이미 해당 언어로 설정되어 있음:', langCode);
        return true;
      }
      
      // 현재 언어 업데이트
      this.state.currentLang = langCode;
      localStorage.setItem('filetoqr_language', langCode);
      document.documentElement.lang = langCode;
      
      // RTL 언어 처리
      const isRTL = ['ar', 'he', 'fa', 'ur'].includes(langCode);
      document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
      
      console.log('언어 변경됨:', langCode);
      
      // 페이지 새로고침 옵션
      if (reload) {
        window.location.reload();
        return true;
      }
      
      // 페이지 요소 업데이트
      this.updatePageElements();
      
      return true;
    } catch (error) {
      console.error('언어 설정 중 오류:', error);
      return false;
    }
  },
  
  /**
   * 번역 리소스 로드 함수
   * @param {string} [lang=null] - 로드할 언어 (null이면 현재 언어)
   * @returns {Promise<Object>} 번역 데이터
   */
  async loadTranslations(lang = null) {
    const langCode = lang || this.state.currentLang;
    
    try {
      // 이미 로드된 언어인 경우 캐시된 데이터 반환
      if (this.state.translations[langCode]) {
        console.log(`번역 데이터 캐시에서 로드: ${langCode}`);
        return this.state.translations[langCode];
      }
      
      console.log(`번역 데이터 로드 중: ${langCode}`);
      
      // 상대 경로 계산
      const basePath = UrlUtils.getBasePath();
      
      // 번역 파일 가져오기
      const langPaths = [
        `${basePath}assets/i18n/${langCode}.json`,
        `/assets/i18n/${langCode}.json`,
        `../assets/i18n/${langCode}.json`,
        `../../assets/i18n/${langCode}.json`
      ];
      
      let translationData = null;
      let loadError = null;
      
      // 각 경로 시도
      for (const path of langPaths) {
        try {
          console.log(`번역 파일 경로 시도: ${path}`);
          const response = await fetch(path);
          
          if (response.ok) {
            translationData = await response.json();
            console.log(`번역 파일 로드 성공: ${path}`);
            break;
          }
        } catch (error) {
          loadError = error;
          console.warn(`번역 파일 로드 실패 (${path}):`, error);
        }
      }
      
      // 모든 경로 실패 시 기본 언어 시도
      if (!translationData && langCode !== this.state.defaultLang) {
        console.warn(`${langCode} 번역 로드 실패, 기본 언어(${this.state.defaultLang}) 시도`);
        return this.loadTranslations(this.state.defaultLang);
      }
      
      // 최종 실패 시 빈 객체 반환
      if (!translationData) {
        console.error('모든 번역 파일 로드 실패:', loadError);
        translationData = {};
      }
      
      // 번역 데이터 캐싱
      this.state.translations[langCode] = translationData;
      
      return translationData;
    } catch (error) {
      console.error(`번역 데이터 로드 중 오류 (${langCode}):`, error);
      return {};
    }
  },
  
  /**
   * 번역 키에 해당하는 텍스트 가져오기
   * @param {string} key - 번역 키 (예: 'common.welcome')
   * @param {Object} [params={}] - 치환할 매개변수
   * @param {string} [defaultValue=null] - 기본값
   * @returns {string} 번역된 텍스트
   */
  translate(key, params = {}, defaultValue = null) {
    try {
      // 번역 데이터 확인
      const langData = this.state.translations[this.state.currentLang];
      if (!langData) {
        console.warn(`번역 데이터가 로드되지 않음: ${this.state.currentLang}`);
        return defaultValue || key;
      }

      // dot notation 중첩 키 탐색
      const result = getNested(langData, key);
      if (result === undefined) {
        console.warn(`[i18n] 번역 키 없음: ${key}`);
        return defaultValue || key;
      }
      if (typeof result !== 'string') {
        console.warn(`[i18n] 번역 결과가 문자열 아님: ${key}`, result);
        return defaultValue || key;
      }

      // 매개변수 치환
      let translatedText = result;
      if (params && Object.keys(params).length > 0) {
        Object.keys(params).forEach(paramKey => {
          translatedText = translatedText.replace(
            new RegExp(`{{\\s*${paramKey}\\s*}}`, 'g'),
            params[paramKey]
          );
        });
      }
      return translatedText;
    } catch (error) {
      console.error('[i18n] 번역 중 오류:', error, '키:', key);
      return defaultValue || key;
    }
  },
  
  /**
   * 페이지 요소 업데이트 (data-i18n 속성 사용)
   */
  updatePageElements() {
    try {
      // 번역 적용할 요소 선택
      const elements = document.querySelectorAll('[data-i18n]');
      console.log(`번역 적용할 요소 수: ${elements.length}`);
      
      elements.forEach(element => {
        const key = element.getAttribute('data-i18n');
        const params = {};
        
        // 매개변수 속성 처리
        const dataAttrs = Array.from(element.attributes).filter(attr => 
          attr.name.startsWith('data-i18n-param-')
        );
        
        dataAttrs.forEach(attr => {
          const paramName = attr.name.replace('data-i18n-param-', '');
          params[paramName] = attr.value;
        });
        
        // 번역 적용
        const translatedText = this.translate(key, params, null);
        
        if (translatedText !== null && translatedText !== key) {
          // HTML 허용 여부 확인
          if (element.hasAttribute('data-i18n-html')) {
            element.innerHTML = translatedText;
          } else {
            element.textContent = translatedText;
          }
        }
      });
      
      console.log('페이지 요소 번역 완료');
    } catch (error) {
      console.error('페이지 요소 번역 중 오류:', error);
    }
  },
  
  /**
   * 다른 언어 버전의 페이지로 이동
   * @param {string} lang - 언어 코드
   * @returns {boolean} 성공 여부
   */
  navigateToLanguage(lang) {
    try {
      // 지원하지 않는 언어 확인
      if (!this.state.supportedLangs.includes(lang)) {
        console.warn(`지원하지 않는 언어로 이동 시도: ${lang}`);
        return false;
      }
      
      // 로컬 스토리지에 언어 설정 저장
      localStorage.setItem('filetoqr_language', lang);
      
      // URL 유틸리티 활용하여 다국어 URL 생성
      const newUrl = UrlUtils.getLanguageUrl(lang);
      
      // 새 URL로 이동
      console.log(`언어 변경에 따른 이동: ${newUrl}`);
      window.location.href = newUrl;
      
      return true;
    } catch (error) {
      console.error('언어 페이지 이동 중 오류:', error);
      return false;
    }
  },
  
  /**
   * i18n 키 또는 페이지 ID로 URL 생성
   * @param {string} key - 페이지 ID (예: 'home') 또는 i18n URL 키 (예: 'urls.home')
   * @param {string} [lang=null] - 언어 코드 (null이면 현재 언어 사용)
   * @returns {string} 생성된 URL 또는 키를 찾지 못한 경우 '#'
   */
  getUrlFromKey(key, lang = null) {
    try {
      let pageId = null;
      const Config = window.FileToQR.config;
      // 1. 키가 Config.PAGE_CONFIG.pages에 직접 페이지 ID로 존재하는지 확인
      if (Config.PAGE_CONFIG.pages[key]) {
        pageId = key;
      } else {
        for (const [id, i18nVal] of Object.entries(Config.PAGE_CONFIG.i18nKeys)) {
          if (i18nVal === key) {
            pageId = id;
            break;
          }
        }
      }
      if (!pageId) {
        console.warn(`[i18n] getUrlFromKey: 키 '${key}'에 해당하는 페이지 ID를 찾을 수 없습니다. Config.PAGE_CONFIG.pages 또는 Config.PAGE_CONFIG.i18nKeys를 확인하세요.`);
        return '#';
      }
      const pageHtmlPath = Config.getPageHtmlPath(pageId);
      if (!pageHtmlPath) {
        console.warn(`[i18n] getUrlFromKey: 페이지 ID '${pageId}'(원본 키: '${key}')에 해당하는 HTML 경로를 찾을 수 없습니다. Config.PAGE_CONFIG.pages를 확인하세요.`);
        return '#';
      }
      return UrlUtils.getI18nUrl(pageHtmlPath, lang);
    } catch (error) {
      console.error(`[i18n] getUrlFromKey('${key}', '${lang}') 처리 중 오류:`, error);
      return '#';
    }
  }
};

// 전역 객체에 등록
window.FileToQR.i18n = I18nUtils;

// 페이지 로드 시 자동 초기화
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM 로드 완료, i18n 자동 초기화 시작');
  I18nUtils.init().catch(error => {
    console.error('i18n 자동 초기화 실패:', error);
  });
});

// Export for ES modules
export default I18nUtils; 