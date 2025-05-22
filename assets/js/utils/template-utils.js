/**
 * template-utils.js - FileToQR 템플릿 유틸리티
 * 버전: 1.1.0
 * 최종 업데이트: 2025-07-25
 * 
 * 이 모듈은 Handlebars 템플릿 관련 유틸리티 함수를 제공합니다.
 * - Handlebars 라이브러리 로드
 * - 헬퍼 함수 등록
 * - 파셜(partial) 템플릿 로드 및 등록
 * - 템플릿 컴파일 및 렌더링
 */

import Config from '../core/config.js';
import PathUtils from './path-utils.js'; // PathUtils 임포트 추가

// 전역 객체 설정
window.FileToQR = window.FileToQR || {};
window.FileToQR.utils = window.FileToQR.utils || {};

// Handlebars 인스턴스 (동적 로드 후 할당)
let Handlebars = null;

/**
 * Template 유틸리티 모듈
 */
const TemplateUtils = {
  // 상태
  state: {
    isInitialized: false,
    isLoading: false,
    partialsLoaded: false,
    helpersRegistered: false
  },

  /**
   * Handlebars 라이브러리 로드 (CDN)
   * @returns {Promise<void>} Handlebars 로드 완료 시 resolve, 실패 시 reject
   */
  async loadHandlebars() {
    if (Handlebars !== null) { // 이미 로드된 경우
        console.log('[TemplateUtils] Handlebars already loaded.');
        return Promise.resolve(Handlebars);
    }
    console.log('[TemplateUtils] Attempting to load Handlebars...');
    return new Promise((resolve, reject) => {
        const scriptUrl = 'https://cdn.jsdelivr.net/npm/handlebars@latest/dist/handlebars.min.js';
        console.log(`[TemplateUtils] Creating script tag for Handlebars from: ${scriptUrl}`);
        const handlebarsScript = document.createElement('script');
        handlebarsScript.src = scriptUrl;
        // handlebarsScript.async = true; // async는 순서 보장이 중요할 때 주의 필요, 여기서는 init 내 await으로 관리

        handlebarsScript.onload = () => {
            if (typeof window.Handlebars !== 'undefined') {
                Handlebars = window.Handlebars; // 전역 Handlebars 할당
                console.log('[TemplateUtils] Handlebars loaded successfully via CDN and assigned to local Handlebars variable.');
                resolve(Handlebars);
            } else {
                const errorMsg = '[TemplateUtils] Handlebars loaded BUT window.Handlebars is undefined.';
                console.error(errorMsg);
                reject(new Error(errorMsg));
            }
        };

        handlebarsScript.onerror = (event) => {
            // 네트워크 오류, 스크립트 오류 등 상세 정보 포함 시도
            const errorDetail = event && event.message ? event.message : 'Unknown script load error';
            const errorMsg = `[TemplateUtils] FAILED to load Handlebars script from CDN: ${scriptUrl}. Error: ${errorDetail}`;
            console.error(errorMsg, event);
            reject(new Error(errorMsg));
        };

        console.log('[TemplateUtils] Appending Handlebars script tag to head...');
        document.head.appendChild(handlebarsScript);
    });
  },

  /**
   * 템플릿 유틸리티 초기화
   * @param {Object} [options={}] - 초기화 옵션
   * @param {boolean} [options.loadPartials=true] - 공통 파셜 로드 여부
   * @returns {Promise<void>} 초기화 성공 시 resolve, 실패 시 reject
   */
  async init(options = {}) {
    console.log('[TemplateUtils] Initialization started.');
    if (this.state.isInitialized) {
      console.log('[TemplateUtils] Already initialized.');
      return Promise.resolve();
    }
    if (this.state.isLoading) {
      console.warn('[TemplateUtils] Initialization is already in progress.');
      // 진행 중인 Promise를 반환하거나, 특정 로직을 추가할 수 있습니다.
      // 여기서는 간단히 경고만 하고 새 Promise를 반환합니다.
      return new Promise((resolve, reject) => {
        const checkInterval = setInterval(() => {
          if (!this.state.isLoading) {
            clearInterval(checkInterval);
            if (this.state.isInitialized) {
              resolve();
            } else {
              reject(new Error('[TemplateUtils] Concurrent initialization failed.'));
            }
          }
        }, 100);
      });
    }
    this.state.isLoading = true;

    try {
        console.log('[TemplateUtils] Attempting to load Handlebars...');
        await this.loadHandlebars(); // 이 Promise가 reject될 수 있음
        console.log('[TemplateUtils] Handlebars loaded successfully (or was already loaded).');

        console.log('[TemplateUtils] Registering Handlebars helpers...');
        this.registerHelpers();
        this.state.helpersRegistered = true;
        console.log('[TemplateUtils] Handlebars helpers registered.');

        if (options.loadPartials !== false) {
            console.log('[TemplateUtils] Loading common partials...');
            await this.loadCommonPartials(); // 이 Promise도 reject될 수 있음
            this.state.partialsLoaded = true;
            console.log('[TemplateUtils] Common partials loaded.');
        }
        this.state.isInitialized = true;
        this.state.isLoading = false;
        console.log('[TemplateUtils] Initialization completed successfully.');
        return Promise.resolve(); // 명시적 성공 resolve
    } catch (error) {
        this.state.isLoading = false;
        this.state.isInitialized = false; // 초기화 실패 상태로 명확히 설정
        const errorMsg = `[TemplateUtils] Initialization FAILED: ${error.message}`;
        console.error(errorMsg, error);
        // 이 에러를 app-core.js가 받을 수 있도록 전파
        return Promise.reject(new Error(errorMsg)); 
    }
  },

  /**
   * Handlebars 헬퍼 함수 등록
   */
  registerHelpers() {
    if (!Handlebars) {
      console.warn("[TemplateUtils] Handlebars not loaded. Cannot register helpers.");
      return;
    }

    // t: 다국어 번역 헬퍼
    Handlebars.registerHelper('t', function (key, options) {
      const params = options.hash;
      if (window.FileToQR && window.FileToQR.i18n && typeof window.FileToQR.i18n.translate === 'function') {
        return new Handlebars.SafeString(window.FileToQR.i18n.translate(key, params, key));
      } else {
        console.warn(`[TemplateUtils Helper 't'] I18n module not found or translate function missing.`);
        return key; // 번역 실패 시 키 반환
      }
    });

    // concat: 문자열 연결 헬퍼
    Handlebars.registerHelper('concat', function (...args) {
      // 마지막 인자는 Handlebars options 객체이므로 제외
      return args.slice(0, -1).join('');
    });

    // eq: 동등 비교 헬퍼
    Handlebars.registerHelper('eq', function (a, b) {
      return a === b;
    });

    // formatDate: 날짜 포맷팅 헬퍼 (간단 버전)
    Handlebars.registerHelper('formatDate', function (dateString, format = 'YYYY-MM-DD') {
      try {
        const date = new Date(dateString);
        // 매우 기본적인 포맷팅, 필요시 Moment.js 또는 date-fns 같은 라이브러리 사용 고려
        if (format === 'YYYY-MM-DD') {
          return `${date.getFullYear()}-${('0' + (date.getMonth() + 1)).slice(-2)}-${('0' + date.getDate()).slice(-2)}`;
        }
        return date.toLocaleDateString(); // 기본 로캘 날짜 형식
      } catch (e) {
        console.warn(`[TemplateUtils Helper 'formatDate'] Error formatting date: ${dateString}`, e);
        return dateString;
      }
    });

    // getPath: 경로 생성 헬퍼
    Handlebars.registerHelper('getPath', function (relativePath) {
      return PathUtils.getAbsolutePath(relativePath);
    });
    
    // getAssetPath: 에셋 경로 생성 헬퍼
    Handlebars.registerHelper('getAssetPath', function (assetPath) {
      // PathUtils.getAssetPath가 정의되어 있다고 가정합니다. 없다면 정의 필요.
      if (PathUtils && typeof PathUtils.getAssetPath === 'function') {
        return PathUtils.getAssetPath(assetPath);
      } else {
        // 기본 fallback: PathUtils.getAbsolutePath 사용 또는 직접 구성
        console.warn("[TemplateUtils Helper 'getAssetPath'] PathUtils.getAssetPath is not defined. Falling back to getAbsolutePath.");
        return PathUtils.getAbsolutePath(assetPath); // 혹은 '/assets/' + assetPath 등
      }
    });
    
    // i18nUrl: 다국어 URL 생성 헬퍼 (app-core.js의 updateInternalLinks와 유사한 기능)
    Handlebars.registerHelper('i18nUrl', function(pageKey) {
      if (window.FileToQR && window.FileToQR.i18n && typeof window.FileToQR.i18n.getUrlFromKey === 'function') {
        return window.FileToQR.i18n.getUrlFromKey(pageKey);
      }
      // Fallback: 기본 URL 반환 또는 경고
      console.warn(`[TemplateUtils Helper 'i18nUrl'] I18n module or getUrlFromKey not available for key: ${pageKey}`);
      return '#'; // 기본값
    });

    console.log('[TemplateUtils] All Handlebars helpers registered.');
  },

  /**
   * 단일 파셜 템플릿 로드 및 등록
   * @param {string} name - 파셜 이름
   * @param {string} filePath - 파셜 파일 경로 (루트부터의 절대 경로 또는 상대 경로)
   * @returns {Promise<void>}
   */
  async loadPartial(name, filePath) {
    if (!Handlebars) {
      const errorMsg = "[TemplateUtils] Handlebars not loaded. Cannot load partial.";
      console.error(errorMsg);
      return Promise.reject(new Error(errorMsg));
    }
    try {
      const response = await fetch(filePath);
      if (!response.ok) {
        throw new Error(`Failed to load partial ${name} from ${filePath}: ${response.status} ${response.statusText}`);
      }
      const templateString = await response.text();
      Handlebars.registerPartial(name, templateString);
      console.log(`[TemplateUtils] Successfully loaded partial: ${name} from ${filePath}`);
    } catch (error) {
      console.error(`[TemplateUtils] Error loading partial ${name} from ${filePath}:`, error);
      throw error; // 오류를 다시 던져 호출자가 처리하도록 함
    }
  },

  /**
   * 공통 파셜 템플릿 로드 및 등록
   * @returns {Promise<void>}
   */
  async loadCommonPartials() {
    console.log('[TemplateUtils] Starting to load common partials...');
    const partialsDir = Config.PATH_CONFIG.partials || '/components/partials/';
    // PathUtils.getBasePath() 사용하여 애플리케이션 기본 경로를 얻고, 이를 기준으로 파셜 경로 구성
    const basePath = PathUtils.getBasePath(); // 예: '/' 또는 '/ko/' 등
    // basePath가 이미 /로 끝나므로, partialsDir 시작의 /는 제거할 수 있음
    const absolutePartialsDir = `${basePath}${partialsDir.replace(/^\/+/, '')}`;
    console.log(`[TemplateUtils] Base path for partials: ${absolutePartialsDir}`);

    const commonPartials = {
      'header': `${absolutePartialsDir}header.hbs`,
      'footer': `${absolutePartialsDir}footer.hbs`,
      'loading': `${absolutePartialsDir}loading.hbs`,
      'language-selector': `${absolutePartialsDir}language-selector.hbs`
      // 필요한 다른 공통 파셜 추가
    };

    const promises = Object.entries(commonPartials).map(([name, path]) => {
      return this.loadPartial(name, path);
    });

    try {
      await Promise.all(promises);
      console.log('[TemplateUtils] Common partials loading finished.');
    } catch (error) {
      console.error('[TemplateUtils] Failed to load one or more common partials:', error);
      // 여기서 에러를 다시 throw하여 init()의 catch 블록으로 전파
      throw new Error(`Failed to load common partials: ${error.message}`);
    }
  },

  /**
   * 템플릿 렌더링
   * @param {string} source - Handlebars 템플릿 문자열
   * @param {Object} data - 템플릿에 전달할 데이터
   * @returns {string} 렌더링된 HTML 문자열
   */
  render(source, data) {
    if (!Handlebars) {
      console.error("[TemplateUtils] Handlebars not loaded. Cannot render template.");
      return ''; // 또는 오류 메시지 반환
    }
    try {
      const template = Handlebars.compile(source);
      return template(data);
    } catch (error) {
      console.error('[TemplateUtils] Error rendering template:', error);
      return ''; // 오류 발생 시 빈 문자열 또는 오류 메시지 반환
    }
  },

  /**
   * 템플릿 ID로 템플릿 렌더링
   * @param {string} templateId - 템플릿 스크립트 태그의 ID
   * @param {Object} data - 템플릿에 전달할 데이터
   * @returns {string} 렌더링된 HTML 문자열 또는 오류 시 빈 문자열
   */
  renderById(templateId, data) {
    const sourceElement = document.getElementById(templateId);
    if (!sourceElement) {
      console.error(`[TemplateUtils] Template with ID '${templateId}' not found.`);
      return '';
    }
    const source = sourceElement.innerHTML;
    return this.render(source, data);
  }
};

// 전역 객체에 유틸리티 등록
window.FileToQR.TemplateUtils = TemplateUtils;
console.log('[TemplateUtils] Successfully assigned to window.FileToQR.TemplateUtils');

// ES 모듈 방식으로 export
export default TemplateUtils; 