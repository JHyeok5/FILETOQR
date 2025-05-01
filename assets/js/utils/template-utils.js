/**
 * template-utils.js - FileToQR 템플릿 유틸리티
 * 버전: 1.0.0
 * 최종 업데이트: 2025-06-15
 * 
 * 이 모듈은 HTML 템플릿 조작 및 삽입을 위한 유틸리티 기능을 제공합니다:
 * - 컴포넌트 로드 및 삽입
 * - 템플릿 캐싱
 * - 동적 템플릿 조작
 */

// 템플릿 캐시
const templateCache = new Map();

// 템플릿 유틸리티
const TemplateUtils = {
  /**
   * 컴포넌트 로드 및 삽입
   * @param {string} componentName - 컴포넌트 이름 (파일명)
   * @param {HTMLElement|string} container - 컴포넌트를 삽입할 컨테이너 (DOM 요소 또는 선택자)
   * @param {Object} data - 템플릿에 전달할 데이터 (옵션)
   * @returns {Promise<boolean>} 로드 성공 여부
   */
  async loadComponent(componentName, container, data = {}) {
    try {
      // 컨테이너 확인
      const targetContainer = typeof container === 'string' ? 
        document.querySelector(container) : container;
      
      if (!targetContainer) {
        console.warn(`컴포넌트 '${componentName}'를 삽입할 컨테이너를 찾을 수 없습니다.`);
        return false;
      }
      
      // 템플릿 가져오기
      const template = await this.getTemplate(componentName);
      
      if (!template) {
        console.warn(`컴포넌트 '${componentName}' 템플릿을 로드할 수 없습니다.`);
        return false;
      }
      
      // 데이터로 템플릿 처리 (있는 경우)
      const processedTemplate = this.processTemplate(template, data);
      
      // 컨테이너에 삽입
      targetContainer.innerHTML = processedTemplate;
      
      // 스크립트 실행 (있는 경우)
      this.executeScripts(targetContainer);
      
      return true;
    } catch (error) {
      console.error(`컴포넌트 '${componentName}' 로드 중 오류 발생:`, error);
      return false;
    }
  },
  
  /**
   * 템플릿 가져오기 (캐시 사용)
   * @param {string} componentName - 컴포넌트 이름 (파일명)
   * @returns {Promise<string>} 템플릿 HTML
   */
  async getTemplate(componentName) {
    // 확장자가 없으면 .html 추가
    const fileName = componentName.endsWith('.html') ? 
      componentName : `${componentName}.html`;
    
    // 상대 경로 확인
    const path = fileName.includes('/') ? fileName : `/components/${fileName}`;
    
    // 캐시 확인
    if (templateCache.has(path)) {
      return templateCache.get(path);
    }
    
    try {
      // fetch를 사용하여 템플릿 가져오기
      const response = await fetch(path);
      
      if (!response.ok) {
        // 기본 경로 실패 시 다른 경로 시도
        const altPath = path.startsWith('/') ? path.substring(1) : `/${path}`;
        const altResponse = await fetch(altPath);
        
        if (!altResponse.ok) {
          throw new Error(`HTTP 오류: ${response.status} (원본), ${altResponse.status} (대체)`);
        }
        
        const template = await altResponse.text();
        templateCache.set(path, template);
        return template;
      }
      
      const template = await response.text();
      templateCache.set(path, template);
      return template;
    } catch (error) {
      console.error(`템플릿 '${path}' 로드 실패:`, error);
      return null;
    }
  },
  
  /**
   * 템플릿 데이터 처리
   * @param {string} template - 템플릿 HTML
   * @param {Object} data - 템플릿에 전달할 데이터
   * @returns {string} 처리된 템플릿
   */
  processTemplate(template, data) {
    if (!data || Object.keys(data).length === 0) {
      return template;
    }
    
    // 간단한 템플릿 처리: {{변수명}} 패턴 대체
    let processed = template;
    
    for (const [key, value] of Object.entries(data)) {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      processed = processed.replace(regex, value);
    }
    
    return processed;
  },
  
  /**
   * 삽입된 스크립트 실행
   * @param {HTMLElement} container - 스크립트가 포함된 컨테이너
   */
  executeScripts(container) {
    const scripts = container.querySelectorAll('script');
    
    scripts.forEach(oldScript => {
      const newScript = document.createElement('script');
      
      // 속성 복사
      Array.from(oldScript.attributes).forEach(attr => {
        newScript.setAttribute(attr.name, attr.value);
      });
      
      // 내용 복사
      newScript.textContent = oldScript.textContent;
      
      // 원본 스크립트 대체
      oldScript.parentNode.replaceChild(newScript, oldScript);
    });
  },
  
  /**
   * 템플릿 캐시 비우기
   * @param {string} [path] - 특정 템플릿 경로 (생략 시 모든 캐시 비움)
   */
  clearCache(path = null) {
    if (path) {
      templateCache.delete(path);
    } else {
      templateCache.clear();
    }
  }
};

// 글로벌 네임스페이스에 등록
if (typeof window !== 'undefined') {
  window.FileToQR = window.FileToQR || {};
  window.FileToQR.TemplateUtils = TemplateUtils;
}

export default TemplateUtils; 