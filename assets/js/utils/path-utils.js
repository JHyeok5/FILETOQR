/**
 * path-utils.js - FileToQR 파일 경로 유틸리티
 * 버전: 1.0.0
 * 최종 업데이트: 2025-07-01
 *
 * 이 모듈은 파일 경로 처리와 관련된 공통 유틸리티 함수를 제공합니다:
 * - 모듈 경로 정규화: 다양한 경로 형식을 일관된 형식으로 변환
 * - 파일 경로 변환: 상대 경로와 절대 경로 간 변환 및 다양한 경로 변형 생성
 * - 동적 임포트 지원: 여러 경로 형식을 시도하여 안정적인 모듈 로딩
 * 
 * 이 유틸리티의 주요 목적:
 * 1. 경로 처리 코드 중복 제거
 * 2. 동적 모듈 로딩의 신뢰성 향상
 * 3. 다양한 환경(개발, 프로덕션, 서브 디렉토리 배포 등)에서의 호환성 보장
 * 
 * 사용 예시:
 * ```
 * // 모듈 임포트
 * const module = await PathUtils.importModule('utils/config-manager');
 * 
 * // 경로 변형 생성
 * const paths = PathUtils.getPathVariations('utils/file-utils.js');
 * ```
 */

/**
 * 파일 경로 유틸리티 모듈 API 정의
 */
const PathUtils = {
  /**
   * 모듈 경로 정규화
   * 다양한 형식의 경로를 일관된 형식으로 변환합니다.
   * 
   * @param {string} modulePath - 정규화할 모듈 경로
   * @returns {string} 정규화된 모듈 경로
   * 
   * @example
   * // 결과: './utils/config.js'
   * PathUtils.normalizePath('/utils/config.js');
   * 
   * @example
   * // 결과: './components/header.js'
   * PathUtils.normalizePath('components/header.js');
   */
  normalizePath(modulePath) {
    // 1. 경로가 /로 시작하는지 확인 (절대 경로)
    if (modulePath.startsWith('/')) {
      // 앞의 / 제거
      modulePath = modulePath.substring(1);
    }
    
    // 2. 상대 경로인지 확인
    if (!modulePath.startsWith('./') && !modulePath.startsWith('../')) {
      // 상대 경로로 변환
      modulePath = './' + modulePath;
    }
    
    return modulePath;
  },

  /**
   * 애플리케이션의 기본 경로를 가져옵니다.
   * URL 기반으로 현재 애플리케이션의 기본 경로(basePath)를 확인합니다.
   * 
   * @returns {string} 애플리케이션 기본 경로
   * 
   * @example
   * // URL이 https://example.com/my-app/index.html인 경우
   * // 결과: '/my-app/'
   * PathUtils.getBasePath();
   * 
   * @example
   * // URL이 https://example.com/index.html인 경우
   * // 결과: '/'
   * PathUtils.getBasePath();
   */
  getBasePath() {
    if (typeof window === 'undefined' || !window.location) {
      return '/';
    }
    
    try {
      // URL 경로 가져오기
      const pathname = window.location.pathname;
      
      // 파일명 제거하기 (index.html 등)
      let basePath;
      if (pathname.endsWith('/')) {
        basePath = pathname; // 이미 / 로 끝나는 경우
      } else {
        // 마지막 / 이후의 파일명을 제거하고 / 추가
        const lastSlashIndex = pathname.lastIndexOf('/');
        if (lastSlashIndex === -1) {
          basePath = '/';
        } else {
          basePath = pathname.substring(0, lastSlashIndex + 1);
        }
      }
      
      // 언어 경로 패턴 제거 (/en/, /ja/, /zh/ 등)
      const langPattern = /\/([a-z]{2})\/$/;
      if (langPattern.test(basePath)) {
        // 언어 경로를 제외한 상위 경로로 변경
        const parentPath = basePath.substring(0, basePath.length - 4); // '/xx/' 제거
        basePath = parentPath.length > 0 ? parentPath : '/';
      }
      
      console.log(`애플리케이션 기본 경로 계산됨: ${basePath}`);
      return basePath;
    } catch (error) {
      console.error('기본 경로 계산 오류:', error);
      return '/';
    }
  },

  /**
   * 경로를 다양한 형식으로 변환하여 시도 가능한 경로 배열 반환
   * 브라우저 환경에서 모듈 로딩 시 다양한 경로 형식을 시도하기 위한 함수입니다.
   * 
   * @param {string} basePath - 기본 경로
   * @returns {string[]} 시도 가능한 다양한 경로 배열
   * 
   * @example
   * // 결과: ['./utils/file.js', 'utils/file.js', '/utils/file.js']
   * PathUtils.getPathVariations('./utils/file.js');
   * 
   * @example
   * // 결과: ['/components/header.js', 'components/header.js', './components/header.js']
   * PathUtils.getPathVariations('/components/header.js');
   */
  getPathVariations(basePath) {
    const paths = [];
    
    // 절대 경로와 상대 경로 시도
    if (basePath.startsWith('./')) {
      paths.push(basePath);
      paths.push(basePath.substring(2)); // './' 제거
      paths.push('/' + basePath.substring(2)); // '/' 추가
    } else if (basePath.startsWith('/')) {
      paths.push(basePath);
      paths.push(basePath.substring(1)); // '/' 제거
      paths.push('./' + basePath.substring(1)); // './' 추가
    } else {
      paths.push(basePath);
      paths.push('./' + basePath);
      paths.push('/' + basePath);
    }
    
    // 추가 경로 변형 (assets/ 포함 여부)
    if (!basePath.includes('assets/') && !basePath.includes('assets\\')) {
      paths.push(`assets/js/${basePath}`);
      paths.push(`./assets/js/${basePath}`);
      paths.push(`/assets/js/${basePath}`);
    }
    
    // 애플리케이션 기본 경로 추가
    const appBasePath = this.getBasePath();
    if (appBasePath !== '/' && !paths.some(p => p.startsWith(appBasePath))) {
      paths.push(`${appBasePath}${basePath}`);
      if (basePath.startsWith('./')) {
        paths.push(`${appBasePath}${basePath.substring(2)}`);
      } else if (basePath.startsWith('/')) {
        paths.push(`${appBasePath}${basePath.substring(1)}`);
      }
    }
    
    return paths;
  },

  /**
   * 모듈 동적 임포트 (다양한 경로 시도)
   * 여러 경로 형식을 시도하여 모듈을 안정적으로 로드합니다.
   * 환경에 따라 경로 해석이 다를 수 있기 때문에 유용합니다.
   * 
   * @param {string} modulePath - 모듈 기본 경로
   * @param {boolean} addJsExtension - .js 확장자 자동 추가 여부 (기본값: true)
   * @returns {Promise<Object>} 임포트된 모듈
   * @throws {Error} 모든 경로 시도 실패 시 에러 발생
   * 
   * @example
   * // 성공하면 모듈 반환, 실패하면 에러 발생
   * try {
   *   const configModule = await PathUtils.importModule('utils/config');
   *   // 모듈 사용
   * } catch (error) {
   *   console.error('모듈을 로드할 수 없습니다:', error);
   * }
   */
  async importModule(modulePath, addJsExtension = true) {
    // .js 확장자 추가 (필요한 경우)
    if (addJsExtension && !modulePath.endsWith('.js')) {
      modulePath += '.js';
    }
    
    // 정규화된 경로
    const normalizedPath = this.normalizePath(modulePath);
    
    // 시도할 경로 배열
    const pathVariations = this.getPathVariations(normalizedPath);
    
    // 각 경로 시도
    let lastError = null;
    
    for (const path of pathVariations) {
      try {
        console.log(`모듈 임포트 시도: ${path}`);
        return await import(path);
      } catch (error) {
        console.warn(`경로 ${path}에서 모듈을 로드할 수 없습니다:`, error.message);
        lastError = error;
      }
    }
    
    // 모든 시도 실패
    throw new Error(`모듈을 로드할 수 없습니다 (${modulePath}): ${lastError?.message || 'Unknown error'}`);
  }
};

// 전역 참조를 위한 등록
if (typeof window !== 'undefined') {
  window.FileToQR = window.FileToQR || {};
  window.FileToQR.utils = window.FileToQR.utils || {};
  window.FileToQR.utils.path = PathUtils;
  window.PathUtils = PathUtils;
}

// 모듈 내보내기
export default PathUtils; 