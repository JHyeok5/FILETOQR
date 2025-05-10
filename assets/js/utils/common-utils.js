/**
 * common-utils.js - FileToQR 공통 유틸리티 모듈
 * 버전: 1.0.0
 * 최종 업데이트: 2025-08-01
 * 
 * 이 모듈은 여러 파일에서 중복되는 공통 유틸리티 함수들을 통합합니다:
 * - 버전 비교 유틸리티
 * - 형식 검증 함수
 * - 기타 공통 헬퍼 함수
 */

// 공통 유틸리티 모듈 정의
const CommonUtils = {
  /**
   * 버전 비교
   * @param {string} version1 - 첫 번째 버전
   * @param {string} version2 - 두 번째 버전
   * @returns {number} version1이 version2보다 크면 1, 같으면 0, 작으면 -1
   */
  compareVersions(version1, version2) {
    const v1parts = version1.split('.').map(Number);
    const v2parts = version2.split('.').map(Number);
    
    for (let i = 0; i < v1parts.length; ++i) {
      if (v2parts.length === i) {
        return 1; // version1이 더 긴 경우
      }
      
      if (v1parts[i] > v2parts[i]) {
        return 1;
      }
      
      if (v1parts[i] < v2parts[i]) {
        return -1;
      }
    }
    
    if (v1parts.length !== v2parts.length) {
      return -1; // version2가 더 긴 경우
    }
    
    return 0; // 버전이 같음
  },

  /**
   * 형식 검증 함수 - 파일/값 검증용 공통 유틸리티
   */
  validation: {
    /**
     * 이메일 형식 검증
     * @param {string} email - 검증할 이메일
     * @returns {boolean} 유효성 여부
     */
    isValidEmail(email) {
      const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      return regex.test(email);
    },
    
    /**
     * URL 형식 검증
     * @param {string} url - 검증할 URL
     * @returns {boolean} 유효성 여부
     */
    isValidUrl(url) {
      try {
        new URL(url);
        return true;
      } catch (e) {
        return false;
      }
    },
    
    /**
     * 파일명 형식 검증
     * @param {string} filename - 검증할 파일명
     * @returns {boolean} 유효성 여부
     */
    isValidFileName(filename) {
      return typeof filename === 'string' && filename.length > 0;
    },
    
    /**
     * 파일 크기 검증
     * @param {number} size - 파일 크기 (바이트)
     * @param {number} maxSize - 최대 허용 크기 (바이트)
     * @returns {boolean} 유효성 여부
     */
    isValidFileSize(size, maxSize) {
      return typeof size === 'number' && typeof maxSize === 'number' && size > 0 && size <= maxSize;
    }
  },
  
  /**
   * 일반 유틸리티 함수
   */
  general: {
    /**
     * DOM 요소 생성 헬퍼
     * @param {string} tag - 태그 이름
     * @param {Object} attributes - 속성 객체
     * @param {string|Element|Array} [children] - 자식 요소
     * @returns {Element} 생성된 요소
     */
    createElement(tag, attributes = {}, children = null) {
      const element = document.createElement(tag);
      
      // 속성 추가
      Object.entries(attributes).forEach(([key, value]) => {
        if (key === 'className') {
          element.className = value;
        } else if (key === 'style' && typeof value === 'object') {
          Object.assign(element.style, value);
        } else {
          element.setAttribute(key, value);
        }
      });
      
      // 자식 요소 추가
      if (children) {
        if (typeof children === 'string') {
          element.textContent = children;
        } else if (children instanceof Element) {
          element.appendChild(children);
        } else if (Array.isArray(children)) {
          children.forEach(child => {
            if (child instanceof Element) {
              element.appendChild(child);
            } else if (typeof child === 'string') {
              element.appendChild(document.createTextNode(child));
            }
          });
        }
      }
      
      return element;
    },
    
    /**
     * 디바운스 함수
     * @param {Function} func - 실행할 함수
     * @param {number} wait - 대기 시간 (ms)
     * @returns {Function} 디바운스된 함수
     */
    debounce(func, wait) {
      let timeout;
      return function executedFunction(...args) {
        const later = () => {
          clearTimeout(timeout);
          func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
      };
    },
    
    /**
     * 쓰로틀 함수
     * @param {Function} func - 실행할 함수
     * @param {number} limit - 제한 시간 (ms)
     * @returns {Function} 쓰로틀된 함수
     */
    throttle(func, limit) {
      let inThrottle;
      return function executedFunction(...args) {
        if (!inThrottle) {
          func(...args);
          inThrottle = true;
          setTimeout(() => { inThrottle = false; }, limit);
        }
      };
    }
  }
};

// 하위 호환성을 위한 전역 참조
if (typeof window !== 'undefined') {
  window.FileToQR = window.FileToQR || {};
  window.FileToQR.utils = window.FileToQR.utils || {};
  window.FileToQR.utils.common = CommonUtils;
}

// 모듈 내보내기
export default CommonUtils; 