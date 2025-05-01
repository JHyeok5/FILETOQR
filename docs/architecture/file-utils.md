# FileToQR 파일 유틸리티 시스템

## 개요
파일 처리와 관련된 공통 기능을 제공하는 유틸리티 시스템입니다.

## 주요 기능

### 파일 처리 유틸리티
위치: `assets/js/utils/file-utils.js`

```javascript
// 주요 API
FileUtils = {
  getFileExtension(filename),
  formatFileSize(bytes),
  getMimeType(filename),
  getOutputFileName(input, format),
  fileToDataUri(file),
  getMimeTypeFromDataUri(dataUri)
}
```

### URL 유틸리티
위치: `assets/js/utils/url-utils.js`

```javascript
// 주요 API
UrlUtils = {
  getBasePath(),
  getRelativeUrl(path),
  standardizeUrls(includeExtension)
}
```

## 사용 예시
```javascript
// 파일 확장자 얻기
const ext = FileUtils.getFileExtension('example.jpg');

// 파일 크기 포맷팅
const size = FileUtils.formatFileSize(1024);

// URL 생성
const url = UrlUtils.getRelativeUrl('/images/logo.png');
```

## 오류 처리
- 잘못된 입력에 대한 검증
- 명확한 오류 메시지
- 일관된 예외 처리 