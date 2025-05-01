# FileToQR 모듈 시스템

## 개요
FileToQR의 모듈 시스템은 확장 가능하고 유지보수가 용이한 아키텍처를 제공합니다.

## 핵심 컴포넌트

### 모듈 레지스트리
- 위치: `assets/js/registry.js`
- 역할: 모듈 등록 및 관리
- 기능:
  - 모듈 등록/해제
  - 의존성 관리
  - 생명주기 관리

### 모듈 로더
- 위치: `assets/js/utils/module-loader.js`
- 역할: 동적 모듈 로딩
- 기능:
  - 비동기 모듈 로딩
  - 의존성 해결
  - 오류 처리

### 이벤트 시스템
- 위치: `assets/js/core/events.js`
- 역할: 모듈 간 통신
- 기능:
  - 이벤트 발행/구독
  - 비동기 통신
  - 이벤트 버블링

## 모듈 구조
```javascript
// 모듈 예시
{
  id: 'unique-id',
  name: 'module-name',
  version: '1.0.0',
  dependencies: ['other-module'],
  init: async () => {},
  destroy: () => {}
}
```

## 확장 가이드
1. 새 모듈 생성
2. 레지스트리 등록
3. 의존성 선언
4. 초기화 구현 