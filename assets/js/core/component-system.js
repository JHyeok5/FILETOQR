/**
 * component-system.js - FileToQR 컴포넌트 시스템
 * 버전: 1.0.0
 * 최종 업데이트: 2025-06-15
 * 
 * 이 모듈은 FileToQR의 컴포넌트 시스템을 관리합니다:
 * - 컴포넌트 등록, 로드 및 렌더링
 * - 컴포넌트 간 통신
 * - 컴포넌트 생명주기 관리
 */

// 다른 모듈 임포트
import TemplateUtils from '../utils/template-utils.js';

// 컴포넌트 레지스트리
const componentRegistry = new Map();

// 컴포넌트 시스템
const ComponentSystem = {
  /**
   * 컴포넌트 등록
   * @param {string} name - 컴포넌트 이름
   * @param {Object} component - 컴포넌트 정의
   * @returns {boolean} 등록 성공 여부
   */
  register(name, component) {
    if (!name || !component) {
      console.warn('유효한 컴포넌트 이름과 정의가 필요합니다.');
      return false;
    }
    
    if (componentRegistry.has(name)) {
      console.warn(`컴포넌트 '${name}'가 이미 등록되어 있습니다.`);
      return false;
    }
    
    componentRegistry.set(name, component);
    console.log(`컴포넌트 '${name}' 등록 완료`);
    return true;
  },
  
  /**
   * 컴포넌트 조회
   * @param {string} name - 컴포넌트 이름
   * @returns {Object|null} 컴포넌트 정의 또는 없을 경우 null
   */
  getComponent(name) {
    return componentRegistry.get(name) || null;
  },
  
  /**
   * 등록된 모든 컴포넌트 조회
   * @returns {Array<string>} 컴포넌트 이름 목록
   */
  getAllComponentNames() {
    return Array.from(componentRegistry.keys());
  },
  
  /**
   * 컴포넌트 로드 및 렌더링
   * @param {string} name - 컴포넌트 이름
   * @param {HTMLElement|string} container - 컴포넌트를 렌더링할 컨테이너
   * @param {Object} props - 컴포넌트 속성 (선택사항)
   * @returns {Promise<Object|null>} 컴포넌트 인스턴스 또는 실패 시 null
   */
  async render(name, container, props = {}) {
    try {
      // 컴포넌트 정의 조회
      const component = this.getComponent(name);
      
      if (!component) {
        console.warn(`컴포넌트 '${name}'를 찾을 수 없습니다.`);
        return null;
      }
      
      // 컨테이너 확인
      const targetContainer = typeof container === 'string' ? 
        document.querySelector(container) : container;
      
      if (!targetContainer) {
        console.warn(`컴포넌트 '${name}'를 렌더링할 컨테이너를 찾을 수 없습니다.`);
        return null;
      }
      
      // 인스턴스 생성
      const instance = {
        name,
        props: { ...props },
        component,
        container: targetContainer,
        state: component.initialState ? { ...component.initialState } : {},
        setState: function(newState) {
          this.state = { ...this.state, ...newState };
          this.render();
          return this;
        },
        render: async function() {
          try {
            // 템플릿 로드
            const template = await TemplateUtils.getTemplate(this.component.template || `components/${name}.html`);
            
            if (!template) {
              throw new Error(`컴포넌트 '${name}' 템플릿을 로드할 수 없습니다.`);
            }
            
            // 랜더링 데이터 준비
            const renderData = {
              props: this.props,
              state: this.state
            };
            
            // 템플릿 처리
            const processedTemplate = TemplateUtils.processTemplate(template, renderData);
            
            // 컨테이너에 삽입
            this.container.innerHTML = processedTemplate;
            
            // 이벤트 연결
            if (this.component.attachEvents) {
              this.component.attachEvents(this.container, this);
            }
            
            return true;
          } catch (error) {
            console.error(`컴포넌트 '${name}' 렌더링 중 오류 발생:`, error);
            return false;
          }
        }
      };
      
      // 초기 렌더링
      await instance.render();
      
      // 마운트 이벤트 호출 (있는 경우)
      if (component.onMount) {
        component.onMount(instance);
      }
      
      return instance;
    } catch (error) {
      console.error(`컴포넌트 '${name}' 로드 중 오류 발생:`, error);
      return null;
    }
  },
  
  /**
   * 헤더 및 푸터와 같은 공통 컴포넌트 초기화
   * @returns {Promise<boolean>} 초기화 성공 여부
   */
  async initCommonComponents() {
    try {
      // 헤더 컴포넌트 로드
      const headerContainer = document.querySelector('header');
      if (headerContainer) {
        await TemplateUtils.loadComponent('header', headerContainer);
      }
      
      // 푸터 컴포넌트 로드
      const footerContainer = document.querySelector('footer');
      if (footerContainer) {
        await TemplateUtils.loadComponent('footer', footerContainer);
      }
      
      return true;
    } catch (error) {
      console.error('공통 컴포넌트 초기화 중 오류 발생:', error);
      return false;
    }
  },
  
  /**
   * 컴포넌트 시스템 초기화
   * @returns {Promise<boolean>} 초기화 성공 여부
   */
  async init() {
    try {
      console.log('컴포넌트 시스템 초기화 중...');
      
      // 공통 컴포넌트 초기화
      await this.initCommonComponents();
      
      console.log('컴포넌트 시스템 초기화 완료');
      return true;
    } catch (error) {
      console.error('컴포넌트 시스템 초기화 실패:', error);
      return false;
    }
  }
};

// 글로벌 네임스페이스에 등록
if (typeof window !== 'undefined') {
  window.FileToQR = window.FileToQR || {};
  window.FileToQR.ComponentSystem = ComponentSystem;
}

export default ComponentSystem; 