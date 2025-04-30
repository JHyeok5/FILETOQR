/**
 * module-loader.js - FileToQR 모듈 로더
 * 버전: 1.0.0
 * 최종 업데이트: 2025-06-15
 * 
 * 이 모듈은 FileToQR의 동적 모듈 로딩을 담당합니다:
 * - ES 모듈 로딩 및 관리
 * - 모듈 의존성 처리
 * - 비동기 모듈 초기화
 */

import VersionManager from './version-manager.js';

// 모듈 로더 네임스페이스
const ModuleLoader = {
  // 로드된 모듈 저장소
  loadedModules: new Map(),
  
  // 로딩 중인 모듈 
  loadingModules: new Map(),
  
  // 모듈 로딩 설정
  config: {
    baseUrl: '/assets/js/',
    preloadModules: [],
    moduleAliases: {}, // 별칭 매핑
    moduleShims: {} // 비ES 모듈 대응용 심
  },
  
  /**
   * 모듈 로더 초기화
   * @param {Object} options - 초기화 옵션
   */
  init(options = {}) {
    this.config = { ...this.config, ...options };
    console.log('모듈 로더 초기화 완료');
    
    // 버전 등록
    VersionManager.registerVersion('module-loader', '1.0.0');
    
    // 사전 로드 모듈 처리
    if (this.config.preloadModules && this.config.preloadModules.length > 0) {
      this._preloadModules();
    }
    
    return this;
  },
  
  /**
   * 모듈 불러오기
   * @param {string} modulePath - 모듈 경로 (절대/상대)
   * @param {Object} options - 로드 옵션
   * @returns {Promise<Object>} 모듈 객체
   */
  async loadModule(modulePath, options = {}) {
    const resolvedPath = this._resolvePath(modulePath);
    
    // 이미 로드된 모듈이면 반환
    if (this.loadedModules.has(resolvedPath)) {
      return this.loadedModules.get(resolvedPath);
    }
    
    // 로딩 중인 모듈이면 기존 Promise 반환
    if (this.loadingModules.has(resolvedPath)) {
      return this.loadingModules.get(resolvedPath);
    }
    
    // 로딩 Promise 생성
    const loadPromise = this._importModule(resolvedPath, options);
    this.loadingModules.set(resolvedPath, loadPromise);
    
    try {
      const module = await loadPromise;
      this.loadedModules.set(resolvedPath, module);
      this.loadingModules.delete(resolvedPath);
      
      // 버전 정보 있으면 등록
      if (module.version) {
        VersionManager.registerVersion(
          this._getModuleNameFromPath(resolvedPath), 
          module.version,
          { modulePath: resolvedPath }
        );
      }
      
      return module;
    } catch (error) {
      this.loadingModules.delete(resolvedPath);
      console.error(`모듈 로드 실패: ${resolvedPath}`, error);
      throw error;
    }
  },
  
  /**
   * 모듈 리셋 (다시 로드하기 위함)
   * @param {string} modulePath - 모듈 경로
   */
  resetModule(modulePath) {
    const resolvedPath = this._resolvePath(modulePath);
    this.loadedModules.delete(resolvedPath);
    this.loadingModules.delete(resolvedPath);
  },
  
  /**
   * 모듈 일괄 로드
   * @param {Array<string>} modulePaths - 모듈 경로 배열
   * @returns {Promise<Object>} 로드된 모듈 맵
   */
  async loadModules(modulePaths) {
    const promises = modulePaths.map(path => this.loadModule(path));
    const modules = await Promise.all(promises);
    
    // 결과 맵 생성
    const resultMap = {};
    modulePaths.forEach((path, index) => {
      const moduleName = this._getModuleNameFromPath(path);
      resultMap[moduleName] = modules[index];
    });
    
    return resultMap;
  },
  
  /**
   * 모듈 별칭 설정
   * @param {Object} aliases - 별칭 매핑 객체
   */
  setAliases(aliases) {
    this.config.moduleAliases = { ...this.config.moduleAliases, ...aliases };
  },
  
  /**
   * 모듈 심 설정 (비ES 모듈용)
   * @param {Object} shims - 심 매핑 객체
   */
  setShims(shims) {
    this.config.moduleShims = { ...this.config.moduleShims, ...shims };
  },
  
  /**
   * ES 모듈 로드
   * @private
   * @param {string} modulePath - 모듈 경로
   * @param {Object} options - 로드 옵션
   * @returns {Promise<Object>} 모듈 객체
   */
  async _importModule(modulePath, options) {
    // 심 설정 확인
    if (this.config.moduleShims[modulePath]) {
      return this._loadShimmedModule(modulePath);
    }
    
    try {
      // 동적 임포트 사용
      const module = await import(/* webpackIgnore: true */ modulePath);
      
      // 초기화 함수 있으면 실행
      if (typeof module.init === 'function' && options.autoInit !== false) {
        await module.init();
      }
      
      return module;
    } catch (error) {
      console.error(`모듈 임포트 실패: ${modulePath}`, error);
      throw error;
    }
  },
  
  /**
   * 심 모듈 로드 (비ES 모듈용)
   * @private
   * @param {string} modulePath - 모듈 경로
   * @returns {Promise<Object>} 심 모듈 객체
   */
  async _loadShimmedModule(modulePath) {
    const shim = this.config.moduleShims[modulePath];
    
    if (typeof shim === 'function') {
      return shim();
    }
    
    return shim;
  },
  
  /**
   * 모듈 경로 해석
   * @private
   * @param {string} modulePath - 모듈 경로
   * @returns {string} 해석된 경로
   */
  _resolvePath(modulePath) {
    // 별칭 확인
    for (const [alias, path] of Object.entries(this.config.moduleAliases)) {
      if (modulePath.startsWith(alias)) {
        modulePath = modulePath.replace(alias, path);
        break;
      }
    }
    
    // 절대 경로면 그대로 반환
    if (modulePath.startsWith('/') || modulePath.startsWith('http')) {
      return modulePath;
    }
    
    // 상대 경로는 기본 URL 기준으로 해석
    return `${this.config.baseUrl}${modulePath}`;
  },
  
  /**
   * 경로에서 모듈 이름 추출
   * @private
   * @param {string} modulePath - 모듈 경로
   * @returns {string} 모듈 이름
   */
  _getModuleNameFromPath(modulePath) {
    const parts = modulePath.split('/');
    const filename = parts[parts.length - 1];
    return filename.replace(/\.js$/, '');
  },
  
  /**
   * 사전 로드 모듈 처리
   * @private
   */
  async _preloadModules() {
    const preloadPromises = this.config.preloadModules.map(
      modulePath => this.loadModule(modulePath, { autoInit: false })
    );
    
    try {
      await Promise.all(preloadPromises);
      console.log('모듈 사전 로드 완료');
    } catch (error) {
      console.error('모듈 사전 로드 중 오류:', error);
    }
  }
};

// 레지스트리에 등록
if (typeof window.FileToQR === 'undefined') {
  window.FileToQR = {};
}

window.FileToQR.ModuleLoader = ModuleLoader;

// 모듈 내보내기
export default ModuleLoader; 