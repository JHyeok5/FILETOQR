/**
 * components.js - FileToQR 컴포넌트 시스템
 * 버전: 1.0.0
 * 최종 업데이트: 2025-06-15
 * 참조: ../../docs/architecture/component-system.md
 * 
 * 이 모듈은 재사용 가능한 UI 컴포넌트를 등록, 초기화, 라이프사이클 관리하기 위한
 * 가벼운 컴포넌트 시스템을 제공합니다.
 */

import EventEmitter from '../utils/event-emitter.js';

// 컴포넌트 이벤트 관리를 위한 이벤트 이미터 인스턴스
const componentEvents = new EventEmitter();

// 컴포넌트 레지스트리
const components = new Map();

// (IIFE 내부, 모든 함수 선언 후에만 아래 코드가 존재해야 함)
const ComponentSystem = {
  // FileToQR.components.register를 안전하게 호출하는 래퍼 함수
  register: function(name, component) {
    if (typeof window.FileToQR !== 'undefined' && window.FileToQR.components && typeof window.FileToQR.components.register === 'function') {
      return window.FileToQR.components.register(name, component);
    }
    console.error("FileToQR.components.register 함수를 찾을 수 없습니다.");
    return false;
  },
  // FileToQR.components.init을 안전하게 호출하는 래퍼 함수
  init: function() {
    if (typeof window.FileToQR !== 'undefined' && window.FileToQR.components && typeof window.FileToQR.components.init === 'function') {
      return window.FileToQR.components.init();
    }
    console.error("FileToQR.components.init 함수를 찾을 수 없습니다.");
    // 필요시 기본값 반환
  },
  mount: undefined, // 필요시 실제 함수로 대체
  unmount: undefined, // 필요시 실제 함수로 대체
  update: undefined, // 필요시 실제 함수로 대체
  on: componentEvents.on.bind(componentEvents),
  off: componentEvents.off.bind(componentEvents),
  emit: componentEvents.emit.bind(componentEvents)
};
window.ComponentSystem = ComponentSystem;

/**
 * 컴포넌트 등록
 * @param {string} name - 컴포넌트 이름
 * @param {Object} component - 컴포넌트 정의
 */
function register(name, component) {
  if (components.has(name)) {
    console.warn(`컴포넌트가 이미 등록되어 있습니다: ${name}`);
    return;
  }
  
  components.set(name, component);
  componentEvents.emit('componentRegistered', { name, component });
}

// 즉시 실행 함수로 네임스페이스 보호
(function() {
  'use strict';
  
  // 앱 네임스페이스
  const FileToQR = window.FileToQR = window.FileToQR || {};
  
  // 컴포넌트 캐시
  const componentCache = new Map();
  
  // 컴포넌트 인스턴스 레지스트리
  const componentInstances = new Map();
  
  // 컴포넌트 클래스 레지스트리
  const componentClasses = new Map();
  
  // 컴포넌트 ID 카운터
  let componentIdCounter = 0;
  
  /**
   * 기본 컴포넌트 클래스
   * 모든 컴포넌트의 기본 클래스
   */
  class Component {
    /**
     * 컴포넌트 생성자
     * @param {Object} options - 컴포넌트 옵션
     */
    constructor(options = {}) {
      // 컴포넌트 ID
      this.id = options.id || `component-${++componentIdCounter}`;
      
      // 요소 참조
      this.element = null;
      
      // 부모 요소 참조
      this.parentElement = null;
      
      // 설정
      this.options = { ...options };
      
      // 상태
      this.state = {
        initialized: false,
        mounted: false
      };
      
      // 이벤트 핸들러
      this.eventHandlers = new Map();
    }
    
    /**
     * 컴포넌트 초기화
     * @param {Object} options - 초기화 옵션 (기본값: {})
     * @returns {Component} 메서드 체이닝을 위한 인스턴스 반환
     */
    init(options = {}) {
      // 이미 초기화된 경우
      if (this.state.initialized) {
        console.warn(`컴포넌트가 이미 초기화되었습니다: ${this.id}`);
        return this;
      }
      
      // 옵션 병합
      this.options = { ...this.options, ...options };
      
      // 초기화 훅 호출
      this.onInit();
      
      // 상태 업데이트
      this.state.initialized = true;
      
      return this;
    }
    
    /**
     * 컴포넌트 마운트
     * @param {HTMLElement|string} container - 컴포넌트를 마운트할 컨테이너
     * @returns {Component} 메서드 체이닝을 위한 인스턴스 반환
     */
    mount(container) {
      if (!this.state.initialized) {
        throw new Error('마운트하기 전에 컴포넌트를 초기화해야 합니다.');
      }
      
      // 컨테이너 선택자 처리
      if (typeof container === 'string') {
        this.parentElement = document.querySelector(container);
        if (!this.parentElement) {
          throw new Error(`컨테이너를 찾을 수 없습니다: ${container}`);
        }
      } else if (container instanceof HTMLElement) {
        this.parentElement = container;
      } else {
        throw new Error('유효한 컨테이너 요소 또는 선택자가 필요합니다.');
      }
      
      // 마운트 전 훅 호출
      this.onBeforeMount();
      
      // 렌더링
      const content = this.render();
      
      // 요소 생성
      if (typeof content === 'string') {
        // HTML 문자열 기반 렌더링
        const temp = document.createElement('div');
        temp.innerHTML = content.trim();
        this.element = temp.firstChild;
      } else if (content instanceof HTMLElement) {
        // 요소 기반 렌더링
        this.element = content;
      }
      
      // DOM에 요소 추가
      if (this.element) {
        this.element.setAttribute('data-component-id', this.id);
        this.parentElement.appendChild(this.element);
      }
      
      // 이벤트 바인딩
      this.bindEvents();
      
      // 마운트 후 훅 호출
      this.onMounted();
      
      // 상태 업데이트
      this.state.mounted = true;
      
      return this;
    }
    
    /**
     * 컴포넌트 언마운트
     * @returns {Component} 메서드 체이닝을 위한 인스턴스 반환
     */
    unmount() {
      if (!this.state.mounted) {
        return this;
      }
      
      // 언마운트 전 훅 호출
      this.onBeforeUnmount();
      
      // 이벤트 핸들러 해제
      this.unbindEvents();
      
      // DOM에서 요소 제거
      if (this.element && this.element.parentNode) {
        this.element.parentNode.removeChild(this.element);
      }
      
      // 상태 업데이트
      this.state.mounted = false;
      
      // 언마운트 후 훅 호출
      this.onUnmounted();
      
      return this;
    }
    
    /**
     * 컴포넌트 업데이트
     * @param {Object} newState - 새 상태 (기본값: {})
     * @returns {Component} 메서드 체이닝을 위한 인스턴스 반환
     */
    update(newState = {}) {
      if (!this.state.mounted) {
        return this;
      }
      
      // 상태 업데이트 전 훅 호출
      this.onBeforeUpdate(newState);
      
      // 요소 업데이트
      const newContent = this.render();
      if (typeof newContent === 'string') {
        // HTML 문자열 기반 업데이트
        const temp = document.createElement('div');
        temp.innerHTML = newContent.trim();
        const newElement = temp.firstChild;
        
        if (this.element && this.element.parentNode) {
          this.element.parentNode.replaceChild(newElement, this.element);
          this.element = newElement;
          this.element.setAttribute('data-component-id', this.id);
        }
      }
      
      // 이벤트 재바인딩
      this.unbindEvents();
      this.bindEvents();
      
      // 상태 업데이트 후 훅 호출
      this.onUpdated();
      
      return this;
    }
    
    /**
     * 컴포넌트 렌더링
     * @returns {string|HTMLElement} 렌더링된 HTML 문자열 또는 요소
     */
    render() {
      // 기본 구현은 빈 div 반환
      return `<div class="component" data-component-id="${this.id}"></div>`;
    }
    
    /**
     * 이벤트 바인딩
     */
    bindEvents() {
      // 하위 클래스에서 구현
    }
    
    /**
     * 이벤트 바인딩 해제
     */
    unbindEvents() {
      // 등록된 모든 이벤트 핸들러 해제
      this.eventHandlers.forEach((handlers, eventType) => {
        handlers.forEach(({ element, handler }) => {
          element.removeEventListener(eventType, handler);
        });
      });
      
      // 이벤트 핸들러 맵 초기화
      this.eventHandlers.clear();
    }
    
    /**
     * 이벤트 핸들러 등록
     * @param {HTMLElement} element - 이벤트를 등록할 요소
     * @param {string} eventType - 이벤트 유형
     * @param {Function} handler - 이벤트 핸들러
     * @param {Object} options - 이벤트 리스너 옵션 (기본값: {})
     */
    addEventListener(element, eventType, handler, options = {}) {
      if (!element || !(element instanceof HTMLElement)) {
        throw new Error('유효한 DOM 요소가 필요합니다.');
      }
      
      const boundHandler = handler.bind(this);
      element.addEventListener(eventType, boundHandler, options);
      
      // 이벤트 핸들러 등록
      if (!this.eventHandlers.has(eventType)) {
        this.eventHandlers.set(eventType, []);
      }
      
      this.eventHandlers.get(eventType).push({
        element,
        handler: boundHandler,
        original: handler
      });
    }
    
    // 라이프사이클 훅
    
    /** 초기화 시 호출 */
    onInit() {}
    
    /** 마운트 직전 호출 */
    onBeforeMount() {}
    
    /** 마운트 직후 호출 */
    onMounted() {}
    
    /** 언마운트 직전 호출 */
    onBeforeUnmount() {}
    
    /** 언마운트 직후 호출 */
    onUnmounted() {}
    
    /** 업데이트 직전 호출 */
    onBeforeUpdate(newState) {}
    
    /** 업데이트 직후 호출 */
    onUpdated() {}
  }
  
  /**
   * 컴포넌트 클래스 등록
   * @param {string} name - 컴포넌트 이름
   * @param {Class} componentClass - 컴포넌트 클래스
   * @returns {boolean} 등록 성공 여부
   */
  function registerComponent(name, componentClass) {
    if (componentClasses.has(name)) {
      console.warn(`컴포넌트 클래스가 이미 등록되어 있습니다: ${name}`);
      return false;
    }
    
    if (typeof componentClass !== 'function') {
      throw new Error('컴포넌트 클래스는 함수 또는 클래스여야 합니다.');
    }
    
    componentClasses.set(name, componentClass);
    console.log(`컴포넌트 클래스 등록 완료: ${name}`);
    
    return true;
  }
  
  /**
   * 컴포넌트 인스턴스 생성
   * @param {string} componentName - 컴포넌트 이름
   * @param {Object} options - 인스턴스 옵션 (기본값: {})
   * @returns {Component} 생성된 컴포넌트 인스턴스
   */
  function createComponent(componentName, options = {}) {
    if (!componentClasses.has(componentName)) {
      throw new Error(`등록된 컴포넌트를 찾을 수 없습니다: ${componentName}`);
    }
    
    const ComponentClass = componentClasses.get(componentName);
    const instance = new ComponentClass(options);
    
    // 인스턴스 등록
    componentInstances.set(instance.id, instance);
    
    return instance;
  }
  
  /**
   * 컴포넌트 인스턴스 가져오기
   * @param {string} id - 컴포넌트 ID
   * @returns {Component|null} 컴포넌트 인스턴스 또는 없을 경우 null
   */
  function getComponent(id) {
    return componentInstances.get(id) || null;
  }
  
  /**
   * HTML 컴포넌트 로드
   * @param {string} url - 컴포넌트 URL
   * @returns {Promise<string>} 로드된 HTML 문자열
   */
  async function loadComponentHtml(url) {
    if (componentCache.has(url)) {
      return componentCache.get(url);
    }
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to load component HTML: ${url} (${response.status} ${response.statusText})`);
      }
      const html = await response.text();
      componentCache.set(url, html);
      return html;
    } catch (error) {
      console.error(`Error loading component from ${url}:`, error);
      throw error; // Re-throw to be caught by caller
    }
  }
  
  /**
   * 지정된 셀렉터에 HTML 컴포넌트를 삽입하고 내부 스크립트를 실행합니다.
   * @param {string} selector - 컴포넌트를 삽입할 DOM 셀렉터
   * @param {string} url - 컴포넌트 HTML 파일의 URL
   * @param {string} [position='replace'] - 삽입 위치 ('replace', 'beforeend', 'afterbegin', 'beforebegin')
   * @returns {Promise<void>} 스크립트 실행 완료 후 resolve되는 Promise
   */
  async function insertComponent(selector, url, position = 'replace') {
    if (!selector || !url) {
      console.warn('insertComponent: selector 또는 url이 제공되지 않았습니다.');
      return Promise.reject(new Error('Selector or URL not provided for insertComponent'));
    }

    try {
      const html = await loadComponentHtml(url);
      const targetElement = document.querySelector(selector);

      if (!targetElement) {
        console.warn(`insertComponent: 대상 요소를 찾을 수 없음 (${selector})`);
        return Promise.reject(new Error(`Target element not found: ${selector}`));
      }

      // 삽입 위치에 따라 처리
      if (position === 'replace') {
        targetElement.innerHTML = html;
      } else if (position === 'beforeend') {
        targetElement.insertAdjacentHTML('beforeend', html);
      } else if (position === 'afterbegin') {
        targetElement.insertAdjacentHTML('afterbegin', html);
      } else {
        console.warn(`insertComponent: 유효하지 않은 삽입 위치 (${position})`);
        targetElement.innerHTML = html; // 기본값으로 replace
      }

      // 삽입된 HTML 내의 스크립트 처리
      // requestAnimationFrame을 사용하여 DOM 변경이 반영될 시간을 줍니다.
      await new Promise(resolve => requestAnimationFrame(resolve));

      const scripts = Array.from(targetElement.querySelectorAll('script'));
      const scriptPromises = [];

      scripts.forEach(originalScript => {
        // 인라인 스크립트와 외부 스크립트를 구분하지 않고 동일하게 처리
        // 새 script 요소를 만들어 기존 스크립트의 내용을 복사하고 DOM에 다시 추가하여 실행
        const newScript = document.createElement('script');
        
        // 스크립트 속성 복사 (src, type, async, defer 등)
        originalScript.getAttributeNames().forEach(attrName => {
          newScript.setAttribute(attrName, originalScript.getAttribute(attrName));
        });
        
        newScript.textContent = originalScript.textContent; // 인라인 스크립트 내용 복사

        // 스크립트 로드/실행 완료를 위한 Promise
        const scriptPromise = new Promise((resolve, reject) => {
          // 외부 스크립트의 경우 로드 완료 또는 오류를 기다림
          if (newScript.src) {
            newScript.onload = () => {
              console.log(`외부 스크립트 로드 완료: ${newScript.src} (컴포넌트: ${url})`);
              resolve();
            };
            newScript.onerror = (event) => {
              console.error(`외부 스크립트 로드 오류: ${newScript.src} (컴포넌트: ${url})`, event);
              reject(new Error(`Failed to load script: ${newScript.src} in component ${url}`));
            };
          } else {
            // 인라인 스크립트는 DOM에 추가되면 동기적으로 실행되는 경향이 있으나,
            // 만약을 위해 비동기 작업처럼 처리하고, 다음 프레임에서 resolve.
            // 이는 스크립트 내에서 DOM 조작 후 UI 변경이 반영될 시간을 주기도 합니다.
            requestAnimationFrame(() => {
                console.log(`인라인 스크립트 처리됨 (컴포넌트: ${url})`);
                resolve();
            });
          }
        });
        scriptPromises.push(scriptPromise);
        
        // 원본 스크립트를 새 스크립트로 교체하여 실행
        // (targetElement가 아닌 originalScript의 parentNode에 추가/교체해야 함)
        if (originalScript.parentNode) {
            originalScript.parentNode.replaceChild(newScript, originalScript);
        } else {
            // 스크립트가 최상위 요소일 경우 (드문 경우)
             console.warn(`스크립트의 부모 노드를 찾을 수 없습니다. 스크립트가 실행되지 않을 수 있습니다. (컴포넌트: ${url})`);
        }
      });
      
      // 모든 스크립트 실행이 완료될 때까지 대기
      await Promise.all(scriptPromises);
      
      // 추가로 DOM 업데이트 및 렌더링 주기를 한 번 더 기다립니다.
      // 스크립트 실행 후 발생할 수 있는 DOM 변경이 완전히 반영되도록 합니다.
      await new Promise(resolve => requestAnimationFrame(resolve));

      console.log(`컴포넌트 HTML 삽입 및 스크립트 실행 완료: ${selector} from ${url}`);

    } catch (error) {
      console.error(`insertComponent (${selector}, ${url}) 실패:`, error);
      throw error; // 오류를 다시 던져 호출자가 처리하도록 함
    }
  }
  
  /**
   * 기본 컴포넌트(헤더, 푸터 등)를 페이지에 로드하고 초기화합니다.
   * @async
   */
  async function loadDefaultComponents() {
    console.log('기본 컴포넌트(헤더/푸터) 로드 시작 (components.js)');
    const headerSelector = '#header-container'; // 헤더 컴포넌트가 삽입될 컨테이너 ID
    const footerSelector = '#footer-container'; // 푸터 컴포넌트가 삽입될 컨테이너 ID
    const headerUrl = '/components/header.html';
    const footerUrl = '/components/footer.html';

    try {
      const headerTarget = document.querySelector(headerSelector);
      const footerTarget = document.querySelector(footerSelector);

      let headerPromise = Promise.resolve();
      let footerPromise = Promise.resolve();

      if (headerTarget) {
        console.log(`[Components] Header container (${headerSelector}) found. Attempting to load header from ${headerUrl}`);
        headerPromise = insertComponent(headerSelector, headerUrl, 'replace')
          .then(() => {
            console.log('[Components] Header HTML loaded and scripts (if any) executed.');
            if (window.FileToQR && window.FileToQR.Header && typeof window.FileToQR.Header.initializeMobileMenuToggle === 'function') {
              console.log('[Components] Initializing mobile menu toggle for header...');
              window.FileToQR.Header.initializeMobileMenuToggle();
            } else {
              console.warn('[Components] window.FileToQR.Header.initializeMobileMenuToggle not found after header load.');
            }
            // activateNavLinks는 app-core.js에서 페이지별 컨텐츠 로드 전에 호출될 것이므로 여기서는 호출하지 않음
          })
          .catch(error => {
            console.error(`[Components] Failed to load or initialize header into ${headerSelector}:`, error);
          });
      } else {
        console.warn(`[Components] 기본 헤더를 삽입할 위치(${headerSelector})를 찾을 수 없습니다. HTML 구조를 확인하세요.`);
      }

      if (footerTarget) {
        console.log(`[Components] Footer container (${footerSelector}) found. Attempting to load footer from ${footerUrl}`);
        footerPromise = insertComponent(footerSelector, footerUrl, 'replace')
          .then(() => {
            console.log('[Components] Footer HTML loaded and scripts (if any) executed.');
            if (window.FileToQR && window.FileToQR.Footer && typeof window.FileToQR.Footer.initializeFooter === 'function') {
              console.log('[Components] Initializing footer specific logic...');
              window.FileToQR.Footer.initializeFooter();
            } else {
              console.warn('[Components] window.FileToQR.Footer.initializeFooter not found after footer load.');
            }
          })
          .catch(error => {
            console.error(`[Components] Failed to load or initialize footer into ${footerSelector}:`, error);
          });
      } else {
        console.warn(`[Components] 기본 푸터를 삽입할 위치(${footerSelector})를 찾을 수 없습니다. HTML 구조를 확인하세요.`);
      }

      // 두 작업이 모두 완료될 때까지 기다림 (성공/실패 여부와 관계없이)
      await Promise.allSettled([headerPromise, footerPromise]);

      if (!headerTarget && !footerTarget) {
        console.warn('로드할 기본 컴포넌트가 없거나, 대상 위치를 찾을 수 없습니다 (components.js).');
        // 헤더/푸터 로드 실패 시에도 시스템이 중단되지는 않도록 처리
      }
      console.log('기본 컴포넌트(헤더/푸터) 로드 시도 완료 (components.js).');

    } catch (error) {
      console.error('기본 컴포넌트(헤더/푸터) 로드 중 예기치 않은 오류 발생 (components.js):', error);
      // 여기서 throw를 하면 app-core.js의 전체 초기화가 중단될 수 있음. 이미 각 컴포넌트 로드 시 catch 있음.
    }
  }
  
  /**
   * 컴포넌트 시스템 초기화
   * @returns {Promise<void>}
   */
  async function init() {
    // 필요한 경우 초기화 로직 구현
    console.log('컴포넌트 시스템 초기화 완료');
  }
  
  // 컴포넌트 시스템 API
  FileToQR.components = {
    Component,
    register: registerComponent,
    create: createComponent,
    get: getComponent,
    load: loadComponentHtml,
    insert: insertComponent,
    loadDefault: loadDefaultComponents,
    init
  };
  // 명시적으로 window에 할당
  window.FileToQR = FileToQR;
  window.FileToQR.components = FileToQR.components;
  if (
    typeof window !== 'undefined' &&
    window.FileToQR &&
    window.FileToQR.components &&
    typeof window.FileToQR.components.init === 'function'
  ) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', window.FileToQR.components.init);
    } else {
      window.FileToQR.components.init();
    }
  } else {
    console.error('FileToQR.components.init 함수를 찾을 수 없습니다. components.js 로드 순서 또는 네임스페이스 할당을 확인하세요.');
  }
})(); 