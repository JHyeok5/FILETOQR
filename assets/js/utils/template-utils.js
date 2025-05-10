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
    try {
      console.log('템플릿 유틸리티 초기화 중...');
      
      // Handlebars 로드
      await this.loadHandlebars();
      
      // Handlebars 헬퍼 등록
      this.registerHelpers();
      
      // 기본 파티셜 로드 (있는 경우)
      if (options.loadPartials !== false) {
        await this.loadCommonPartials();
      }
      
      console.log('템플릿 유틸리티 초기화 완료');
      
      return Promise.resolve();
    } catch (error) {
      console.error('템플릿 유틸리티 초기화 실패:', error);
      return Promise.reject(error);
    }
  },

  /**
   * Handlebars 라이브러리 동적 로드
   * @returns {Promise<void>}
   * @private
   */
  async loadHandlebars() {
    if (Handlebars !== null) {
      return Promise.resolve(Handlebars);
    }
    
    try {
      // CDN에서 Handlebars 로드 시도
      const HandlebarsScript = document.createElement('script');
      HandlebarsScript.src = 'https://cdn.jsdelivr.net/npm/handlebars@latest/dist/handlebars.min.js';
      
      // 스크립트 로드 Promise
      const loadPromise = new Promise((resolve, reject) => {
        HandlebarsScript.onload = () => {
          if (typeof window.Handlebars !== 'undefined') {
            Handlebars = window.Handlebars;
            console.log('Handlebars 로드 성공');
            resolve(Handlebars);
          } else {
            reject(new Error('Handlebars 로드 실패: window.Handlebars가 정의되지 않음'));
          }
        };
        HandlebarsScript.onerror = () => {
          reject(new Error('Handlebars 스크립트 로드 오류'));
        };
      });
      
      // DOM에 스크립트 추가
      document.head.appendChild(HandlebarsScript);
      
      // 로드 완료까지 대기
      await loadPromise;
      
      return Handlebars;
    } catch (error) {
      console.error('Handlebars 로드 실패:', error);
      throw error;
    }
  },

  /**
   * Handlebars 헬퍼 등록
   * @private
   */
  registerHelpers() {
    if (!Handlebars) return;
    
    // i18n 헬퍼 등록
    Handlebars.registerHelper('t', (key, options) => {
      // 글로벌 i18n 객체 사용
      if (window.FileToQR && window.FileToQR.i18n) {
        // 파라미터 추출
        const params = {};
        if (options && options.hash) {
          Object.keys(options.hash).forEach(key => {
            params[key] = options.hash[key];
          });
        }
        
        return window.FileToQR.i18n.t(key, params);
      }
      
      // i18n 모듈이 없는 경우 키 자체 반환
      return key;
    });
    
    // formatDate 헬퍼 등록
    Handlebars.registerHelper('formatDate', (date, options) => {
      if (window.FileToQR && window.FileToQR.i18n) {
        const formatOptions = options && options.hash ? options.hash : {};
        return window.FileToQR.i18n.formatDate(date, formatOptions);
      }
      return date;
    });
    
    // formatNumber 헬퍼 등록
    Handlebars.registerHelper('formatNumber', (number, options) => {
      if (window.FileToQR && window.FileToQR.i18n) {
        const formatOptions = options && options.hash ? options.hash : {};
        return window.FileToQR.i18n.formatNumber(number, formatOptions);
      }
      return number;
    });
    
    // eq 비교 헬퍼
    Handlebars.registerHelper('eq', function(a, b, options) {
      return a === b ? options.fn(this) : options.inverse(this);
    });
    
    // neq 비교 헬퍼
    Handlebars.registerHelper('neq', function(a, b, options) {
      return a !== b ? options.fn(this) : options.inverse(this);
    });
    
    // gt 비교 헬퍼
    Handlebars.registerHelper('gt', function(a, b, options) {
      return a > b ? options.fn(this) : options.inverse(this);
    });
    
    // gte 비교 헬퍼
    Handlebars.registerHelper('gte', function(a, b, options) {
      return a >= b ? options.fn(this) : options.inverse(this);
    });
    
    // lt 비교 헬퍼
    Handlebars.registerHelper('lt', function(a, b, options) {
      return a < b ? options.fn(this) : options.inverse(this);
    });
    
    // lte 비교 헬퍼
    Handlebars.registerHelper('lte', function(a, b, options) {
      return a <= b ? options.fn(this) : options.inverse(this);
    });
    
    // contains 헬퍼
    Handlebars.registerHelper('contains', function(arr, item, options) {
      if (Array.isArray(arr) && arr.includes(item)) {
        return options.fn(this);
      }
      return options.inverse(this);
    });
    
    // 조건부 클래스 헬퍼
    Handlebars.registerHelper('classIf', function(condition, trueClass, falseClass) {
      return condition ? trueClass : (falseClass || '');
    });
    
    console.log('Handlebars 헬퍼 등록 완료');
  },

  /**
   * 공통 파티셜 로드
   * @returns {Promise<void>}
   * @private
   */
  async loadCommonPartials() {
    if (!Handlebars) {
      console.error('Handlebars가 로드되지 않은 상태에서 파티셜 로드 시도');
      return Promise.reject(new Error('Handlebars not loaded'));
    }
    
    console.log('공통 파티셜 로드 시작');
    
    try {
      // DOM에서 파티셜 데이터 요소 찾기
      const partialElements = document.querySelectorAll('script[type="text/x-handlebars-partial"]');
      if (partialElements.length > 0) {
        console.log(`DOM에서 ${partialElements.length}개의 파티셜 요소 발견`);
        
        // DOM에서 파티셜 등록
        partialElements.forEach(element => {
          const partialName = element.getAttribute('data-partial-name');
          if (partialName) {
            Handlebars.registerPartial(partialName, element.innerHTML);
            console.log(`DOM 파티셜 등록: ${partialName}`);
          }
        });
      }
      
      // 파티셜 컴포넌트 목록
      const partials = [
        'header',
        'footer',
        'loading',
        'language-selector'
      ];
      
      const basePath = PathUtils.getBasePath() || './';
      console.log('파티셜 로드 기본 경로:', basePath);
      
      // 각 파티셜 로드 시도
      for (const partial of partials) {
        try {
          // 첫 번째 시도: 컴포넌트 경로
          let partialUrl = `${basePath}components/partials/${partial}.hbs`;
          let response = await fetch(partialUrl);
          
          // 404인 경우 다른 경로 시도
          if (!response.ok) {
            console.log(`${partialUrl} 로드 실패, 다른 경로 시도`);
            partialUrl = `${basePath}components/partials/${partial}.handlebars`;
            response = await fetch(partialUrl);
            
            // 그래도 실패하면 HTML 파일 시도
            if (!response.ok) {
              partialUrl = `${basePath}components/partials/${partial}.html`;
              response = await fetch(partialUrl);
            }
          }
          
          if (response.ok) {
            const template = await response.text();
            Handlebars.registerPartial(partial, template);
            console.log(`파티셜 로드 성공: ${partial}`);
          } else {
            // 파티셜이 파일로 존재하지 않으면 DOM에서 찾기 시도
            const inlinePartial = document.getElementById(`partial-${partial}`);
            if (inlinePartial) {
              Handlebars.registerPartial(partial, inlinePartial.innerHTML);
              console.log(`인라인 파티셜 사용: ${partial}`);
            } else {
              console.warn(`파티셜 로드 실패: ${partial}`);
            }
          }
        } catch (error) {
          console.warn(`파티셜 '${partial}' 로드 오류:`, error);
        }
      }
      
      console.log('공통 파티셜 로드 완료');
      return Promise.resolve();
    } catch (error) {
      console.error('공통 파티셜 로드 중 오류 발생:', error);
      return Promise.reject(error);
    }
  },

  /**
   * 템플릿 로드 및 캐싱
   * @param {string} templatePath - 템플릿 파일 경로
   * @returns {Promise<string>} 템플릿 문자열
   */
  async loadTemplate(templatePath) {
    // 이미 캐시에 있으면 반환
    if (this._templateCache[templatePath]) {
      return Promise.resolve(this._templateCache[templatePath]);
    }
    
    try {
      // 다양한 경로 패턴 시도
      const pathVariations = [
        templatePath,
        `/${templatePath}`,
        `./${templatePath}`,
        `../${templatePath}`
      ];
      
      let templateContent = null;
      
      for (const path of pathVariations) {
        try {
          const response = await fetch(path);
          if (response.ok) {
            templateContent = await response.text();
            console.log(`템플릿 로드 성공: ${path}`);
            break;
          }
        } catch (err) {
          console.warn(`경로에서 템플릿 로드 실패: ${path}`);
        }
      }
      
      if (!templateContent) {
        throw new Error(`템플릿을 찾을 수 없음: ${templatePath}`);
      }
      
      // 캐시에 저장
      this._templateCache[templatePath] = templateContent;
      
      return templateContent;
    } catch (error) {
      console.error(`템플릿 로드 실패 (${templatePath}): ${error.message}`);
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
    if (!Handlebars) {
      throw new Error('Handlebars가 로드되지 않았습니다');
    }
    
    if (cacheKey && this._compiledTemplates[cacheKey]) {
      return this._compiledTemplates[cacheKey];
    }
    
    try {
      const compiledTemplate = Handlebars.compile(template);
      
      if (cacheKey) {
        this._compiledTemplates[cacheKey] = compiledTemplate;
      }
      
      return compiledTemplate;
    } catch (error) {
      console.error('템플릿 컴파일 실패:', error);
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
      console.error('컴포넌트 로드 실패: 컨테이너가 없습니다');
      return false;
    }
    
    try {
      // Handlebars 로드 확인
      if (!Handlebars) {
        await this.loadHandlebars();
      }
      
      // 컴포넌트 경로 생성
      const componentPath = `${basePath}components/${componentName}.html`;
      
      // 템플릿 로드
      const template = await this.loadTemplate(componentPath);
      
      // 기본 데이터에 basePath 추가
      const templateData = {
        ...data,
        basePath: basePath
      };
      
      // 템플릿 컴파일 및 렌더링
      const compiledTemplate = this.compileTemplate(template, componentName);
      const renderedHtml = compiledTemplate(templateData);
      
      // 컨테이너에 HTML 삽입
      container.innerHTML = renderedHtml;
      
      // i18n 사용 가능한 경우 번역 적용
      if (window.FileToQR && window.FileToQR.i18n) {
        window.FileToQR.i18n.applyTranslations();
      }
      
      console.log(`컴포넌트 로드 완료: ${componentName}`);
      
      return true;
    } catch (error) {
      console.error(`컴포넌트 로드 실패 (${componentName}): ${error.message}`);
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
    if (!Handlebars) {
      throw new Error('Handlebars가 로드되지 않았습니다');
    }
    
    try {
      const compiledTemplate = this.compileTemplate(template);
      return compiledTemplate(data);
    } catch (error) {
      console.error('템플릿 렌더링 실패:', error);
      throw error;
    }
  },

  /**
   * 파티셜 등록
   * @param {string} name - 파티셜 이름
   * @param {string} template - 파티셜 템플릿 문자열
   */
  registerPartial(name, template) {
    if (!Handlebars) {
      throw new Error('Handlebars가 로드되지 않았습니다');
    }
    
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
      console.error('Handlebars가 로드되지 않았습니다');
      return false;
    }
    
    try {
      const templateElement = document.querySelector(templateSelector);
      if (!templateElement) {
        console.error(`템플릿 요소를 찾을 수 없음: ${templateSelector}`);
        return false;
      }
      
      const template = templateElement.innerHTML;
      const compiledTemplate = this.compileTemplate(template, templateSelector);
      const renderedHtml = compiledTemplate(data);
      
      container.innerHTML = renderedHtml;
      
      // i18n 사용 가능한 경우 번역 적용
      if (window.FileToQR && window.FileToQR.i18n) {
        window.FileToQR.i18n.applyTranslations();
      }
      
      return true;
    } catch (error) {
      console.error(`템플릿 렌더링 실패 (${templateSelector}): ${error.message}`);
      return false;
    }
  }
};

// 템플릿 유틸리티를 전역 객체에 등록
window.FileToQR = window.FileToQR || {};
window.FileToQR.TemplateUtils = TemplateUtils;

export default TemplateUtils; 