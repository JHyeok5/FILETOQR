/**
 * template-utils.js - FileToQR 템플릿 유틸리티
 * 버전: 1.0.0
 * 최종 업데이트: 2025-07-15
 * 
 * 이 모듈은 Handlebars 템플릿 엔진을 활용하여 템플릿 기반 UI 렌더링을 제공합니다.
 * - 컴포넌트 로딩 및 렌더링
 * - 템플릿 캐싱
 * - Handlebars 헬퍼 등록
 * - 다국어 지원 통합
 */

import PathUtils from './path-utils.js';

// Handlebars 의존성 동적 로드
let Handlebars = null;

/**
 * FileToQR 템플릿 유틸리티 모듈
 */
const TemplateUtils = {
  /**
   * 템플릿 캐시 저장소
   * @type {Object}
   * @private
   */
  _templateCache: {},

  /**
   * 컴파일된 템플릿 함수 캐시
   * @type {Object}
   * @private
   */
  _compiledTemplates: {},

  /**
   * 템플릿 유틸리티 초기화
   * @param {Object} options - 초기화 옵션
   * @returns {Promise<void>} 초기화 완료 Promise
   */
  async init(options = {}) {
    console.log('[TemplateUtils] Initialization started.');
    try {
      console.log('[TemplateUtils] Attempting to load Handlebars...');
      await this.loadHandlebars();
      console.log('[TemplateUtils] Handlebars loaded successfully (or was already loaded).');
      
      console.log('[TemplateUtils] Registering Handlebars helpers...');
      this.registerHelpers();
      console.log('[TemplateUtils] Handlebars helpers registered.');
      
      if (options.loadPartials !== false) {
        console.log('[TemplateUtils] Loading common partials...');
        await this.loadCommonPartials();
        console.log('[TemplateUtils] Common partials loaded.');
      }
      
      console.log('[TemplateUtils] Initialization completed successfully.');
      return Promise.resolve();
    } catch (error) {
      const errorMessage = `TemplateUtils 초기화 실패: Handlebars 로드 또는 기타 초기화 오류 - ${error.message}`;
      console.error(`[TemplateUtils] Initialization failed. Details: ${error.message}`, error);
      return Promise.reject(new Error(errorMessage));
    }
  },

  /**
   * Handlebars 라이브러리 동적 로드
   * @returns {Promise<void>}
   * @private
   */
  async loadHandlebars() {
    if (typeof window.Handlebars === 'function' && Handlebars === window.Handlebars) {
      console.log('[TemplateUtils] Handlebars already loaded and initialized.');
      return Promise.resolve(window.Handlebars);
    }
    if (typeof window.Handlebars === 'function') {
        console.log('[TemplateUtils] window.Handlebars found, re-assigning to local Handlebars variable.');
        Handlebars = window.Handlebars;
        return Promise.resolve(window.Handlebars);
    }

    const handlebarsUrl = 'https://cdn.jsdelivr.net/npm/handlebars@latest/dist/handlebars.min.js';
    console.log(`[TemplateUtils] Attempting to load Handlebars from CDN: ${handlebarsUrl}`);
    
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = handlebarsUrl;
      script.defer = true;

      script.onload = () => {
        if (typeof window.Handlebars !== 'undefined' && window.Handlebars) {
          Handlebars = window.Handlebars;
          console.log('[TemplateUtils] Handlebars loaded successfully via CDN and assigned.');
          resolve(window.Handlebars);
        } else {
          const errorMsg = '[TemplateUtils] Handlebars loaded from CDN, but window.Handlebars is undefined or null.';
          console.error(errorMsg);
          reject(new Error('Handlebars 로드 성공했으나 window.Handlebars가 정의되지 않았습니다.'));
        }
      };

      script.onerror = (event) => {
        const errorMsg = `[TemplateUtils] Failed to load Handlebars script from CDN. URL: ${handlebarsUrl}`;
        console.error(errorMsg, event);
        reject(new Error(`Handlebars CDN 스크립트 로드에 실패했습니다. URL: ${handlebarsUrl}`));
      };
      
      console.log('[TemplateUtils] Appending Handlebars script tag to head...');
      document.head.appendChild(script);
    });
  },

  /**
   * Handlebars 헬퍼 등록
   * @private
   */
  registerHelpers() {
    if (!Handlebars) {
        console.warn('[TemplateUtils] Handlebars is not available, cannot register helpers.');
        return;
    }
    
    // i18n 헬퍼 등록
    Handlebars.registerHelper('t', (key, options) => {
      if (window.FileToQR && window.FileToQR.i18n) {
        const params = {};
        if (options && options.hash) {
          Object.keys(options.hash).forEach(paramKey => {
            params[paramKey] = options.hash[paramKey];
          });
        }
        return window.FileToQR.i18n.t(key, params);
      }
      return key;
    });
    
    Handlebars.registerHelper('formatDate', (date, options) => {
      if (window.FileToQR && window.FileToQR.i18n) {
        const formatOptions = options && options.hash ? options.hash : {};
        return window.FileToQR.i18n.formatDate(date, formatOptions);
      }
      return date;
    });
    
    Handlebars.registerHelper('formatNumber', (number, options) => {
      if (window.FileToQR && window.FileToQR.i18n) {
        const formatOptions = options && options.hash ? options.hash : {};
        return window.FileToQR.i18n.formatNumber(number, formatOptions);
      }
      return number;
    });
    
    Handlebars.registerHelper('eq', function(a, b, options) { return a === b ? options.fn(this) : options.inverse(this); });
    Handlebars.registerHelper('neq', function(a, b, options) { return a !== b ? options.fn(this) : options.inverse(this); });
    Handlebars.registerHelper('gt', function(a, b, options) { return a > b ? options.fn(this) : options.inverse(this); });
    Handlebars.registerHelper('gte', function(a, b, options) { return a >= b ? options.fn(this) : options.inverse(this); });
    Handlebars.registerHelper('lt', function(a, b, options) { return a < b ? options.fn(this) : options.inverse(this); });
    Handlebars.registerHelper('lte', function(a, b, options) { return a <= b ? options.fn(this) : options.inverse(this); });
    Handlebars.registerHelper('contains', function(arr, item, options) { return (Array.isArray(arr) && arr.includes(item)) ? options.fn(this) : options.inverse(this); });
    Handlebars.registerHelper('classIf', function(condition, trueClass, falseClass) { return condition ? trueClass : (falseClass || ''); });
    
    console.log('[TemplateUtils] All Handlebars helpers registered.');
  },

  /**
   * 공통 파티셜 로드
   * @returns {Promise<void>}
   * @private
   */
  async loadCommonPartials() {
    if (!Handlebars) {
      console.error('[TemplateUtils] Handlebars not loaded, cannot load partials.');
      return Promise.reject(new Error('Handlebars not loaded'));
    }
    console.log('[TemplateUtils] Starting to load common partials...');
    try {
      const partialElements = document.querySelectorAll('script[type="text/x-handlebars-partial"]');
      if (partialElements.length > 0) {
        console.log(`[TemplateUtils] Found ${partialElements.length} partial elements in DOM.`);
        partialElements.forEach(element => {
          const partialName = element.getAttribute('data-partial-name');
          if (partialName) {
            Handlebars.registerPartial(partialName, element.innerHTML);
            console.log(`[TemplateUtils] Registered DOM partial: ${partialName}`);
          }
        });
      }
      
      const partials = ['header', 'footer', 'loading', 'language-selector'];
      const basePath = PathUtils.getBasePath() || './';
      console.log('[TemplateUtils] Base path for partials:', basePath);
      
      for (const partial of partials) {
        try {
          let partialUrl = `${basePath}components/partials/${partial}.hbs`;
          let response = await fetch(partialUrl);
          if (!response.ok) {
            console.log(`[TemplateUtils] Failed to load ${partialUrl}, trying .handlebars`);
            partialUrl = `${basePath}components/partials/${partial}.handlebars`;
            response = await fetch(partialUrl);
            if (!response.ok) {
              console.log(`[TemplateUtils] Failed to load ${partialUrl}, trying .html`);
              partialUrl = `${basePath}components/partials/${partial}.html`;
              response = await fetch(partialUrl);
            }
          }
          
          if (response.ok) {
            const template = await response.text();
            Handlebars.registerPartial(partial, template);
            console.log(`[TemplateUtils] Successfully loaded partial: ${partial} from ${partialUrl}`);
          } else {
            const inlinePartial = document.getElementById(`partial-${partial}`);
            if (inlinePartial) {
              Handlebars.registerPartial(partial, inlinePartial.innerHTML);
              console.log(`[TemplateUtils] Used inline partial: ${partial}`);
            } else {
              console.warn(`[TemplateUtils] Failed to load partial file and no inline partial found for: ${partial}`);
            }
          }
        } catch (error) {
          console.warn(`[TemplateUtils] Error loading partial '${partial}':`, error);
        }
      }
      console.log('[TemplateUtils] Common partials loading finished.');
    } catch (error) {
      console.error('[TemplateUtils] Error during common partials loading:', error);
      throw error;
    }
  },

  /**
   * 템플릿 로드 및 캐싱
   * @param {string} templatePath - 템플릿 파일 경로
   * @returns {Promise<string>} 템플릿 문자열
   */
  async loadTemplate(templatePath) {
    if (this._templateCache[templatePath]) {
      return this._templateCache[templatePath];
    }
    try {
      const pathVariations = [templatePath, `/${templatePath}`, `./${templatePath}`, `../${templatePath}`];
      let templateContent = null;
      for (const path of pathVariations) {
        try {
          const response = await fetch(path);
          if (response.ok) {
            templateContent = await response.text();
            console.log(`[TemplateUtils] Template loaded successfully: ${path}`);
            break;
          }
        } catch (err) { /* Continue trying other paths */ }
      }
      if (!templateContent) throw new Error(`Template not found: ${templatePath} (tried variations)`);
      this._templateCache[templatePath] = templateContent;
      return templateContent;
    } catch (error) {
      console.error(`[TemplateUtils] Failed to load template (${templatePath}): ${error.message}`);
      throw error;
    }
  },

  /**
   * 템플릿 컴파일
   * @param {string} template - 템플릿 문자열
   * @param {string} [cacheKey] - 캐시 키 (선택사항)
   * @returns {Function} 컴파일된 템플릿 함수
   */
  compileTemplate(template, cacheKey = null) {
    if (!Handlebars) throw new Error('[TemplateUtils] Handlebars is not loaded, cannot compile template.');
    if (cacheKey && this._compiledTemplates[cacheKey]) return this._compiledTemplates[cacheKey];
    try {
      const compiledTemplate = Handlebars.compile(template);
      if (cacheKey) this._compiledTemplates[cacheKey] = compiledTemplate;
      return compiledTemplate;
    } catch (error) {
      console.error('[TemplateUtils] Template compilation failed:', error);
      throw error;
    }
  },

  /**
   * 컴포넌트 로드 및 렌더링
   * @param {string} componentName - 컴포넌트 이름
   * @param {HTMLElement} container - 렌더링할 컨테이너 요소
   * @param {string} [basePath=''] - 기본 경로
   * @param {Object} [data={}] - 템플릿 데이터
   * @returns {Promise<boolean>} 성공 여부
   */
  async loadComponent(componentName, container, basePath = '', data = {}) {
    if (!container) {
      console.error('[TemplateUtils] Component load failed: Container is missing for', componentName);
      return false;
    }
    try {
      if (!Handlebars) await this.loadHandlebars();
      const componentPath = `${basePath}components/${componentName}.html`;
      const template = await this.loadTemplate(componentPath);
      const templateData = { ...data, basePath: basePath };
      const compiledTemplate = this.compileTemplate(template, componentName);
      container.innerHTML = compiledTemplate(templateData);
      if (window.FileToQR && window.FileToQR.i18n) window.FileToQR.i18n.applyTranslations();
      console.log(`[TemplateUtils] Component loaded: ${componentName}`);
      return true;
    } catch (error) {
      console.error(`[TemplateUtils] Failed to load component (${componentName}): ${error.message}`);
      return false;
    }
  },

  /**
   * 템플릿 문자열 렌더링
   * @param {string} template - 템플릿 문자열
   * @param {Object} data - 템플릿 데이터
   * @returns {string} 렌더링된 HTML
   */
  renderTemplate(template, data = {}) {
    if (!Handlebars) throw new Error('[TemplateUtils] Handlebars is not loaded, cannot render template.');
    try {
      const compiledTemplate = this.compileTemplate(template);
      return compiledTemplate(data);
    } catch (error) {
      console.error('[TemplateUtils] Template rendering failed:', error);
      throw error;
    }
  },

  /**
   * 파티셜 등록
   * @param {string} name - 파티셜 이름
   * @param {string} template - 파티셜 템플릿 문자열
   */
  registerPartial(name, template) {
    if (!Handlebars) throw new Error('[TemplateUtils] Handlebars is not loaded, cannot register partial.');
    Handlebars.registerPartial(name, template);
  },

  /**
   * 템플릿 캐시 지우기
   * @param {string} [templatePath] - 특정 템플릿 경로 (없으면 전체 캐시 삭제)
   */
  clearCache(templatePath = null) {
    if (templatePath) {
      delete this._templateCache[templatePath];
      delete this._compiledTemplates[templatePath];
    } else {
      this._templateCache = {};
      this._compiledTemplates = {};
    }
    console.log(`[TemplateUtils] Cache cleared for: ${templatePath || 'all'}`);
  },

  /**
   * HTML 템플릿 요소를 렌더링
   * @param {string} templateSelector - 템플릿 요소 선택자
   * @param {HTMLElement} container - 렌더링할 컨테이너 요소
   * @param {Object} data - 템플릿 데이터
   * @returns {boolean} 성공 여부
   */
  renderTemplateElement(templateSelector, container, data = {}) {
    if (!Handlebars) {
      console.error('[TemplateUtils] Handlebars not loaded, cannot render template element.');
      return false;
    }
    try {
      const templateElement = document.querySelector(templateSelector);
      if (!templateElement) {
        console.error(`[TemplateUtils] Template element not found: ${templateSelector}`);
        return false;
      }
      const template = templateElement.innerHTML;
      const compiledTemplate = this.compileTemplate(template, templateSelector);
      container.innerHTML = compiledTemplate(data);
      if (window.FileToQR && window.FileToQR.i18n) window.FileToQR.i18n.applyTranslations();
      return true;
    } catch (error) {
      console.error(`[TemplateUtils] Failed to render template element (${templateSelector}): ${error.message}`);
      return false;
    }
  }
};

// 템플릿 유틸리티를 전역 객체에 등록 (app-core.js가 직접 import 하므로, 이 부분은 호환성 또는 다른 모듈용일 수 있음)
if (typeof window !== 'undefined') {
    window.FileToQR = window.FileToQR || {}; 
    window.FileToQR.TemplateUtils = TemplateUtils;
    console.log('[TemplateUtils] Successfully assigned to window.FileToQR.TemplateUtils');
} else {
  console.warn('[TemplateUtils] window object not found, cannot assign TemplateUtils globally.');
}

export default TemplateUtils; 