# FileToQR 프로젝트 디렉토리 구조 설명

**버전**: 1.0.0  
**최종 업데이트**: 2025-04-28

## 개요

이 문서는 FileToQR 프로젝트의 디렉토리 구조와 각 디렉토리의 목적을 설명합니다. 프로젝트의 이해와 새로운 기능 개발을 위한 참조 문서로 사용하세요.

## 최상위 구조

```
filetoqr/
├── .ai-guides/       # AI 어시스턴트를 위한 가이드라인
├── assets/           # 정적 리소스 및 스크립트
├── components/       # 재사용 가능한 HTML 컴포넌트
├── pages/            # 특정 주제별 페이지
├── templates/        # 페이지 템플릿
├── workers/          # Web Worker 스크립트
├── config.js         # 전역 설정 및 상수
├── index.html        # 메인 페이지
└── 기타 HTML 파일    # 주요 기능 페이지들
```

## .ai-guides 디렉토리

AI 코딩 어시스턴트를 위한 가이드라인과 참조 문서를 포함합니다.

```
.ai-guides/
├── README.md                # 가이드 사용 지침
├── guidelines/              # 작업 원칙 및 규칙
│   └── collaboration.md     # 바이브코딩 AI 가이드라인
├── structure/               # 프로젝트 구조 문서
│   ├── project-map.md       # 프로젝트 구조 시각화 문서
│   └── directory-structure.md # 디렉토리 상세 설명(현재 문서)
├── code/                    # 코드 작성 관련 가이드
│   └── style-guide.md       # 코딩 스타일 가이드
├── inventory/               # 파일 인벤토리
│   └── project-inventory.json # 프로젝트 파일 목록 및 관계
├── architecture/            # 아키텍처 문서
│   ├── module-registry.md   # 모듈 레지스트리 설명
│   └── module-registry-reference.js # 모듈 레지스트리 코드 참조
└── references/              # 참조 문서
    ├── adsense-enhancement-plan.txt # 구글 애드센스 보완 계획
    ├── platform-build-plan-v2.txt   # 시스템 구축안 v2.0
    └── platform-build-plan-v3.txt   # 최종 설계 계획안 v3.0
```

**목적**: AI 어시스턴트가 프로젝트를 이해하고 일관된 방식으로 개발할 수 있도록 지원

## assets 디렉토리

프로젝트의 모든 정적 리소스와 JavaScript 코드를 포함합니다.

```
assets/
├── css/              # 스타일시트
│   ├── styles.css    # 기본 스타일
│   ├── dark-mode.css # 다크모드 테마
│   └── components/   # 컴포넌트별 스타일
├── js/               # JavaScript 모듈
│   ├── core/         # 핵심 기능 모듈
│   ├── converters/   # 파일 변환 모듈
│   ├── qr-generator/ # QR 코드 생성 모듈
│   ├── ui/           # UI 컴포넌트
│   ├── utils/        # 유틸리티 함수
│   └── registry.js   # 모듈 레지스트리
└── images/           # 이미지 리소스
    ├── icons/        # 아이콘
    ├── ui/           # UI 이미지
    └── logo.svg      # 로고
```

### assets/css/

스타일시트 파일을 포함합니다.

| 파일/디렉토리 | 설명 |
|--------------|------|
| `styles.css` | 전체 애플리케이션에 적용되는 기본 스타일 |
| `dark-mode.css` | 다크모드 관련 스타일 |
| `components/` | 개별 컴포넌트 스타일(파일 업로더, 변환기 UI 등) |

**목적**: 사용자 인터페이스의 모양과 느낌을 정의

### assets/js/core/

애플리케이션의 핵심 로직을 포함합니다.

| 파일 | 설명 |
|-----|------|
| `converter-core.js` | 모든 파일 변환 작업의 기본 로직 정의 |
| `qr-core.js` | QR 코드 생성의 기본 로직 정의 |
| `app-core.js` | 전체 애플리케이션 초기화 및 조정 |

**목적**: 애플리케이션의 핵심 기능과 인터페이스 정의

### assets/js/converters/

파일 변환 모듈을 포함합니다.

| 파일 | 설명 |
|-----|------|
| `image-converter.js` | 이미지 파일 변환 (PNG, JPEG, WebP 등) |
| `document-converter.js` | 문서 파일 변환 (PDF, DOCX, TXT 등) |
| `audio-converter.js` | 오디오 파일 변환 (MP3, WAV, FLAC 등) |
| `video-converter.js` | 비디오 파일 변환 (MP4, WebM, AVI 등) |
| `data-converter.js` | 데이터 파일 변환 (CSV, JSON, YAML 등) |
| `file-converter.js` | 파일을 데이터 URI로 인코딩 (QR 코드 생성용) |

**목적**: 다양한 유형의 파일 변환 기능 제공

### assets/js/qr-generator/

QR 코드 생성 모듈을 포함합니다.

| 파일 | 설명 |
|-----|------|
| `qr-generator.js` | QR 코드 생성 기본 로직, 파일 기반 QR 코드 지원 포함 |
| `qr-designer.js` | QR 코드 디자인 커스터마이징 (색상, 모양, 로고 등) |
| `qr-content-formatter.js` | 콘텐츠 포맷팅 (URL, 텍스트, vCard, WiFi, 파일 등) |

**목적**: QR 코드 생성 및 커스터마이징 기능 제공

### assets/js/ui/

사용자 인터페이스 컴포넌트를 포함합니다.

| 파일 | 설명 |
|-----|------|
| `file-uploader.js` | 드래그앤드롭, 파일 선택, 클립보드 붙여넣기 |
| `progress-tracker.js` | 파일 변환 및 QR 생성 진행 상태 표시 |
| `options-panel.js` | 파일 변환 및 QR 디자인 옵션 선택 |
| `results-viewer.js` | 변환 결과 및 생성된 QR 코드 표시 |

**목적**: 사용자와의 상호작용을 위한 UI 컴포넌트 구현

### assets/js/utils/

유틸리티 함수를 포함합니다.

| 파일 | 설명 |
|-----|------|
| `file-utils.js` | 파일 처리, 타입 감지, 크기 변환 등 |
| `ui-utils.js` | DOM 조작, 애니메이션, 이벤트 처리 등 |
| `storage-utils.js` | 로컬스토리지, IndexedDB 등 클라이언트 스토리지 관리 |
| `adsense-manager.js` | Google AdSense 광고 로드 및 최적화 |

**목적**: 다양한 모듈에서 재사용 가능한 유틸리티 함수 제공

### assets/js/registry.js

모듈 레지스트리 시스템을 구현합니다.

**목적**: 모든 기능 모듈을 등록하고 관리하는 중앙 시스템 제공

### assets/images/

이미지, 아이콘 등 시각적 리소스를 포함합니다.

**목적**: 애플리케이션의 시각적 요소 저장

## components 디렉토리

재사용 가능한 HTML 컴포넌트를 포함합니다.

```
components/
├── header.html       # 공통 헤더 컴포넌트
├── footer.html       # 공통 푸터 컴포넌트
├── file-uploader.html # 파일 업로더 컴포넌트
└── ad-containers.html # 광고 컨테이너 컴포넌트
```

**목적**: 여러 페이지에서 공통으로 사용되는 HTML 구조 모듈화

## pages 디렉토리

특정 주제별 콘텐츠 페이지를 포함합니다.

```
pages/
├── formats/          # 파일 형식별 상세 페이지
├── convert/          # 변환 조합별 전용 페이지
├── qrcode/           # QR 코드 활용 가이드
└── blog/             # 블로그 포스트
```

### pages/formats/

각 파일 형식에 대한 정보 페이지를 포함합니다.

| 파일 | 설명 |
|-----|------|
| `png.html` | PNG 파일 형식 설명 및 특징 |
| `jpg.html` | JPG 파일 형식 설명 및 특징 |
| 기타 형식별 페이지 | 다양한 파일 형식에 대한 상세 정보 |

**목적**: 각 파일 형식에 대한 교육 자료 및 SEO 최적화 콘텐츠 제공

### pages/convert/

특정 변환 조합에 대한 전용 페이지를 포함합니다.

| 파일 | 설명 |
|-----|------|
| `png-to-jpg.html` | PNG에서 JPG로 변환 전용 가이드 |
| `csv-to-json.html` | CSV에서 JSON으로 변환 전용 가이드 |
| 기타 변환 조합 페이지 | 다양한 변환 조합에 대한 전용 가이드 |

**목적**: 인기 있는 변환 조합에 대한 전용 랜딩 페이지 및 SEO 최적화

### pages/qrcode/

다양한 업종별 QR 코드 활용 가이드를 포함합니다.

| 파일 | 설명 |
|-----|------|
| `retail.html` | 소매업 QR 코드 활용 가이드 |
| `restaurant.html` | 요식업 QR 코드 활용 가이드 |
| 기타 업종별 가이드 | 다양한 업종별 QR 코드 활용 사례 |

**목적**: 업종별 QR 코드 활용 방법 안내 및 SEO 최적화

### pages/blog/

블로그 포스트 페이지를 포함합니다.

| 파일 | 설명 |
|-----|------|
| `image-formats-guide.html` | 이미지 형식 선택 가이드 |
| `qr-marketing-tips.html` | QR 코드 마케팅 팁 |
| 기타 블로그 포스트 | 다양한 주제의 정보성 콘텐츠 |

**목적**: 파일 변환 및 QR 코드 관련 정보 제공, SEO 및 트래픽 유도

## templates 디렉토리

페이지 템플릿을 포함합니다.

```
templates/
├── blog-template.html      # 블로그 페이지 템플릿
├── format-template.html    # 파일 형식 상세 템플릿
└── convert-template.html   # 변환 가이드 템플릿
```

**목적**: 다양한 페이지 유형에 대한 일관된 구조 제공

## workers 디렉토리

웹 워커 스크립트를 포함합니다.

```
workers/
├── image-worker.js         # 이미지 처리 워커
├── document-worker.js      # 문서 처리 워커
└── compression-worker.js   # 압축 처리 워커
```

**목적**: 메인 스레드 블로킹 없이 백그라운드에서 무거운 처리 수행

## 최상위 파일

| 파일 | 설명 |
|-----|------|
| `config.js` | 전역 설정 및 상수 정의 |
| `index.html` | 메인 홈페이지 |
| `convert.html` | 파일 변환 기능 페이지 |
| `qrcode.html` | QR 코드 생성 기능 페이지 |
| `privacy.html` | 개인정보처리방침 |
| `terms.html` | 이용약관 |
| `cookie-policy.html` | 쿠키 정책 |

**목적**: 애플리케이션의 주요 접근점 및 필수 페이지 제공

## 파일 배치 규칙

### 새 파일 추가 시 규칙

1. **모듈 및 기능 관련 JS 파일**: `assets/js/` 하위의 적절한 서브디렉토리에 배치
2. **컴포넌트 스타일**: `assets/css/components/` 디렉토리에 배치
3. **공통 컴포넌트**: `components/` 디렉토리에 배치
4. **콘텐츠 페이지**: `pages/` 하위의 적절한 서브디렉토리에 배치
5. **Web Worker**: `workers/` 디렉토리에 배치
6. **AI 가이드라인 문서**: `.ai-guides/` 하위의 적절한 서브디렉토리에 배치

### 이름 지정 규칙

1. **모듈 JS 파일**: 기능을 명확히 설명하는 kebab-case 사용 (예: `image-converter.js`)
2. **컴포넌트 HTML 파일**: 컴포넌트 이름을 kebab-case로 사용 (예: `file-uploader.html`)
3. **페이지 HTML 파일**: 페이지 내용을 명확히 설명하는 kebab-case 사용 (예: `png-to-jpg.html`)
4. **Worker 파일**: 처리 유형을 명확히 설명하는 kebab-case 사용 (예: `image-worker.js`)
5. **AI 가이드 문서**: 내용을 명확히 설명하는 kebab-case 사용 (예: `module-registry.md`)

## 새 기능 추가 예시

### 새로운 파일 형식 지원 추가

예: WebP에서 AVIF로 변환 기능 추가

1. 변환 로직 구현: `assets/js/converters/image-converter.js` 수정 또는 새 모듈 작성
2. Web Worker 구현: `workers/image-worker.js` 수정 또는 확장
3. 레지스트리에 등록: `registry.js`를 통한 모듈 등록
4. UI 업데이트: 필요한 경우 옵션 패널 업데이트
5. 전용 페이지 추가: `pages/convert/webp-to-avif.html` 생성
6. 파일 형식 페이지 추가: 필요한 경우 `pages/formats/avif.html` 생성

### 새로운 QR 콘텐츠 유형 추가

예: 암호화폐 지갑 주소용 QR 코드

1. 콘텐츠 포맷터 구현: `assets/js/qr-generator/qr-content-formatter.js` 수정
2. 레지스트리에 등록: 새 포맷터를 레지스트리에 등록
3. UI 업데이트: QR 생성 옵션에 새 유형 추가
4. 사용 가이드 추가: `pages/qrcode/cryptocurrency.html` 생성

### 파일 기반 QR 코드 기능 확장

예: 더 큰 파일 지원 또는 파일 압축 기능 추가

1. 파일 변환 로직 수정: `assets/js/converters/file-converter.js` 업데이트
2. QR 생성기 수정: `assets/js/qr-generator/qr-generator.js` 업데이트
3. Web Worker 구현: 필요한 경우 압축을 위한 `workers/compression-worker.js` 활용
4. UI 업데이트: 파일 크기 제한 및 옵션 관련 UI 조정
5. 문서 업데이트: 지원되는 파일 크기 및 유형에 대한 안내 업데이트

### AI 가이드라인 문서 업데이트

예: 새로운 코딩 표준 추가

관련 가이드 문서 식별: .ai-guides/code/style-guide.md
문서 버전 및 날짜 업데이트: 문서 상단의 버전 정보 갱신
내용 추가 및 수정: 새로운 코딩 표준 내용 작성
관련 문서 참조 업데이트: 필요 시 다른 문서의 참조 링크 수정
프로젝트 인벤토리 갱신: .ai-guides/inventory/project-inventory.json 업데이트

결론
이 문서는 FileToQR 프로젝트의 디렉토리 구조와 각 구성 요소의 목적을 설명했습니다. 새로운 기능 개발이나 기존 코드 수정 시 이 구조를 준수하여 일관성을 유지하세요. 특히 AI 개발 가이드라인을 참조하여 작업해야 합니다. 구조에 관한 질문이나 제안이 있으면 개발 팀에 문의하세요.