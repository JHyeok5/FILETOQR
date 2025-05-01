/**
 * debug-helper.js - FileToQR 디버그 헬퍼 유틸리티
 * 버전: 1.0.0
 * 최종 업데이트: 2025-06-15
 * 
 * 이 모듈은 FileToQR 프로젝트의 디버그 모드와 관련된 유틸리티 기능을 제공합니다:
 * - 디버그 모드 설정 및 확인
 * - 디버그 메시지 로깅
 * - 모듈 로딩 시 일관된 경로 사용
 */

// 디버그 헬퍼 모듈
const DebugHelper = {
  /**
   * 디버그 모드 설정
   * @param {boolean} enabled - 디버그 모드 활성화 여부
   */
  setDebugMode(enabled = true) {
    if (typeof window !== 'undefined') {
      window.DEBUG_MODE = enabled;
      
      // localStorage에 디버그 모드 설정 저장 (페이지 새로고침 시에도 유지)
      try {
        if (enabled) {
          localStorage.setItem('fileToQR_debugMode', 'enabled');
        } else {
          localStorage.removeItem('fileToQR_debugMode');
        }
      } catch (error) {
        console.warn('디버그 모드 설정을 localStorage에 저장하지 못했습니다:', error);
      }
      
      console.log(`디버그 모드가 ${enabled ? '활성화' : '비활성화'}되었습니다.`);
      return true;
    }
    return false;
  },
  
  /**
   * 디버그 모드 확인
   * @returns {boolean} 디버그 모드 활성화 여부
   */
  isDebugMode() {
    if (typeof window !== 'undefined') {
      // 명시적 설정이 있으면 그것을 사용
      if (typeof window.DEBUG_MODE === 'boolean') {
        return window.DEBUG_MODE;
      }
      
      // localStorage에서 설정 확인
      try {
        return localStorage.getItem('fileToQR_debugMode') === 'enabled';
      } catch (error) {
        // localStorage 접근 실패 시 기본값으로 false 반환
        return false;
      }
    }
    return false;
  },
  
  /**
   * 디버그 로깅
   * @param {...any} args - 로그 인자들
   */
  log(...args) {
    if (this.isDebugMode()) {
      console.log('[DEBUG]', ...args);
    }
  },
  
  /**
   * 디버그 경고
   * @param {...any} args - 경고 인자들
   */
  warn(...args) {
    if (this.isDebugMode()) {
      console.warn('[DEBUG]', ...args);
    }
  },
  
  /**
   * 디버그 에러
   * @param {...any} args - 에러 인자들
   */
  error(...args) {
    if (this.isDebugMode()) {
      console.error('[DEBUG]', ...args);
    }
  },
  
  /**
   * 모듈 동적 로드 (경로 처리 자동화)
   * @param {string} path - 모듈 경로
   * @param {boolean} tryAltPath - 대체 경로 시도 여부
   * @returns {Promise<Object>} 모듈 객체
   */
  async loadModule(path, tryAltPath = true) {
    if (!path) {
      throw new Error('모듈 경로가 지정되지 않았습니다.');
    }
    
    // 경로가 .js로 끝나지 않으면 추가
    const fullPath = path.endsWith('.js') ? path : `${path}.js`;
    
    // 경로 정규화
    const normalizedPath = fullPath.startsWith('./') || fullPath.startsWith('/') ? 
      fullPath : `./${fullPath}`;
    
    try {
      // 첫 번째 시도
      const module = await import(normalizedPath);
      this.log(`모듈 로드 성공: ${normalizedPath}`);
      return module;
    } catch (error) {
      this.warn(`모듈 로드 실패: ${normalizedPath}`, error.message);
      
      // 대체 경로 시도
      if (tryAltPath) {
        try {
          // 상대 경로 <-> 절대 경로 전환
          const altPath = normalizedPath.startsWith('./') ? 
            normalizedPath.substring(2) : // 상대 경로를 절대 경로로
            (normalizedPath.startsWith('/') ? 
              `.${normalizedPath}` : // 절대 경로를 상대 경로로
              `/${normalizedPath}`); // 다른 형태의 경로 처리
          
          this.log(`대체 경로 시도: ${altPath}`);
          const module = await import(altPath);
          this.log(`대체 경로로 모듈 로드 성공: ${altPath}`);
          return module;
        } catch (altError) {
          this.error(`대체 경로도 로드 실패:`, altError.message);
          throw new Error(`모듈 로드 실패 (원본 및 대체 경로): ${path}`);
        }
      }
      
      throw error;
    }
  }
};

// 디버그 모드 초기화 (페이지 로드 시)
if (typeof window !== 'undefined') {
  // 전역 변수가 없으면 localStorage에서 확인
  if (typeof window.DEBUG_MODE !== 'boolean') {
    try {
      window.DEBUG_MODE = localStorage.getItem('fileToQR_debugMode') === 'enabled';
    } catch (error) {
      window.DEBUG_MODE = false;
    }
  }
  
  // 글로벌 네임스페이스에 등록
  window.FileToQR = window.FileToQR || {};
  window.FileToQR.debug = DebugHelper;
}

export default DebugHelper; 