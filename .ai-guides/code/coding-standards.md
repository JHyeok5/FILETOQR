# FileToQR 코딩 표준

**버전**: 1.0.0  
**최종 업데이트**: 2025-06-15

## 개요

이 문서는 FileToQR 프로젝트에서 일관된 코드 스타일과 구조를 유지하기 위한 코딩 표준을 정의합니다. 모든 코드 기여 시 이 가이드라인을 준수해야 합니다.

## 일반 코딩 규칙

### 기본 원칙

1. **가독성 우선**: 간결하고 읽기 쉬운 코드 작성
2. **일관성 유지**: 프로젝트 전체에서 동일한 스타일과 패턴 사용
3. **자체 문서화**: 코드 자체로 의도와 동작이 명확하게 전달되도록 작성
4. **중복 방지**: 코드 중복은 최소화하고 재사용성 높은 함수로 분리

### 명명 규칙

1. **변수 및 함수명**:
   - camelCase 사용: `fileName`, `getDataFromServer`
   - 의미 있고 설명적인 이름 사용
   - 너무 짧거나 너무 긴 이름 지양 (1~3단어 권장)

2. **상수**:
   - 대문자와 언더스코어 사용: `MAX_RETRY_COUNT`, `API_ENDPOINT`

3. **파일명**:
   - 소문자 케밥 케이스 사용: `file-converter.js`, `url-utils.js`
   - 기능을 설명하는 명확한 이름 사용

4. **클래스명**:
   - PascalCase 사용: `FileConverter`, `ModuleRegistry`

### 포맷팅

1. **들여쓰기**: 2칸 공백 사용
2. **줄 길이**: 최대 80자 (초과 시 적절히 줄 바꿈)
3. **세미콜론**: 모든 구문 끝에 세미콜론 포함
4. **따옴표**: 문자열은 작은 따옴표(`'`) 사용
5. **중괄호**: 여는 중괄호는 같은 줄에 배치

```javascript
// 올바른 방식
function calculateTotal(items) {
  let total = 0;
  for (let i = 0; i < items.length; i++) {
    total += items[i].price;
  }
  return total;
}

// 피해야 할 방식
function calculateTotal (items) 
{
    let total = 0
    for(let i=0;i<items.length;i++)
    {
        total += items[i].price
    }
    return total
}
```

## JavaScript 특화 표준

### 모듈 구조

각 JavaScript 모듈은 다음 표준 구조를 따라야 합니다:

```javascript
/**
 * 파일명 - 간략한 설명
 * 버전: 1.0.0
 * 최종 업데이트: YYYY-MM-DD
 * 참조: ../.ai-guides/관련문서.md
 * 
 * 이 모듈은 ... 기능을 담당합니다:
 * - 주요 기능 1
 * - 주요 기능 2
 */

// 모듈 객체 (외부로 노출될 API)
const moduleName = {};

// 즉시 실행 함수로 내부 로직 캡슐화
(function() {
  'use strict';
  
  // private 변수 및 함수
  
  /**
   * 함수 설명
   * @param {타입} 파라미터명 - 파라미터 설명
   * @returns {타입} 반환값 설명
   */
  function someFunction(param) {
    // 구현
  }
  
  // API 노출
  moduleName.publicFunction = someFunction;
  
  // 글로벌 네임스페이스에 등록
  window.moduleName = moduleName;
})();

// ESM 모듈 익스포트
export default moduleName;
```

### 변수 선언

1. **const 우선**: 값이 재할당되지 않는 변수는 const 사용
2. **let 사용**: 블록 스코프의 변수는 let 사용 (var 사용 금지)
3. **변수 호이스팅 주의**: 변수는 사용 직전에 선언

```javascript
// 올바른 방식
const API_URL = 'https://api.example.com';
let count = 0;

function process() {
  const data = fetchData();
  let result;
  
  if (data.isValid) {
    result = processData(data);
  }
  
  return result;
}

// 피해야 할 방식
var API_URL = 'https://api.example.com';
var count = 0;
var result;

function process() {
  var data = fetchData();
  
  if (data.isValid) {
    result = processData(data);  // 전역 변수 수정
  }
  
  return result;
}
```

### 함수 선언

1. **함수 표현식** 사용:

```javascript
// 선호되는 방식
const calculateArea = function(width, height) {
  return width * height;
};

// 또는 화살표 함수
const calculateArea = (width, height) => width * height;

// 피해야 할 방식 (호이스팅 문제)
function calculateArea(width, height) {
  return width * height;
}
```

2. **명확한 파라미터**: 함수 파라미터는 명확하고 일관되게 유지

3. **기본값 사용**: 가능한 경우 파라미터 기본값 제공

```javascript
function createUser(name, role = 'user', active = true) {
  // ...
}
```

### 비동기 코드 처리

1. **Promise 및 async/await 선호**:

```javascript
// 선호되는 방식
async function fetchUserData(userId) {
  try {
    const response = await fetch(`/api/users/${userId}`);
    if (!response.ok) throw new Error('Network error');
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch user data:', error);
    return null;
  }
}

// 콜백 지양
function fetchUserData(userId, callback) {
  fetch(`/api/users/${userId}`)
    .then(response => response.json())
    .then(data => callback(null, data))
    .catch(error => callback(error));
}
```

### 오류 처리

1. **명시적 오류 처리**: try/catch 블록으로 예외 처리
2. **의미 있는 오류 메시지**: 오류 발생 시 상세한 정보 제공
3. **오류 전파**: 필요한 경우 상위 레벨로 오류 전파

```javascript
async function processFile(file) {
  try {
    const data = await readFile(file);
    return processData(data);
  } catch (error) {
    console.error(`파일 처리 중 오류 발생: ${file.name}`, error);
    throw new Error(`Failed to process ${file.name}: ${error.message}`);
  }
}
```

## HTML 및 CSS 표준

### HTML 구조

1. **시맨틱 태그 사용**: `<header>`, `<nav>`, `<main>`, `<section>`, `<footer>` 등
2. **속성 순서**: id, class, data-*, 기타 속성
3. **들여쓰기**: 중첩된 요소는 2칸 들여쓰기

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>페이지 제목</title>
</head>
<body>
  <header class="main-header">
    <nav>
      <ul>
        <li><a href="#">메뉴 1</a></li>
        <li><a href="#">메뉴 2</a></li>
      </ul>
    </nav>
  </header>
  
  <main>
    <section id="intro" class="intro-section">
      <h1>섹션 제목</h1>
      <p>섹션 내용</p>
    </section>
  </main>
  
  <footer>
    <p>&copy; 2025 FileToQR</p>
  </footer>
</body>
</html>
```

### CSS 구조

1. **클래스 명명**: 케밥 케이스 사용 (`nav-item`, `file-container`)
2. **BEM 방법론** 권장: Block__Element--Modifier
3. **속성 순서**:
   - 포지셔닝/레이아웃 (position, display, z-index 등)
   - 박스 모델 (width, height, margin, padding 등)
   - 타이포그래피 (font, line-height, text-* 등)
   - 시각 효과 (color, background, border, opacity 등)
   - 변환/애니메이션 (transform, transition, animation 등)

```css
.card {
  /* 포지셔닝 */
  position: relative;
  display: flex;
  
  /* 박스 모델 */
  width: 300px;
  height: auto;
  margin: 1rem;
  padding: 1rem;
  
  /* 타이포그래피 */
  font-size: 1rem;
  line-height: 1.5;
  
  /* 시각 효과 */
  background-color: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  
  /* 변환/애니메이션 */
  transition: box-shadow 0.3s ease;
}

.card:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}
```

## 코드 품질

### 코드 문서화

1. **모듈 헤더**: 모든 파일 상단에 모듈의 목적과 기능 설명

2. **JSDoc 주석**: 모든 함수와 클래스에 JSDoc 스타일 주석 사용

```javascript
/**
 * 파일을 데이터 URI로 변환
 * @param {File} file - 변환할 파일 객체
 * @returns {Promise<string>} 데이터 URI
 */
function fileToDataUri(file) {
  // 구현
}
```

3. **인라인 주석**: 복잡한 로직이나 명확하지 않은 의도에 대한 설명

### 코드 테스트

1. **단위 테스트**: 중요 함수와 모듈에 대한 단위 테스트 작성
2. **테스트 커버리지**: 핵심 기능에 대해 높은 테스트 커버리지 목표
3. **경계 조건 테스트**: 극단적 입력값과 오류 조건 테스트

### 성능 최적화

1. **DOM 조작 최소화**: DOM 조작은 배치 처리 
2. **이벤트 위임**: 가능한 경우 이벤트 위임 패턴 사용
3. **불필요한 연산 방지**: 계산 결과 캐싱, 메모이제이션 활용

## 모듈 통합 가이드라인

최근 개선된 중복 기능 제거와 모듈 구조화 방식을 따라야 합니다:

1. **중복 함수 통합**:
   - 유틸리티 함수는 해당 네임스페이스(FileToQR.utils.*)에 등록
   - 다른 모듈에서는 유틸리티 네임스페이스를 통해 함수 참조

2. **모듈 등록 표준**:
   - 모든 모듈은 registry.js를 통해 등록
   - 의존성을 명시적으로 선언

3. **초기화 방식 통일**:
   - 모든 모듈은 표준화된 init() 메서드 제공
   - app-core.js의 initPageSpecific()에서 호출

4. **파일 구조화**:
   - 명확한 디렉토리 분류에 따라 파일 배치
   - 일관된 네이밍 규칙 준수 