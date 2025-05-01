/**
 * registry.js - FileToQR 모듈 레지스트리
 * 버전: 1.2.0
 * 최종 업데이트: 2025-06-15
 * 참조: ../../docs/architecture/module-registry.md
 * 
 * 이 모듈은 FileToQR 프로젝트의 핵심 아키텍처 구성 요소로,
 * 모든 기능 모듈을 관리하고 의존성을 추적하는 중앙 시스템입니다.
 */

// 오류 유형 정의
const ErrorTypes = {
  MODULE_NOT_FOUND: 'MODULE_NOT_FOUND',
  DEPENDENCY_NOT_FOUND: 'DEPENDENCY_NOT_FOUND',
  CIRCULAR_DEPENDENCY: 'CIRCULAR_DEPENDENCY',
  INVALID_MODULE: 'INVALID_MODULE',
  INITIALIZATION_ERROR: 'INITIALIZATION_ERROR'
};

// 모듈 레지스트리 클래스
class ModuleRegistry {
  constructor() {
    // 모듈 저장소
    this._modules = new Map();
    
    // 모듈 의존성 그래프
    this._dependencies = new Map();
    
    // 모듈 메타데이터
    this._metadata = new Map();
    
    // 이벤트 구독자
    this._subscribers = {
      register: [],
      load: [],
      error: [],
      dependencyError: []
    };
    
    // 상태 플래그
    this._initialized = false;
    
    // 모듈 로딩 상태
    this._loadingStatus = new Map();
  }
  
  /**
   * 모듈 등록
   * @param {string} namespace - 모듈 네임스페이스
   * @param {string} name - 모듈 이름
   * @param {Object} moduleObject - 모듈 객체
   * @param {Array<string>} dependencies - 의존성 목록 (기본값: [])
   * @param {Object} metadata - 메타데이터 (기본값: {})
   * @returns {ModuleRegistry} 메서드 체이닝을 위한 인스턴스 반환
   * @throws {Error} 순환 참조나 필수 의존성이 누락된 경우
   */
  register(namespace, name, moduleObject, dependencies = [], metadata = {}) {
    const moduleId = this._createModuleId(namespace, name);
    
    // 필수 파라미터 검증
    if (!namespace || !name) {
      throw new Error(`네임스페이스와 이름은 필수입니다: ${namespace}.${name}`);
    }
    
    if (!moduleObject || typeof moduleObject !== 'object') {
      throw new Error(`유효한 모듈 객체가 필요합니다: ${moduleId}`);
    }
    
    // 이미 등록된 모듈인지 확인
    if (this._modules.has(moduleId)) {
      console.warn(`모듈이 이미 등록되어 있습니다: ${moduleId}`);
      return this;
    }
    
    // 순환 참조 검사
    if (this.hasCircularDependency(namespace, name, dependencies)) {
      throw new Error(`순환 참조가 발견되었습니다: ${moduleId}`);
    }
    
    // 의존성 검증
    const missingDependencies = this._validateDependencies(dependencies);
    
    if (missingDependencies.length > 0) {
      const errorMessage = `모듈 ${moduleId}의 의존성을 찾을 수 없습니다: ${missingDependencies.join(', ')}`;
      
      // 필수 의존성이 누락된 경우 에러 발생
      if (metadata.requireAllDependencies) {
        throw new Error(errorMessage);
      }
      
      console.warn(errorMessage);
      
      // 의존성 문제 이벤트 발생
      this._notify('dependencyError', {
        moduleId,
        dependencies: missingDependencies,
        message: errorMessage
      });
    }
    
    // 모듈, 의존성, 메타데이터 저장
    this._modules.set(moduleId, moduleObject);
    this._dependencies.set(moduleId, dependencies);
    this._metadata.set(moduleId, {
      ...metadata,
      namespace,
      name,
      registeredAt: new Date(),
      hasMissingDependencies: missingDependencies.length > 0
    });
    
    // 로딩 상태 업데이트
    this._loadingStatus.set(moduleId, true);
    
    console.log(`모듈 등록 완료: ${moduleId}`);
    
    // 이벤트 발생
    this._notify('register', {
      moduleId,
      namespace,
      name,
      dependencies,
      metadata: this._metadata.get(moduleId)
    });
    
    return this;
  }
  
  /**
   * 의존성 검증
   * @param {Array<string>} dependencies - 의존성 목록
   * @returns {Array<string>} 누락된 의존성 목록
   * @private
   */
  _validateDependencies(dependencies) {
    if (!Array.isArray(dependencies)) return [];
    
    return dependencies.filter(dep => {
      // 의존성 문자열 파싱 ('namespace.name' 형식)
      const parts = dep.split('.');
      if (parts.length !== 2) {
        console.warn(`잘못된 의존성 형식: ${dep}. 'namespace.name' 형식이어야 합니다.`);
        return true; // 누락으로 간주
      }
      
      const [namespace, name] = parts;
      return !this.isLoaded(namespace, name);
    });
  }
  
  /**
   * 모듈 ID 생성
   * @param {string} namespace - 모듈 네임스페이스
   * @param {string} name - 모듈 이름
   * @returns {string} 모듈 ID
   * @private
   */
  _createModuleId(namespace, name) {
    return `${namespace}.${name}`;
  }
  
  /**
   * 모듈 가져오기
   * @param {string} namespace - 모듈 네임스페이스
   * @param {string} name - 모듈 이름
   * @param {boolean} throwOnMissing - 모듈이 없을 경우 예외 발생 여부
   * @returns {Object|null} 모듈 객체 또는 없을 경우 null
   * @throws {Error} throwOnMissing이 true이고 모듈이 없을 경우
   */
  get(namespace, name, throwOnMissing = false) {
    const moduleId = this._createModuleId(namespace, name);
    
    if (!this._modules.has(moduleId)) {
      const errorMsg = `모듈을 찾을 수 없음: ${moduleId}`;
      
      if (throwOnMissing) {
        this._handleError(ErrorTypes.MODULE_NOT_FOUND, errorMsg);
        throw new Error(errorMsg);
      } else {
        console.warn(errorMsg);
        return null;
      }
    }
    
    return this._modules.get(moduleId);
  }
  
  /**
   * 모듈 목록 가져오기
   * @param {string} namespace - 네임스페이스 (옵션)
   * @returns {Array<Object>} 모듈 정보 목록
   */
  getModules(namespace = null) {
    const modules = [];
    
    for (const [moduleId, moduleObject] of this._modules.entries()) {
      const metadata = this._metadata.get(moduleId);
      
      // 네임스페이스 필터링
      if (namespace && metadata.namespace !== namespace) {
        continue;
      }
      
      modules.push({
        id: moduleId,
        namespace: metadata.namespace,
        name: metadata.name,
        object: moduleObject,
        metadata
      });
    }
    
    return modules;
  }
  
  /**
   * 모듈 네임스페이스 목록 가져오기
   * @returns {Array<string>} 고유 네임스페이스 목록
   */
  getNamespaces() {
    const namespaces = new Set();
    
    for (const moduleId of this._modules.keys()) {
      const [namespace] = moduleId.split('.');
      namespaces.add(namespace);
    }
    
    return Array.from(namespaces);
  }
  
  /**
   * 모듈 로드 확인
   * @param {string} namespace - 모듈 네임스페이스
   * @param {string} name - 모듈 이름
   * @returns {boolean} 모듈 로드 여부
   */
  isLoaded(namespace, name) {
    const moduleId = this._createModuleId(namespace, name);
    return this._modules.has(moduleId);
  }
  
  /**
   * 모듈 의존성 목록 가져오기
   * @param {string} namespace - 모듈 네임스페이스
   * @param {string} name - 모듈 이름
   * @returns {Array<string>|null} 의존성 목록 또는 모듈이 없을 경우 null
   */
  getDependencies(namespace, name) {
    const moduleId = this._createModuleId(namespace, name);
    
    if (!this._dependencies.has(moduleId)) {
      return [];
    }
    
    return this._dependencies.get(moduleId);
  }
  
  /**
   * 모듈과 의존성 모두 가져오기
   * @param {string} namespace - 모듈 네임스페이스
   * @param {string} name - 모듈 이름
   * @param {boolean} throwOnMissing - 모듈이나 의존성이 없을 경우 예외 발생 여부
   * @returns {Object} 모듈과 의존성 객체
   * @throws {Error} throwOnMissing이 true이고 모듈이나 의존성이 없을 경우
   */
  getWithDependencies(namespace, name, throwOnMissing = false) {
    const moduleId = this._createModuleId(namespace, name);
    const module = this.get(namespace, name, throwOnMissing);
    
    if (!module) {
      return { module: null, dependencies: {} };
    }
    
    const dependencies = {};
    const dependencyIds = this._dependencies.get(moduleId) || [];
    
    for (const depId of dependencyIds) {
      const [depNs, depName] = depId.split('.');
      const depModule = this.get(depNs, depName, false);
      
      if (depModule) {
        dependencies[depId] = depModule;
      }
    }
    
    return { module, dependencies };
  }
  
  /**
   * 의존성 주입
   * @param {Object} module - 대상 모듈 객체
   * @param {Object} dependencies - 주입할 의존성 객체
   * @returns {Object} 의존성이 주입된 모듈
   */
  inject(module, dependencies) {
    if (!module || typeof module !== 'object') {
      return module;
    }
    
    if (!dependencies || typeof dependencies !== 'object') {
      return module;
    }
    
    // 모듈에 의존성 주입 (inject 메서드가 있는 경우)
    if (typeof module.inject === 'function') {
      module.inject(dependencies);
    }
    
    // 모듈 데코레이션 (decorate 메서드가 있는 경우)
    if (typeof module.decorate === 'function') {
      module.decorate();
    }
    
    return module;
  }
  
  /**
   * 모듈 의존성 업데이트
   * @param {string} namespace - 모듈 네임스페이스
   * @param {string} name - 모듈 이름
   * @param {Array<string>} dependencies - 새 의존성 목록
   * @returns {boolean} 업데이트 성공 여부
   */
  updateDependencies(namespace, name, dependencies) {
    if (!Array.isArray(dependencies)) {
      console.warn(`유효한 의존성 배열이 필요합니다: ${namespace}.${name}`);
      return false;
    }
    
    const moduleId = this._createModuleId(namespace, name);
    
    if (!this._modules.has(moduleId)) {
      console.warn(`의존성을 업데이트할 모듈이 없습니다: ${moduleId}`);
      return false;
    }
    
    // 순환 의존성 확인
    for (const dep of dependencies) {
      const [depNs, depName] = dep.split('.');
      
      if (depNs === namespace && depName === name) {
        console.warn(`자기 자신에 대한 의존성은 허용되지 않습니다: ${moduleId}`);
        return false;
      }
      
      // 순환 의존성 검사
      const existingDeps = this._dependencies.get(this._createModuleId(depNs, depName)) || [];
      if (existingDeps.includes(`${namespace}.${name}`)) {
        console.warn(`순환 의존성이 감지되었습니다: ${moduleId} <-> ${dep}`);
        return false;
      }
    }
    
    // 의존성 업데이트
    this._dependencies.set(moduleId, dependencies);
    
    // 메타데이터 업데이트
    const metadata = this._metadata.get(moduleId) || {};
    metadata.dependencies = dependencies;
    this._metadata.set(moduleId, metadata);
    
    console.log(`모듈 의존성 업데이트 완료: ${moduleId}`);
    return true;
  }
  
  /**
   * 순환 참조 검사
   * @param {string} namespace - 모듈 네임스페이스
   * @param {string} name - 모듈 이름
   * @param {Array<string>} newDependencies - 새로운 의존성 목록
   * @returns {boolean} 순환 참조 존재 여부
   */
  hasCircularDependency(namespace, name, newDependencies = []) {
    const moduleId = this._createModuleId(namespace, name);
    const visited = new Set();
    
    const checkCycle = (currentId, path = new Set()) => {
      if (path.has(currentId)) {
        return true; // 순환 참조 발견
      }
      
      if (visited.has(currentId)) {
        return false; // 이미 검사한 경로
      }
      
      visited.add(currentId);
      path.add(currentId);
      
      // 현재 모듈의 의존성 확인
      const deps = currentId === moduleId ? 
        newDependencies : 
        (this._dependencies.get(currentId) || []);
      
      for (const dep of deps) {
        if (checkCycle(dep, new Set(path))) {
          return true;
        }
      }
      
      path.delete(currentId);
      return false;
    };
    
    return checkCycle(moduleId);
  }
  
  /**
   * 오류 처리
   * @param {string} type - 오류 유형
   * @param {string} message - 오류 메시지
   * @param {Error} originalError - 원본 오류 객체 (선택사항)
   * @private
   */
  _handleError(type, message, originalError = null) {
    const error = {
      type,
      message,
      timestamp: new Date(),
      originalError
    };
    
    console.error(`[ModuleRegistry] ${type}: ${message}`, originalError || '');
    
    // 오류 이벤트 발생
    this._notify('error', error);
    
    return error;
  }
  
  /**
   * 이벤트 구독
   * @param {string} event - 이벤트 이름
   * @param {Function} callback - 콜백 함수
   * @returns {ModuleRegistry} 메서드 체이닝을 위한 인스턴스 반환
   */
  subscribe(event, callback) {
    if (typeof callback !== 'function') {
      console.warn(`유효한 콜백 함수가 필요합니다: ${event}`);
      return this;
    }
    
    if (this._subscribers[event]) {
      this._subscribers[event].push(callback);
    } else {
      this._subscribers[event] = [callback];
    }
    
    return this;
  }
  
  /**
   * 이벤트 구독 해제
   * @param {string} event - 이벤트 이름
   * @param {Function} callback - 콜백 함수
   * @returns {ModuleRegistry} 메서드 체이닝을 위한 인스턴스 반환
   */
  unsubscribe(event, callback) {
    if (!this._subscribers[event]) {
      return this;
    }
    
    this._subscribers[event] = this._subscribers[event].filter(cb => cb !== callback);
    
    return this;
  }
  
  /**
   * 이벤트 구독 (alias for subscribe)
   * @param {string} event - 이벤트 이름
   * @param {Function} callback - 콜백 함수
   * @returns {ModuleRegistry} 메서드 체이닝을 위한 인스턴스 반환
   */
  on(event, callback) {
    return this.subscribe(event, callback);
  }
  
  /**
   * 이벤트 발생
   * @param {string} event - 이벤트 이름
   * @param {*} data - 이벤트 데이터
   * @private
   */
  _notify(event, data) {
    if (!this._subscribers[event]) {
      return;
    }
    
    for (const callback of this._subscribers[event]) {
      try {
        callback(data);
      } catch (error) {
        console.error(`이벤트 리스너 실행 중 오류: ${event}`, error);
      }
    }
  }
  
  /**
   * 초기화 상태 확인
   * @returns {boolean} 초기화 완료 여부
   */
  isInitialized() {
    return this._initialized;
  }
  
  /**
   * 초기화 상태 설정
   * @param {boolean} state - 초기화 상태
   * @returns {ModuleRegistry} 메서드 체이닝을 위한 인스턴스 반환
   */
  setInitialized(state = true) {
    this._initialized = state;
    return this;
  }
  
  /**
   * 모듈 버전 가져오기
   * @param {string} namespace - 모듈 네임스페이스
   * @param {string} name - 모듈 이름
   * @returns {string|null} 모듈 버전 또는 버전 정보가 없는 경우 null
   */
  getModuleVersion(namespace, name) {
    const moduleId = this._createModuleId(namespace, name);
    const metadata = this._metadata.get(moduleId);
    
    if (!metadata || !metadata.version) {
      return null;
    }
    
    return metadata.version;
  }
  
  /**
   * 모듈 메타데이터 업데이트
   * @param {string} namespace - 모듈 네임스페이스
   * @param {string} name - 모듈 이름
   * @param {Object} metadata - 새 메타데이터
   * @returns {boolean} 업데이트 성공 여부
   */
  updateMetadata(namespace, name, metadata) {
    if (!metadata || typeof metadata !== 'object') {
      console.warn(`유효한 메타데이터 객체가 필요합니다: ${namespace}.${name}`);
      return false;
    }
    
    const moduleId = this._createModuleId(namespace, name);
    
    if (!this._modules.has(moduleId)) {
      console.warn(`메타데이터를 업데이트할 모듈이 없습니다: ${moduleId}`);
      return false;
    }
    
    // 기존 메타데이터와 병합
    const existingMetadata = this._metadata.get(moduleId) || {};
    this._metadata.set(moduleId, { ...existingMetadata, ...metadata });
    
    return true;
  }
  
  /**
   * 특정 모듈에 의존하는 모듈 목록 가져오기
   * @param {string} namespace - 모듈 네임스페이스
   * @param {string} name - 모듈 이름
   * @returns {Array<Object>} 의존하는 모듈 목록
   */
  getDependentModules(namespace, name) {
    const targetId = this._createModuleId(namespace, name);
    const dependents = [];
    
    for (const [moduleId, dependencies] of this._dependencies.entries()) {
      if (dependencies.includes(targetId)) {
        const [ns, n] = moduleId.split('.');
        const module = this.get(ns, n);
        const metadata = this._metadata.get(moduleId);
        
        dependents.push({
          id: moduleId,
          namespace: ns,
          name: n,
          object: module,
          metadata
        });
      }
    }
    
    return dependents;
  }
  
  /**
   * 의존성 트리 생성
   * @param {string} namespace - 모듈 네임스페이스
   * @param {string} name - 모듈 이름
   * @returns {Object} 의존성 트리 객체
   */
  getDependencyTree(namespace, name) {
    const rootId = this._createModuleId(namespace, name);
    
    // 재귀적으로 의존성 트리 구축
    const buildTree = (id) => {
      const [ns, n] = id.split('.');
      const dependencies = this._dependencies.get(id) || [];
      const children = {};
      
      for (const depId of dependencies) {
        children[depId] = buildTree(depId);
      }
      
      return {
        id,
        namespace: ns,
        name: n,
        dependencies: children,
        metadata: this._metadata.get(id) || {}
      };
    };
    
    return buildTree(rootId);
  }
}

// 모듈 레지스트리 인스턴스 생성
const registry = new ModuleRegistry();

// 하위 호환성을 위한 전역 참조
if (typeof window !== 'undefined') {
  window.FileToQR = window.FileToQR || {};
  window.FileToQR.registry = registry;
}

export default registry; 