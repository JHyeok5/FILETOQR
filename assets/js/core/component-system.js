/**
 * component-system.js - FileToQR 컴포넌트 시스템
 * 버전: 1.0.0
 * 최종 업데이트: 2025-06-15
 * 
 * 이 모듈은 FileToQR의 컴포넌트 시스템을 구현합니다:
 * - 컴포넌트 정의, 등록, 마운트, 업데이트, 언마운트 기능
 * - 이벤트 핸들링
 * - 상태 관리
 * - HTML 템플릿 렌더링
 */

// 컴포넌트 시스템 네임스페이스
const ComponentSystem = {
  // 등록된 컴포넌트 저장소
  registry: new Map(),
  
  // 마운트된 컴포넌트 인스턴스
  instances: new Map(),
  
  /**
   * 컴포넌트 정의
   * @param {string} name - 컴포넌트 이름
   * @param {Object} definition - 컴포넌트 정의 객체
   * @returns {Object} 등록된 컴포넌트 정의
   */
  defineComponent(name, definition) {
    if (this.registry.has(name)) {
      console.warn(`컴포넌트 "${name}"이(가) 이미 등록되어 있습니다.`);
    }
    
    // 기본 라이프사이클 메서드 추가
    const component = {
      name,
      version: definition.version || '1.0.0',
      // 기본 라이프사이클 메서드
      onCreate: definition.onCreate || function() {},
      onMount: definition.onMount || function() {},
      onUpdate: definition.onUpdate || function() {},
      onDestroy: definition.onDestroy || function() {},
      // 템플릿 렌더링 함수
      render: definition.render || function() { return ''; },
      // 상태 초기화
      initialState: definition.initialState || {},
      // 메서드 복사
      ...definition.methods
    };
    
    this.registry.set(name, component);
    console.log(`컴포넌트 "${name}" 버전 ${component.version} 등록됨`);
    return component;
  },
  
  /**
   * 컴포넌트 생성 및 마운트
   * @param {string} name - 컴포넌트 이름
   * @param {HTMLElement} container - 마운트할 컨테이너 요소
   * @param {Object} props - 컴포넌트에 전달할 속성
   * @returns {string} 인스턴스 ID
   */
  mountComponent(name, container, props = {}) {
    if (!this.registry.has(name)) {
      console.error(`컴포넌트 "${name}"이(가) 등록되지 않았습니다.`);
      return null;
    }
    
    const definition = this.registry.get(name);
    const instanceId = `${name}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    
    // 인스턴스 생성
    const instance = {
      id: instanceId,
      definition,
      container,
      props,
      state: { ...definition.initialState },
      eventListeners: []
    };
    
    // 인스턴스 저장
    this.instances.set(instanceId, instance);
    
    // 생성 라이프사이클 호출
    definition.onCreate.call(instance, props);
    
    // 렌더링
    this._renderComponent(instance);
    
    // 마운트 라이프사이클 호출
    definition.onMount.call(instance, container);
    
    return instanceId;
  },
  
  /**
   * 컴포넌트 업데이트
   * @param {string} instanceId - 컴포넌트 인스턴스 ID
   * @param {Object} newProps - 새 속성
   * @param {boolean} forceUpdate - 강제 업데이트 여부
   */
  updateComponent(instanceId, newProps = {}, forceUpdate = false) {
    if (!this.instances.has(instanceId)) {
      console.error(`인스턴스 ID "${instanceId}"를 찾을 수 없습니다.`);
      return;
    }
    
    const instance = this.instances.get(instanceId);
    const oldProps = instance.props;
    
    // props 업데이트
    instance.props = { ...instance.props, ...newProps };
    
    // 변경사항 확인
    const hasChanged = forceUpdate || JSON.stringify(oldProps) !== JSON.stringify(instance.props);
    
    if (hasChanged) {
      // 업데이트 라이프사이클 호출
      instance.definition.onUpdate.call(instance, oldProps, instance.props);
      
      // 재렌더링
      this._renderComponent(instance);
    }
  },
  
  /**
   * 컴포넌트 언마운트
   * @param {string} instanceId - 컴포넌트 인스턴스 ID
   */
  unmountComponent(instanceId) {
    if (!this.instances.has(instanceId)) {
      console.error(`인스턴스 ID "${instanceId}"를 찾을 수 없습니다.`);
      return;
    }
    
    const instance = this.instances.get(instanceId);
    
    // 이벤트 리스너 제거
    this._removeAllEventListeners(instance);
    
    // 소멸 라이프사이클 호출
    instance.definition.onDestroy.call(instance);
    
    // 컨테이너 비우기
    instance.container.innerHTML = '';
    
    // 인스턴스 제거
    this.instances.delete(instanceId);
  },
  
  /**
   * 컴포넌트 렌더링
   * @private
   * @param {Object} instance - 컴포넌트 인스턴스
   */
  _renderComponent(instance) {
    // 이전 이벤트 리스너 정리
    this._removeAllEventListeners(instance);
    
    // 템플릿 렌더링
    const html = instance.definition.render.call(instance, instance.props, instance.state);
    instance.container.innerHTML = html;
    
    // 이벤트 리스너 추가 (data-event 속성 처리)
    this._registerEventListeners(instance);
  },
  
  /**
   * 컴포넌트 상태 설정
   * @param {string} instanceId - 컴포넌트 인스턴스 ID
   * @param {Function|Object} updater - 상태 업데이트 함수 또는 객체
   */
  setState(instanceId, updater) {
    if (!this.instances.has(instanceId)) {
      console.error(`인스턴스 ID "${instanceId}"를 찾을 수 없습니다.`);
      return;
    }
    
    const instance = this.instances.get(instanceId);
    const oldState = { ...instance.state };
    
    // 상태 업데이트
    if (typeof updater === 'function') {
      instance.state = { ...instance.state, ...updater(oldState) };
    } else {
      instance.state = { ...instance.state, ...updater };
    }
    
    // 변경사항 확인
    const hasChanged = JSON.stringify(oldState) !== JSON.stringify(instance.state);
    
    if (hasChanged) {
      // 재렌더링
      this._renderComponent(instance);
    }
  },
  
  /**
   * 이벤트 리스너 등록
   * @private
   * @param {Object} instance - 컴포넌트 인스턴스
   */
  _registerEventListeners(instance) {
    const elements = instance.container.querySelectorAll('[data-event]');
    
    elements.forEach(element => {
      const eventInfo = element.dataset.event.split(':');
      if (eventInfo.length !== 2) return;
      
      const [eventName, methodName] = eventInfo;
      
      if (typeof instance.definition[methodName] !== 'function') {
        console.warn(`컴포넌트 "${instance.definition.name}"에 메서드 "${methodName}"이(가) 없습니다.`);
        return;
      }
      
      const handler = (event) => {
        instance.definition[methodName].call(instance, event, instance.props, instance.state);
      };
      
      element.addEventListener(eventName, handler);
      
      // 이벤트 리스너 추적 (나중에 정리 위함)
      instance.eventListeners.push({
        element,
        eventName,
        handler
      });
    });
  },
  
  /**
   * 모든 이벤트 리스너 제거
   * @private
   * @param {Object} instance - 컴포넌트 인스턴스
   */
  _removeAllEventListeners(instance) {
    instance.eventListeners.forEach(({ element, eventName, handler }) => {
      element.removeEventListener(eventName, handler);
    });
    
    instance.eventListeners = [];
  }
};

// 레지스트리에 등록
if (typeof window.FileToQR === 'undefined') {
  window.FileToQR = {};
}

window.FileToQR.ComponentSystem = ComponentSystem;

// 모듈 내보내기
export default ComponentSystem; 