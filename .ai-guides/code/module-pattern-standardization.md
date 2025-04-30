# 모듈 로딩 방식 표준화 문서

**버전**: 1.0.0  
**최종 업데이트**: 2025-06-25  
**담당 영역**: 코드 구조, 모듈 패턴

## 개요

이 문서는 FileToQR 프로젝트의 자바스크립트 모듈 로딩 방식 표준화 작업에 대한 내용을 설명합니다. 이 개선 작업을 통해 프로젝트 전체의 코드 구조가 일관성 있게 변경되었으며, 유지보수성과 확장성이 향상되었습니다.

## 기존 문제점

프로젝트에서 모듈 로딩/정의 방식이 혼합되어 사용되었습니다:

1. **ES 모듈 패턴**:
   ```javascript
   // 모듈 가져오기
   import FileUtils from '../utils/file-utils.js';
   
   // 모듈 정의 및 내보내기
   const ModuleName = { /* 구현 */ };
   export default ModuleName;
   ```

2. **즉시 실행 함수(IIFE) 패턴**:
   ```javascript
   // ES 모듈 가져오기
   import FileUtils from '../utils/file-utils.js';
   
   // 즉시 실행 함수로 캡슐화
   (function() {
     'use strict';
     
     // 전역 네임스페이스에 모듈 노출
     const FileToQR = window.FileToQR = window.FileToQR || {};
     const moduleNamespace = FileToQR.moduleNamespace = {};
     
     // 모듈 내부 구현...
   })();
   ```

이 두 가지 패턴이 혼합되어 사용되면서 다음과 같은 문제가 발생했습니다:

- 코드 일관성 부족으로 가독성 저하
- 모듈 간 의존성 추적 어려움
- 전역 네임스페이스 오염 가능성
- 테스트 및 디버깅 복잡성 증가
- 번들러 최적화 제한

## 개선 방향: ES 모듈 표준화

모든 모듈을 ES 모듈 패턴으로 통일하기로 결정했습니다. 이는 다음과 같은 이유로 선택되었습니다:

1. **표준 준수**: ES 모듈은 JavaScript의 공식 모듈 시스템
2. **정적 분석 가능**: 정적 `import`/`export`로 의존성 분석이 용이
3. **트리 쉐이킹**: 번들러의 코드 최적화 지원
4. **명시적 의존성**: 모듈 간 관계가 명확하게 표현됨
5. **캡슐화**: 모듈 스코프 자체가 캡슐화를 제공하므로 IIFE가 필요 없음

## 변환 패턴

### IIFE와 전역 네임스페이스 패턴에서 ES 모듈 패턴으로 변환

```javascript
// 변환 전
import FileUtils from '../utils/file-utils.js';

(function() {
  'use strict';
  
  const FileToQR = window.FileToQR = window.FileToQR || {};
  const myModule = FileToQR.myModule = {};
  
  let privateVar = 'private';
  
  myModule.publicMethod = function() {
    // 구현...
  };
  
  function privateFunction() {
    // 구현...
  }
  
  // 초기화
  function init() {
    // 구현...
  }
  
  // 모듈이 로드될 때 init 호출
  init();
})();
```

```javascript
// 변환 후
import FileUtils from '../utils/file-utils.js';

// 비공개 변수 및 함수
let privateVar = 'private';

function privateFunction() {
  // 구현...
}

// 초기화 함수
function init() {
  // 구현...
}

// 공개 API를 가진 모듈 객체
const myModule = {
  publicMethod() {
    // 구현...
  }
};

// 초기화 실행
init();

// 하위 호환성을 위한 전역 참조 (선택사항)
if (typeof window !== 'undefined') {
  window.FileToQR = window.FileToQR || {};
  window.FileToQR.myModule = myModule;
}

// 모듈 내보내기
export default myModule;
```

## 적용된 주요 변경 사항

1. **모듈 정의 통일**
   - 모든 모듈이 ES 모듈 패턴으로 변환됨
   - IIFE 제거 및 자연스러운 모듈 스코프 활용

2. **의존성 관리 개선**
   - 모든 의존성을 상단에 명시적 `import` 문으로 선언
   - 순환 의존성 감지 및 해결

3. **전역 네임스페이스 정리**
   - 전역 객체(`window.FileToQR`)를 통한 접근 최소화
   - 필요한 경우 하위 호환성을 위한 제한적 전역 참조 유지

4. **초기화 프로세스 표준화**
   - 모듈 로드 시 실행되는 초기화 코드 명확히 분리
   - 이벤트 기반 초기화 패턴 적용

5. **내부 API와 공개 API 구분**
   - 모듈 내부 함수는 모듈 스코프에 비공개로 유지
   - 공개 API만 `export` 문을 통해 노출

## 예제: 변환된 파일

### 파일 유틸리티 모듈
```javascript
/**
 * file-utils.js - FileToQR 파일 유틸리티 모듈
 * 버전: 1.1.0
 * 최종 업데이트: 2025-06-25
 */

// 비공개 헬퍼 함수들
function isValidFileName(filename) {
  return typeof filename === 'string' && filename.length > 0;
}

// 파일 유틸리티 모듈 API 정의
const FileUtils = {
  /**
   * 파일명에서 확장자 추출
   * @param {string} filename - 파일명
   * @returns {string} 소문자 확장자 (점 제외)
   */
  getFileExtension(filename) {
    if (!isValidFileName(filename)) return '';
    return filename.split('.').pop().toLowerCase();
  },

  /**
   * 바이트 단위 파일 크기를 사람이 읽기 쉬운 형식으로 변환
   * @param {number} bytes - 바이트 단위 크기
   * @param {number} decimals - 소수점 자릿수 (기본값: 2)
   * @returns {string} 포맷팅된 파일 크기 (예: "1.5 MB")
   */
  formatFileSize(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
  },

  // 나머지 메서드들...
};

// 하위 호환성을 위한 전역 참조
if (typeof window !== 'undefined') {
  window.FileToQR = window.FileToQR || {};
  window.FileToQR.utils = window.FileToQR.utils || {};
  window.FileToQR.utils.file = FileUtils;
}

// 모듈 내보내기
export default FileUtils;
```

### QR Generator 모듈
```javascript
/**
 * qr-generator.js - QR 코드 생성 기능을 구현하는 모듈
 * 버전: 1.2.0
 * 최종 업데이트: 2025-06-25
 */

// 의존성 가져오기
import FileUtils from '../utils/file-utils.js';
import QRCore from '../core/qr-core.js';

// 모듈 내부 상태
let qrSettings = {
  foregroundColor: '#000000',
  backgroundColor: '#FFFFFF',
  errorCorrectionLevel: 'M',
  margin: 1,
  size: 256,
  logoEnabled: false,
  logoSize: 15,
  logoImage: null
};

let currentContentType = 'url';
let qrCode = null;
let generatedQRDataURL = null;
let fileUtils = null;

// 비공개 함수들
function initUI() {
  // DOM 요소 참조
  const elements = {
    // 요소 참조 코드...
  };
  
  // 이벤트 리스너 등록
  bindEvents(elements);
  
  // URL 파라미터 및 세션 스토리지 데이터 확인
  checkForFileData();
  
  console.log('QR 코드 생성기 초기화 완료');
}

function loadQRCodeLibrary() {
  return new Promise((resolve, reject) => {
    // 라이브러리 로드 코드...
  });
}

function bindEvents(elements) {
  // 이벤트 바인딩 코드...
}

// 추가 내부 함수들...

// 공개 API를 가진 모듈 객체
const qrGenerator = {
  /**
   * 모듈 초기화
   */
  init() {
    console.log('QR 코드 생성기 초기화 중...');
    
    // FileToQR.utils가 준비되었는지 확인
    if (window.FileToQR?.utils?.file) {
      fileUtils = window.FileToQR.utils.file;
      console.log('파일 유틸리티 참조 설정 완료');
    } else {
      console.warn('파일 유틸리티를 찾을 수 없습니다. 내부 기능으로 대체합니다.');
      fileUtils = FileUtils; // 새 유틸리티 모듈 사용
    }
    
    // QRCode 라이브러리 로드 확인
    if (typeof QRCode === 'undefined') {
      console.warn('QRCode 라이브러리가 로드되지 않았습니다. 라이브러리를 로드 중입니다...');
      loadQRCodeLibrary().then(() => {
        console.log('QRCode 라이브러리 로드 완료');
        initUI();
      }).catch(error => {
        console.error('QRCode 라이브러리 로드 실패:', error);
      });
    } else {
      initUI();
    }
  },
  
  /**
   * QR 코드 생성
   * @param {string} contentType - 콘텐츠 유형
   * @param {string|Object} content - QR 코드 콘텐츠
   * @param {Object} settings - QR 코드 설정
   */
  generateQR(contentType, content, settings = {}) {
    // QR 코드 생성 코드...
  },
  
  // 기타 공개 API들...
};

// 하위 호환성을 위한 전역 참조 (qrGenerator.js와 같은 경우만)
if (typeof window !== 'undefined') {
  window.FileToQR = window.FileToQR || {};
  window.FileToQR.qrGenerator = qrGenerator;
}

// 모듈 내보내기
export default qrGenerator;
```

## 하위 호환성 유지

기존 코드가 전역 `FileToQR` 네임스페이스에 의존하는 경우에 대한 하위 호환성을 유지하기 위해:

1. **순차적 마이그레이션**: 모든 모듈이 ES 모듈 패턴으로 변환되는 동안 기존 의존성 유지
2. **전역 객체 참조 유지**: 대부분의 모듈에서 전역 객체에 대한 제한적인 참조 유지
3. **점진적 이전**: 중요도가 낮은 모듈부터 시작하여 핵심 모듈로 전환
4. **테스트 강화**: 각 변환 후 기능 테스트를 통한 호환성 문제 조기 발견

## 이점

1. **일관성**: 모든 코드가 동일한 모듈 패턴을 따름으로써 가독성 향상
2. **의존성 관리**: 모듈 간의 명확한 의존성 표현으로 관리 용이
3. **현대적 개발**: 최신 자바스크립트 표준 및 도구와의 호환성 개선
4. **디버깅 개선**: 모듈 구조가 명확해져 디버깅이 용이
5. **번들러 최적화**: 트리 쉐이킹 등 번들러 최적화 지원 향상
6. **IDE 지원**: 코드 완성 및 정적 분석 도구의 효과적인 지원

## 결론

ES 모듈 패턴으로의 표준화를 통해 FileToQR 프로젝트의 코드 구조가 더욱 일관되고 유지보수하기 쉬워졌습니다. 이러한 변화는 개발 생산성을 향상시키고, 향후 기능 확장을 더 효율적으로 지원할 것입니다. 