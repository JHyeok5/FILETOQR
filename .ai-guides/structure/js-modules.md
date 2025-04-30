# JavaScript 모듈 구조

**버전**: 1.1.0  
**최종 업데이트**: 2025-06-15

## 개요

FileToQR 프로젝트는 모듈식 아키텍처를 채택하여 유지보수성과 확장성을 향상시켰습니다. 각 기능은 독립적인 모듈로 분리되어 있으며, 공통 유틸리티를 통해 코드 재사용성을 높였습니다.

## 모듈 구조

### 코어 모듈 (`assets/js/core/`)
- `app-core.js` - 애플리케이션 초기화 및 전역 설정
- `converter-core.js` - 파일 변환 핵심 로직 (이미지, 문서, 오디오 변환 지원)
- `qr-core.js` - QR 코드 생성 핵심 로직 (다양한 콘텐츠 유형 및 커스텀 스타일링 지원)
- 공통 이벤트 핸들러 및 애플리케이션 라이프사이클 관리

### 유틸리티 모듈 (`assets/js/utils/`)
- `file-utils.js` - 파일 처리 관련 유틸리티 함수
- `template-utils.js` - UI 템플릿 생성 및 관리
- `url-utils.js` - URL 처리 및 파라미터 관리
- `module-loader.js` - 동적 모듈 로딩
- `version-manager.js` - 버전 관리 및 호환성 체크
- `adsense-manager.js` - 광고 관리
- `usage-analytics.js` - 사용자 행동 분석

### 변환기 모듈 (`assets/js/converters/`)
- `file-converter.js` - 파일 변환 기능 구현 (converter-core.js 활용)

### QR 생성기 모듈 (`assets/js/qr-generator/`)
- `qr-generator.js` - QR 코드 생성 기능 구현 (qr-core.js 활용)
- `qr-scanner.js` - QR 코드 스캔 기능 구현

### UI 모듈 (`assets/js/ui/`)
- `previews/` - 파일 및 QR 코드 미리보기 구현

### 페이지별 모듈 (`assets/js/pages/`)
- 각 페이지별 특화된 스크립트

## 핵심 모듈 세부 정보

### converter-core.js
파일 변환 기능의 핵심 로직을 제공하는 모듈입니다:

```javascript
// 객체 리터럴 패턴으로 모듈 정의
const ConverterCore = {};

// 지원하는 파일 형식 및 변환 경로 정의
ConverterCore.supportedFormats = {
  'image': { ... },
  'document': { ... },
  'audio': { ... }
};

// 주요 API 메서드
ConverterCore.convertFile = async function(file, outputFormat, options, progressCallback) { ... };
ConverterCore.canConvert = function(inputFormat, outputFormat) { ... };

// 형식별 변환 구현
ConverterCore.convertImage = function(dataUri, outputFormat, options, progressCallback) { ... };
ConverterCore.convertDocument = function(dataUri, inputFormat, outputFormat, options, progressCallback) { ... };
ConverterCore.convertAudio = function(dataUri, outputFormat, options, progressCallback) { ... };

// 글로벌 네임스페이스 등록
window.FileToQR.core.converter = ConverterCore;

export default ConverterCore;
```

### qr-core.js
QR 코드 생성 기능의 핵심 로직을 제공하는 모듈입니다:

```javascript
// 객체 리터럴 패턴으로 모듈 정의
const QRCore = {};

// 기본 설정 및 지원 콘텐츠 유형 정의
QRCore.defaultSettings = { ... };
QRCore.contentTypes = { ... };

// 주요 API 메서드
QRCore.generateQRCode = async function(contentType, content, settings) { ... };
QRCore.validateContent = function(contentType, content) { ... };
QRCore.formatContent = function(contentType, content) { ... };

// 고급 기능 구현
QRCore.addLogoToQRCode = function(qrDataUrl, logoDataUrl, logoSizePercent, logoMargin) { ... };
QRCore.exportQRCode = async function(dataUrl, format, options) { ... };

// 글로벌 네임스페이스 등록
window.FileToQR.core.qr = QRCore;

export default QRCore;
```

## 데이터 흐름

1. 사용자 입력 → 페이지 모듈
2. 페이지 모듈 → 핵심 기능 모듈 (변환기/생성기)
3. 핵심 기능 모듈 ↔ 유틸리티 모듈
4. 결과 → UI 모듈 → 사용자 출력

## 모듈 간 통신

### 직접 임포트
```javascript
import FileUtils from '../utils/file-utils.js';
import ConverterCore from '../core/converter-core.js';
import QRCore from '../core/qr-core.js';
```

### 글로벌 네임스페이스
모든 주요 모듈은 `FileToQR` 글로벌 네임스페이스에 등록되어 어디서든 접근 가능:
```javascript
window.FileToQR = window.FileToQR || {};
window.FileToQR.utils = window.FileToQR.utils || {};
window.FileToQR.core = window.FileToQR.core || {};
window.FileToQR.utils.file = FileUtils;
window.FileToQR.core.converter = ConverterCore;
window.FileToQR.core.qr = QRCore;
```

## 유틸리티 모듈 통합

### 파일 유틸리티 모듈 (`file-utils.js`)
파일 관련 모든 유틸리티 기능이 이곳에 통합되어 있습니다:
- 파일 확장자 추출
- 파일 크기 포맷팅
- MIME 타입 관리
- 파일 데이터 변환

이전에는 이러한 기능들이 여러 파일에 중복 구현되어 있었으나, 이제 하나의 모듈로 통합되었습니다.

### 이점
- 코드 중복 제거
- 파일 처리 로직의 일관성 유지
- 버그 수정이 한 곳에서 이루어져 전체 애플리케이션에 즉시 적용
- 새로운 기능 추가 시 한 곳만 수정하면 됨 