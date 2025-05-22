# FileToQR 내부 아키텍처 및 개발 가이드

## [2024-06 최신화] 운영/배포 구조 변경 안내

- 기존: webpack, dist 등 빌드 자동화 산출물을 Pages에 배포
- 변경: main/(root) 폴더에 모든 정적 파일 직접 관리 + GitHub Actions(deploy.yml) 자동화 배포 혼합 운영
- webpack, dist 등 빌드 자동화는 더 이상 사용하지 않음
- deploy.yml 등 워크플로우는 테스트, 파일 복사, 기타 자동화 작업에만 사용

---

## 목차
1. 프로젝트 전체 구성 개요
2. FileToQR 6단계 로직 설명
3. 6단계별 주요 폴더/파일 매핑 표
4. 매핑에 포함되지 않은 폴더/파일 및 역할
5. 참고 및 활용 안내

---

## 1. 프로젝트 전체 구성 개요

FileToQR 프로젝트는 다양한 파일 및 텍스트를 QR 코드로 변환하는 웹 서비스로, 다음과 같은 폴더/파일 구조를 갖고 있습니다.

```
루트/
  ├─ index.html, convert.html, qrcode.html, ... (주요 HTML)
  ├─ assets/
  │    ├─ js/ (핵심 JS 모듈)
  │    ├─ css/ (스타일)
  │    ├─ images/, sounds/, i18n/ (리소스/다국어)
  ├─ components/ (공통 UI 템플릿)
  ├─ docs/ (설계/구조 문서)
  ├─ .ai-guides/ (내부 개발 가이드)
  ├─ .github/, package.json, webpack.config.js, ... (환경/배포)
  └─ ... 기타
```

- **assets/js/**: 서비스 핵심 로직(JS), 페이지별/유틸리티/엔진/모듈 등 포함
- **components/partials/**: 헤더, 푸터 등 공통 UI 템플릿(Handlebars)
- **assets/css/**: 전체 스타일 및 컴포넌트별 CSS
- **assets/images/**, **assets/sounds/**: 이미지, 사운드 등 리소스
- **assets/i18n/**: 다국어 번역 JSON
- **docs/**, **.ai-guides/**: 설계, 구조, 개발 가이드, 협업 규칙 등
- **.github/**, **package.json** 등: 배포, 환경, 워크플로우

---

## 2. FileToQR 6단계 로직 설명

FileToQR의 서비스 로직은 다음 6단계로 구성되어 있습니다.

1. **사용자 진입 & HTML 로딩**
   - 사용자가 웹사이트(예: convert.html, qrcode.html)에 접속
   - 각 HTML 파일이 메인 엔트리(main.js 등)를 불러옴
2. **메인 엔트리(main.js) 및 전역 초기화**
   - 현재 페이지 감지, 공통 UI/모듈 동적 import
   - app-core.js 등에서 전역 상태/유틸리티/다국어 등 초기화
3. **페이지별 모듈 동작**
   - file-to-qr-core.js, qr-generator.js 등에서 각 페이지의 핵심 기능 담당
   - 필요시 converter-core.js, qr-core.js 등 하위 엔진/유틸리티와 상호작용
4. **입력값/파일 검증 및 에러 안내**
   - 파일 업로드, 텍스트/URL 입력 등에서 입력값을 유형별로 검증
   - 잘못된 입력/파일/포맷/크기 등은 상세 에러 메시지로 안내
5. **의존성, 초기화, UI/DOM 체크 및 상태 관리**
   - QR 코드 라이브러리, i18n 등 의존성 체크
   - 동적 import/초기화 타이밍 관리, 중복 초기화 방지
   - UI/DOM 요소 존재 여부 체크, 누락 시 경고 및 사용자 안내
6. **QR 코드 생성, 렌더링, 다운로드 및 결과 표시**
   - 입력값을 바탕으로 QR 코드 생성(옵션 적용)
   - 결과 이미지를 UI에 표시, 다운로드 기능 제공
   - 진행상황, 에러, 안내 메시지 등 UX 강화

---

## 3. 6단계별 주요 폴더/파일 매핑 표

| 단계 | 설명 | 주요 파일/폴더(예시) |
|------|------|----------------------|
| **1단계** | 사용자 진입 & HTML 로딩 | `/index.html`, `/convert.html`, `/qrcode.html`, `/help.html` 등 (루트 HTML) |
| **2단계** | 메인 엔트리 및 전역 초기화 | `assets/js/core/main.js`, `assets/js/core/app-core.js`, `assets/js/core/config.js`, `assets/js/core/component-system.js`, `assets/js/core/components.js` |
| **3단계** | 페이지별 모듈 동작 | `assets/js/qr-generator/file-to-qr-core.js`, `assets/js/qr-generator/qr-generator.js`, `assets/js/qr-generator/qr-scanner.js`, `assets/js/core/converter-core.js`, `assets/js/core/qr-core.js`, `assets/js/pages/convert.js`, `assets/js/pages/content.js`, `assets/js/pages/home.js`, `assets/js/pages/timer.js` |
| **4단계** | 입력값/파일 검증 및 에러 안내 | `assets/js/qr-generator/file-to-qr-core.js`, `assets/js/qr-generator/qr-generator.js`(입력값 검증 함수), `assets/js/utils/file-utils.js`, `assets/js/utils/url-utils.js` 등 |
| **5단계** | 의존성, 초기화, UI/DOM 체크 | `assets/js/qr-generator/qr-generator.js`(의존성/UI 체크), `assets/js/qr-generator/file-to-qr-core.js`, `assets/js/core/app-core.js`, `assets/js/utils/module-loader.js`, `assets/js/utils/i18n-utils.js` |
| **6단계** | QR 생성, 렌더링, 다운로드, 결과 표시 | `assets/js/qr-generator/qr-generator.js`, `assets/js/qr-generator/file-to-qr-core.js`, `assets/js/core/qr-core.js`, `assets/js/core/converter-core.js`, `assets/js/utils/template-utils.js`, `assets/js/utils/NotificationManager.js` |

---

## 4. 매핑에 포함되지 않은 폴더/파일 및 역할

아래 폴더/파일들은 6단계 로직의 직접적 흐름에는 포함되지 않지만, 프로젝트의 품질, 협업, 배포, 다국어, UI/UX, 관리 등에 중요한 역할을 합니다.

### 4.1 문서/가이드/설계
- `.ai-guides/` (내부 개발 가이드, 협업 규칙, 구조/설계 문서)
- `docs/architecture/` (시스템 구조, 모듈 설명 등)

### 4.2 다국어/리소스/스타일
- `assets/i18n/` (다국어 번역 JSON)
- `assets/images/`, `assets/images/flags/` (이미지 리소스)
- `assets/sounds/` (효과음 등)
- `assets/css/`, `assets/css/components/` (CSS, 스타일)

### 4.3 UI/UX 보조
- `assets/js/ui/`, `assets/js/ui/previews/` (UI 컴포넌트, 프리뷰, 툴팁 등)
- `components/partials/` (Handlebars 템플릿: header, footer 등)

### 4.4 벤더/외부 라이브러리
- `assets/js/vendor/` (외부 라이브러리: qrcode.min.js 등)

### 4.5 설정/배포/환경
- `.github/`, `.gitignore`, `CNAME`, `.nojekyll`, `webpack.config.js`, `package.json`, `package-lock.json`, `git-push-lock.bat`

### 4.6 다국어 페이지/폴더
- `/ko/`, `/en/`, `/ja/`, `/zh/` (각 언어별 정적 페이지/리소스)

### 4.7 빌드/배포 산출물
- `/dist/`, `/node_modules/` (빌드 결과물, 외부 패키지)

### 4.8 보조 폴더/파일 ↔ 6단계 연결 표

| 폴더/파일                | 1단계 | 2단계 | 3단계 | 4단계 | 5단계 | 6단계 | 연결 설명 요약 |
|--------------------------|:-----:|:-----:|:-----:|:-----:|:-----:|:-----:|:----------------|
| `.ai-guides/`            |   -   |   ●   |   ●   |   ●   |   ●   |   ●   | 개발 가이드, 설계, 협업 규칙 등 모든 단계 참고/문서화 |
| `docs/architecture/`     |   -   |   ●   |   ●   |   ●   |   ●   |   ●   | 시스템 구조/모듈 설명, 설계 참고 |
| `assets/i18n/`           |   -   |   ●   |   ●   |   ●   |   ●   |   ●   | 다국어 번역, 에러/안내 메시지 등 |
| `assets/images/`         |   -   |   -   |   -   |   -   |   -   |   ●   | UI/UX, 결과 표시, 프리뷰 등 |
| `assets/sounds/`         |   -   |   -   |   -   |   -   |   -   |   ●   | 알림, UX 효과음 등 |
| `assets/css/`            |   ●   |   ●   |   ●   |   ●   |   ●   |   ●   | 전체 UI/UX 스타일, 각 단계 UI |
| `assets/js/ui/`          |   -   |   ●   |   ●   |   ●   |   ●   |   ●   | UI 컴포넌트, 프리뷰, 툴팁 등 |
| `components/partials/`   |   ●   |   ●   |   ●   |   ●   |   ●   |   ●   | 헤더/푸터 등 공통 UI, 템플릿 |
| `assets/js/vendor/`      |   -   |   ●   |   ●   |   ●   |   ●   |   ●   | 외부 라이브러리(QR 등) |
| `.github/`, `.gitignore` |   -   |   -   |   -   |   -   |   -   |   -   | 배포, 환경, 워크플로우 관리 |
| `webpack.config.js`      |   -   |   -   |   -   |   -   |   -   |   -   | 빌드/번들링 환경 |
| `/ko/`, `/en/`, ...      |   ●   |   ●   |   ●   |   ●   |   ●   |   ●   | 다국어 정적 페이지/리소스 |
| `/dist/`, `/node_modules/`|  -   |   -   |   -   |   -   |   -   |   -   | 빌드 결과물, 외부 패키지 |

- ● : 해당 단계와 직접/간접적으로 연결됨

### 4.9 각 항목별 연결 상세 설명

- **.ai-guides/**, **docs/architecture/**  
  → 모든 단계의 설계, 구조, 개발 가이드, 협업 규칙, 모듈 설명 등에서 참고  
  → 신규 기능/수정/문제 발생 시 항상 참고 및 문서화

- **assets/i18n/**  
  → 2~6단계에서 다국어 메시지, 에러 안내, UI 텍스트 등으로 활용  
  → 입력값 검증, 에러 안내, 결과 표시 등 모든 사용자 인터페이스에 적용

- **assets/images/**, **assets/sounds/**  
  → 6단계(결과 표시, 프리뷰, 알림 등)에서 UI/UX 강화에 사용

- **assets/css/**  
  → 모든 단계의 UI/UX 스타일에 적용  
  → 각 단계별 화면, 버튼, 입력, 결과 등 시각적 일관성 제공

- **assets/js/ui/**, **components/partials/**  
  → 2~6단계에서 공통 UI(헤더, 푸터, 프리뷰, 툴팁 등)로 활용  
  → 동적 UI 생성, 템플릿 처리, 접근성 개선 등

- **assets/js/vendor/**  
  → 2~6단계에서 외부 라이브러리(QR 생성 등)로 활용  
  → 의존성 관리, 성능 최적화 등

- **.github/**, **webpack.config.js** 등  
  → 직접적인 서비스 로직과는 무관하지만,  
  → 배포, 빌드, 환경설정, 워크플로우 자동화 등 프로젝트 운영에 필수

- **/ko/**, **/en/**, ...  
  → 1~6단계의 다국어 지원, 정적 페이지, 리소스 제공

### 4.10 초기 진입 시 자동 언어 감지 및 리다이렉트

- **의도:**
  - 사용자가 사이트 루트(`/` 또는 `/index.html`)로 진입할 때, 브라우저 언어를 감지하여 `/ko/`, `/en/`, `/ja/`, `/zh/` 등 해당 언어 폴더로 자동 리다이렉트하여 글로벌 UX를 개선합니다.
- **적용 위치:**
  - 루트 `index.html`(및 필요시 기타 진입점) 최상단 스크립트
- **동작 방식:**
  1. 이미 언어 폴더에 있으면 리다이렉트하지 않음
  2. 브라우저 언어(`navigator.language` 또는 `navigator.languages`)를 감지
  3. 지원 언어 중 우선순위 매칭, 없으면 기본값(영어 `/en/`)
  4. 해당 언어 폴더로 이동(리다이렉트)
- **예외/고려사항:**
  - 사용자가 직접 언어 폴더로 진입한 경우 추가 리다이렉트 없음
  - 언어 선택 UI와 충돌 없음(수동 선택 시 해당 언어로 이동)
  - SEO 영향은 크지 않으나, 서버 리다이렉트가 아니므로 완벽하지 않음
  - 향후 언어 선택값을 localStorage 등에 저장해 우선 적용 가능
- **예시 코드:**

```html
<script>
  (function() {
    // 이미 언어 폴더에 있으면 리다이렉트하지 않음
    if (/^\/(en|ko|ja|zh)(\/|$)/.test(window.location.pathname)) return;

    // 브라우저 언어 감지
    var lang = (navigator.languages && navigator.languages[0]) || navigator.language || 'en';
    lang = lang.toLowerCase();

    // 지원 언어 매핑
    var supported = ['en', 'ko', 'ja', 'zh'];
    var target = supported.find(function(l) { return lang.startsWith(l); }) || 'en';

    // 리다이렉트
    window.location.replace('/' + target + '/');
  })();
</script>
```

- **문서/가이드 반영:**
  - 본 섹션 및 예시 코드는 실제 적용 시점에 맞춰 최신화하며, 향후 구조/로직 변경 시 반드시 함께 업데이트합니다.

---

## 문제 해결 원칙 (SPA/파일 변환 페이지)

### 1. 마크업-스크립트 매핑 일치
- 각 페이지(main 내부) 마크업은 해당 JS 컨트롤러가 기대하는 id/class 구조와 100% 일치해야 함
- 예: `.converter-type-btn`, `#file-upload`, `#download-btn` 등은 convert.js가 정상 동작하는 데 필수
- 불필요한 래퍼(div#convert-app 등)는 제거

### 2. main-container 중복/불필요 UI 완전 제거
- SPA 라우팅 시 main-container의 innerHTML을 완전히 비우고, 새 main만 삽입
- main 내부에 main 태그가 중첩되면 첫 번째 main만 남기고 나머지는 모두 제거
- convert-app 등 불필요한 래퍼도 자동 제거

### 3. 이벤트 바인딩/초기화 일관성
- convert.js 등 컨트롤러는 항상 init(force)로 강제 재초기화
- 이벤트 바인딩 전 cloneNode 등으로 기존 바인딩 해제 후, 새로 바인딩
- SPA 이동 시에도 main/header/footer가 모두 렌더링된 후에만 script 삽입 및 init(force) 실행

### 4. 네임스페이스/모듈 연결 구조
- 모든 컨트롤러/유틸리티는 window.FileToQR 네임스페이스에 정확히 할당
- app-core.js에서 동적으로 접근/초기화 가능해야 함
- ES 모듈 import/export 구조와 전역 네임스페이스 할당이 일관되게 유지되어야 함

### 5. 점검/수정 단계별 체크리스트
- [ ] main 내부 마크업 구조가 컨트롤러 기대와 일치하는가?
- [ ] main-container 교체 시 중복/불필요 UI가 완전히 제거되는가?
- [ ] SPA 이동 후에도 이벤트 바인딩이 정상 동작하는가?
- [ ] 컨트롤러/유틸리티가 window.FileToQR에 정확히 할당되는가?
- [ ] 헤더/푸터 등 공통 컴포넌트가 SPA 이동 시에도 정상 동작하는가?

### 6. 예시
- 잘못된 예: main 내부에 <div id="convert-app">...</div> 래퍼가 남아있음 → 이벤트 바인딩 실패/중복 UI
- 올바른 예: main 내부에 .converter-type-btn, #file-upload 등만 존재, 불필요 래퍼 없음

---

## 5. 참고 및 활용 안내

- 이 문서는 FileToQR 프로젝트의 **내부 개발자 누구나** 빠르게 구조와 역할을 파악하고, 유지보수/확장/협업 시 참고할 수 있도록 작성되었습니다.
- 각 단계별로 문제가 발생했을 때, 이 가이드의 매핑 표와 설명을 참고하여 **어느 파일/폴더에서 우선적으로 원인 분석 및 수정을 시도해야 하는지** 빠르게 판단할 수 있습니다.
- 문서/가이드/설계 관련 파일은 `.ai-guides/`, `docs/architecture/` 등에서 추가로 확인할 수 있습니다.
- 폴더/파일 구조나 역할이 변경될 경우, 이 문서도 함께 업데이트 해주세요.

---

**문의/피드백:**
- 내부 개발 가이드 개선이 필요하거나, 추가 설명이 필요한 경우 `.ai-guides/` 내 담당자 또는 리드 개발자에게 문의 바랍니다. 