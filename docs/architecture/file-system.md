# FileToQR 파일 시스템 아키텍처

## 개요
이 문서는 FileToQR 프로젝트의 파일 시스템 아키텍처를 설명합니다.

## 파일 구조
```
FileToQR/
├── assets/
│   ├── js/
│   │   ├── converters/     # 파일 변환 관련 모듈
│   │   ├── core/          # 핵심 기능 모듈
│   │   ├── qr-generator/  # QR 코드 생성 모듈
│   │   └── utils/         # 유틸리티 모듈
│   └── css/               # 스타일시트
├── components/            # 재사용 가능한 컴포넌트
├── docs/                 # 프로젝트 문서
└── workers/              # Web Workers
```

## 핵심 모듈
- **파일 변환 시스템**: `assets/js/converters/`
  - 이미지, 문서, 오디오, 비디오 변환 지원
  - 각 변환기는 독립적인 모듈로 구현

- **QR 코드 생성 시스템**: `assets/js/qr-generator/`
  - QR 코드 생성 및 스타일링
  - 다양한 데이터 형식 지원

- **유틸리티**: `assets/js/utils/`
  - 파일 처리
  - URL 관리
  - 모듈 로딩

## 확장성
- 플러그인 아키텍처로 새로운 변환기 추가 가능
- 모듈식 설계로 기능 확장 용이 