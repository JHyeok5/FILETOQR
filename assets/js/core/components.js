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

// 컴포넌트 시스템 API
const ComponentSystem = {
  register,
  init,
  mount,
  unmount,
  update,
  on: componentEvents.on.bind(componentEvents),
  off: componentEvents.off.bind(componentEvents),
  emit: componentEvents.emit.bind(componentEvents)
};

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
    // 캐시된 컴포넌트 있는지 확인
    if (componentCache.has(url)) {
      return componentCache.get(url);
    }
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`컴포넌트를 불러올 수 없습니다: ${url}`);
      }
      
      const html = await response.text();
      
      // 캐시에 저장
      componentCache.set(url, html);
      
      return html;
    } catch (error) {
      console.error('컴포넌트 로드 오류:', error);
      throw error;
    }
  }
  
  /**
   * 컴포넌트 삽입
   * @param {string} selector - 대상 요소 선택자
   * @param {string} url - 컴포넌트 URL
   * @param {string} position - 삽입 위치 ('replace', 'append', 'prepend', 'before', 'after')
   * @returns {Promise<boolean>} 삽입 성공 여부
   */
  async function insertComponent(selector, url, position = 'replace') {
    const targetElement = document.querySelector(selector);
    if (!targetElement) {
      console.error(`선택자와 일치하는 요소를 찾을 수 없습니다: ${selector}`);
      return false;
    }
    
    try {
      const html = await loadComponentHtml(url);
      
      // HTML 삽입
      switch (position) {
        case 'replace':
          targetElement.innerHTML = html;
          break;
        case 'append':
          targetElement.insertAdjacentHTML('beforeend', html);
          break;
        case 'prepend':
          targetElement.insertAdjacentHTML('afterbegin', html);
          break;
        case 'before':
          targetElement.insertAdjacentHTML('beforebegin', html);
          break;
        case 'after':
          targetElement.insertAdjacentHTML('afterend', html);
          break;
        default:
          targetElement.innerHTML = html;
      }
      
      // 스크립트 실행
      const scripts = targetElement.querySelectorAll('script');
      scripts.forEach(oldScript => {
        const newScript = document.createElement('script');
        
        // 속성 복사
        Array.from(oldScript.attributes).forEach(attr => 
          newScript.setAttribute(attr.name, attr.value)
        );
        
        // 내용 복사
        newScript.textContent = oldScript.textContent;
        
        // 교체
        oldScript.parentNode.replaceChild(newScript, oldScript);
      });
      
      return true;
    } catch (error) {
      console.error('컴포넌트 삽입 오류:', error);
      return false;
    }
  }
  
  /**
   * 기본 컴포넌트 로드 (헤더, 푸터 등)
   * @returns {Promise<void>}
   */
  async function loadDefaultComponents() {
    await insertComponent('header', '/components/header.html', 'replace');
    await insertComponent('footer', '/components/footer.html', 'replace');
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
  // 전역(window)에 명시적으로 노출
  if (typeof window !== 'undefined') {
    window.FileToQR = window.FileToQR || {};
    window.FileToQR.components = FileToQR.components;
  }
})(); 