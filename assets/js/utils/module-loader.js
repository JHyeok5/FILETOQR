/**
 * module-loader.js - FileToQR 모듈 로딩 유틸리티
 * 버전: 1.0.0
 * 최종 업데이트: 2025-06-15
 * 참조: ../.ai-guides/architecture/module-registry.md
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
    initializingModules: new Set() // 초기화 중인 모듈 추적
  };
  
  // 오류 유형 정의
  const ErrorTypes = {
    MODULE_LOAD_ERROR: 'MODULE_LOAD_ERROR',
    MODULE_INIT_ERROR: 'MODULE_INIT_ERROR',
    CIRCULAR_DEPENDENCY: 'CIRCULAR_DEPENDENCY',
    TIMEOUT_ERROR: 'TIMEOUT_ERROR'
  };
  
  // 모듈 로더 유틸리티
  ModuleLoader = {};
  
  /**
   * 초기화 및 설정
   * @param {Object} config - 설정 객체
   * @param {string} config.baseUrl - 모듈 기본 URL
   * @param {Object} config.aliases - 모듈 경로 별칭
   */
  ModuleLoader.configure = function(config = {}) {
    if (config.baseUrl) {
      _state.baseUrl = config.baseUrl.endsWith('/') ? config.baseUrl : config.baseUrl + '/';
    }
    
    if (config.aliases && typeof config.aliases === 'object') {
      _state.aliases = { ..._state.aliases, ...config.aliases };
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
   * 단일 모듈 로드
   * @param {string} modulePath - 모듈 경로
   * @param {Object} options - 로드 옵션
   * @param {number} options.timeout - 타임아웃 (ms)
   * @param {boolean} options.init - 로드 후 초기화 여부
   * @returns {Promise<Object>} 로드된 모듈
   */
  ModuleLoader.loadModule = async function(modulePath, options = {}) {
    const resolvedPath = ModuleLoader._resolvePath(modulePath);
    const defaultOptions = { timeout: 10000, init: true };
    options = { ...defaultOptions, ...options };
    
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
        
        // 모듈 초기화 (init 메서드가 있고 options.init이 true인 경우)
        if (options.init && module.default && typeof module.default.init === 'function') {
          // 모듈이 이미 초기화 중인지 확인
          if (_state.initializingModules.has(resolvedPath)) {
            console.warn(`모듈 ${modulePath}가 이미 초기화 중입니다.`);
          } else {
            _state.initializingModules.add(resolvedPath);
            
            try {
              // 모듈 의존성 확인
              if (FileToQR.registry) {
                // 모듈 ID 파싱 (파일 경로에서 네임스페이스와 이름 추출)
                const moduleIdParts = ModuleLoader._parseModuleId(modulePath);
                
                if (moduleIdParts) {
                  const { namespace, name } = moduleIdParts;
                  
                  // 레지스트리에서 모듈 및 의존성 가져오기
                  const moduleInfo = FileToQR.registry.getWithDependencies(namespace, name);
                  
                  if (moduleInfo) {
                    // 모든 의존성이 로드되었는지 확인
                    await ModuleLoader._loadDependencies(moduleInfo.module, namespace, name);
                  }
                }
              }
              
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
        
        // 로딩 완료
        _state.loadedModules.add(resolvedPath);
        resolve(module.default);
      } catch (error) {
        // 타임아웃 취소
        clearTimeout(timeoutId);
        
        console.error(`모듈 로딩 실패: ${modulePath}`, error);
        reject(error);
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
   * 모듈 의존성 로드
   * @param {Object} module - 모듈 객체
   * @param {string} namespace - 모듈 네임스페이스
   * @param {string} name - 모듈 이름
   * @returns {Promise<void>}
   * @private
   */
  ModuleLoader._loadDependencies = async function(module, namespace, name) {
    if (!FileToQR.registry) return;
    
    const dependencies = FileToQR.registry.getDependencies(namespace, name);
    if (!dependencies || dependencies.length === 0) return;
    
    // 의존성 모듈 로드
    const promises = dependencies.map(async (dep) => {
      try {
        const [depNamespace, depName] = dep.split('.');
        
        // 이미 로드된 모듈인지 확인
        if (FileToQR.registry.isLoaded(depNamespace, depName)) {
          return FileToQR.registry.get(depNamespace, depName);
        }
        
        // 의존성 모듈 경로 추정
        const depPath = ModuleLoader._guessModulePath(depNamespace, depName);
        
        if (!depPath) {
          console.warn(`의존성 모듈 경로를 추정할 수 없음: ${dep}`);
          return null;
        }
        
        // 모듈 로드
        return await ModuleLoader.loadModule(depPath);
      } catch (error) {
        console.error(`의존성 로드 실패: ${dep}`, error);
        return null;
      }
    });
    
    await Promise.all(promises);
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
      'ui.previews': 'assets/js/ui/previews/{name}'
    };
    
    // 특수 경우 처리
    const specialCases = {
      'utils.file': 'assets/js/utils/file-utils',
      'converters.file-converter': 'assets/js/converters/file-converter',
      'core.converter': 'assets/js/core/converter-core',
      'core.qr': 'assets/js/core/qr-core'
    };
    
    // 특수 경우 확인
    const fullId = `${namespace}.${name}`;
    if (specialCases[fullId]) {
      return specialCases[fullId];
    }
    
    // 일반 규칙 적용
    if (pathPatterns[namespace]) {
      return pathPatterns[namespace].replace('{name}', name);
    }
    
    return null;
  };
  
  /**
   * 여러 모듈 로드
   * @param {Array<string>} modulePaths - 모듈 경로 배열
   * @param {Object} options - 로드 옵션
   * @returns {Promise<Object>} 모듈 객체 맵
   */
  ModuleLoader.loadModules = async function(modulePaths, options = {}) {
    if (!Array.isArray(modulePaths)) {
      throw new Error('modulePaths는 배열이어야 합니다.');
    }
    
    const modules = {};
    const promises = modulePaths.map(async (path) => {
      try {
        modules[path] = await ModuleLoader.loadModule(path, options);
      } catch (error) {
        console.error(`모듈 로드 실패: ${path}`, error);
        modules[path] = null;
      }
    });
    
    await Promise.all(promises);
    return modules;
  };
  
  /**
   * 모듈 로드 상태 확인
   * @param {string} modulePath - 모듈 경로
   * @returns {boolean} 로드 여부
   */
  ModuleLoader.isLoaded = function(modulePath) {
    const resolvedPath = ModuleLoader._resolvePath(modulePath);
    return _state.loadedModules.has(resolvedPath);
  };
  
  /**
   * 모듈 로드 초기화 (캐시 초기화)
   * @param {string} modulePath - 모듈 경로 (선택 사항)
   * @returns {ModuleLoader} 메서드 체이닝을 위한 인스턴스 반환
   */
  ModuleLoader.resetModule = function(modulePath) {
    if (modulePath) {
      const resolvedPath = ModuleLoader._resolvePath(modulePath);
      _state.loadedModules.delete(resolvedPath);
    } else {
      // 모든 캐시 초기화
      _state.loadedModules.clear();
    }
    
    return ModuleLoader;
  };
  
  // 모듈 등록
  if (typeof FileToQR.utils === 'undefined') {
    FileToQR.utils = {};
  }
  
  FileToQR.utils.moduleLoader = ModuleLoader;
  
  // 모듈 레지스트리에 등록
  if (FileToQR.registry) {
    FileToQR.registry.register('utils', 'moduleLoader', ModuleLoader);
  }
})();

// 모듈 내보내기
export default ModuleLoader; 