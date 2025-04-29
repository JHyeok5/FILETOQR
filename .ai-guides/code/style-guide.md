# FileToQR 코딩 스타일 가이드

**버전**: 1.3.0  
**최종 업데이트**: 2025-05-25

## 개요

이 문서는 FileToQR 프로젝트의 일관된 코드 스타일을 유지하기 위한 가이드라인을 제공합니다. 코드를 작성하거나 수정할 때 이 지침을 따라주세요.

## 일반 원칙

1. **가독성 우선**: 항상 가독성과 유지보수성을 최우선으로 고려
2. **단순성**: 복잡한 솔루션보다 단순하고 명확한 코드 선호
3. **일관성**: 프로젝트 전체에 걸쳐 일관된 패턴과 스타일 유지
4. **자체 문서화**: 코드가 그 의도를 명확히 전달하도록 작성

## JavaScript 코딩 규칙

### 파일 구조

```javascript
/**
 * 파일 설명 주석
 * 
 * 파일의 전반적인 목적과 기능 설명
 * 
 * @module module-name
 */

// 외부 의존성 임포트
import { something } from 'external-lib';

// 내부 모듈 임포트
import { anotherThing } from '../module/another-thing.js';

// 상수 정의
const CONSTANT_VALUE = 'value';

// 클래스 또는 주요 기능 구현
class MyClass {
  // 클래스 구현
}

// 유틸리티 함수
function utilityFunction() {
  // 함수 구현
}

// 내보내기
export default MyClass;
export { utilityFunction };
```

### 명명 규칙

- **변수/함수**: camelCase 사용 (예: `fileName`, `calculateTotal`)
- **클래스/생성자**: PascalCase 사용 (예: `FileUploader`, `QRGenerator`)
- **상수**: 대문자 스네이크 케이스 사용 (예: `MAX_FILE_SIZE`, `DEFAULT_QUALITY`)
- **프라이빗 속성/메소드**: 언더스코어 접두사 사용 (예: `_privateMethod`)

### 함수 작성

```javascript
/**
 * 함수 설명
 * 
 * @param {Type} paramName - 파라미터 설명
 * @returns {ReturnType} 반환값 설명
 */
function functionName(paramName) {
  // 구현
  return result;
}
```

- 함수는 단일 책임을 가져야 함
- 20줄 이상의 함수는 작은 함수로 분리 고려
- 기본 매개변수 값 사용 권장 (예: `function(param = defaultValue)`)

### 클래스 작성

```javascript
/**
 * 클래스 설명
 */
class ClassName {
  /**
   * 생성자 설명
   * @param {Type} param - 파라미터 설명
   */
  constructor(param) {
    this.property = param;
    this._privateProperty = 'private';
  }
  
  /**
   * 메소드 설명
   * @param {Type} param - 파라미터 설명
   * @returns {ReturnType} 반환값 설명
   */
  methodName(param) {
    // 구현
    return result;
  }
  
  /**
   * 프라이빗 메소드 설명
   * @private
   */
  _privateMethod() {
    // 구현
  }
}
```

### 비동기 처리

- Promise 대신 async/await 사용 권장
- 오류 처리는 try-catch 블록 사용

```javascript
async function asyncFunction() {
  try {
    const result = await someAsyncOperation();
    return processResult(result);
  } catch (error) {
    console.error('Error in asyncFunction:', error);
    throw error; // 필요에 따라 오류 전파
  }
}
```

### 조건문

- 복잡한 조건은 설명 변수로 분리

```javascript
// 권장하지 않음
if (file.size > 5242880 && (file.type.startsWith('image/') || file.type.startsWith('video/'))) {
  // 코드
}

// 권장
const isLargeFile = file.size > 5242880;
const isMediaFile = file.type.startsWith('image/') || file.type.startsWith('video/');
if (isLargeFile && isMediaFile) {
  // 코드
}
```

### 모듈 등록

모든 주요 모듈은 레지스트리에 등록해야 합니다:

```javascript
import registry from '../registry.js';

// 모듈 정의
const myModule = {
  // 구현
};

// 레지스트리 등록
registry.register('category.subcategory', 'module-name', myModule, {
  // 메타데이터
  version: '1.0.0',
  description: '모듈 설명',
  dependencies: ['other-module'],
  // 변환기인 경우
  formats: {
    input: ['format1', 'format2'],
    output: ['format3', 'format4']
  }
});

export default myModule;
```

## HTML/CSS 코딩 규칙

### HTML 구조

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>페이지 제목 - FileToQR</title>
  <link rel="stylesheet" href="assets/css/styles.css">
</head>
<body>
  <!-- 헤더 컴포넌트 -->
  <div id="header-container"></div>
  
  <!-- 메인 콘텐츠 -->
  <main class="container">
    <section class="section-name">
      <h1>제목</h1>
      <!-- 콘텐츠 -->
    </section>
  </main>
  
  <!-- 푸터 컴포넌트 -->
  <div id="footer-container"></div>
  
  <!-- 스크립트 -->
  <script type="module" src="assets/js/core/app-core.js"></script>
</body>
</html>
```

### CSS 네이밍

- BEM(Block Element Modifier) 방법론 사용

```css
/* 블록 */
.file-uploader {
  /* 스타일 */
}

/* 요소 */
.file-uploader__input {
  /* 스타일 */
}

/* 수정자 */
.file-uploader--active {
  /* 스타일 */
}
```

### 컴포넌트 로딩

컴포넌트 로딩은 다음과 같이 구현:

```javascript
/**
 * HTML 컴포넌트 로드
 * @param {string} containerId - 컴포넌트를 로드할 컨테이너 ID
 * @param {string} componentPath - 컴포넌트 파일 경로
 */
async function loadComponent(containerId, componentPath) {
  try {
    const response = await fetch(componentPath);
    const html = await response.text();
    document.getElementById(containerId).innerHTML = html;
  } catch (error) {
    console.error(`Failed to load component from ${componentPath}:`, error);
  }
}

// 사용 예
loadComponent('header-container', 'components/header.html');
loadComponent('footer-container', 'components/footer.html');
```

## 주석 작성 지침

### 파일 헤더 주석

```javascript
/**
 * 파일 이름 및 설명
 * 
 * 상세한 설명과 주요 기능 소개
 * 
 * @module module-name
 * @author 작성자
 * @version 1.0.0
 * @since 2025-04-28
 */
```

### 함수/메소드 주석

```javascript
/**
 * 함수가 수행하는 작업에 대한 간결한 설명
 * 
 * 필요 시 더 자세한 설명 추가
 *
 * @param {Type} paramName - 파라미터 설명
 * @param {Type} [optionalParam] - 선택적 파라미터 설명
 * @returns {ReturnType} 반환값 설명
 * @throws {ErrorType} 오류 발생 조건 설명
 * @example
 * // 사용 예시 코드
 * const result = functionName('example');
 */
```

### 코드 내 주석

- 복잡한 로직에만 코드 내 주석 사용
- 주석은 '무엇'이 아닌 '왜'에 초점

```javascript
// 잘못된 예
// i를 1씩 증가
i++;

// 좋은 예
// 홀수 인덱스만 처리하기 위해 2씩 증가
i += 2;
```

## 오류 처리

### 기본 원칙

- 예상 가능한 오류는 명시적으로 처리
- 구체적인 오류 메시지 제공
- 사용자 친화적인 오류 표시

### 오류 객체 구조

```javascript
class AppError extends Error {
  constructor(message, code, userMessage) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.userMessage = userMessage || message;
  }
}

// 사용 예
throw new AppError(
  'Failed to convert image: HEIC format not supported',
  'FORMAT_NOT_SUPPORTED',
  '이미지 변환 실패: HEIC 형식은 지원되지 않습니다.'
);
```

## 테스트 코드 작성

### 기본 구조

```javascript
/**
 * 기능 테스트
 */
function testFeature() {
  console.group('Testing Feature');
  
  try {
    // 테스트 케이스
    const result = featureFunction(testInput);
    console.log('Expected:', expectedOutput);
    console.log('Result:', result);
    console.assert(
      JSON.stringify(result) === JSON.stringify(expectedOutput),
      'Test failed: Result does not match expected output'
    );
    
    console.log('✅ Test passed');
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
  
  console.groupEnd();
}
```

## 성능 최적화 지침

- 큰 파일 처리 시 Web Worker 사용
- 메모리 효율성 고려 (대용량 객체의 참조 명시적 제거)
- 비용이 큰 연산 캐싱
- DOM 조작 최소화 (일괄 업데이트 사용)

## 예제 구현

### 기본 버튼 컴포넌트

### QR 코드 생성기 - 파일 기능

다음은 파일 기반 QR 코드 생성 기능의 구현 예시입니다:

```javascript
/**
 * 파일 입력 핸들러
 * @param {Event} e - 이벤트 객체
 */
function handleFileSelect(e) {
  const file = e.target.files[0];
  if (!file) return;
  
  // 파일 크기 제한 검증
  const maxSizeKB = 2;
  if (file.size > maxSizeKB * 1024) {
    showError(`파일 크기가 최대 허용 크기(${maxSizeKB}KB)를 초과합니다`);
    clearFileInput();
    return;
  }
  
  // 글로벌 변수에 파일 저장
  fileToEncode = file;
  
  // 파일 정보 표시
  const fileInfo = document.getElementById('file-info');
  fileInfo.innerHTML = `
    <p><strong>파일명:</strong> ${file.name}</p>
    <p><strong>크기:</strong> ${formatFileSize(file.size)}</p>
    <p><strong>유형:</strong> ${file.type || '알 수 없음'}</p>
  `;
  
  // 파일 미리보기 표시 (가능한 경우)
  displayFilePreview(file);
}

/**
 * 파일을 QR 코드로 인코딩
 * @param {File} file - 인코딩할 파일
 * @returns {Promise<string>} 인코딩된 데이터 URI
 */
async function encodeFileToQR(file) {
  try {
    // 파일을 데이터 URI로 변환
    const dataUri = await fileConverter.fileToDataUri(file);
    return dataUri;
  } catch (error) {
    throw new Error(`파일 인코딩 오류: ${error.message}`);
  }
}
```

### 파일 미리보기 기능 구현

파일 유형에 따른 적절한 미리보기를 제공하는 예시입니다:

```javascript
/**
 * 파일 미리보기 표시
 * @param {File} file - 미리보기할 파일
 */
function displayFilePreview(file) {
  const filePreview = document.getElementById('file-preview');
  
  // 파일 유형에 따라 적절한 미리보기 표시
  if (file.type.match('image.*')) {
    // 이미지 파일 미리보기
    const reader = new FileReader();
    reader.onload = function(e) {
      filePreview.innerHTML = `<img src="${e.target.result}" alt="이미지 미리보기">`;
    };
    reader.readAsDataURL(file);
  } else if (file.type.match('text.*') || file.type === 'application/json') {
    // 텍스트 파일 미리보기
    const reader = new FileReader();
    reader.onload = function(e) {
      // 텍스트 길이 제한 (표시를 위해)
      const text = e.target.result;
      const previewText = text.length > 500 ? text.substr(0, 500) + '...' : text;
      filePreview.innerHTML = `<div class="text-preview">${previewText}</div>`;
    };
    reader.readAsText(file);
  } else if (file.type.match('audio.*')) {
    // 오디오 파일 미리보기
    const reader = new FileReader();
    reader.onload = function(e) {
      filePreview.innerHTML = `<audio controls src="${e.target.result}"></audio>`;
    };
    reader.readAsDataURL(file);
  } else if (file.type.match('video.*')) {
    // 비디오 파일 미리보기
    const reader = new FileReader();
    reader.onload = function(e) {
      filePreview.innerHTML = `<video controls src="${e.target.result}"></video>`;
    };
    reader.readAsDataURL(file);
  } else {
    // 기타 파일 유형
    const extension = getFileExtension(file.name);
    filePreview.innerHTML = `<div class="generic-preview">${extension.toUpperCase()} 파일</div>`;
  }
}
```

이 예시는 다음 모범 사례를 보여줍니다:
- 다양한 파일 유형(이미지, 텍스트, 오디오, 비디오 등)에 적합한 미리보기 제공
- 각 파일 유형에 맞는 FileReader API 메서드 사용(readAsDataURL, readAsText)
- 텍스트 파일의 경우 길이 제한을 통한 성능 최적화
- JSDoc 주석으로 함수 설명 및 매개변수 문서화
- 명확한 변수명과 함수명 사용
- 조건부 로직의 구조화된 접근 방식

## 파일 구조 컨벤션

## 변경 이력

- **1.2.0** (2025-05-20): 파일 미리보기 기능 구현 예제 추가
- **1.1.0** (2025-05-15): 파일 기반 QR 코드 생성 예제 추가
- **1.0.0** (2025-04-28): 최초 문서 작성

## 마무리

이 스타일 가이드는 FileToQR 프로젝트의 일관성과 품질을 유지하기 위해 작성되었습니다. 모든 개발 참여자는 이 가이드라인을 따라주세요.

## 모듈 간 통신 패턴

### 페이지 간 데이터 전달

FileToQR에서 페이지 간 데이터 전달에는 다음 방식을 사용합니다:

#### 1. URL 파라미터를 통한 간단한 데이터 전달

```javascript
// 데이터 전송
function navigateToPage(data) {
  const url = `target-page.html?param1=${encodeURIComponent(data.value1)}&param2=${encodeURIComponent(data.value2)}`;
  window.location.href = url;
}

// 데이터 수신
function receiveUrlParams() {
  const params = new URLSearchParams(window.location.search);
  const param1 = params.get('param1');
  const param2 = params.get('param2');
  
  if (param1 && param2) {
    // 데이터 처리
  }
}
```

#### 2. 세션 스토리지를 사용한 복잡한 데이터 전달 (권장 패턴)

파일 변환에서 QR 코드 생성으로 데이터를 전달할 때와 같이 더 복잡한 데이터 구조를 위해 세션 스토리지를 사용합니다:

```javascript
// 데이터 전송 (file-converter.js)
function sendDataToOtherPage(data) {
  try {
    // 필요한 데이터만 선택적으로 저장
    const transferData = {
      id: data.id,
      name: data.name,
      type: data.type,
      size: data.size,
      dataUri: data.dataUri
    };
    
    // 세션 스토리지에 데이터 저장
    sessionStorage.setItem('fileToQR', JSON.stringify(transferData));
    
    // URL 파라미터로 데이터 유형 전달 (세션 스토리지 키가 아닌 데이터 유형)
    window.location.href = 'qrcode.html?contentType=file';
  } catch (error) {
    console.error('데이터 전송 오류:', error);
    // 오류 처리
  }
}

// 데이터 수신 (qr-generator.js)
function checkForTransferredData() {
  const params = new URLSearchParams(window.location.search);
  const contentType = params.get('contentType');
  
  if (contentType === 'file') {
    // 세션 스토리지에서 데이터 검색
    const dataJson = sessionStorage.getItem('fileToQR');
    
    if (dataJson) {
      try {
        const receivedData = JSON.parse(dataJson);
        
        // 데이터 사용 후 세션 스토리지에서 제거
        sessionStorage.removeItem('fileToQR');
        
        // 데이터 처리
        processReceivedData(receivedData);
      } catch (error) {
        console.error('데이터 파싱 오류:', error);
        // 오류 처리
      }
    }
  }
}

// 수신된 데이터 처리
function processReceivedData(data) {
  // 데이터 유효성 검사
  if (!data || !data.dataUri) {
    console.error('유효하지 않은 데이터 형식');
    return;
  }
  
  // UI 업데이트
  updateUIWithData(data);
  
  // 작업 수행
  performOperation(data);
}
```

### 메모리 및 성능 고려사항

1. **세션 스토리지 크기 제한**: 최대 5-10MB이므로 매우 큰 파일 데이터는 저장 안 됨
2. **데이터 최소화**: 필요한 최소한의 데이터만 전달
3. **데이터 정리**: 사용 후 세션 스토리지에서 데이터 제거
4. **오류 처리**: 데이터 전송/수신 중 오류 발생 가능성 대비
5. **민감 정보**: 민감한 정보는 세션 스토리지에 저장하지 않음
