# 모듈 레지스트리 가이드

**버전**: 1.2.0  
**최종 업데이트**: 2025-05-20

## 개요

모듈 레지스트리(registry.js)는 FileToQR 프로젝트의 핵심 아키텍처 구성 요소로, 모든 기능 모듈을 관리하고 의존성을 추적하는 중앙 시스템입니다. 이 문서는 레지스트리의 개념, 사용법, 확장 방법을 설명합니다.

## 레지스트리 목적

모듈 레지스트리는 다음과 같은 목적으로 사용됩니다:

1. **모듈 등록 및 발견**: 모든 기능 모듈을 중앙에서 등록하고 검색
2. **의존성 관리**: 모듈 간 의존성 관계를 명시적으로 정의하고 추적
3. **파일 형식 매핑**: 지원되는 변환 형식 간의 관계 관리
4. **모듈 메타데이터**: 버전, 설명 등 모듈 정보 저장
5. **확장성 제공**: 플러그인 패턴을 통한 기능 확장 지원

## 레지스트리 구조

```javascript
registry
├── modules                 // 등록된 모듈 컨테이너
│   ├── core                // 핵심 모듈
│   ├── converters          // 파일 변환기
│   │   ├── image           // 이미지 변환기
│   │   ├── document        // 문서 변환기
│   │   ├── audio           // 오디오 변환기
│   │   ├── video           // 비디오 변환기
│   │   └── data            // 데이터 변환기
│   ├── qr                  // QR 생성 관련 모듈
│   │   ├── generators      // QR 코드 생성기
│   │   ├── formatters      // QR 콘텐츠 포맷터
│   │   └── designers       // QR 디자인 모듈
│   ├── ui                  // UI 컴포넌트
│   ├── utils               // 유틸리티
│   └── workers             // Web Workers
│
├── formatMappings          // 변환 형식 매핑
│   └── conversions         // 입력 → 출력 형식 → 변환기 ID
│
├── supportedFormats        // 지원되는 파일 유형
│   ├── image               // 이미지 형식 목록
│   ├── document            // 문서 형식 목록
│   ├── audio               // 오디오 형식 목록
│   ├── video               // 비디오 형식 목록
│   └── data                // 데이터 형식 목록
│
├── dependencies            // 모듈 의존성 그래프
└── listeners               // 이벤트 리스너
    ├── register            // 등록 이벤트 리스너
    └── unregister          // 등록 해제 이벤트 리스너
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

// 레지스트리에 등록
registry.register('category.subcategory', 'module-id', myModule, {
  version: '1.0.0',
  description: '모듈 설명',
  dependencies: ['dependency1', 'dependency2']
});

export default myModule;
```

### 모듈 조회

```javascript
// 모듈 조회
const module = registry.get('category.subcategory', 'module-id');

if (module) {
  // 모듈 사용
  const result = module.process(data);
}
```

### 변환기 조회

```javascript
// 특정 파일 형식 변환에 사용할 변환기 조회
const converter = registry.getConverter('png', 'jpg');

if (converter) {
  // 변환기 사용
  const result = await converter.convert(file, options);
}
```

### 지원되는 형식 조회

```javascript
// 특정 입력 형식에 대해 지원되는 출력 형식 목록 조회
const outputFormats = registry.getSupportedOutputFormats('png');
console.log(outputFormats); // ['jpg', 'webp', 'gif', 'pdf', ...]
```

### 이벤트 리스닝

```javascript
// 모듈 등록 이벤트 리스닝
registry.on('register', (data) => {
  console.log(`Module ${data.id} registered in ${data.type}`);
});

// 모듈 등록 해제 이벤트 리스닝
registry.on('unregister', (data) => {
  console.log(`Module ${data.id} unregistered from ${data.type}`);
});
```

## 변환기 모듈 등록

변환기 모듈은 추가 메타데이터를 포함해야 합니다:

```javascript
// 이미지 변환기 등록
registry.register('converters.image', 'png-to-jpg', pngToJpgConverter, {
  version: '1.0.0',
  description: 'PNG에서 JPG로 변환',
  dependencies: ['assets/js/utils/file-utils.js'],
  formats: {
    input: ['png'],
    output: ['jpg', 'jpeg']
  }
});
```

변환기 등록 시 `formats` 속성이 있으면 자동으로 형식 매핑이 생성됩니다.

## 모듈 카테고리 구조

레지스트리에서 사용하는 모듈 카테고리 경로는 다음과 같습니다:

| 카테고리 경로 | 설명 | 예시 모듈 |
|--------------|------|----------|
| `core` | 핵심 애플리케이션 모듈 | `app-core`, `converter-core` |
| `converters.image` | 이미지 변환기 | `png-to-jpg`, `webp-optimizer` |
| `converters.document` | 문서 변환기 | `pdf-to-text`, `docx-to-html` |
| `converters.audio` | 오디오 변환기 | `mp3-to-wav`, `audio-compressor` |
| `converters.video` | 비디오 변환기 | `mp4-to-webm`, `video-to-gif` |
| `converters.data` | 데이터 변환기 | `csv-to-json`, `xml-formatter` |
| `converters.file` | 파일 인코딩 변환기 | `file-to-data-uri`, `file-to-base64` |
| `qr.generators` | QR 코드 생성기 | `basic-qr-generator`, `dynamic-qr` |
| `qr.formatters` | QR 콘텐츠 포맷터 | `url-formatter`, `vcard-formatter`, `wifi-formatter`, `file-formatter` |
| `qr.designers` | QR 디자인 도구 | `color-designer`, `logo-integrator` |
| `ui` | UI 컴포넌트 | `file-uploader`, `progress-tracker` |
| `ui.previews` | 미리보기 컴포넌트 | `image-preview`, `text-preview`, `file-preview` |
| `utils` | 유틸리티 함수 | `file-utils`, `ui-utils` |
| `workers` | Web Worker 스크립트 | `image-worker`, `compression-worker` |

## 의존성 관리

레지스트리는 모듈 간 의존성을 추적합니다:

```javascript
// 의존성이 있는 모듈 등록
registry.register('ui', 'result-viewer', resultViewerModule, {
  dependencies: [
    'utils/file-utils',
    'utils/ui-utils',
    'core/converter-core'
  ]
});

// 특정 모듈의 의존성 확인
const dependencies = registry.dependencies.get('ui/result-viewer');
console.log([...dependencies]); // ['utils/file-utils', 'utils/ui-utils', 'core/converter-core']
```

## 모듈 비활성화

필요한 경우 모듈을 비활성화할 수 있습니다:

```javascript
// 모듈 비활성화
registry.disable('converters.video', 'mp4-to-webm');

// 비활성화된 모듈은 get() 메서드로 조회되지 않음
const disabledModule = registry.get('converters.video', 'mp4-to-webm'); // null
```

## 새로운 카테고리 확장

프로젝트가 확장됨에 따라 새로운 모듈 카테고리가 필요할 수 있습니다. 이 경우 레지스트리 초기화 시 새 카테고리를 추가해야 합니다:

```javascript
// registry.js의 constructor 내부
this.modules = {
  // 기존 카테고리
  core: new Map(),
  converters: { /* ... */ },
  
  // 새 카테고리 추가
  newCategory: {
    subCategory: new Map()
  }
};
```

## 모듈 레지스트리 확장

레지스트리 자체에 새로운 기능이 필요한 경우 다음과 같이 확장할 수 있습니다:

```javascript
// registry.js에 새 메서드 추가
class Registry {
  // 기존 메서드들...
  
  /**
   * 특정 카테고리의 모든 모듈 조회
   * @param {string} category - 카테고리 경로
   * @returns {Array} 모듈 배열
   */
  getAllInCategory(category) {
    const path = category.split('.');
    let target = this.modules;
    
    for (const segment of path) {
      if (!target[segment]) {
        return [];
      }
      target = target[segment];
    }
    
    if (!(target instanceof Map)) {
      return [];
    }
    
    return Array.from(target.entries())
      .filter(([, entry]) => entry.metadata.enabled)
      .map(([id, entry]) => ({
        id,
        module: entry.module,
        metadata: entry.metadata
      }));
  }
}
```

## 모범 사례

### 레지스트리 사용 모범 사례

1. **명시적 의존성**: 모듈이 필요로 하는 모든 의존성을 명시적으로 선언
2. **의미 있는 ID**: 모듈 ID는 기능을 명확히 설명하는 이름 사용
3. **적절한 카테고리**: 모듈의 기능에 맞는 카테고리에 등록
4. **메타데이터 충실히 작성**: 버전, 설명 등 메타데이터 상세히 제공
5. **이벤트 활용**: 모듈 등록/해제 이벤트를 활용한 느슨한 결합 구현

### 일반적인 실수 방지

1. **하드코딩된 모듈 참조**: 직접 모듈을 임포트하는 대신 항상 레지스트리를 통해 조회
2. **중복 등록**: 동일 ID로 여러 번 등록하지 않도록 주의
3. **누락된 의존성**: 사용하는 모든 모듈을 의존성에 명시
4. **순환 의존성**: 상호 의존적인 모듈 구조 피하기

## 실제 사용 예시

### 이미지 변환기 구현

```javascript
// assets/js/converters/image-converter.js
import registry from '../registry.js';
import fileUtils from '../utils/file-utils.js';

/**
 * PNG에서 JPG로 변환하는 변환기
 */
const pngToJpgConverter = {
  /**
   * PNG 이미지를 JPG로 변환
   * @param {File} inputFile - 입력 PNG 파일
   * @param {Object} options - 변환 옵션 (품질, 크기 등)
   * @returns {Promise<Blob>} JPG 파일 Blob
   */
  async convert(inputFile, options = {}) {
    // 이미지를 캔버스에 로드
    const image = await fileUtils.fileToImage(inputFile);
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    
    const ctx = canvas.getContext('2d');
    ctx.drawImage(image, 0, 0);
    
    // JPG로 변환
    const quality = options.quality || 0.92;
    return new Promise(resolve => {
      canvas.toBlob(blob => resolve(blob), 'image/jpeg', quality);
    });
  }
};

// 레지스트리에 등록
registry.register('converters.image', 'png-to-jpg', pngToJpgConverter, {
  version: '1.0.0',
  description: 'PNG 이미지를 JPG로 변환',
  dependencies: ['utils/file-utils'],
  formats: {
    input: ['png'],
    output: ['jpg', 'jpeg']
  }
});

export default pngToJpgConverter;
```

### 변환 기능 사용

```javascript
// convert.html의 스크립트
import registry from './assets/js/registry.js';

// 파일 형식 감지
function detectFormat(file) {
  const extension = file.name.split('.').pop().toLowerCase();
  return extension;
}

// 파일 변환 처리
async function handleFileConversion(file, targetFormat) {
  const sourceFormat = detectFormat(file);
  
  // 레지스트리에서 적절한 변환기 조회
  const converter = registry.getConverter(sourceFormat, targetFormat);
  
  if (!converter) {
    throw new Error(`No converter available for ${sourceFormat} to ${targetFormat}`);
  }
  
  // 변환 옵션 구성
  const options = {
    quality: 0.9,
    // 기타 옵션
  };
  
  // 변환 실행
  return await converter.convert(file, options);
}
```

### 파일 기반 QR 코드 포맷터 구현

```javascript
// assets/js/qr-generator/formatters/file-formatter.js
import registry from '../../../registry.js';
import fileConverter from '../../converters/file-converter.js';

/**
 * 파일을 QR 코드로 변환하는 포맷터
 */
const fileQrFormatter = {
  /**
   * 파일을 QR 코드 콘텐츠로 포맷팅
   * @param {File} file - 입력 파일
   * @param {Object} options - 포맷팅 옵션
   * @returns {Promise<string>} QR 코드 콘텐츠
   */
  async format(file, options = {}) {
    if (!file) {
      throw new Error('파일이 필요합니다');
    }
    
    // 파일 크기 검증 (QR 코드 용량 제한)
    const maxSizeKB = options.maxSizeKB || 2;
    if (file.size > maxSizeKB * 1024) {
      throw new Error(`파일 크기가 최대 허용 크기(${maxSizeKB}KB)를 초과합니다`);
    }
    
    // 파일을 Data URI로 변환
    try {
      const dataUri = await fileConverter.fileToDataUri(file);
      return dataUri;
    } catch (error) {
      throw new Error(`파일 인코딩 오류: ${error.message}`);
    }
  }
};

// 레지스트리에 등록
registry.register('qr.formatters', 'file', fileQrFormatter, {
  version: '1.0.0',
  description: '파일을 QR 코드로 인코딩하는 포맷터',
  dependencies: ['converters.file/file-to-data-uri'],
  contentTypes: ['file']
});

export default fileQrFormatter;
```

### 파일 미리보기 모듈 구현

```javascript
// assets/js/ui/previews/file-preview.js
import registry from '../../../registry.js';

/**
 * 다양한 유형의 파일 미리보기를 제공하는 모듈
 */
const filePreviewModule = {
  /**
   * 파일 유형에 따라 적절한 미리보기 생성
   * @param {File} file - 미리보기할 파일
   * @param {HTMLElement} container - 미리보기를 표시할 컨테이너
   * @returns {Promise<boolean>} 미리보기 생성 성공 여부
   */
  async renderPreview(file, container) {
    if (!file || !container) {
      return false;
    }
    
    // 이미지 미리보기
    if (file.type.match('image.*')) {
      return this._renderImagePreview(file, container);
    }
    
    // 텍스트 미리보기
    if (file.type.match('text.*') || file.type === 'application/json') {
      return this._renderTextPreview(file, container);
    }
    
    // 오디오 미리보기
    if (file.type.match('audio.*')) {
      return this._renderAudioPreview(file, container);
    }
    
    // 비디오 미리보기
    if (file.type.match('video.*')) {
      return this._renderVideoPreview(file, container);
    }
    
    // 일반 파일 미리보기
    return this._renderGenericPreview(file, container);
  },
  
  /**
   * 이미지 파일 미리보기 렌더링
   * @private
   */
  async _renderImagePreview(file, container) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        container.innerHTML = `<img src="${e.target.result}" alt="이미지 미리보기" class="preview-image">`;
        resolve(true);
      };
      reader.onerror = () => resolve(false);
      reader.readAsDataURL(file);
    });
  },
  
  /**
   * 텍스트 파일 미리보기 렌더링
   * @private
   */
  async _renderTextPreview(file, container) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target.result;
        // 텍스트 길이 제한 (최대 500자)
        const previewText = text.length > 500 ? text.substr(0, 500) + '...' : text;
        container.innerHTML = `
          <div class="text-preview">
            <pre>${previewText}</pre>
          </div>
        `;
        resolve(true);
      };
      reader.onerror = () => resolve(false);
      reader.readAsText(file);
    });
  },
  
  /**
   * 오디오 파일 미리보기 렌더링
   * @private
   */
  async _renderAudioPreview(file, container) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        container.innerHTML = `
          <audio controls class="preview-audio">
            <source src="${e.target.result}" type="${file.type}">
            브라우저가 오디오 재생을 지원하지 않습니다.
          </audio>
        `;
        resolve(true);
      };
      reader.onerror = () => resolve(false);
      reader.readAsDataURL(file);
    });
  },
  
  /**
   * 비디오 파일 미리보기 렌더링
   * @private
   */
  async _renderVideoPreview(file, container) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        container.innerHTML = `
          <video controls class="preview-video">
            <source src="${e.target.result}" type="${file.type}">
            브라우저가 비디오 재생을 지원하지 않습니다.
          </video>
        `;
        resolve(true);
      };
      reader.onerror = () => resolve(false);
      reader.readAsDataURL(file);
    });
  },
  
  /**
   * 일반 파일 미리보기 렌더링
   * @private
   */
  async _renderGenericPreview(file, container) {
    const extension = file.name.split('.').pop().toUpperCase();
    container.innerHTML = `
      <div class="generic-preview">
        <div class="file-icon">${extension}</div>
        <div class="file-info">
          <div class="file-name">${file.name}</div>
          <div class="file-size">${this._formatFileSize(file.size)}</div>
        </div>
      </div>
    `;
    return true;
  },
  
  /**
   * 파일 크기를 읽기 쉬운 형식으로 변환
   * @private
   */
  _formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
};

// 레지스트리에 등록
registry.register('ui.previews', 'file-preview', filePreviewModule, {
  version: '1.0.0',
  description: '다양한 유형의 파일 미리보기 컴포넌트',
  dependencies: []
});

export default filePreviewModule;
```

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
  