# FileToQR 프로젝트 맵

**버전**: 1.0.0  
**최종 업데이트**: 2025-04-28

이 문서는 파일 변환 및 QR 코드 생성 플랫폼의 전체 구조를 시각화하여 개발자와 AI가 프로젝트의 구성과 관계를 이해하는 데 도움을 줍니다.

## 디렉토리 구조 맵

```
filetoqr/
├── .ai-guides/                    # AI 협업 가이드 문서 모음
│   ├── README.md                  # AI 가이드 사용 지침
│   ├── guidelines/                # 작업 원칙 및 규칙
│   │   └── collaboration.md       # 바이브코딩 AI 가이드라인
│   ├── structure/                 # 프로젝트 구조 문서
│   │   ├── project-map.md         # 프로젝트 구조 시각화 문서(현재 문서)
│   │   └── directory-structure.md # 디렉토리 상세 설명
│   ├── code/                      # 코드 작성 관련 가이드
│   │   └── style-guide.md         # 코딩 스타일 가이드
│   ├── inventory/                 # 파일 인벤토리
│   │   └── project-inventory.json # 프로젝트 파일 목록 및 관계
│   ├── architecture/              # 아키텍처 문서
│   │   ├── module-registry.md     # 모듈 레지스트리 설명
│   │   └── module-registry-reference.js # 모듈 레지스트리 코드 참조
│   └── references/                # 참조 문서
│       ├── adsense-enhancement-plan.txt # 구글 애드센스 보완 계획
│       ├── platform-build-plan-v2.txt   # 시스템 구축안 v2.0
│       └── platform-build-plan-v3.txt   # 최종 설계 계획안 v3.0
│
├── assets/
│   ├── css/
│   │   ├── styles.css             # 기본 스타일시트
│   │   ├── dark-mode.css          # 다크모드 관련 스타일
│   │   └── components/            # 컴포넌트별 스타일
│   │       ├── file-uploader.css  # 파일 업로더 스타일
│   │       ├── converter.css      # 변환기 UI 스타일
│   │       └── qr-generator.css   # QR 생성기 UI 스타일
│   │
│   ├── js/
│   │   ├── core/                  # 핵심 기능 모듈
│   │   │   ├── converter-core.js  # 파일 변환 핵심 로직
│   │   │   ├── qr-core.js         # QR 코드 생성 핵심 로직
│   │   │   └── app-core.js        # 애플리케이션 코어
│   │   │
│   │   ├── converters/            # 파일 변환 모듈
│   │   │   ├── image-converter.js # 이미지 변환
│   │   │   ├── document-converter.js # 문서 변환
│   │   │   ├── audio-converter.js # 오디오 변환
│   │   │   ├── video-converter.js # 비디오 변환
│   │   │   ├── data-converter.js  # 데이터 파일 변환
│   │   │   └── file-converter.js  # 파일 변환 및 QR 코드 연동
│   │   │
│   │   ├── qr-generator/          # QR 코드 생성 모듈
│   │   │   ├── qr-generator.js    # QR 코드 생성 기본 로직 (파일 기반 QR 코드 지원)
│   │   │   ├── qr-designer.js     # QR 디자인 커스터마이징
│   │   │   └── qr-content-formatter.js # 콘텐츠 포맷팅 (URL, 텍스트, 파일 등)
│   │   │
│   │   ├── ui/                    # UI 컴포넌트
│   │   │   ├── file-uploader.js   # 파일 업로드 UI
│   │   │   ├── progress-tracker.js # 진행 상태 UI
│   │   │   ├── options-panel.js   # 옵션 패널 UI
│   │   │   └── results-viewer.js  # 결과 뷰어 UI
│   │   │
│   │   ├── utils/                 # 유틸리티 함수
│   │   │   ├── file-utils.js      # 파일 관련 유틸
│   │   │   ├── ui-utils.js        # UI 관련 유틸
│   │   │   ├── storage-utils.js   # 스토리지 관련 유틸
│   │   │   └── adsense-manager.js # 광고 관리 유틸
│   │   │
│   │   └── registry.js            # 모듈 레지스트리
│   │
│   └── images/                    # 이미지 리소스
│       ├── icons/                 # 아이콘
│       ├── ui/                    # UI 이미지
│       └── logo.svg               # 로고
│
├── components/                    # 재사용 가능한 HTML 컴포넌트
│   ├── header.html                # 헤더 컴포넌트
│   ├── footer.html                # 푸터 컴포넌트
│   ├── file-uploader.html         # 파일 업로더 컴포넌트
│   └── ad-containers.html         # 광고 컨테이너 컴포넌트
│
├── pages/                         # 개별 페이지
│   ├── formats/                   # 파일 형식별 상세 페이지
│   │   ├── png.html               # PNG 파일 설명
│   │   ├── jpg.html               # JPG 파일 설명
│   │   └── ...                    # 기타 형식
│   │
│   ├── convert/                   # 변환 조합별 전용 페이지
│   │   ├── png-to-jpg.html        # PNG에서 JPG로 변환
│   │   ├── csv-to-json.html       # CSV에서 JSON으로 변환
│   │   └── ...                    # 기타 변환 조합
│   │
│   ├── qrcode/                    # QR 코드 가이드
│   │   ├── retail.html            # 소매업 QR 활용
│   │   ├── restaurant.html        # 요식업 QR 활용
│   │   └── ...                    # 기타 산업별 가이드
│   │
│   └── blog/                      # 블로그 포스트
│       ├── image-formats-guide.html # 이미지 형식 가이드
│       ├── qr-marketing-tips.html # QR 마케팅 팁
│       └── ...                    # 기타 블로그 포스트
│
├── templates/                     # 페이지 템플릿
│   ├── blog-template.html         # 블로그 페이지 템플릿
│   ├── format-template.html       # 파일 형식 상세 템플릿
│   └── convert-template.html      # 변환 가이드 템플릿
│
├── workers/                       # Web Worker 스크립트
│   ├── image-worker.js            # 이미지 처리 워커
│   ├── document-worker.js         # 문서 처리 워커
│   └── compression-worker.js      # 압축 처리 워커
│
├── config.js                      # 전역 설정 및 상수
├── index.html                     # 메인 페이지
├── convert.html                   # 파일 변환 페이지
├── qrcode.html                    # QR 코드 생성 페이지
├── privacy.html                   # 개인정보처리방침
├── terms.html                     # 이용약관
└── cookie-policy.html             # 쿠키 정책
```

## 모듈 의존성 관계도

```
+---------------+        +----------------+       +----------------+
| UI 컴포넌트    | -----> | 코어 모듈      | <---- | 유틸리티       |
| (file-uploader|        | (converter-core|       | (file-utils    |
|  progress-    |        |  qr-core       |       |  ui-utils      |
|  tracker, etc)|        |  app-core)     |       |  storage-utils)|
+---------------+        +----------------+       +----------------+
       |                        |
       |                        |
       v                        v
+----------------+       +----------------+       +----------------+
| 변환기 모듈     | <---- | 모듈 레지스트리 | ----> | QR 생성기 모듈  |
| (image-converter|       | (registry.js)  |       | (qr-generator  |
|  document-conv. |       +----------------+       |  qr-designer   |
|  audio-conv. etc|                               |  content-format)|
+----------------+                               +----------------+
       |                                                 |
       |                                                 |
       v                                                 v
+----------------+                               +----------------+
| Web Workers    |                               | 애드센스 관리   |
| (image-worker  |                               | (adsense-manager|
|  document-worker|                              +----------------+
|  compress-worker|
+----------------+
```

## 주요 페이지 흐름도

```
+-------------+     +-----------------+     +---------------+
| 메인 페이지  | --> | 파일 변환 페이지 | --> | 결과 다운로드  |
| (index.html) |     | (convert.html)  |     |               |
+-------------+     +-----------------+     +---------------+
       |                    |
       |                    |
       |                    v
       |             +------------------+
       |             | QR 코드 생성 전환 |
       |             | (파일 데이터 전달) |
       v             +------------------+
+---------------+            |
| QR 생성 페이지 | <----------+
| (qrcode.html)  |
+---------------+     +---------------+
       |              | QR 코드 저장   |
       +------------->|               |
                      +---------------+
```

## 확장 지점

이 프로젝트는 다음 영역에서 확장이 용이하도록 설계되었습니다:

1. **새로운 파일 형식 지원**: `converters/` 디렉토리에 새 변환기 모듈 추가
2. **새로운 QR 콘텐츠 유형**: `qr-generator/qr-content-formatter.js`에 새 포맷터 추가
3. **파일 기반 QR 코드 확장**: 
   - `file-converter.js`에서 `handleConvertToQRClick()` 함수를 통한 데이터 전달 방식 확장
   - `qr-generator.js`에서 `checkForFileData()` 및 `encodeFileToQR()` 함수를 통한 파일 지원 유형 확장
   - 세션 스토리지 대신 IndexedDB를 사용한 대용량 파일 지원 확장 가능
4. **UI 커스터마이징**: `components/` 디렉토리와 `assets/css/components/`에서 컴포넌트 수정
5. **기능 확장**: 레지스트리 기반 플러그인 구조를 통해 새로운 기능 모듈 추가

## 참고 사항

- 모든 새 파일 생성 전 이 맵을 참조하여 적절한 위치 결정
- 디렉토리 구조 변경이 필요한 경우 맵 업데이트 필요
- 모듈 간 의존성 관계 변경 시 관계도 업데이트 필요
- AI 가이드라인 파일 작업 시 `.ai-guides/` 디렉토리의 구조 준수