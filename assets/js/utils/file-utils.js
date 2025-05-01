/**
 * file-utils.js - FileToQR 파일 유틸리티 모듈
 * 버전: 1.1.0
 * 최종 업데이트: 2025-06-25
 *
 * 이 모듈은 파일 관련 공통 유틸리티 함수들을 제공합니다:
 * - 파일 확장자 추출
 * - 파일 크기 포맷팅
 * - 파일 MIME 타입 관리
 * - 데이터 URI 변환
 */

// 비공개 헬퍼 함수들
function isValidFileName(filename) {
  return typeof filename === 'string' && filename.length > 0;
}

// 파일 유틸리티 모듈 API 정의
const FileUtils = {
  /**
   * 파일명에서 확장자 추출
   * @param {string} filename - 파일명
   * @returns {string} 소문자 확장자 (점 제외)
   */
  getFileExtension(filename) {
    if (!isValidFileName(filename)) return '';
    return filename.split('.').pop().toLowerCase();
  },

  /**
   * 바이트 단위 파일 크기를 사람이 읽기 쉬운 형식으로 변환
   * @param {number} bytes - 바이트 단위 크기
   * @param {number} decimals - 소수점 자릿수 (기본값: 2)
   * @returns {string} 포맷팅된 파일 크기 (예: "1.5 MB")
   */
  formatFileSize(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
  },

  /**
   * 확장자에 따른 MIME 타입 반환
   * @param {string} format - 파일 확장자 (점 제외)
   * @returns {string} MIME 타입
   */
  getMimeType(format) {
    const mimeTypes = {
      // 이미지
      'png': 'image/png',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'svg': 'image/svg+xml',
      'bmp': 'image/bmp',
      'ico': 'image/x-icon',
      
      // 문서
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'xls': 'application/vnd.ms-excel',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'ppt': 'application/vnd.ms-powerpoint',
      'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'txt': 'text/plain',
      'rtf': 'application/rtf',
      
      // 오디오
      'mp3': 'audio/mpeg',
      'wav': 'audio/wav',
      'ogg': 'audio/ogg',
      'flac': 'audio/flac',
      'm4a': 'audio/m4a',
      
      // 비디오
      'mp4': 'video/mp4',
      'webm': 'video/webm',
      'avi': 'video/x-msvideo',
      'mov': 'video/quicktime',
      'wmv': 'video/x-ms-wmv',
      
      // 데이터
      'json': 'application/json',
      'xml': 'application/xml',
      'csv': 'text/csv',
      'yaml': 'application/x-yaml',
      'yml': 'application/x-yaml',
      
      // 압축
      'zip': 'application/zip',
      'rar': 'application/x-rar-compressed',
      '7z': 'application/x-7z-compressed',
      'tar': 'application/x-tar',
      'gz': 'application/gzip'
    };
    
    return mimeTypes[format?.toLowerCase()] || 'application/octet-stream';
  },

  /**
   * 출력 파일명 생성
   * @param {string} inputFileName - 입력 파일명
   * @param {string} outputFormat - 출력 형식 (확장자)
   * @returns {string} 새 파일명
   */
  getOutputFileName(inputFileName, outputFormat) {
    const baseName = inputFileName.substring(0, inputFileName.lastIndexOf('.')) || inputFileName;
    return `${baseName}.${outputFormat}`;
  },

  /**
   * 파일을 데이터 URI로 변환
   * @param {File} file - 파일 객체
   * @returns {Promise<string>} 데이터 URI 문자열
   */
  fileToDataUri(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = function(event) {
        resolve(event.target.result);
      };
      
      reader.onerror = function(error) {
        reject(error);
      };
      
      reader.readAsDataURL(file);
    });
  },

  /**
   * 데이터 URI에서 MIME 타입 추출
   * @param {string} dataUri - 데이터 URI
   * @returns {string} MIME 타입
   */
  getMimeTypeFromDataUri(dataUri) {
    const match = dataUri.match(/^data:([^;]+);/);
    return match ? match[1] : 'application/octet-stream';
  }
};

// 하위 호환성을 위한 전역 참조
if (typeof window !== 'undefined') {
  window.FileToQR = window.FileToQR || {};
  window.FileToQR.utils = window.FileToQR.utils || {};
  window.FileToQR.utils.file = FileUtils;
  // 직접 접근을 위한 전역 참조 추가
  window.FileUtils = FileUtils;
}

// 모듈 내보내기
export default FileUtils; 