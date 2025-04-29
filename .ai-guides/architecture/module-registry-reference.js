/**
 * 모듈 레지스트리
 * 
 * 모든 변환기 및 기능 모듈을 등록하고 관리하는 중앙 레지스트리
 * 새로운 모듈을 추가하거나 기존 모듈을 수정할 때 이 레지스트리를 통해 관리
 * 
 * @module registry
 */

/**
 * 레지스트리 클래스
 * 모듈 등록, 조회, 비활성화 등 기능 제공
 */
class Registry {
  constructor() {
    // 등록된 모듈 맵
    this.modules = {
      // 코어 모듈
      core: new Map(),
      
      // 파일 변환기
      converters: {
        image: new Map(),  // 이미지 변환기
        document: new Map(), // 문서 변환기
        audio: new Map(),   // 오디오 변환기
        video: new Map(),   // 비디오 변환기
        data: new Map()     // 데이터 변환기
      },
      
      // QR 생성 관련 모듈
      qr: {
        generators: new Map(),  // QR 코드 생성기
        formatters: new Map(),  // QR 콘텐츠 포맷터
        designers: new Map()    // QR 디자인 모듈
      },
      
      // UI 컴포넌트
      ui: new Map(),
      
      // 유틸리티
      utils: new Map(),
      
      // Web Workers
      workers: new Map()
    };
    
    // 변환 가능한 형식 매핑
    this.formatMappings = {
      // 입력 형식 -> 출력 형식 -> 변환기 ID
      conversions: new Map()
    };
    
    // 지원되는 파일 유형
    this.supportedFormats = {
      image: new Set(['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg', 'bmp', 'tiff', 'heic', 'avif', 'ico']),
      document: new Set(['pdf', 'docx', 'txt', 'rtf', 'odt', 'pptx', 'xlsx']),
      audio: new Set(['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a']),
      video: new Set(['mp4', 'webm', 'avi', 'mov', 'mkv']),
      data: new Set(['csv', 'json', 'yaml', 'xml', 'tsv', 'sql', 'xlsx', 'toml'])
    };
    
    // 모듈 의존성 그래프
    this.dependencies = new Map();
    
    // 이벤트 리스너
    this.listeners = {
      register: new Set(),
      unregister: new Set()
    };
  }
  
  /**
   * 모듈 등록
   * @param {string} type - 모듈 유형 (core, converters.image 등)
   * @param {string} id - 모듈 식별자
   * @param {Object} module - 모듈 객체
   * @param {Object} metadata - 모듈 메타데이터 (버전, 설명 등)
   * @returns {boolean} 등록 성공 여부
   */
  register(type, id, module, metadata = {}) {
    try {
      // 모듈 유형 경로 파싱 (converters.image -> modules.converters.image)
      const path = type.split('.');
      let target = this.modules;
      
      for (const segment of path) {
        if (!target[segment]) {
          console.warn(`Invalid module type path: ${type}`);
          return false;
        }
        target = target[segment];
      }
      
      // 모듈 식별자 중복 검사
      if (target.has(id)) {
        console.warn(`Module ${id} already registered for type ${type}`);
        return false;
      }
      
      // 모듈 등록
      target.set(id, {
        module,
        metadata: {
          ...metadata,
          registeredAt: new Date(),
          enabled: true
        }
      });
      
      // 변환기인 경우 형식 매핑 등록
      if (type.startsWith('converters.') && metadata.formats) {
        this._registerFormatMappings(id, metadata.formats);
      }
      
      // 의존성 등록
      if (metadata.dependencies) {
        this.dependencies.set(id, new Set(metadata.dependencies));
      }
      
      // 등록 이벤트 발생
      this._triggerEvent('register', { type, id, metadata });
      
      return true;
    } catch (error) {
      console.error(`Failed to register module ${id}:`, error);
      return false;
    }
  }
  
  /**
   * 등록된 모듈 조회
   * @param {string} type - 모듈 유형
   * @param {string} id - 모듈 식별자
   * @returns {Object|null} 모듈 객체 또는 null
   */
  get(type, id) {
    try {
      // 모듈 유형 경로 파싱
      const path = type.split('.');
      let target = this.modules;
      
      for (const segment of path) {
        if (!target[segment]) {
          return null;
        }
        target = target[segment];
      }
      
      // 모듈 찾기
      const entry = target.get(id);
      if (!entry || !entry.metadata.enabled) {
        return null;
      }
      
      return entry.module;
    } catch (error) {
      console.error(`Failed to get module ${id}:`, error);
      return null;
    }
  }
  
  /**
   * 모듈 비활성화
   * @param {string} type - 모듈 유형
   * @param {string} id - 모듈 식별자
   * @returns {boolean} 비활성화 성공 여부
   */
  disable(type, id) {
    try {
      // 모듈 유형 경로 파싱
      const path = type.split('.');
      let target = this.modules;
      
      for (const segment of path) {
        if (!target[segment]) {
          return false;
        }
        target = target[segment];
      }
      
      // 모듈 찾기
      const entry = target.get(id);
      if (!entry) {
        return false;
      }
      
      // 비활성화
      entry.metadata.enabled = false;
      
      // 비활성화 이벤트 발생
      this._triggerEvent('unregister', { type, id });
      
      return true;
    } catch (error) {
      console.error(`Failed to disable module ${id}:`, error);
      return false;
    }
  }
  
  /**
   * 변환기 조회
   * @param {string} inputFormat - 입력 파일 형식
   * @param {string} outputFormat - 출력 파일 형식
   * @returns {Object|null} 변환기 모듈 또는 null
   */
  getConverter(inputFormat, outputFormat) {
    // 형식 매핑 조회
    const inputMap = this.formatMappings.conversions.get(inputFormat);
    if (!inputMap) {
      return null;
    }
    
    const converterId = inputMap.get(outputFormat);
    if (!converterId) {
      return null;
    }
    
    // 파일 유형 찾기
    let converterType = null;
    for (const [type, formats] of Object.entries(this.supportedFormats)) {
      if (formats.has(inputFormat)) {
        converterType = `converters.${type}`;
        break;
      }
    }
    
    if (!converterType) {
      return null;
    }
    
    // 변환기 조회
    return this.get(converterType, converterId);
  }
  
  /**
   * 지원하는 변환 형식 목록 조회
   * @param {string} inputFormat - 입력 파일 형식
   * @returns {Array<string>} 지원하는 출력 형식 목록
   */
  getSupportedOutputFormats(inputFormat) {
    const inputMap = this.formatMappings.conversions.get(inputFormat);
    if (!inputMap) {
      return [];
    }
    
    return Array.from(inputMap.keys());
  }
  
  /**
   * 이벤트 리스너 등록
   * @param {string} event - 이벤트 이름
   * @param {Function} callback - 콜백 함수
   */
  on(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event].add(callback);
    }
  }
  
  /**
   * 이벤트 리스너 제거
   * @param {string} event - 이벤트 이름
   * @param {Function} callback - 콜백 함수
   */
  off(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event].delete(callback);
    }
  }
  
  /**
   * 내부: 형식 매핑 등록
   * @private
   */
  _registerFormatMappings(converterId, formats) {
    if (!formats.input || !formats.output) {
      return;
    }
    
    // 각 입력 형식에 대해
    for (const inputFormat of formats.input) {
      // 입력 형식 맵 조회 또는 생성
      if (!this.formatMappings.conversions.has(inputFormat)) {
        this.formatMappings.conversions.set(inputFormat, new Map());
      }
      
      const inputMap = this.formatMappings.conversions.get(inputFormat);
      
      // 각 출력 형식에 대해
      for (const outputFormat of formats.output) {
        // 동일 형식 변환 제외 (옵션만 적용)
        if (inputFormat !== outputFormat) {
          inputMap.set(outputFormat, converterId);
        }
      }
    }
  }
  
  /**
   * 내부: 이벤트 발생
   * @private
   */
  _triggerEvent(event, data) {
    if (this.listeners[event]) {
      for (const callback of this.listeners[event]) {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in ${event} listener:`, error);
        }
      }
    }
  }
}

// 싱글톤 인스턴스 생성 및 내보내기
const registry = new Registry();
export default registry;