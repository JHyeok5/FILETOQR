# FileToQR 파일 구조

**버전**: 1.0.0  
**최종 업데이트**: 2025-06-15

## 개요

이 문서는 FileToQR 프로젝트의 파일 구조와 각 디렉토리의 역할을 설명합니다. 프로젝트에 기여하기 전에 이 구조를 이해하는 것이 중요합니다.

## 루트 디렉토리

```
/
├── assets/           # 웹 애셋(스크립트, 스타일, 이미지 등)
├── components/       # 재사용 가능한 UI 컴포넌트
├── pages/            # 페이지별 스크립트 및 컨텐츠
├── workers/          # 웹 워커 스크립트
├── blog/             # 블로그 콘텐츠
├── .github/          # GitHub 관련 설정(워크플로우 등)
├── .ai-guides/       # AI 개발 가이드라인 및 문서
├── .nojekyll         # GitHub Pages Jekyll 처리 비활성화
├── CNAME             # 사용자 정의 도메인 설정
├── README.md         # 프로젝트 소개 및 문서
├── index.html        # 메인 홈페이지
├── convert.html      # 파일 변환 페이지
├── qrcode.html       # QR 코드 생성/스캔 페이지
├── help.html         # 도움말 페이지
├── privacy.html      # 개인정보처리방침
├── terms.html        # 이용약관
├── package.json      # 프로젝트 의존성 및 스크립트
└── webpack.config.js # Webpack 구성
```

## 주요 디렉토리 상세 설명

### assets/ 디렉토리

```
assets/
├── css/         # 스타일시트
├── images/      # 이미지 리소스
└── js/          # JavaScript 파일
    ├── core/            # 핵심 애플리케이션 로직
    ├── converters/      # 파일 변환 관련 모듈
    ├── qr-generator/    # QR 코드 생성/스캔 모듈
    ├── ui/              # UI 컴포넌트 및 위젯
    │   └── previews/    # 미리보기 컴포넌트
    ├── utils/           # 유틸리티 함수
    └── pages/           # 페이지별 스크립트
```

### assets/js/ 디렉토리 - 주요 파일

#### 코어 시스템
- **core/app-core.js**: 애플리케이션 핵심 기능 관리(모듈 초기화, 라우팅, 이벤트 관리)
- **core/component-system.js**: 컴포넌트 관리 시스템
- **core/components.js**: 기본 컴포넌트 구현
- **registry.js**: 모듈 레지스트리 - 중앙 모듈 관리 및 의존성 처리

#### 기능 모듈
- **converters/file-converter.js**: 파일 변환 기능 구현
- **qr-generator/qr-generator.js**: QR 코드 생성 기능
- **qr-generator/qr-scanner.js**: QR 코드 스캔 및 해석 기능

#### UI 컴포넌트
- **ui/ui-components.js**: UI 컴포넌트 컬렉션
- **ui/help-tooltip.js**: 도움말 툴팁 구현
- **ui/progress-tracker.js**: 진행 상황 표시 컴포넌트
- **ui/previews/file-preview.js**: 파일 미리보기 컴포넌트

#### 유틸리티
- **utils/module-loader.js**: 동적 모듈 로딩 유틸리티
- **utils/template-utils.js**: 템플릿 처리 유틸리티
- **utils/version-manager.js**: 버전 관리 유틸리티
- **utils/url-utils.js**: URL 관련 유틸리티
- **utils/adsense-manager.js**: 광고 관리 유틸리티
- **utils/usage-analytics.js**: 사용 분석 유틸리티

## HTML 페이지 구조

- **index.html**: 메인 랜딩 페이지, 서비스 소개 및 기능 탐색
- **convert.html**: 파일 변환 기능 페이지
- **qrcode.html**: QR 코드 생성 및 스캔 페이지
- **help.html**: 도움말 및 FAQ
- **privacy.html**: 개인정보처리방침
- **terms.html**: 이용약관

## 파일 네이밍 규칙

1. **케밥 케이스**: 모든 파일과 디렉토리 이름은 소문자 케밥 케이스(kebab-case) 사용
   - 예: `file-converter.js`, `help-tooltip.js`

2. **목적별 접미사**: 파일의 용도에 따라 일관된 접미사 사용
   - UI 컴포넌트: `-component.js` 또는 컴포넌트 타입 자체 사용
   - 유틸리티: `-utils.js` 또는 `-manager.js`
   - 페이지 스크립트: `-page.js`

3. **디렉토리 분류**: 파일은 기능과 목적에 맞는 디렉토리에 배치
   - 유틸리티 함수: `utils/` 디렉토리
   - 코어 시스템: `core/` 디렉토리
   - 특정 기능 모듈: 기능 이름에 맞는 디렉토리 (예: `converters/`)

## 새 파일 추가 지침

새 파일을 추가할 때는 다음 지침을 따르세요:

1. 파일의 목적과 기능을 명확히 파악
2. 해당 기능의 기존 구현이 있는지 확인 (중복 방지)
3. 적절한 디렉토리 위치 결정
4. 네이밍 규칙 준수
5. 파일 헤더에 표준 메타데이터(버전, 설명, 업데이트 날짜 등) 포함
6. 필요시 registry.js에 모듈 등록 