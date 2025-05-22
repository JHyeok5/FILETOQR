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
    const targetElement = document.querySelector(selector);
    if (!targetElement) {
      console.error(`Target element not found for selector: ${selector}`);
      return Promise.reject(new Error(`Target element not found: ${selector}`));
    }

    try {
      const html = await loadComponentHtml(url);
      
      // HTML 삽입
      switch (position) {
        case 'beforeend':
          targetElement.insertAdjacentHTML('beforeend', html);
          break;
        case 'afterbegin':
          targetElement.insertAdjacentHTML('afterbegin', html);
          break;
        case 'beforebegin':
          targetElement.insertAdjacentHTML('beforebegin', html);
          break;
        case 'replace':
        default:
          targetElement.innerHTML = html;
          break;
      }
      
      // 삽입된 HTML 내의 스크립트 실행
      // innerHTML로 삽입된 스크립트는 자동 실행되지 않으므로, 새로운 script 엘리먼트를 만들어 교체합니다.
      const scripts = Array.from(targetElement.querySelectorAll("script"));
      const scriptPromises = scripts.map(script => {
        return new Promise((resolve, reject) => {
          const newScript = document.createElement("script");
          // Copy attributes (async, defer, type, etc.)
          Array.from(script.attributes).forEach(attr => {
            newScript.setAttribute(attr.name, attr.value);
          });

          if (script.src) {
            newScript.src = script.src; // Ensure src is set before onload/onerror
            newScript.onload = () => {
              console.log(`Script loaded: ${script.src}`);
              resolve();
            };
            newScript.onerror = (e) => {
              console.error(`Script failed to load: ${script.src}`, e);
              reject(new Error(`Script failed to load: ${script.src}`));
            };
          } else {
            newScript.textContent = script.textContent;
            // Inline scripts are executed when appended, but for consistency and potential async init inside them:
            // We consider them "loaded" immediately after appending,
            // unless they signal completion (e.g. via a custom event or global flag).
            // For this iteration, we assume inline scripts execute synchronously or manage their own async.
            // For header.html, we'll call its init functions explicitly later.
            resolve(); 
          }
          
          // Replace the old script tag with the new one to execute it
          script.parentNode.replaceChild(newScript, script);
          if (!script.src) {
             // For inline scripts, ensure they are executed. 
             // If they were already resolved, this doesn't re-resolve but ensures execution.
          }
        });
      });

      await Promise.all(scriptPromises);
      console.log(`All scripts in ${url} processed for selector ${selector}.`);

    } catch (error) {
      console.error(`Failed to insert component from ${url} into ${selector}:`, error);
      // 오류를 다시 던져서 호출자가 처리할 수 있도록 함
      throw error;
    }
  }
  
  /**
   * 기본 공통 컴포넌트(헤더, 푸터 등)를 로드하고 초기화합니다.
   * @returns {Promise<void>} 모든 컴포넌트 로드 및 초기화 완료 후 resolve
   */
  async function loadDefaultComponents() {
    console.log('기본 컴포넌트(헤더/푸터) 로드 시작 (components.js)');
    const headerSelector = 'body > header'; // 헤더 컴포넌트가 삽입될 기본 셀렉터
    const footerSelector = 'body > footer'; // 푸터 컴포넌트가 삽입될 기본 셀렉터
    const headerUrl = '/components/header.html';
    const footerUrl = '/components/footer.html';

    try {
      const headerTarget = document.querySelector(headerSelector);
      const footerTarget = document.querySelector(footerSelector);

      if (!headerTarget) {
        console.warn(`기본 헤더를 삽입할 위치(${headerSelector})를 찾을 수 없습니다. 건너<0xEB><0x9C><0x85>니다.`);
      }
      if (!footerTarget) {
        console.warn(`기본 푸터를 삽입할 위치(${footerSelector})를 찾을 수 없습니다. 건너<0xEB><0x9C><0x85>니다.`);
      }

      const loadPromises = [];

      if (headerTarget) {
        loadPromises.push(
          insertComponent(headerSelector, headerUrl, 'replace').then(() => {
            if (window.FileToQR && window.FileToQR.Header) {
              if (typeof window.FileToQR.Header.initializeMobileMenuToggle === 'function') {
                window.FileToQR.Header.initializeMobileMenuToggle();
                console.log('헤더 모바일 메뉴 초기화 완료.');
              }
              // activateNavLinks는 app-core.js의 i18n 초기화 이후에 호출되어야 올바른 링크가 활성화됨
              // 따라서 여기서는 호출하지 않음.
            }
          })
        );
      }

      if (footerTarget) {
        loadPromises.push(
          insertComponent(footerSelector, footerUrl, 'replace').then(() => {
            if (window.FileToQR && window.FileToQR.Footer && typeof window.FileToQR.Footer.initializeFooter === 'function') {
              window.FileToQR.Footer.initializeFooter();
              console.log('푸터 초기화 완료.');
            }
          })
        );
      }

      if (loadPromises.length > 0) {
        await Promise.all(loadPromises);
        console.log('모든 기본 컴포넌트(헤더/푸터) 로드 및 내부 스크립트 실행 완료 (components.js)');
      } else {
        console.log('로드할 기본 컴포넌트가 없거나, 대상 위치를 찾을 수 없습니다.');
      }

    } catch (error) {
      console.error('기본 컴포넌트 로드 중 심각한 오류 발생:', error);
      // UI에 오류 메시지를 표시하거나, 사용자에게 알리는 로직 추가 가능
      // throw error; // 필요에 따라 에러를 다시 던져 상위 호출자에게 전파
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