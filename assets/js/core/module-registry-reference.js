/**
 * module-registry-reference.js - 모듈 레지스트리 참조 구현
 * 버전: 1.0.0
 * 최종 업데이트: 2025-06-15
 * 참조: ../../docs/architecture/module-registry.md
 * 
 * 이 파일은 모듈 레지스트리의 참조 구현을 제공합니다.
 * 실제 프로덕션에서는 registry.js를 사용하세요.
 */

// Registry 클래스 정의
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

  // ... 기존 Registry 클래스의 메서드들 ...
}

// 참조용 간단한 구현
class ModuleRegistryReference {
  constructor() {
    this.modules = new Map();
    this.dependencies = new Map();
  }

  register(namespace, name, module, dependencies = []) {
    const id = `${namespace}.${name}`;
    this.modules.set(id, module);
    this.dependencies.set(id, dependencies);
    return this;
  }

  get(namespace, name) {
    return this.modules.get(`${namespace}.${name}`);
  }

  getDependencies(namespace, name) {
    return this.dependencies.get(`${namespace}.${name}`) || [];
  }
}

export { Registry, ModuleRegistryReference };
export default ModuleRegistryReference; 