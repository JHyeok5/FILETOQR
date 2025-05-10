/**
 * app-core.js - FileToQR 애플리케이션 코어 모듈
 * 버전: 1.1.0
 * 최종 업데이트: 2025-07-15
 * 참조: ../../docs/architecture/module-registry.md
 * 
 * 이 모듈은 애플리케이션의 핵심 기능을 관리합니다:
 * - 모듈 초기화 및 등록
 * - 이벤트 관리
 * - 네비게이션 및 라우팅
 * - 전역 상태 관리
 * - 컴포넌트 시스템 관리
 * - 버전 관리
 * - 페이지별 초기화
 * - 다국어 지원
 */

// 디버깅을 위한 로그 추가
console.log('app-core.js 로딩 시작');

// 글로벌 네임스페이스 설정
window.FileToQR = window.FileToQR || {};

// 애플리케이션 버전
const APP_VERSION = '2.0.0';

// 애플리케이션 설정 및 상수
const CONFIG = {
  linkStandardization: {
    includeExtension: true
  },
  routes: {
    home: '/index.html',
    convert: '/convert.html',
    qrcode: '/qrcode.html',
    privacy: '/privacy.html',
    terms: '/terms.html',
    help: '/help.html'
  },
  supportedLanguages: ['ko', 'en', 'zh', 'ja']
};

/**
 * 현재 페이지 식별자 반환
 * @returns {string} 페이지 식별자
 */
function getCurrentPage() {
  try {
    // 페이지 경로를 가져와서 분석
    const path = window.location.pathname;
    
    // 언어 코드 제거 (예: /en/index.html -> /index.html)
    let pathWithoutLang = path;
    const pathParts = path.split('/').filter(part => part);
    
    if (pathParts.length > 0 && CONFIG.supportedLanguages.includes(pathParts[0])) {
      // 언어 코드를 제외한 경로 재구성
      pathWithoutLang = '/' + pathParts.slice(1).join('/');
    }
    
    // 루트 페이지 확인
    if (pathWithoutLang === '/' || pathWithoutLang.endsWith('/index.html')) return 'home';
    
    // 변환 페이지 확인
    if (pathWithoutLang.endsWith('/convert.html')) return 'convert';
    
    // QR 코드 페이지 확인
    if (pathWithoutLang.endsWith('/qrcode.html')) return 'qrcode';
    
    // 도움말 페이지 확인
    if (pathWithoutLang.endsWith('/help.html')) return 'help';
    
    // 개인정보 처리방침 페이지 확인
    if (pathWithoutLang.endsWith('/privacy.html')) return 'privacy';
    
    // 이용약관 페이지 확인
    if (pathWithoutLang.endsWith('/terms.html')) return 'terms';
    
    // 타이머 페이지 확인
    if (pathWithoutLang.endsWith('/timer.html')) return 'timer';
    
    // 문의하기 페이지 확인
    if (pathWithoutLang.endsWith('/contact.html')) return 'contact';
    
    // 페이지 식별자를 파일명에서 추출
    const lastSegment = pathWithoutLang.split('/').pop() || '';
    const pageId = lastSegment.replace('.html', '');
    
    return pageId || 'unknown';
  } catch (error) {
    console.error('현재 페이지 확인 중 오류 발생:', error);
    return 'unknown';
  }
}

/**
 * 페이지 이동 함수
 * @param {string} url - 이동할 URL
 * @param {boolean} [newTab=false] - 새 탭에서 열기 여부
 */
function navigateTo(url, newTab = false) {
  try {
    // URL 열기
    if (newTab) {
      window.open(url, '_blank');
    } else {
      window.location.href = url;
    }
  } catch (error) {
    console.error('페이지 이동 중 오류 발생:', error);
  }
}

/**
 * 기본 경로 가져오기
 * @returns {string} 기본 경로
 */
function getBasePath() {
  // 현재 URL 경로 분석
  const currentPath = window.location.pathname;
  const pathParts = currentPath.split('/').filter(part => part);
  
  // 언어 코드가 포함된 경우 상위 디렉토리로 이동
  if (pathParts.length > 0 && CONFIG.supportedLanguages.includes(pathParts[0])) {
    return '../';
  }
  
  // 기본값은 상대 경로 './'
  return './';
}

/**
 * 애플리케이션 초기화
 * @returns {Promise<void>}
 */
async function init() {
  console.log(`FileToQR 애플리케이션 초기화 시작 (v${APP_VERSION})`);
  
  try {
    // 페이지별 초기화
    await initCurrentPage();
    
    console.log('애플리케이션 초기화 완료');
  } catch (error) {
    console.error('애플리케이션 초기화 실패:', error);
  }
}

/**
 * 현재 페이지 초기화 (페이지별 로직)
 * @private
 * @returns {Promise<void>}
 */
async function initCurrentPage() {
  try {
    // 현재 페이지 ID 가져오기
    const pageId = getCurrentPage();
    
    console.log(`페이지별 초기화 시작: ${pageId}`);
    
    // 페이지별 초기화 함수 매핑
    const pageInitializers = {
      'home': initHomePage,
      'convert': initConvertPage,
      'qrcode': initQRCodePage,
      'timer': initTimerPage,
      'help': initHelpPage,
      'contact': initContactPage,
      'privacy': initPrivacyPage,
      'terms': initTermsPage
    };
    
    // 초기화 함수 실행
    if (pageInitializers[pageId] && typeof pageInitializers[pageId] === 'function') {
      await pageInitializers[pageId]();
    } else {
      console.log(`${pageId} 페이지에 대한 별도 초기화 함수 없음`);
    }
    
    console.log(`${pageId} 페이지 초기화 완료`);
  } catch (error) {
    console.error('페이지 초기화 실패:', error);
  }
}

/**
 * 홈 페이지 초기화
 * @private
 */
function initHomePage() {
  console.log('홈페이지 초기화');
  
  // 시작하기 버튼 이벤트만 남겨둠
  const getStartedBtns = document.querySelectorAll('.get-started-btn');
  getStartedBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      navigateTo('convert.html');
    });
  });
}

/**
 * 변환 페이지 초기화
 * @private
 */
function initConvertPage() {
  console.log('변환 페이지 초기화');
  
  // 전역 객체에서 페이지 컨트롤러 확인 및 초기화
  if (window.FileToQR && window.FileToQR.ConvertPageController) {
    window.FileToQR.ConvertPageController.init();
  } else {
    console.error('ConvertPageController를 찾을 수 없습니다');
  }
}

/**
 * QR 코드 페이지 초기화
 * @private
 */
function initQRCodePage() {
  console.log('QR 코드 페이지 초기화');
}

/**
 * 타이머 페이지 초기화
 * @private
 */
function initTimerPage() {
  console.log('타이머 페이지 초기화');
}

/**
 * 도움말 페이지 초기화
 * @private
 */
function initHelpPage() {
  console.log('도움말 페이지 초기화');
}

/**
 * 문의하기 페이지 초기화
 * @private
 */
function initContactPage() {
  console.log('문의하기 페이지 초기화');
}

/**
 * 개인정보 처리방침 페이지 초기화
 * @private
 */
function initPrivacyPage() {
  console.log('개인정보 처리방침 페이지 초기화');
}

/**
 * 이용약관 페이지 초기화
 * @private
 */
function initTermsPage() {
  console.log('이용약관 페이지 초기화');
}

// 자동 초기화
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', init);
}

// 글로벌 네임스페이스에 등록
window.FileToQR.appCore = {
  init,
  getCurrentPage,
  navigateTo,
  getConfig: () => CONFIG,
  getBasePath
};
window.FileToQR.initApp = init;
window.FileToQR.getBasePath = getBasePath;
window.FileToQR.getCurrentPage = getCurrentPage;
window.FileToQR.navigateTo = navigateTo;
window.FileToQR.version = APP_VERSION; 