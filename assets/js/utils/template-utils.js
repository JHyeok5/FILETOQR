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
   * @param {string} basePath - 기본 경로 (서브 디렉토리에서 호출 시 사용, 예: '../')
   * @param {Object} data - 템플릿에 전달할 데이터 (옵션)
   * @returns {Promise<boolean>} 로드 성공 여부
   */
  async loadComponent(componentName, container, basePath = '', data = {}) {
    try {
      console.log(`컴포넌트 로드 요청: '${componentName}', basePath: '${basePath}'`);
      
      // 컨테이너 확인
      const targetContainer = typeof container === 'string' ? 
        document.querySelector(container) : container;
      
      if (!targetContainer) {
        console.warn(`컴포넌트 '${componentName}'를 삽입할 컨테이너를 찾을 수 없습니다.`);
        return false;
      }
      
      // 데이터에 basePath 추가
      data.basePath = basePath || '';
      console.log(`컴포넌트 데이터 basePath: '${data.basePath}'`);
      
      // 템플릿 가져오기 - 여러 경로 패턴 시도
      let template = null;
      const possiblePaths = [
        // 확장자가 없는 경우 다양한 경로 패턴 시도
        componentName.endsWith('.html') ? `${basePath}${componentName}` : `${basePath}${componentName}.html`,
        componentName.endsWith('.html') ? `${basePath}${componentName}` : `${basePath}components/${componentName}.html`,
        componentName.includes('/') ? `${basePath}${componentName}` : `${basePath}components/${componentName}`
      ];
      
      console.log('시도할 경로 목록:', possiblePaths);
      
      // 가능한 모든 경로를 순차적으로 시도
      for (const path of possiblePaths) {
        try {
          console.log(`경로 '${path}' 시도 중...`);
          template = await this.getTemplate(path);
          if (template) {
            console.log(`컴포넌트 '${componentName}' 템플릿을 '${path}'에서 로드했습니다.`);
            break; // 성공하면 루프 종료
          }
        } catch (err) {
          // 개별 시도 실패는 무시하고 다음 경로 패턴으로 넘어갑니다
          console.debug(`경로 '${path}'에서 로드 실패, 다른 경로 시도 중...`, err);
        }
      }
      
      if (!template) {
        console.warn(`컴포넌트 '${componentName}' 템플릿을 로드할 수 없습니다.`);
        return false;
      }
      
      // 데이터로 템플릿 처리 (있는 경우)
      const processedTemplate = this.processTemplate(template, data);
      
      // 컨테이너에 삽입
      targetContainer.innerHTML = processedTemplate;
      console.log(`컴포넌트 '${componentName}' 삽입 완료`);
      
      // 스크립트 실행 (있는 경우)
      this.executeScripts(targetContainer);
      
      return true;
    } catch (error) {
      console.error(`컴포넌트 '${componentName}' 로드 중 오류 발생:`, error);
      return false;
    }
  },
  
  /**
   * 컴포넌트 템플릿 가져오기
   * @param {string} componentName - 컴포넌트 경로
   * @returns {Promise<string>} 템플릿 HTML
   */
  async getTemplate(componentName) {
    try {
      // 경로 정규화 - 이미 .html로 끝나는지 확인
      const templatePath = componentName.endsWith('.html') 
        ? componentName 
        : `${componentName}.html`;
      
      // 절대 경로 또는 상대 경로 처리
      const fullPath = templatePath.startsWith('/') 
        ? templatePath.substring(1) // 앞의 '/' 제거
        : templatePath;
        
      console.log(`템플릿 로드 시도: ${fullPath}`);
      
      // 캐시 방지를 위한 타임스탬프 추가
      const cacheBuster = `?_=${Date.now()}`;
      
      // 템플릿 가져오기
      const response = await fetch(fullPath + cacheBuster, {
        method: 'GET',
        headers: {
          'Content-Type': 'text/html',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        cache: 'no-store'
      });
      
      if (!response.ok) {
        console.error(`템플릿 로드 실패: ${response.status} ${response.statusText}, URL: ${fullPath}`);
        throw new Error(`템플릿 로드 실패: ${response.status} ${response.statusText}`);
      }
      
      const template = await response.text();
      console.log(`템플릿 로드 성공: ${fullPath}, 길이: ${template.length}자`);
      return template;
    } catch (error) {
      console.error(`템플릿 '${componentName}' 로드 중 오류 발생:`, error);
      throw error;
    }
  },
  
  /**
   * 템플릿 처리 (변수 교체)
   * @param {string} template - 처리할 템플릿
   * @param {Object} data - 삽입할 데이터
   * @returns {string} 처리된 템플릿
   */
  processTemplate(template, data = {}) {
    if (!template) return '';
    
    try {
      console.log('템플릿 처리 시작, 전달된 데이터:', data);
      
      // 기본 데이터 추가
      const processData = {
        timestamp: new Date().toISOString(),
        baseUrl: window.location.origin,
        currentPath: window.location.pathname,
        ...data
      };
      
      // 템플릿 변수 교체 ({{변수명}})
      let processed = template;
      
      // 모든 {{변수명}} 패턴 찾기
      const variablePattern = /\{\{([^}]+)\}\}/g;
      let match;
      
      while ((match = variablePattern.exec(template)) !== null) {
        const fullMatch = match[0]; // {{변수명}}
        const variableName = match[1].trim(); // 변수명
        
        console.log(`템플릿 변수 발견: ${fullMatch}, 변수명: ${variableName}`);
        
        // 변수 값 가져오기 (점 표기법 지원)
        let value = processData;
        const parts = variableName.split('.');
        
        try {
          for (const part of parts) {
            if (value === undefined || value === null) break;
            value = value[part];
          }
          
          // undefined나 null이면 빈 문자열로
          if (value === undefined || value === null) {
            console.log(`변수 '${variableName}'의 값이 없음, 빈 문자열로 대체`);
            value = '';
          }
          
          // 객체나 배열이면 JSON 문자열로 변환
          if (typeof value === 'object') {
            value = JSON.stringify(value);
          }
          
          console.log(`변수 '${variableName}' 값: ${value}`);
          
          // 변수 교체
          processed = processed.replace(fullMatch, value);
        } catch (err) {
          console.warn(`템플릿 변수 '${variableName}' 처리 중 오류:`, err);
          // 오류 발생 시 빈 문자열로 교체
          processed = processed.replace(fullMatch, '');
        }
      }
      
      return processed;
    } catch (error) {
      console.error('템플릿 처리 중 오류 발생:', error);
      return template; // 오류 시 원본 반환
    }
  },
  
  /**
   * 삽입된 스크립트 실행
   * @param {HTMLElement} container - 스크립트가 포함된 컨테이너
   */
  executeScripts(container) {
    const scripts = container.querySelectorAll('script');
    console.log(`${scripts.length}개의 스크립트 실행 시작`);
    
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
    console.log(`템플릿 캐시 비움${path ? ': ' + path : ' (전체)'}`);
  }
};

// 글로벌 네임스페이스에 등록
if (typeof window !== 'undefined') {
  window.FileToQR = window.FileToQR || {};
  window.FileToQR.TemplateUtils = TemplateUtils;
}

export default TemplateUtils; 