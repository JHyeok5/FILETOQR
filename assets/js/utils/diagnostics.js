/**
 * diagnostics.js - FileToQR 진단 유틸리티
 * 버전: 1.0.1
 * 최종 업데이트: 2025-06-15
 * 
 * 이 모듈은 FileToQR 프로젝트의 모듈 시스템 진단 기능을 제공합니다:
 * - 모듈 경로 검사
 * - 의존성 문제 진단
 * - 순환 참조 탐지
 */

// 진단 도구 네임스페이스
const Diagnostics = {
  /**
   * 모듈 시스템 진단
   * @returns {Promise<Object>} 진단 결과
   */
  async diagnoseModuleSystem() {
    // ModuleLoader 및 Registry 확인
    if (typeof window.FileToQR === 'undefined') {
      return {
        error: '진단 실패: FileToQR 네임스페이스를 찾을 수 없습니다.'
      };
    }

    const moduleLoader = window.FileToQR.utils?.moduleLoader;
    const registry = window.FileToQR.registry;
    
    const results = {
      timestamp: new Date().toISOString(),
      moduleLoaderVersion: moduleLoader ? '1.1.0' : 'Not found',
      registryVersion: registry ? registry.getModuleVersion('registry', 'core') || '1.3.0' : 'Not found',
      moduleLoaderDiagnosis: null,
      registryStatus: null,
      missingPaths: [],
      pathProblems: []
    };
    
    // ModuleLoader 진단
    if (moduleLoader && typeof moduleLoader.diagnose === 'function') {
      results.moduleLoaderDiagnosis = moduleLoader.diagnose();
    } else {
      results.moduleLoaderDiagnosis = { error: 'ModuleLoader.diagnose 함수를 찾을 수 없습니다.' };
    }
    
    // Registry 상태 확인
    if (registry) {
      const namespaces = registry.getNamespaces();
      const modules = {};
      
      for (const namespace of namespaces) {
        modules[namespace] = registry.getModules(namespace).map(m => ({
          id: m.id,
          name: m.name,
          hasMissingDependencies: m.metadata.hasMissingDependencies
        }));
      }
      
      results.registryStatus = {
        initialized: registry.isInitialized(),
        namespaces,
        moduleCount: registry.getModules().length,
        modules
      };
    }
    
    // 파일 경로 확인
    results.pathProblems = await this.checkModulePaths();
    
    return results;
  },
  
  /**
   * 모듈 경로 확인
   * @returns {Promise<Array>} 경로 문제 목록
   */
  async checkModulePaths() {
    const moduleLoader = window.FileToQR.utils?.moduleLoader;
    const registry = window.FileToQR.registry;
    const problems = [];
    
    if (!moduleLoader || !registry) {
      return [{ error: 'ModuleLoader 또는 Registry를 찾을 수 없습니다.' }];
    }
    
    try {
      // Registry에 등록된 모든 모듈 확인
      const allModules = registry.getModules();
      
      for (const moduleInfo of allModules) {
        const { namespace, name } = moduleInfo.metadata;
        
        // ModuleLoader의 경로 추정 사용
        const estimatedPath = moduleLoader._guessModulePath(namespace, name);
        
        if (!estimatedPath) {
          problems.push({
            moduleId: `${namespace}.${name}`,
            type: 'PATH_ESTIMATION_FAILED',
            message: `모듈 ${namespace}.${name}에 대한 경로 추정 실패`
          });
          continue;
        }
        
        // 실제 파일 확인 (간접적 방법)
        try {
          const testImport = await this.testModuleImport(estimatedPath);
          if (!testImport.success) {
            problems.push({
              moduleId: `${namespace}.${name}`,
              type: 'FILE_NOT_FOUND',
              estimatedPath,
              message: `모듈 ${namespace}.${name}의 추정 경로 ${estimatedPath}에서 파일을 찾을 수 없습니다.`,
              error: testImport.error
            });
          }
        } catch (error) {
          problems.push({
            moduleId: `${namespace}.${name}`,
            type: 'IMPORT_ERROR',
            estimatedPath,
            message: `모듈 ${namespace}.${name} 임포트 중 오류 발생`,
            error: error.message
          });
        }
      }
    } catch (error) {
      problems.push({
        type: 'CHECK_ERROR',
        message: '모듈 경로 확인 중 오류 발생',
        error: error.message
      });
    }
    
    return problems;
  },
  
  /**
   * 모듈 임포트 테스트
   * @param {string} path - 모듈 경로
   * @returns {Promise<Object>} 테스트 결과
   */
  async testModuleImport(path) {
    try {
      // 경로가 .js로 끝나지 않으면 추가
      const fullPath = path.endsWith('.js') ? path : `${path}.js`;
      
      // 상대 경로 확인 및 경로 정규화
      const importPath = fullPath.startsWith('/') ? 
        fullPath : // 이미 절대 경로면 그대로 사용
        (fullPath.startsWith('./') ? fullPath : `./${fullPath}`); // 상대 경로로 변환
      
      // 동적 임포트 시도
      await import(importPath);
      
      return { success: true, path: fullPath };
    } catch (error) {
      // 첫 시도 실패 시 대체 경로 시도
      try {
        const altPath = path.startsWith('/') ? path.substring(1) : `/${path}`;
        const altFullPath = altPath.endsWith('.js') ? altPath : `${altPath}.js`;
        
        await import(altFullPath);
        return { success: true, path: altFullPath };
      } catch (altError) {
        return { 
          success: false, 
          path,
          error: error.message,
          altError: altError.message
        };
      }
    }
  },
  
  /**
   * 진단 결과 표시
   * @param {Object} results - 진단 결과
   * @returns {string} HTML 형식의 진단 결과
   */
  formatResults(results) {
    if (!results) return '<p>진단 결과가 없습니다.</p>';
    
    let html = `
      <div class="diagnostic-results">
        <h3>모듈 시스템 진단 결과 (${results.timestamp})</h3>
        <p>ModuleLoader 버전: ${results.moduleLoaderVersion}</p>
        <p>Registry 버전: ${results.registryVersion}</p>
        
        <h4>경로 문제</h4>
        <div class="path-problems">
    `;
    
    if (results.pathProblems.length === 0) {
      html += '<p>발견된 경로 문제가 없습니다.</p>';
    } else {
      html += '<ul>';
      for (const problem of results.pathProblems) {
        html += `<li>
          <strong>${problem.moduleId || 'Unknown'}</strong>: 
          ${problem.message} 
          ${problem.estimatedPath ? `(경로: ${problem.estimatedPath})` : ''}
        </li>`;
      }
      html += '</ul>';
    }
    
    html += '</div>'; // 경로 문제 끝
    
    // 순환 참조 문제
    if (results.moduleLoaderDiagnosis && results.moduleLoaderDiagnosis.circularDependencies) {
      html += '<h4>순환 참조</h4><div class="circular-deps">';
      
      const circulars = results.moduleLoaderDiagnosis.circularDependencies;
      if (!circulars || circulars.length === 0) {
        html += '<p>순환 참조가 발견되지 않았습니다.</p>';
      } else {
        html += '<ul>';
        for (const circular of circulars) {
          html += `<li>
            시작 모듈: <strong>${circular.startModule}</strong>
            <br>순환 경로: ${circular.cycles.map(c => c.join(' → ')).join(', ')}
          </li>`;
        }
        html += '</ul>';
      }
      
      html += '</div>'; // 순환 참조 끝
    }
    
    // Registry 상태
    if (results.registryStatus) {
      html += `
        <h4>Registry 상태</h4>
        <div class="registry-status">
          <p>초기화 완료: ${results.registryStatus.initialized ? '예' : '아니오'}</p>
          <p>네임스페이스: ${results.registryStatus.namespaces.join(', ')}</p>
          <p>총 모듈 수: ${results.registryStatus.moduleCount}</p>
        </div>
      `;
    }
    
    html += '</div>'; // 진단 결과 끝
    
    return html;
  },
  
  /**
   * UI에 진단 결과 표시
   * @param {HTMLElement} container - 결과를 표시할 컨테이너
   */
  async showDiagnosticsUI(container) {
    if (!container) {
      container = document.createElement('div');
      container.id = 'module-diagnostics';
      container.style.cssText = `
        position: fixed;
        top: 10%;
        left: 10%;
        width: 80%;
        height: 80%;
        background: white;
        border: 1px solid #ccc;
        border-radius: 5px;
        box-shadow: 0 0 15px rgba(0,0,0,0.2);
        z-index: 9999;
        overflow: auto;
        padding: 20px;
      `;
      
      const closeBtn = document.createElement('button');
      closeBtn.textContent = '닫기';
      closeBtn.style.cssText = `
        position: absolute;
        top: 10px;
        right: 10px;
        padding: 5px 10px;
      `;
      closeBtn.addEventListener('click', () => container.remove());
      
      container.appendChild(closeBtn);
      document.body.appendChild(container);
    }
    
    container.innerHTML += '<p>모듈 시스템 진단 중...</p>';
    
    try {
      const results = await this.diagnoseModuleSystem();
      const resultsHTML = this.formatResults(results);
      
      // 이전 결과를 지우고 새 결과 표시
      container.innerHTML = '';
      const contentDiv = document.createElement('div');
      contentDiv.innerHTML = resultsHTML;
      container.appendChild(contentDiv);
      
      // 닫기 버튼 추가
      const closeBtn = document.createElement('button');
      closeBtn.textContent = '닫기';
      closeBtn.style.cssText = `
        position: absolute;
        top: 10px;
        right: 10px;
        padding: 5px 10px;
      `;
      closeBtn.addEventListener('click', () => container.remove());
      container.appendChild(closeBtn);
    } catch (error) {
      container.innerHTML += `<p>진단 중 오류 발생: ${error.message}</p>`;
    }
  }
};

// 글로벌 네임스페이스에 등록 - 순환 참조 방지를 위해 등록 방식 수정
if (typeof window !== 'undefined') {
  window.FileToQR = window.FileToQR || {};
  // 기존 객체를 덮어쓰지 않도록 확인
  if (!window.FileToQR.Diagnostics) {
    window.FileToQR.Diagnostics = Diagnostics;
  }
}

export default Diagnostics; 