# FileToQR 모듈 아키텍처

**버전**: 1.0.0  
**최종 업데이트**: 2025-06-15

## 개요

이 문서는 FileToQR 프로젝트의 모듈 아키텍처, 모듈 간 상호작용 방식, 그리고 모듈 등록 시스템에 대한 상세 내용을 제공합니다.

## 모듈 시스템 구조

FileToQR은 등록 기반 모듈 시스템을 사용하여 기능을 구성합니다:

```
[app-core.js] --> [registry.js] <-- [기능 모듈들]
    |               |                   |
    v               v                   v
[초기화 관리]  [모듈 등록/관리]       [기능 구현]
```

### 핵심 구성 요소

1. **app-core.js**: 애플리케이션 핵심 부분, 초기화 및 페이지 라우팅 담당
2. **registry.js**: 중앙 모듈 레지스트리, 모듈 관리와 의존성 주입 처리
3. **기능 모듈**: file-converter.js, qr-generator.js 등 실제 기능 구현

## 모듈 등록 및 초기화 흐름

```
1. DOM 로드
     |
     v
2. app-core.js 초기화
     |
     v
3. registry.js 초기화 (ModuleRegistry 인스턴스 생성)
     |
     v
4. 페이지 식별 (getCurrentPage)
     |
     v
5. 페이지별 모듈 초기화 (initPageSpecific)
     |
     v
6. 페이지에 필요한 모듈 초기화 호출 (모듈.init)
```

## 모듈 구조 표준

각 기능 모듈은 다음 구조를 따릅니다:

```javascript
// 모듈 객체 (외부로 노출될 API)
const moduleName = {};

// 즉시 실행 함수로 내부 로직 캡슐화
(function() {
  'use strict';
  
  // private 변수 및 함수
  
  // 모듈 초기화 함수 (반드시 구현)
  function init() {
    // 초기화 로직
  }
  
  // API 공개
  moduleName.init = init;
  moduleName.publicFunction1 = function1;
  // ... 기타 공개 함수
  
  // 글로벌 네임스페이스에 등록
  window.moduleName = moduleName;
})();

// 모듈 익스포트
export default moduleName;
```

## 모듈 간 통신 방법

FileToQR에서는 다음 세 가지 방법으로 모듈 간 통신이 이루어집니다:

1. **직접 참조**: `FileToQR.namespace.moduleName` 형식의 글로벌 네임스페이스 참조
2. **레지스트리 참조**: `FileToQR.registry.get(namespace, name)` 메서드를 통한 참조
3. **유틸리티 공유**: 공통 유틸리티는 `FileToQR.utils` 네임스페이스에 등록

### 예시 - 파일 유틸리티 공유

```javascript
// 파일 변환기에서 유틸리티 함수 정의 및 등록
if (typeof fileConverter !== 'undefined') {
  FileToQR.registry.register('converters', 'file-converter', fileConverter);
  
  // 파일 관련 유틸리티 함수 통합
  if (!FileToQR.utils.file) {
    FileToQR.utils.file = {
      getExtension: fileConverter.getFileExtension,
      formatSize: fileConverter.formatFileSize,
      toDataUri: fileConverter.fileToDataUri
    };
  }
}

// 다른 모듈에서 유틸리티 함수 사용
if (FileToQR.utils && FileToQR.utils.file) {
  fileUtils = FileToQR.utils.file;
  // 유틸리티 함수 사용
}
```

## 의존성 관리

모듈 간 의존성은 다음과 같이 관리됩니다:

1. **모듈 등록 순서**: 의존성이 있는 모듈은 의존 대상 모듈 이후에 등록
2. **명시적 의존성**: 레지스트리에 모듈 등록 시 의존성 목록 명시
3. **초기화 순서**: app-core.js에서 페이지 로드 시 의존성 순서에 따라 초기화

```javascript
// 의존성 명시 예
FileToQR.registry.register('qr-generator', 'qr-generator', qrGenerator, ['utils.file']);
```

## 모듈 레지스트리 세부 사항

ModuleRegistry 클래스는 다음 핵심 기능을 제공합니다:

1. **register(namespace, name, moduleObject, dependencies, metadata)**: 
   모듈 등록

2. **get(namespace, name)**:
   등록된 모듈 참조 가져오기

3. **inject(module, dependencies)**:
   모듈에 의존성 주입

4. **getModules(namespace)**:
   등록된 모듈 목록 조회

5. **updateMetadata(namespace, name, metadata)**:
   모듈 메타데이터 업데이트

## 개선된 모듈 구조 지침

최근 개선 작업으로 다음 지침이 적용되었습니다:

1. **중복 함수 제거**: 유틸리티 함수들을 중앙화하여 중복 코드 제거
   - 예시: file-converter.js의 파일 유틸리티 함수를 FileToQR.utils.file로 통합

2. **모듈 등록 통일**: registry.js를 통한 중앙 집중식 모듈 관리
   - 모든 모듈은 `FileToQR.registry.register()` 메서드로 등록

3. **초기화 방식 통일**: 모든 모듈이 init() 메서드 제공
   - app-core.js의 initPageSpecific()에서 페이지별로 필요한 모듈 초기화

## 새 모듈 추가 가이드

새 모듈을 추가할 때는 다음 단계를 따르세요:

1. 적절한 디렉토리에 모듈 파일 생성 (기능에 따라 분류)
2. 표준 모듈 구조 템플릿 사용
3. 모든 공개 API에 적절한 JSDoc 주석 추가
4. 초기화(init) 함수 반드시 구현
5. registry.js에 모듈 등록 코드 추가
6. 필요한 경우 공통 유틸리티 함수를 FileToQR.utils에 등록

## 의존성 순서 예시

```
1. core/app-core.js (핵심 기능)
2. utils/* (기본 유틸리티)
3. registry.js (모듈 등록 시스템)
4. converters/file-converter.js (파일 변환 + 파일 유틸리티)
5. qr-generator/qr-generator.js, qr-generator/qr-scanner.js (QR 코드 관련)
``` 