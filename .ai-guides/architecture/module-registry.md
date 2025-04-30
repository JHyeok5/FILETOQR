# 모듈 레지스트리 가이드

**버전**: 1.4.0  
**최종 업데이트**: 2025-06-20

## 개요

모듈 레지스트리(registry.js)는 FileToQR 프로젝트의 핵심 아키텍처 구성 요소로, 모든 기능 모듈을 관리하고 의존성을 추적하는 중앙 시스템입니다. 이 문서는 레지스트리의 개념, 사용법, 확장 방법을 설명합니다.

## 레지스트리 목적

모듈 레지스트리는 다음과 같은 목적으로 사용됩니다:

1. **모듈 등록 및 발견**: 모든 기능 모듈을 중앙에서 등록하고 검색
2. **의존성 관리**: 모듈 간 의존성 관계를 명시적으로 정의하고 추적
3. **파일 형식 매핑**: 지원되는 변환 형식 간의 관계 관리
4. **모듈 메타데이터**: 버전, 설명 등 모듈 정보 저장
5. **확장성 제공**: 플러그인 패턴을 통한 기능 확장 지원
6. **오류 처리 및 추적**: 모듈 로딩 및 의존성 오류 처리

## 핵심 모듈 현황

### 1. converter-core.js

파일 변환의 핵심 로직을 제공하는 모듈입니다:

- **용도**: 다양한 파일 형식 간 변환 구현 및 변환 프로세스 관리
- **지원 형식**: 
  - 이미지: png, jpg, jpeg, gif, webp, bmp, svg
  - 문서: txt, md, csv, json, xml, html
  - 오디오: mp3, wav, ogg
- **주요 기능**:
  - `convertFile`: 파일 변환 시작 및 프로세스 관리
  - `canConvert`: 변환 가능 여부 확인
  - 형식별 변환 로직 (이미지, 문서, 오디오)
  - 진행 상황 알림 처리
- **의존성**: `utils.file`

### 2. qr-core.js

QR 코드 생성의 핵심 로직을 제공하는 모듈입니다:

- **용도**: 다양한 콘텐츠 유형의 QR 코드 생성 및 커스터마이징
- **지원 콘텐츠 타입**: url, text, email, phone, vcard, wifi, file
- **주요 기능**:
  - `generateQRCode`: QR 코드 생성 작업 실행
  - `validateContent`: QR 코드 콘텐츠 유효성 검증
  - `formatContent`: 콘텐츠 타입별 포맷팅
  - `addLogoToQRCode`: QR 코드에 로고 추가
  - `exportQRCode`: 다양한 형식(PNG, JPEG, SVG)으로 내보내기
- **의존성**: `utils.file`

### 3. theme-manager.js

UI 테마 관리 및 다크 모드 지원을 담당하는 모듈입니다:

- **용도**: 시스템 및 사용자 선호에 따른 테마 적용 관리
- **주요 기능**:
  - `initTheme`: 초기 테마 설정 감지 및 적용
  - `toggleTheme`: 테마 전환 (다크/라이트)
  - `setTheme`: 특정 테마로 직접 설정
  - `getPreferredTheme`: 사용자 선호 테마 조회
  - `listenForChanges`: 시스템 테마 변경 감지
- **의존성**: `utils.storage`

### 4. progress-tracker.js

진행 상태 시각화 및 피드백을 담당하는 모듈입니다:

- **용도**: 파일 변환, QR 코드 생성 등 시간이 소요되는 작업 상태 표시
- **주요 기능**:
  - `start`: 진행 표시 시작 및 초기화
  - `updateProgress`: 진행률 업데이트
  - `complete`: 성공적 완료 처리
  - `error`: 오류 상태 표시
  - `reset`: 진행 상태 초기화
- **의존성**: `utils.ui`

### 5. form-validator.js

사용자 입력 유효성 검사 및 피드백을 담당하는 모듈입니다:

- **용도**: 폼 입력 검증 및 사용자 피드백 제공
- **주요 기능**:
  - `validateField`: 개별 입력 필드 검증
  - `validateForm`: 전체 폼 유효성 검증
  - `showFieldError`: 필드별 오류 표시
  - `clearFieldError`: 오류 상태 제거
  - `addValidationListeners`: 실시간 검증 이벤트 등록
- **의존성**: `utils.validation`

## 레지스트리 구조

```javascript
registry
├── _modules                 // 등록된 모듈 저장소 (Map)
├── _dependencies            // 모듈 의존성 그래프 (Map)
├── _metadata                // 모듈 메타데이터 (Map)
├── _subscribers             // 이벤트 구독자
│   ├── register             // 등록 이벤트 리스너
│   ├── load                 // 로드 이벤트 리스너
│   ├── error                // 오류 이벤트 리스너
│   └── dependencyError      // 의존성 오류 이벤트 리스너
├── _loadingStatus           // 모듈 로딩 상태 (Map)
└── _initialized             // 초기화 여부 (boolean)
```

## 기본 사용법

### 모듈 등록

```javascript
import registry from '../registry.js';

// 모듈 정의
const myModule = {
  // 모듈 구현
  process: (data) => { /* 처리 로직 */ },
  validate: (input) => { /* 검증 로직 */ }
};

// 레지스트리에 등록 - 의존성 포함
registry.register('namespace', 'module-name', myModule, 
  ['utils.file', 'core.converter'], // 의존성 목록
  {
  version: '1.0.0',
    description: '모듈 설명'
  } // 메타데이터
);

export default myModule;
```

### 모듈 조회

```javascript
// 모듈 조회
const module = registry.get('namespace', 'module-name');

if (module) {
  // 모듈 사용
  const result = module.process(data);
}

// 모듈 조회 - 없을 경우 예외 발생
try {
  const criticalModule = registry.get('namespace', 'critical-module', true);
  // 모듈 사용
} catch (error) {
  console.error('필수 모듈을 찾을 수 없습니다:', error);
}
```

### 모듈과 의존성 함께 조회

```javascript
// 모듈과 의존성 함께 조회
const moduleWithDeps = registry.getWithDependencies('namespace', 'module-name');

if (moduleWithDeps) {
  const { module, dependencies } = moduleWithDeps;
  
  // 모듈 사용
  const result = module.process(data);
  
  // 의존성 모듈 사용
  if (dependencies['utils.file']) {
    const fileExtension = dependencies['utils.file'].getFileExtension('example.jpg');
  }
}
```

### 의존성 관리

```javascript
// 모듈 의존성 조회
const dependencies = registry.getDependencies('namespace', 'module-name');
console.log(dependencies); // ['utils.file', 'core.converter']

// 모듈 의존성 업데이트
registry.updateDependencies('namespace', 'module-name', 
  ['utils.file', 'core.converter', 'new.dependency']
);

// 의존성 오류 확인
const hasMissingDeps = registry.getModules().filter(
  module => module.metadata.hasMissingDependencies
);
console.log(hasMissingDeps); // 누락된 의존성이 있는 모듈 목록

// 순환 의존성 확인
const hasCircular = registry.hasCircularDependency('namespace', 'module-name');
if (hasCircular) {
  console.warn('순환 의존성이 감지되었습니다!');
}

// 의존성 트리 조회
const depTree = registry.getDependencyTree('namespace', 'module-name');
console.log(depTree);
/* 출력 예시:
{
  id: 'namespace.module-name',
  namespace: 'namespace',
  name: 'module-name',
  version: '1.0.0',
  dependencies: [
    {
      id: 'utils.file',
      namespace: 'utils',
      name: 'file',
      version: '1.0.0',
      dependencies: []
    },
    {
      id: 'core.converter',
      namespace: 'core',
      name: 'converter',
      version: '1.0.0',
      dependencies: [
        {
          id: 'utils.file',
          circular: true // 순환 의존성 표시
        }
      ]
    }
  ]
}
*/
```

### 이벤트 리스닝

```javascript
// 모듈 등록 이벤트 리스닝
registry.on('register', (data) => {
  console.log(`모듈 등록됨: ${data.moduleId}`);
});

// 오류 이벤트 리스닝
registry.on('error', (error) => {
  console.error(`모듈 오류 발생: ${error.message}`, error);
});

// 의존성 오류 이벤트 리스닝
registry.on('dependencyError', (data) => {
  console.warn(`의존성 문제 발생: ${data.moduleId}에서 ${data.dependencies.join(', ')} 의존성을 찾을 수 없습니다.`);
});
```

## 의존성 관리 심화

### 의존성 명시 규칙

의존성은 항상 `namespace.name` 형식으로 지정해야 합니다:

```javascript
// 올바른 의존성 명시
registry.register('ui', 'component', uiComponent, [
  'utils.file',
  'core.converter',
  'ui.previews.file'
]);

// 잘못된 의존성 명시 (오류 발생)
registry.register('ui', 'component', uiComponent, [
  'utils',          // 네임스페이스만 지정 (오류)
  'file-utils.js',  // 파일명 지정 (오류)
  'core/converter'  // 경로 형식 지정 (오류)
]);
```

### 의존성 검증

모듈 등록 시 의존성이 자동으로 검증됩니다:

```javascript
// 존재하지 않는 의존성이 있는 모듈 등록
registry.register('ui', 'new-component', newComponent, [
  'utils.file',               // 존재함
  'nonexistent.module'        // 존재하지 않음
]);

// 콘솔에 경고 출력:
// "모듈 ui.new-component의 의존성을 찾을 수 없습니다: nonexistent.module"

// 의존성 오류 이벤트 발생
registry.on('dependencyError', (data) => {
  // 누락된 의존성 처리 로직
  console.warn(`모듈 ${data.moduleId}에 누락된 의존성이 있습니다: ${data.dependencies.join(', ')}`);
  
  // 예: 필요한 모듈 동적 로드
  if (data.dependencies.includes('nonexistent.module')) {
    loadModuleAsynchronously('nonexistent.module')
      .then(() => {
        console.log('누락된 모듈을 로드했습니다.');
      })
      .catch(error => {
        console.error('모듈 로드 실패:', error);
      });
  }
});
```

### 의존성이 있는 모듈 찾기

특정 모듈에 의존하는 다른 모듈을 찾을 수 있습니다:

```javascript
// 특정 모듈에 의존하는 모듈 목록 조회
const dependentModules = registry.getDependentModules('utils', 'file');
console.log(dependentModules);
/* 출력 예시:
[
  {
    id: 'core.converter',
    namespace: 'core',
    name: 'converter',
    metadata: { ... }
  },
  {
    id: 'core.qr',
    namespace: 'core',
    name: 'qr',
    metadata: { ... }
  }
]
*/

// 특정 모듈 업데이트 후 의존 모듈에게 알림
function updateModuleAndNotifyDependents(namespace, name) {
  // 모듈 업데이트 로직...
  
  // 의존 모듈 조회
  const dependents = registry.getDependentModules(namespace, name);
  
  // 각 의존 모듈에게 알림
  dependents.forEach(dep => {
    const module = registry.get(dep.namespace, dep.name);
    if (module && typeof module.onDependencyUpdated === 'function') {
      module.onDependencyUpdated(namespace, name);
    }
  });
}
```

## 오류 처리 개선

### 오류 유형

레지스트리는 다음 오류 유형을 정의합니다:

```javascript
const ErrorTypes = {
  MODULE_NOT_FOUND: 'MODULE_NOT_FOUND',
  DEPENDENCY_NOT_FOUND: 'DEPENDENCY_NOT_FOUND',
  CIRCULAR_DEPENDENCY: 'CIRCULAR_DEPENDENCY',
  INVALID_MODULE: 'INVALID_MODULE',
  INITIALIZATION_ERROR: 'INITIALIZATION_ERROR'
};
```

### 오류 처리 흐름

```javascript
// 오류 이벤트 구독
registry.on('error', (error) => {
  switch(error.type) {
    case 'MODULE_NOT_FOUND':
      console.error('모듈을 찾을 수 없습니다:', error.message);
      // UI에 오류 표시 또는 대체 모듈 로드 시도
      break;
      
    case 'DEPENDENCY_NOT_FOUND':
      console.warn('의존성 문제:', error.message);
      // 누락된 의존성 동적 로드 시도
      break;
      
    case 'CIRCULAR_DEPENDENCY':
      console.error('순환 의존성 감지:', error.message);
      // 개발자에게 알림 또는 의존성 구조 재구성 시도
      break;
      
    case 'INVALID_MODULE':
      console.error('유효하지 않은 모듈:', error.message);
      // 개발자에게 알림
      break;
      
    case 'INITIALIZATION_ERROR':
      console.error('모듈 초기화 오류:', error.message);
      // 사용자에게 오류 알림 및 재시도 옵션 제공
      break;
      
    default:
      console.error('알 수 없는 오류:', error);
  }
  
  // 오류 로깅 또는 분석 시스템에 보고
  logError(error);
});
```

### 강건한 모듈 로딩

모듈 로더와 레지스트리를 결합하여 강건한 모듈 로딩 구현:

```javascript
// module-loader.js에서 모듈 로드 시
async function loadModuleWithDependencies(namespace, name) {
  try {
    // 레지스트리에서 모듈 확인
    if (registry.isLoaded(namespace, name)) {
      return registry.get(namespace, name);
    }
    
    // 모듈 경로 추정
    const path = guessModulePath(namespace, name);
    if (!path) {
      throw new Error(`모듈 경로를 추정할 수 없음: ${namespace}.${name}`);
    }
    
    // 모듈 로드
    const module = await import(path);
    
    // 모듈이 자동 등록되지 않은 경우 등록
    if (!registry.isLoaded(namespace, name)) {
      registry.register(namespace, name, module.default);
    }
    
    return registry.get(namespace, name);
  } catch (error) {
    registry._handleError('MODULE_NOT_FOUND', 
      `모듈 로드 중 오류: ${namespace}.${name}`, error);
    throw error;
  }
}
```

## 모듈 로더 통합

Registry와 ModuleLoader의 통합으로 동적 모듈 로딩 및 의존성 해결이 간소화되었습니다:

```javascript
// module-loader.js에서 의존성 자동 로드
async function loadDependencies(module, namespace, name) {
  if (!registry) return;
  
  // 의존성 목록 조회
  const dependencies = registry.getDependencies(namespace, name);
  if (!dependencies || dependencies.length === 0) return;
  
  // 각 의존성 모듈 로드
  const promises = dependencies.map(async (dep) => {
    const [depNamespace, depName] = dep.split('.');
    
    // 이미 로드된 모듈인지 확인
    if (registry.isLoaded(depNamespace, depName)) {
      return registry.get(depNamespace, depName);
    }
    
    // 의존성 모듈 경로 추정 및 로드
    const depPath = guessModulePath(depNamespace, depName);
    if (!depPath) {
      console.warn(`의존성 모듈 경로를 추정할 수 없음: ${dep}`);
      return null;
    }
    
    // 모듈 로드
    return await loadModule(depPath);
  });
  
  // 모든 의존성 로드 완료 대기
  await Promise.all(promises);
}
```

## QR 코드 생성과 파일 변환 연동

QR 코드 생성 모듈과 파일 변환 모듈 간의 연동이 레지스트리를 통해 개선되었습니다:

```javascript
// qr-generator.js 모듈이 레지스트리에 등록될 때 의존성 명시
registry.register('qr-generator', 'qr-generator', qrGenerator, 
  ['core.qr', 'converters.file-converter']
);

// 파일에서 QR 코드 생성 시 의존성 모듈 사용
async function generateQRFromFile(file) {
  // 레지스트리에서 필요한 모듈 가져오기
  const qrCore = registry.get('core', 'qr', true); // 필수 모듈
  const fileConverter = registry.get('converters', 'file-converter', true); // 필수 모듈
  
  try {
    // 파일 크기 확인 (QR 코드 용량 제한)
    if (file.size > 2 * 1024) { // 2KB 제한
      throw new Error('파일 크기가 너무 큽니다. 2KB 이하여야 합니다.');
    }
    
    // 파일을 Data URI로 변환
      const dataUri = await fileConverter.fileToDataUri(file);
    
    // QR 코드 생성
    const qrOptions = {
      errorCorrectionLevel: 'M',
      margin: 4,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    };
    
    return await qrCore.generateQRCode('file', dataUri, qrOptions);
    } catch (error) {
    registry._handleError('INITIALIZATION_ERROR', 
      '파일에서 QR 코드 생성 중 오류 발생', error);
    throw error;
  }
}
```

## 요약

개선된 모듈 레지스트리는 다음과 같은 이점을 제공합니다:

1. **명확한 의존성 관리**: 모듈 간 의존성을 명시적으로 정의하고 추적
2. **강건한 오류 처리**: 의존성 누락, 순환 의존성 등 다양한 오류 상황 감지 및 처리
3. **자동화된 의존성 해결**: ModuleLoader와의 통합을 통한 의존성 자동 해결
4. **오류 알림 체계**: 오류 및 의존성 문제에 대한 이벤트 기반 알림
5. **의존성 트리 시각화**: 복잡한 의존성 관계 분석 및 디버깅 지원

새로운 모듈을 개발할 때는 항상 의존성을 명확히 명시하고, 레지스트리를 통해 다른 모듈을 참조하세요. 이를 통해 모듈 간 결합도를 낮추고 유지보수성을 높일 수 있습니다.

## 변경 이력

- **1.3.0** (2025-06-15): 의존성 관리 개선 및 오류 처리 기능 강화
- **1.2.0** (2025-05-20): 파일 미리보기 모듈 예제 추가 및 UI 미리보기 카테고리 추가
- **1.1.0** (2025-05-15): 파일 기반 QR 코드 생성 기능을 위한 파일 포맷터 예제 추가
- **1.0.0** (2025-04-28): 최초 문서 작성

# FileToQR 모듈 레지스트리

## 개요

이 문서는 FileToQR 애플리케이션의 모듈 아키텍처 및 레지스트리 구조를 설명합니다. 애플리케이션은 모듈화된 구조를 통해 유지보수와 확장이 용이하며, 세부 기능은 전용 모듈로 분리되어 관리됩니다.

## 핵심 아키텍처

FileToQR 애플리케이션은 다음과 같은 핵심 아키텍처 계층으로 구성됩니다:

1. **코어 계층**: 애플리케이션의 기본 동작과 초기화를 담당
2. **모듈 계층**: 다양한 기능을 모듈화하여 제공
3. **유틸리티 계층**: 공통 기능과 도구를 제공
4. **UI 계층**: 사용자 인터페이스와 관련된 모듈 관리
5. **워커 계층**: 백그라운드 처리와 성능 최적화 담당

## 기반 시스템

### 컴포넌트 시스템

컴포넌트 시스템은 UI 요소의 생성, 관리, 렌더링을 표준화하는 프레임워크입니다.

#### 핵심 모듈

- **component-system.js**: 컴포넌트 정의, 라이프사이클 관리, 상태 관리 제공
- **template-utils.js**: 템플릿 기반 HTML 렌더링 및 데이터 바인딩 기능 제공
- **ui-components.js**: 재사용 가능한 UI 컴포넌트 라이브러리

#### 핵심 기능

1. **컴포넌트 라이프사이클 관리**:
   - `onCreate`: 컴포넌트 생성 시점
   - `onMount`: DOM에 마운트 시점
   - `onUpdate`: 속성 또는 상태 업데이트 시점
   - `onDestroy`: 컴포넌트 제거 시점

2. **이벤트 핸들링**:
   - 데이터 속성 기반 이벤트 바인딩 (`data-event="click:handleClick"`)
   - 자동 이벤트 등록 및 정리

3. **상태 관리**:
   - 반응형 컴포넌트 상태
   - 상태 변경에 따른 자동 UI 업데이트

4. **템플릿 렌더링**:
   - 변수 삽입 (`${변수명}`)
   - 조건부 렌더링 (`<!-- if 조건 -->내용<!-- endif -->`)
   - 반복 렌더링 (`<!-- for 항목 in 배열 -->내용<!-- endfor -->`)

#### 사용 예제

```javascript
// 컴포넌트 정의
ComponentSystem.defineComponent('alert', {
  version: '1.0.0',
  initialState: {
    visible: false,
    type: 'info',
    message: ''
  },
  render(props, state) {
    if (!state.visible) return '';
    return `<div class="alert alert-${state.type}">${state.message}</div>`;
  },
  methods: {
    show(options) {
      ComponentSystem.setState(this.id, { visible: true, ...options });
    },
    close() {
      ComponentSystem.setState(this.id, { visible: false });
    }
  }
});

// 컴포넌트 사용
const alertId = ComponentSystem.mountComponent('alert', document.getElementById('alert-container'));
const alertInstance = ComponentSystem.instances.get(alertId);
alertInstance.definition.show.call(alertInstance, { message: '성공!', type: 'success' });
```

### 버전 관리 시스템

버전 관리 시스템은 모듈과 컴포넌트의 버전을 추적하고 호환성을 보장합니다.

#### 핵심 모듈

- **version-manager.js**: 시맨틱 버전 관리 및 호환성 확인 기능 제공
- **module-loader.js**: 동적 모듈 로딩, 의존성 관리

#### 핵심 기능

1. **버전 등록 및 관리**:
   - 모듈 버전 등록 및 추적
   - 시맨틱 버전 관리 규칙 준수

2. **버전 호환성 확인**:
   - 모듈 간 호환성 검증
   - 의존성 관계 확인

3. **동적 모듈 로딩**:
   - 필요한 시점에 모듈 로드
   - 중복 로드 방지
   - 의존성 문제 해결

#### 사용 예제

```javascript
// 버전 등록
VersionManager.registerVersion('ui-components', '1.0.0', {
  dependencies: ['component-system@1.0.0', 'template-utils@1.0.0']
});

// 모듈 로드
const module = await ModuleLoader.loadModule('assets/js/ui/ui-components.js');

// 호환성 확인
const isCompatible = VersionManager.isCompatible('component-system', '1.0.0');
if (!isCompatible) {
  console.warn('컴포넌트 시스템 버전이 호환되지 않습니다.');
}
```

## 파일 변환 흐름

### 개요

파일 변환 프로세스는 여러 모듈의 협력으로 이루어지며, 각 모듈은 파일 변환 흐름의 특정 부분을 담당합니다.

### 등록된 모듈

- **converter-core**
  - 변환 프로세스 초기화 및 조정
  - 변환 옵션 및 설정 관리

- **file-converter**
  - 파일 업로드 및 변환 UI 관리
  - 파일 처리 및 변환 결과 표시

- **document-converter**, **image-converter**, **audio-converter**, **video-converter**, **data-converter**
  - 특정 파일 타입에 대한 변환 로직 제공
  - 파일 유형별 최적화된 변환 구현

### 변환 흐름

1. 사용자가 파일 업로드
2. 파일 타입 감지
3. 적절한 변환기 모듈 로드
4. 변환 옵션 설정
5. 변환 프로세스 실행
6. 변환 결과 표시 및 다운로드 옵션 제공

## QR 코드 생성 흐름

### 개요

QR 코드 생성은 다양한 콘텐츠 유형을 QR 코드로 변환하는 과정입니다. 이 기능은 일반 텍스트, URL부터 파일 데이터까지 다양한 내용을 지원합니다.

### 등록된 모듈

- **qr-core**
  - QR 코드 생성의 기본 기능 제공
  - 외부 QR 라이브러리 연동

- **qr-generator**
  - 다양한 콘텐츠 유형의 QR 코드 생성
  - QR 코드 커스터마이징 및 다운로드 기능

- **qr-designer**
  - QR 코드 디자인 요소 커스터마이징
  - 색상, 모양, 로고 등 설정

- **qr-content-formatter**
  - 다양한 데이터 유형을 QR 형식으로 포맷팅
  - vCard, WiFi, URL 등 특수 형식 지원

### QR 생성 흐름

1. 사용자가 콘텐츠 유형 선택
2. 콘텐츠 입력 또는 파일 업로드
3. 콘텐츠 형식에 맞게 데이터 포맷팅
4. QR 코드 생성 및 미리보기 표시
5. 디자인 옵션 적용 (색상, 크기 등)
6. 완성된 QR 코드 다운로드 또는 공유

## 파일 변환 → QR 코드 생성 흐름

### 개요

파일 변환 결과를 QR 코드로 직접 생성하는 기능은 `file-converter.js`와 `qr-generator.js` 모듈 간의 연동을 통해 구현됩니다. 이 흐름을 통해 사용자는 변환된 파일을 QR 코드로 생성하여 공유하거나 다운로드할 수 있습니다.

### 등록된 모듈

- **file-converter**
  - 파일 변환 및 다운로드 기능 제공
  - `handleConvertToQRClick()` 함수를 통해 QR 코드 생성 페이지 연동

- **qr-generator**
  - 다양한 콘텐츠 유형의 QR 코드 생성 기능 제공
  - `checkForFileData()` 함수를 통해 파일 변환 페이지에서 전달된 파일 데이터 처리
  - `encodeFileToQR()` 함수로 파일을 QR 코드로 인코딩

### 데이터 흐름

1. 사용자가 파일 변환 페이지에서 변환 작업 완료 후 "QR 코드 생성" 버튼 클릭
2. `handleConvertToQRClick()` 함수가 호출되어 변환 결과를 세션 스토리지에 저장
3. 사용자가 QR 코드 생성 페이지(qrcode.html?contentType=file)로 리디렉션됨
4. QR 생성 페이지 로드 시 `checkForFileData()` 함수가 세션 스토리지에서 파일 데이터 확인
5. 파일 콘텐츠 유형이 자동 선택되고 파일 정보 표시
6. `generateQRCode()` 함수를 통해 파일 데이터를 QR 코드로 자동 생성

### 구현 고려사항

- 세션 스토리지 용량 제한으로 인해 파일 크기는 최대 2KB로 제한
- QR 코드 밀도와 가독성 최적화를 위해 오류 수정 레벨 관리
- 파일 유형별 최적화된 인코딩 방식 적용

### 코드 예제

```javascript
// file-converter.js에서의 QR 코드 연동 함수
function handleConvertToQRClick(result) {
  try {
    // 파일 데이터 저장 (최적화를 위해 필수 정보만 저장)
    const fileData = {
      name: result.filename,
      type: result.type,
      size: result.size,
      dataUri: result.dataUri || null
    };
    
    // 세션 스토리지에 저장
    sessionStorage.setItem('fileToQR', JSON.stringify(fileData));
    
    // QR 코드 페이지로 리디렉션
    window.location.href = 'qrcode.html?contentType=file';
  } catch (error) {
    console.error('Error preparing file for QR code:', error);
    alert('파일을 QR 코드로 변환하는 중 오류가 발생했습니다. 파일 크기가 너무 클 수 있습니다.');
  }
}

// qr-generator.js에서의 파일 데이터 수신 함수
function checkForFileData() {
  // URL 파라미터 확인
  const urlParams = new URLSearchParams(window.location.search);
  const contentType = urlParams.get('contentType');
  
  if (contentType === 'file') {
    // 세션 스토리지에서 파일 데이터 가져오기
    const fileDataJson = sessionStorage.getItem('fileToQR');
    if (fileDataJson) {
      try {
        const fileData = JSON.parse(fileDataJson);
        
        // UI 업데이트 및 QR 코드 생성
        // ...
        
        // 세션 스토리지 정리
        sessionStorage.removeItem('fileToQR');
      } catch (error) {
        console.error('Error processing file data:', error);
      }
    }
  }
}
```

## 요약

모듈 레지스트리는 FileToQR 프로젝트의 핵심 아키텍처 구성 요소로, 모듈화된 기능을 관리하고 확장성을 제공합니다. 새로운 기능을 구현할 때는 적절한 카테고리에 모듈을 등록하고, 필요한 모듈은 항상 레지스트리를 통해 조회하세요.

## 변경 이력

- **1.2.0** (2025-05-20): 파일 미리보기 모듈 예제 추가 및 UI 미리보기 카테고리 추가
- **1.1.0** (2025-05-15): 파일 기반 QR 코드 생성 기능을 위한 파일 포맷터 예제 추가
- **1.0.0** (2025-04-28): 최초 문서 작성

# FileToQR 모듈 레지스트리

## 개요

이 문서는 FileToQR 애플리케이션의 모듈 아키텍처 및 레지스트리 구조를 설명합니다. 애플리케이션은 모듈화된 구조를 통해 유지보수와 확장이 용이하며, 세부 기능은 전용 모듈로 분리되어 관리됩니다.

## 핵심 아키텍처

FileToQR 애플리케이션은 다음과 같은 핵심 아키텍처 계층으로 구성됩니다:

1. **코어 계층**: 애플리케이션의 기본 동작과 초기화를 담당
2. **모듈 계층**: 다양한 기능을 모듈화하여 제공
3. **유틸리티 계층**: 공통 기능과 도구를 제공
4. **UI 계층**: 사용자 인터페이스와 관련된 모듈 관리
5. **워커 계층**: 백그라운드 처리와 성능 최적화 담당

## 기반 시스템

### 컴포넌트 시스템

컴포넌트 시스템은 UI 요소의 생성, 관리, 렌더링을 표준화하는 프레임워크입니다.

#### 핵심 모듈

- **component-system.js**: 컴포넌트 정의, 라이프사이클 관리, 상태 관리 제공
- **template-utils.js**: 템플릿 기반 HTML 렌더링 및 데이터 바인딩 기능 제공
- **ui-components.js**: 재사용 가능한 UI 컴포넌트 라이브러리

#### 핵심 기능

1. **컴포넌트 라이프사이클 관리**:
   - `onCreate`: 컴포넌트 생성 시점
   - `onMount`: DOM에 마운트 시점
   - `onUpdate`: 속성 또는 상태 업데이트 시점
   - `onDestroy`: 컴포넌트 제거 시점

2. **이벤트 핸들링**:
   - 데이터 속성 기반 이벤트 바인딩 (`data-event="click:handleClick"`)
   - 자동 이벤트 등록 및 정리

3. **상태 관리**:
   - 반응형 컴포넌트 상태
   - 상태 변경에 따른 자동 UI 업데이트

4. **템플릿 렌더링**:
   - 변수 삽입 (`${변수명}`)
   - 조건부 렌더링 (`<!-- if 조건 -->내용<!-- endif -->`)
   - 반복 렌더링 (`<!-- for 항목 in 배열 -->내용<!-- endfor -->`)

#### 사용 예제

```javascript
// 컴포넌트 정의
ComponentSystem.defineComponent('alert', {
  version: '1.0.0',
  initialState: {
    visible: false,
    type: 'info',
    message: ''
  },
  render(props, state) {
    if (!state.visible) return '';
    return `<div class="alert alert-${state.type}">${state.message}</div>`;
  },
  methods: {
    show(options) {
      ComponentSystem.setState(this.id, { visible: true, ...options });
    },
    close() {
      ComponentSystem.setState(this.id, { visible: false });
    }
  }
});

// 컴포넌트 사용
const alertId = ComponentSystem.mountComponent('alert', document.getElementById('alert-container'));
const alertInstance = ComponentSystem.instances.get(alertId);
alertInstance.definition.show.call(alertInstance, { message: '성공!', type: 'success' });
```

### 버전 관리 시스템

버전 관리 시스템은 모듈과 컴포넌트의 버전을 추적하고 호환성을 보장합니다.

#### 핵심 모듈

- **version-manager.js**: 시맨틱 버전 관리 및 호환성 확인 기능 제공
- **module-loader.js**: 동적 모듈 로딩, 의존성 관리

#### 핵심 기능

1. **버전 등록 및 관리**:
   - 모듈 버전 등록 및 추적
   - 시맨틱 버전 관리 규칙 준수

2. **버전 호환성 확인**:
   - 모듈 간 호환성 검증
   - 의존성 관계 확인

3. **동적 모듈 로딩**:
   - 필요한 시점에 모듈 로드
   - 중복 로드 방지
   - 의존성 문제 해결

#### 사용 예제

```javascript
// 버전 등록
VersionManager.registerVersion('ui-components', '1.0.0', {
  dependencies: ['component-system@1.0.0', 'template-utils@1.0.0']
});

// 모듈 로드
const module = await ModuleLoader.loadModule('assets/js/ui/ui-components.js');

// 호환성 확인
const isCompatible = VersionManager.isCompatible('component-system', '1.0.0');
if (!isCompatible) {
  console.warn('컴포넌트 시스템 버전이 호환되지 않습니다.');
}
```

## 파일 변환 흐름

### 개요

파일 변환 프로세스는 여러 모듈의 협력으로 이루어지며, 각 모듈은 파일 변환 흐름의 특정 부분을 담당합니다.

### 등록된 모듈

- **converter-core**
  - 변환 프로세스 초기화 및 조정
  - 변환 옵션 및 설정 관리

- **file-converter**
  - 파일 업로드 및 변환 UI 관리
  - 파일 처리 및 변환 결과 표시

- **document-converter**, **image-converter**, **audio-converter**, **video-converter**, **data-converter**
  - 특정 파일 타입에 대한 변환 로직 제공
  - 파일 유형별 최적화된 변환 구현

### 변환 흐름

1. 사용자가 파일 업로드
2. 파일 타입 감지
3. 적절한 변환기 모듈 로드
4. 변환 옵션 설정
5. 변환 프로세스 실행
6. 변환 결과 표시 및 다운로드 옵션 제공

## QR 코드 생성 흐름

### 개요

QR 코드 생성은 다양한 콘텐츠 유형을 QR 코드로 변환하는 과정입니다. 이 기능은 일반 텍스트, URL부터 파일 데이터까지 다양한 내용을 지원합니다.

### 등록된 모듈

- **qr-core**
  - QR 코드 생성의 기본 기능 제공
  - 외부 QR 라이브러리 연동

- **qr-generator**
  - 다양한 콘텐츠 유형의 QR 코드 생성
  - QR 코드 커스터마이징 및 다운로드 기능

- **qr-designer**
  - QR 코드 디자인 요소 커스터마이징
  - 색상, 모양, 로고 등 설정

- **qr-content-formatter**
  - 다양한 데이터 유형을 QR 형식으로 포맷팅
  - vCard, WiFi, URL 등 특수 형식 지원

### QR 생성 흐름

1. 사용자가 콘텐츠 유형 선택
2. 콘텐츠 입력 또는 파일 업로드
3. 콘텐츠 형식에 맞게 데이터 포맷팅
4. QR 코드 생성 및 미리보기 표시
5. 디자인 옵션 적용 (색상, 크기 등)
6. 완성된 QR 코드 다운로드 또는 공유

## 파일 변환 → QR 코드 생성 흐름

### 개요

파일 변환 결과를 QR 코드로 직접 생성하는 기능은 `file-converter.js`와 `qr-generator.js` 모듈 간의 연동을 통해 구현됩니다. 이 흐름을 통해 사용자는 변환된 파일을 QR 코드로 생성하여 공유하거나 다운로드할 수 있습니다.

### 등록된 모듈

- **file-converter**
  - 파일 변환 및 다운로드 기능 제공
  - `handleConvertToQRClick()` 함수를 통해 QR 코드 생성 페이지 연동

- **qr-generator**
  - 다양한 콘텐츠 유형의 QR 코드 생성 기능 제공
  - `checkForFileData()` 함수를 통해 파일 변환 페이지에서 전달된 파일 데이터 처리
  - `encodeFileToQR()` 함수로 파일을 QR 코드로 인코딩

### 데이터 흐름

1. 사용자가 파일 변환 페이지에서 변환 작업 완료 후 "QR 코드 생성" 버튼 클릭
2. `handleConvertToQRClick()` 함수가 호출되어 변환 결과를 세션 스토리지에 저장
3. 사용자가 QR 코드 생성 페이지(qrcode.html?contentType=file)로 리디렉션됨
4. QR 생성 페이지 로드 시 `checkForFileData()` 함수가 세션 스토리지에서 파일 데이터 확인
5. 파일 콘텐츠 유형이 자동 선택되고 파일 정보 표시
6. `generateQRCode()` 함수를 통해 파일 데이터를 QR 코드로 자동 생성

### 구현 고려사항

- 세션 스토리지 용량 제한으로 인해 파일 크기는 최대 2KB로 제한
- 파일 크기가 클 경우 자동 축소 또는 압축 처리
- 바이너리 데이터를 위한 Base64 인코딩 사용
  