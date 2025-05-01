/**
 * module-loader.js - FileToQR 모듈 로딩 유틸리티
 * 버전: 1.1.0
 * 최종 업데이트: 2025-06-15
 * 참조: ../../docs/architecture/module-registry.md
 * 
 * 이 모듈은 동적 모듈 로딩, 의존성 관리, 비동기 모듈 초기화를 담당합니다:
 * - ES 모듈 동적 로드
 * - 의존성 자동 해결
 * - 모듈 초기화 프로세스 관리
 */

// 모듈 로더 변수 선언
let ModuleLoader;

// 즉시 실행 함수로 네임스페이스 보호
(function() {
  'use strict';
  
  // 앱 네임스페이스
  const FileToQR = window.FileToQR = window.FileToQR || {};
  
  // 내부 상태 및 설정
  const _state = {
    baseUrl: '',
    aliases: {}, // 모듈 경로 별칭
    loadingModules: new Map(), // 로딩 중인 모듈 추적
    loadedModules: new Set(), // 로드된 모듈 추적
    initializingModules: new Set(), // 초기화 중인 모듈 추적
    registeredModules: new Map(), // 모듈 ID와 의존성 정보 저장
    defaultTimeout: 10000, // 기본 타임아웃 (10초)
    maxRetries: 2, // 실패 시 최대 재시도 횟수
    retryDelay: 1000, // 재시도 간격 (ms)
    maxDepth: 10 // 최대 의존성 깊이
  };
  
  // 오류 유형 정의
  const ErrorTypes = {
    MODULE_LOAD_ERROR: 'MODULE_LOAD_ERROR',
    MODULE_INIT_ERROR: 'MODULE_INIT_ERROR',
    CIRCULAR_DEPENDENCY: 'CIRCULAR_DEPENDENCY',
    TIMEOUT_ERROR: 'TIMEOUT_ERROR',
    DEPENDENCY_ERROR: 'DEPENDENCY_ERROR'
  };
  
  // 모듈 로더 유틸리티
  ModuleLoader = {};
  
  /**
   * 초기화 및 설정
   * @param {Object} config - 설정 객체
   * @param {string} config.baseUrl - 모듈 기본 URL
   * @param {Object} config.aliases - 모듈 경로 별칭
   * @param {number} config.timeout - 기본 타임아웃 (ms)
   * @param {number} config.maxRetries - 최대 재시도 횟수
   * @param {number} config.retryDelay - 재시도 간격 (ms)
   * @param {number} config.maxDepth - 최대 의존성 깊이
   */
  ModuleLoader.configure = function(config = {}) {
    if (config.baseUrl) {
      _state.baseUrl = config.baseUrl.endsWith('/') ? config.baseUrl : config.baseUrl + '/';
    }
    
    if (config.aliases && typeof config.aliases === 'object') {
      _state.aliases = { ..._state.aliases, ...config.aliases };
    }
    
    if (typeof config.timeout === 'number' && config.timeout > 0) {
      _state.defaultTimeout = config.timeout;
    }
    
    if (typeof config.maxRetries === 'number' && config.maxRetries >= 0) {
      _state.maxRetries = config.maxRetries;
    }
    
    if (typeof config.retryDelay === 'number' && config.retryDelay > 0) {
      _state.retryDelay = config.retryDelay;
    }
    
    if (typeof config.maxDepth === 'number' && config.maxDepth > 0) {
      _state.maxDepth = config.maxDepth;
    }
    
    return ModuleLoader;
  };
  
  /**
   * 모듈 별칭 설정
   * @param {string} alias - 모듈 별칭
   * @param {string} path - 실제 모듈 경로
   */
  ModuleLoader.setAlias = function(alias, path) {
    _state.aliases[alias] = path;
    return ModuleLoader;
  };
  
  /**
   * 모듈 경로 해석
   * @param {string} modulePath - 모듈 경로 (별칭 포함 가능)
   * @returns {string} 실제 모듈 경로
   * @private
   */
  ModuleLoader._resolvePath = function(modulePath) {
    // 별칭 확인
    for (const [alias, path] of Object.entries(_state.aliases)) {
      if (modulePath.startsWith(alias + '/')) {
        modulePath = modulePath.replace(alias + '/', path);
        break;
      } else if (modulePath === alias) {
        modulePath = path;
        break;
      }
    }
    
    // 상대 경로를 절대 경로로 변환
    if (!modulePath.startsWith('http') && !modulePath.startsWith('/')) {
      modulePath = _state.baseUrl + modulePath;
    }
    
    // .js 확장자 추가 (필요한 경우)
    if (!modulePath.endsWith('.js') && !modulePath.includes('?')) {
      modulePath += '.js';
    }
    
    return modulePath;
  };
  
  /**
   * 모듈 등록
   * @param {string} moduleId - 모듈 ID
   * @param {string} path - 모듈 경로
   * @param {Array<string>} dependencies - 의존성 모듈 ID 목록
   * @param {Object} options - 추가 옵션
   */
  ModuleLoader.registerModule = function(moduleId, path, dependencies = [], options = {}) {
    // 기존 등록 확인
    if (_state.registeredModules.has(moduleId)) {
      const existing = _state.registeredModules.get(moduleId);
      
      // 동일한 경로인 경우 의존성만 업데이트
      if (existing.path === path) {
        // 기존 의존성과 병합
        const mergedDeps = [...new Set([...existing.dependencies, ...dependencies])];
        
        _state.registeredModules.set(moduleId, {
          ...existing,
          dependencies: mergedDeps,
          options: { ...existing.options, ...options }
        });
        
        console.log(`모듈 의존성 업데이트: ${moduleId}`);
        return ModuleLoader;
      }
      
      console.warn(`모듈 ID 충돌: ${moduleId}. 경로 다름: ${existing.path} vs ${path}`);
    }
    
    // 새 모듈 등록
    _state.registeredModules.set(moduleId, {
      path,
      dependencies,
      options,
      registeredAt: new Date()
    });
    
    return ModuleLoader;
  };
  
  /**
   * 모듈의 의존성 가져오기
   * @param {string} moduleId - 모듈 ID
   * @returns {Array<string>} 의존성 목록
   */
  ModuleLoader.getDependencies = function(moduleId) {
    const moduleInfo = _state.registeredModules.get(moduleId);
    return moduleInfo ? moduleInfo.dependencies : [];
  };
  
  /**
   * 모듈 의존성 트리 검사
   * @param {string} moduleId - 시작 모듈 ID
   * @returns {Object} 의존성 트리와 순환 참조 정보
   */
  ModuleLoader.checkDependencyTree = function(moduleId) {
    const visited = new Set();
    const path = [];
    const circular = [];
    
    const buildTree = (id, depth = 0) => {
      // 깊이 제한 확인
      if (depth > _state.maxDepth) {
        return { id, dependencies: {}, tooDeep: true };
      }
      
      // 순환 참조 확인
      if (path.includes(id)) {
        const cycle = [...path.slice(path.indexOf(id)), id];
        circular.push(cycle);
        return { id, circular: true, cycle };
      }
      
      // 이미 방문한 노드 확인
      if (visited.has(id)) {
        return { id, dependencies: {}, visited: true };
      }
      
      // 등록되지 않은 모듈 확인
      const moduleInfo = _state.registeredModules.get(id);
      if (!moduleInfo) {
        return { id, missing: true };
      }
      
      // 경로 및 방문 기록 업데이트
      visited.add(id);
      path.push(id);
      
      // 의존성 트리 구축
      const dependencies = {};
      for (const depId of moduleInfo.dependencies) {
        dependencies[depId] = buildTree(depId, depth + 1);
      }
      
      // 현재 노드 경로에서 제거
      path.pop();
      
      return {
        id,
        path: moduleInfo.path,
        dependencies,
        depth
      };
    };
    
    return {
      tree: buildTree(moduleId),
      circular: circular.length > 0 ? circular : null
    };
  };
  
  /**
   * 단일 모듈 로드
   * @param {string} modulePath - 모듈 경로
   * @param {Object} options - 로드 옵션
   * @param {number} options.timeout - 타임아웃 (ms)
   * @param {boolean} options.init - 로드 후 초기화 여부
   * @param {boolean} options.retry - 실패 시 재시도 여부
   * @param {number} options.retries - 현재 재시도 횟수
   * @param {boolean} options.forceDependencies - 의존성 강제 로드 여부
   * @param {Array<string>} options.visited - 이미 방문한 모듈 (순환 참조 방지)
   * @returns {Promise<Object>} 로드된 모듈
   */
  ModuleLoader.loadModule = async function(modulePath, options = {}) {
    const resolvedPath = ModuleLoader._resolvePath(modulePath);
    const defaultOptions = { 
      timeout: _state.defaultTimeout, 
      init: true,
      retry: true,
      retries: 0,
      forceDependencies: false,
      visited: []
    };
    options = { ...defaultOptions, ...options };
    
    // 순환 참조 감지
    if (options.visited.includes(resolvedPath)) {
      console.warn(`순환 의존성 감지: ${resolvedPath}`);
      return Promise.reject(new Error(`순환 의존성 감지: ${resolvedPath}`));
    }
    
    // 방문 기록 업데이트
    const newVisited = [...options.visited, resolvedPath];
    
    // 이미 로드된 모듈 확인
    if (_state.loadedModules.has(resolvedPath) && !options.forceDependencies) {
      console.log(`이미 로드된 모듈 사용: ${modulePath}`);
      return Promise.resolve(null); // null 반환하여 이미 로드되었음을 표시
    }
    
    // 이미 로딩 중인 모듈 확인
    if (_state.loadingModules.has(resolvedPath)) {
      return _state.loadingModules.get(resolvedPath);
    }
    
    // 로딩 프로세스 생성
    const loadPromise = new Promise(async (resolve, reject) => {
      // 타임아웃 설정
      const timeoutId = setTimeout(() => {
        reject(new Error(`모듈 로딩 타임아웃: ${modulePath}`));
      }, options.timeout);
      
      try {
        // 동적 임포트
        const module = await import(resolvedPath);
        
        // 타임아웃 취소
        clearTimeout(timeoutId);
        
        // 의존성 처리
        try {
          const moduleId = ModuleLoader._getModuleIdFromPath(resolvedPath);
          
          if (moduleId && options.init) {
            // 모듈 의존성 로드 (순환 참조 방지)
            await ModuleLoader._loadModuleDependencies(moduleId, {
              ...options,
              visited: newVisited
            });
          }
          
          // 모듈 초기화 (init 메서드가 있고 options.init이 true인 경우)
          if (options.init && module.default && typeof module.default.init === 'function') {
            // 모듈이 이미 초기화 중인지 확인
            if (_state.initializingModules.has(resolvedPath)) {
              console.warn(`모듈 ${modulePath}가 이미 초기화 중입니다.`);
            } else {
              _state.initializingModules.add(resolvedPath);
              
              try {
                // 모듈 초기화
                await module.default.init();
              } catch (initError) {
                console.error(`모듈 초기화 실패: ${modulePath}`, initError);
                throw initError;
              } finally {
                _state.initializingModules.delete(resolvedPath);
              }
            }
          }
        } catch (depError) {
          console.warn(`의존성 처리 중 오류 (무시됨): ${modulePath}`, depError);
          // 의존성 오류는 모듈 로드 실패로 처리하지 않음
        }
        
        // 로딩 완료
        _state.loadedModules.add(resolvedPath);
        resolve(module.default);
      } catch (error) {
        // 타임아웃 취소
        clearTimeout(timeoutId);
        
        console.error(`모듈 로딩 실패: ${modulePath}`, error);
        
        // 재시도 로직
        if (options.retry && options.retries < _state.maxRetries) {
          console.log(`모듈 로딩 재시도 (${options.retries + 1}/${_state.maxRetries}): ${modulePath}`);
          
          setTimeout(async () => {
            try {
              const result = await ModuleLoader.loadModule(modulePath, {
                ...options,
                retries: options.retries + 1
              });
              resolve(result);
            } catch (retryError) {
              reject(retryError);
            }
          }, _state.retryDelay);
        } else {
          reject(error);
        }
      } finally {
        // 로딩 상태 정리
        _state.loadingModules.delete(resolvedPath);
      }
    });
    
    // 로딩 상태 추적
    _state.loadingModules.set(resolvedPath, loadPromise);
    
    return loadPromise;
  };
  
  /**
   * 모듈 의존성 로드
   * @param {string} moduleId - 모듈 ID
   * @param {Object} options - 로드 옵션
   * @returns {Promise<Array>} 로드된 의존성 배열
   * @private
   */
  ModuleLoader._loadModuleDependencies = async function(moduleId, options = {}) {
    const dependencies = ModuleLoader.getDependencies(moduleId);
    if (!dependencies || dependencies.length === 0) {
      return [];
    }
    
    const results = [];
    
    // 각 의존성 로드
    for (const depId of dependencies) {
      try {
        // 모듈 정보 확인
        const depInfo = _state.registeredModules.get(depId);
        
        if (!depInfo) {
          console.warn(`등록되지 않은 의존성: ${depId}`);
          continue;
        }
        
        // 의존성이 이미 방문된 경우 순환 참조 방지
        if (options.visited && options.visited.includes(depInfo.path)) {
          console.warn(`순환 의존성 무시: ${depId}`);
          continue;
        }
        
        // 의존성 로드
        const depModule = await ModuleLoader.loadModule(depInfo.path, {
          ...options,
          retries: 0 // 의존성 로드는 최초 시도만
        });
        
        results.push({ id: depId, module: depModule });
      } catch (error) {
        console.error(`의존성 로드 실패: ${depId}`, error);
        
        // 실패한 의존성 정보 저장
        results.push({ id: depId, error });
      }
    }
    
    return results;
  };
  
  /**
   * 경로에서 모듈 ID 추출
   * @param {string} path - 모듈 경로
   * @returns {string|null} 모듈 ID 또는 null
   * @private
   */
  ModuleLoader._getModuleIdFromPath = function(path) {
    for (const [id, info] of _state.registeredModules) {
      if (path.includes(info.path)) {
        return id;
      }
    }
    return null;
  };
  
  /**
   * 모듈 ID 파싱 (파일 경로에서 네임스페이스와 이름 추출)
   * @param {string} modulePath - 모듈 경로
   * @returns {Object|null} { namespace, name } 또는 파싱 실패 시 null
   * @private
   */
  ModuleLoader._parseModuleId = function(modulePath) {
    try {
      // 예시: 'assets/js/core/converter-core.js' => { namespace: 'core', name: 'converter' }
      // 또는 'assets/js/converters/file-converter.js' => { namespace: 'converters', name: 'file-converter' }
      
      // 파일 경로 정규화
      const normalizedPath = modulePath.replace(/\\/g, '/');
      
      // 디렉토리와 파일명 추출
      const parts = normalizedPath.split('/');
      const fileName = parts[parts.length - 1].replace('.js', '');
      
      // 직전 디렉토리가 네임스페이스
      let namespace = parts[parts.length - 2];
      let name = fileName;
      
      // 특수 경우 처리
      if (namespace === 'js' || namespace === 'assets') {
        // 파일명에서 네임스페이스와 이름 추출 시도
        const fileNameParts = fileName.split('-');
        
        if (fileNameParts.length >= 2) {
          if (fileNameParts[fileNameParts.length - 1] === 'core') {
            // 'converter-core' => { namespace: 'core', name: 'converter' }
            namespace = 'core';
            name = fileNameParts.slice(0, -1).join('-');
          } else {
            // 'file-converter' => { namespace: 'converters', name: 'file-converter' }
            // 규칙에 따라 적절히 변환
            namespace = namespace === 'js' ? 'utils' : namespace;
          }
        }
      }
      
      // UI 네임스페이스 특수 처리
      if (namespace === 'ui') {
        const parentDir = parts[parts.length - 3];
        if (parentDir === 'previews') {
          namespace = 'ui.previews';
        }
      }
      
      return { namespace, name };
    } catch (error) {
      console.warn(`모듈 ID 파싱 실패: ${modulePath}`, error);
      return null;
    }
  };
  
  /**
   * 모듈 경로 추정
   * @param {string} namespace - 모듈 네임스페이스
   * @param {string} name - 모듈 이름
   * @returns {string|null} 추정된 모듈 경로 또는 null
   * @private
   */
  ModuleLoader._guessModulePath = function(namespace, name) {
    // 네임스페이스별 경로 규칙
    const pathPatterns = {
      'core': 'assets/js/core/{name}-core',
      'utils': 'assets/js/utils/{name}-utils',
      'converters': 'assets/js/converters/{name}-converter',
      'qr-generator': 'assets/js/qr-generator/{name}',
      'ui': 'assets/js/ui/{name}',
      'ui.previews': 'assets/js/ui/previews/{name}',
      'pages': 'assets/js/pages/{name}',
      'components': 'components/{name}'
    };
    
    // 특수 경우 처리
    const specialCases = {
      'utils.file': 'assets/js/utils/file-utils',
      'converters.file-converter': 'assets/js/converters/file-converter',
      'core.converter': 'assets/js/core/converter-core',
      'core.qr': 'assets/js/core/qr-core',
      'utils.moduleLoader': 'assets/js/utils/module-loader',
      'utils.urlUtils': 'assets/js/utils/url-utils',
      'utils.diagnostics': 'assets/js/utils/diagnostics',
      'utils.templateUtils': 'assets/js/utils/template-utils',
      'utils.versionManager': 'assets/js/utils/version-manager',
      'ui.components': 'assets/js/ui/ui-components',
      'ui.previews.filePreview': 'assets/js/ui/previews/file-preview',
      'core.componentSystem': 'assets/js/core/component-system',
      'registry': 'assets/js/registry'
    };
    
    // 특수 경우 확인
    const fullId = `${namespace}.${name}`;
    if (specialCases[fullId]) {
      return specialCases[fullId];
    }
    
    // 네임스페이스가 단일 이름인 경우 (예: registry)
    if (fullId === namespace) {
      return specialCases[namespace] || null;
    }
    
    // 일반 규칙 적용
    if (pathPatterns[namespace]) {
      return pathPatterns[namespace].replace('{name}', name);
    }
    
    return null;
  };
  
  /**
   * 의존성 검사 및 잠재적 문제 진단
   * @returns {Object} 진단 결과
   */
  ModuleLoader.diagnose = function() {
    const modules = Array.from(_state.registeredModules.entries()).map(([id, info]) => {
      // 각 모듈의 의존성 상태 확인
      const isLoaded = id.includes('.') ? 
        FileToQR.registry?.isLoaded(...id.split('.')) : 
        _state.loadedModules.has(ModuleLoader._resolvePath(info.path));
      
      // 의존성 검사
      const dependencies = info.dependencies.map(depId => {
        const isDepLoaded = depId.includes('.') ? 
          FileToQR.registry?.isLoaded(...depId.split('.')) : 
          _state.registeredModules.has(depId);
        
        return {
          id: depId,
          loaded: isDepLoaded,
          registered: _state.registeredModules.has(depId)
        };
      });
      
      // 문제 있는 의존성 필터링
      const problematicDeps = dependencies.filter(dep => !dep.loaded || !dep.registered);
      
      return {
        id,
        path: info.path,
        loaded: isLoaded,
        dependencies,
        hasProblems: problematicDeps.length > 0,
        problematicDependencies: problematicDeps
      };
    });
    
    // 순환 참조 진단
    const circularDependencies = [];
    
    for (const [id] of _state.registeredModules.entries()) {
      const result = ModuleLoader.checkDependencyTree(id);
      if (result.circular) {
        circularDependencies.push({
          startModule: id,
          cycles: result.circular
        });
      }
    }
    
    return {
      modules,
      circularDependencies,
      loadingModules: Array.from(_state.loadingModules.keys()),
      initializingModules: Array.from(_state.initializingModules),
      hasCircularDependencies: circularDependencies.length > 0,
      hasLoadingIssues: modules.some(m => m.hasProblems)
    };
  };
  
  // 모듈 등록
  if (typeof FileToQR.utils === 'undefined') {
    FileToQR.utils = {};
  }
  
  FileToQR.utils.moduleLoader = ModuleLoader;
  
  // 모듈 레지스트리에 등록 (이미 존재하는 경우)
  if (typeof FileToQR.registry !== 'undefined') {
    try {
      FileToQR.registry.register('utils', 'moduleLoader', ModuleLoader);
    } catch (error) {
      console.warn('모듈 레지스트리에 ModuleLoader 등록 실패:', error);
    }
  }
})();

// 모듈 내보내기
export default ModuleLoader; 