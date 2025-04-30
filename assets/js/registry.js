/**
 * registry.js - FileToQR 모듈 레지스트리
 * 버전: 1.1.0
 * 최종 업데이트: 2023-06-15
 * 참조: ../.ai-guides/architecture/module-registry.md
 * 
 * 이 모듈은 FileToQR 프로젝트의 핵심 아키텍처 구성 요소로,
 * 모든 기능 모듈을 관리하고 의존성을 추적하는 중앙 시스템입니다.
 */

// 즉시 실행 함수로 네임스페이스 보호
(function() {
  'use strict';
  
  // 앱 네임스페이스
  const FileToQR = window.FileToQR = window.FileToQR || {};
  
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
        error: []
      };
      
      // 상태 플래그
      this._initialized = false;
    }
    
    /**
     * 모듈 등록
     * @param {string} namespace - 모듈 네임스페이스
     * @param {string} name - 모듈 이름
     * @param {Object} moduleObject - 모듈 객체
     * @param {Array<string>} dependencies - 의존성 목록 (기본값: [])
     * @param {Object} metadata - 메타데이터 (기본값: {})
     * @returns {ModuleRegistry} 메서드 체이닝을 위한 인스턴스 반환
     */
    register(namespace, name, moduleObject, dependencies = [], metadata = {}) {
      const moduleId = this._createModuleId(namespace, name);
      
      // 이미 등록된 모듈인지 확인
      if (this._modules.has(moduleId)) {
        console.warn(`모듈이 이미 등록되어 있습니다: ${moduleId}`);
        return this;
      }
      
      // 모듈, 의존성, 메타데이터 저장
      this._modules.set(moduleId, moduleObject);
      this._dependencies.set(moduleId, dependencies);
      this._metadata.set(moduleId, {
        ...metadata,
        namespace,
        name,
        registeredAt: new Date()
      });
      
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
     * @returns {Object|null} 모듈 객체 또는 없을 경우 null
     */
    get(namespace, name) {
      const moduleId = this._createModuleId(namespace, name);
      
      if (!this._modules.has(moduleId)) {
        console.warn(`모듈을 찾을 수 없음: ${moduleId}`);
        return null;
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
          metadata: { ...metadata },
          dependencies: [...this._dependencies.get(moduleId)]
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
      
      for (const metadata of this._metadata.values()) {
        namespaces.add(metadata.namespace);
      }
      
      return [...namespaces];
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
     * 의존성 주입
     * @param {Object} module - 대상 모듈 객체
     * @param {Object} dependencies - 주입할 의존성 객체 맵
     * @returns {Object} 의존성이 주입된 모듈 객체
     */
    inject(module, dependencies) {
      if (!module || typeof module !== 'object') {
        throw new Error('유효한 모듈 객체가 필요합니다.');
      }
      
      // 의존성 주입
      Object.keys(dependencies).forEach(key => {
        // 이미 존재하는 속성 덮어쓰기 방지
        if (module[key] !== undefined) {
          console.warn(`모듈에 이미 '${key}' 속성이 존재합니다. 덮어쓰지 않습니다.`);
          return;
        }
        
        module[key] = dependencies[key];
      });
      
      return module;
    }
    
    /**
     * 이벤트 구독
     * @param {string} event - 이벤트 유형 ('register', 'load', 'error')
     * @param {Function} callback - 콜백 함수
     * @returns {ModuleRegistry} 메서드 체이닝을 위한 인스턴스 반환
     */
    subscribe(event, callback) {
      if (!this._subscribers[event]) {
        throw new Error(`알 수 없는 이벤트 유형: ${event}`);
      }
      
      if (typeof callback !== 'function') {
        throw new Error('콜백은 함수여야 합니다.');
      }
      
      this._subscribers[event].push(callback);
      return this;
    }
    
    /**
     * 이벤트 구독 취소
     * @param {string} event - 이벤트 유형 ('register', 'load', 'error')
     * @param {Function} callback - 제거할 콜백 함수
     * @returns {ModuleRegistry} 메서드 체이닝을 위한 인스턴스 반환
     */
    unsubscribe(event, callback) {
      if (!this._subscribers[event]) {
        throw new Error(`알 수 없는 이벤트 유형: ${event}`);
      }
      
      this._subscribers[event] = this._subscribers[event].filter(cb => cb !== callback);
      return this;
    }
    
    /**
     * 이벤트 알림
     * @param {string} event - 이벤트 유형
     * @param {Object} data - 이벤트 데이터
     * @private
     */
    _notify(event, data) {
      if (!this._subscribers[event]) return;
      
      this._subscribers[event].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`이벤트 처리 중 오류 발생: ${event}`, error);
        }
      });
    }
    
    /**
     * 초기화 여부 확인
     * @returns {boolean} 초기화 여부
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
     * 모듈 버전 확인
     * @param {string} namespace - 모듈 네임스페이스
     * @param {string} name - 모듈 이름
     * @returns {string|null} 모듈 버전 또는 없을 경우 null
     */
    getModuleVersion(namespace, name) {
      const moduleId = this._createModuleId(namespace, name);
      
      if (!this._metadata.has(moduleId)) {
        return null;
      }
      
      return this._metadata.get(moduleId).version || null;
    }
    
    /**
     * 모듈 메타데이터 업데이트
     * @param {string} namespace - 모듈 네임스페이스
     * @param {string} name - 모듈 이름
     * @param {Object} metadata - 업데이트할 메타데이터
     * @returns {boolean} 업데이트 성공 여부
     */
    updateMetadata(namespace, name, metadata) {
      const moduleId = this._createModuleId(namespace, name);
      
      if (!this._metadata.has(moduleId)) {
        return false;
      }
      
      this._metadata.set(moduleId, {
        ...this._metadata.get(moduleId),
        ...metadata,
        updatedAt: new Date()
      });
      
      return true;
    }
  }
  
  // 모듈 레지스트리 인스턴스 생성 및 글로벌 네임스페이스에 등록
  FileToQR.registry = new ModuleRegistry();
  
  console.log('모듈 레지스트리 초기화 완료');
  
  // 기존 모듈 레지스트리 구현이 있다면 초기 모듈 마이그레이션
  if (FileToQR.legacyRegistry && FileToQR.legacyRegistry.modules) {
    Object.keys(FileToQR.legacyRegistry.modules).forEach(moduleId => {
      const parts = moduleId.split('.');
      if (parts.length === 2) {
        const namespace = parts[0];
        const name = parts[1];
        
        FileToQR.registry.register(
          namespace,
          name,
          FileToQR.legacyRegistry.modules[moduleId],
          [],
          { migratedFrom: 'legacyRegistry' }
        );
      }
    });
    
    // 기존 레지스트리 참조 보존 (하위 호환성)
    FileToQR.legacyRegistry = FileToQR.registry;
  }
  
  // 미리 정의된 모듈 등록
  // 파일 관련 유틸리티 함수 초기화
  if (!FileToQR.utils) {
    FileToQR.utils = {};
  }
  
  // 파일 변환기 등록 (가장 먼저 등록하여 유틸리티 함수 사용 가능하게 함)
  if (typeof fileConverter !== 'undefined') {
    FileToQR.registry.register('converters', 'file-converter', fileConverter);
    
    // 파일 관련 유틸리티 함수 통합 - 다른 모듈에서 사용할 수 있도록 먼저 등록
    if (!FileToQR.utils.file) {
      FileToQR.utils.file = {
        getExtension: fileConverter.getFileExtension,
        formatSize: fileConverter.formatFileSize,
        toDataUri: fileConverter.fileToDataUri
      };
      console.log('파일 유틸리티 함수 등록 완료');
    }
  }
  
  // UI 미리보기 모듈 등록
  if (typeof filePreview !== 'undefined') {
    FileToQR.registry.register('ui.previews', 'file-preview', filePreview);
  }
  
  // QR 코드 관련 모듈 등록 (파일 변환기 의존성 이후 등록)
  if (typeof qrGenerator !== 'undefined') {
    FileToQR.registry.register('qr-generator', 'qr-generator', qrGenerator);
  }
  
  if (typeof qrScanner !== 'undefined') {
    FileToQR.registry.register('qr-generator', 'qr-scanner', qrScanner);
  }
  
  // 모듈 등록 상태 로깅
  console.log('등록된 모듈 목록:', FileToQR.registry.getModules());
})();

export default window.FileToQR.registry; 