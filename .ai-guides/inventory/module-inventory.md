# FileToQR 모듈 인벤토리

**버전**: 1.0.0  
**최종 업데이트**: 2025-06-15

## 개요

이 문서는 FileToQR 프로젝트의 모든 주요 모듈과 파일에 대한 상세 인벤토리를 제공합니다. 각 모듈의 역할, 기능, 의존성 및 상호작용을 파악하는데 도움이 됩니다.

## HTML 페이지 인벤토리

| 파일명 | 역할 | 주요 기능 | 종속 모듈 |
|-------|-----|----------|----------|
| **index.html** | 메인 홈페이지 | 서비스 소개 및 기능 탐색 | app-core.js |
| **convert.html** | 파일 변환 페이지 | 파일 업로드 및 변환 | app-core.js, file-converter.js |
| **qrcode.html** | QR 코드 페이지 | QR 코드 생성 및 스캔 | app-core.js, qr-generator.js, qr-scanner.js |
| **help.html** | 도움말 페이지 | 사용자 가이드와 FAQ | app-core.js |
| **privacy.html** | 개인정보처리방침 | 개인정보 관련 정책 | app-core.js |
| **terms.html** | 이용약관 | 서비스 이용 조건 | app-core.js |

## 코어 모듈 인벤토리

| 파일명 | 역할 | 주요 기능 | API |
|-------|-----|----------|-----|
| **core/app-core.js** | 애플리케이션 핵심 | 앱 초기화, 페이지 라우팅, 모듈 로딩 | init(), getCurrentPage() |
| **registry.js** | 모듈 레지스트리 | 모듈 등록 및 의존성 관리 | register(), get(), getModules() |
| **core/component-system.js** | 컴포넌트 시스템 | UI 컴포넌트 관리 | mountComponent(), unmountComponent() |
| **core/components.js** | 기본 컴포넌트 | 공통 UI 컴포넌트 구현 | loadDefault(), createComponent() |

## 기능 모듈 인벤토리

| 파일명 | 역할 | 주요 기능 | API |
|-------|-----|----------|-----|
| **converters/file-converter.js** | 파일 변환 | 파일 업로드, 변환, 다운로드 | init(), handleFile(), convertFile() |
| **qr-generator/qr-generator.js** | QR 코드 생성 | QR 코드 생성 및 내보내기 | init(), generateQRCode(), downloadQRCode() |
| **qr-generator/qr-scanner.js** | QR 코드 스캔 | QR 코드 스캔 및 해석 | init(), startScanner(), processQRResult() |

## UI 컴포넌트 인벤토리

| 파일명 | 역할 | 주요 기능 | API |
|-------|-----|----------|-----|
| **ui/ui-components.js** | UI 컴포넌트 컬렉션 | 공통 UI 요소 구현 | init(), createComponent() |
| **ui/help-tooltip.js** | 도움말 툴팁 | 온라인 도움말 툴팁 표시 | addTooltip(), showTooltip(), hideTooltip() |
| **ui/progress-tracker.js** | 진행 상태 표시 | 작업 진행 상태 시각화 | start(), updateProgress(), complete() |
| **ui/previews/file-preview.js** | 파일 미리보기 | 다양한 파일 형식 미리보기 | init(), previewFile(), setPreviewMode() |

## 유틸리티 인벤토리

| 파일명 | 역할 | 주요 기능 | API |
|-------|-----|----------|-----|
| **utils/module-loader.js** | 모듈 로더 | 동적 모듈 로딩 | registerModule(), loadModules() |
| **utils/template-utils.js** | 템플릿 유틸리티 | HTML 템플릿 처리 | parseTemplate(), renderTemplate() |
| **utils/version-manager.js** | 버전 관리 | 앱 및 모듈 버전 관리 | registerVersion(), checkVersion() |
| **utils/url-utils.js** | URL 유틸리티 | URL 관련 기능 | standardizeLinks(), parseQueryParams() |
| **utils/adsense-manager.js** | 광고 관리 | 광고 삽입 및 관리 | init(), loadAds(), refreshAds() |
| **utils/usage-analytics.js** | 사용 분석 | 사용자 행동 추적 | trackPageView(), trackAction(), trackConversion() |

## 공통 유틸리티 함수 (FileToQR.utils 네임스페이스)

| 네임스페이스 | 출처 | 기능 | 함수 |
|------------|-----|-----|-----|
| **FileToQR.utils.file** | file-converter.js | 파일 처리 유틸리티 | getExtension(), formatSize(), toDataUri() |
| **FileToQR.utils.url** | url-utils.js | URL 처리 유틸리티 | parseQuery(), buildQuery(), isExternal() |
| **FileToQR.utils.template** | template-utils.js | 템플릿 처리 유틸리티 | render(), parse(), compile() |

## 모듈 의존성 맵

```
app-core.js
  ├── module-loader.js
  ├── url-utils.js
  ├── registry.js
  │     ├── file-converter.js
  │     │     └── FileToQR.utils.file
  │     ├── qr-generator.js
  │     │     └── (의존: FileToQR.utils.file)
  │     └── qr-scanner.js
  │           └── (의존: FileToQR.utils.file)
  ├── component-system.js
  │     └── template-utils.js
  └── version-manager.js
```

## 각 페이지에서 사용하는 주요 모듈

### convert.html
- app-core.js
- file-converter.js

### qrcode.html
- app-core.js
- qr-generator.js
- qr-scanner.js

## 중복 기능 개선 내역

다음 모듈 간 기능 중복이 식별되어 개선되었습니다:

1. **중복 파일 유틸리티 함수**
   - 영향 파일: file-converter.js, qr-generator.js, qr-scanner.js
   - 해결 방법: FileToQR.utils.file 네임스페이스로 통합

2. **모듈 등록 방식 불일치**
   - 영향 파일: app-core.js, registry.js
   - 해결 방법: registry.js의 중앙 등록 방식으로 통일

3. **초기화 방식 불일치**
   - 영향 파일: 모든 기능 모듈
   - 해결 방법: 모든 모듈에 표준 init() 메서드 도입

4. **잘못된 스크립트 참조**
   - 영향 파일: convert.html, qrcode.html
   - 해결 방법: 불필요한 스크립트 참조 제거 및 누락된 참조 추가

## 파일명 혼선 해결

다음과 같이 파일명 구분을 명확히 했습니다:

1. **명확한 디렉토리 구조**
   - 기능별 디렉토리 분류 강화: core/, converters/, qr-generator/, utils/ 등

2. **일관된 파일 명명 규칙**
   - 기능 모듈: [기능]-[동작].js (예: file-converter.js)
   - 유틸리티: [기능]-utils.js (예: url-utils.js)

3. **제거된 혼란스러운 파일 참조**
   - 존재하지 않는 file-utils.js, ui-utils.js, storage-utils.js 참조 제거 