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

// 코어 유틸리티 임포트
import ModuleLoader from '../utils/module-loader.js';
import UrlUtils from '../utils/url-utils.js';
import PathUtils from '../utils/path-utils.js';
import TemplateUtils from '../utils/template-utils.js';
import I18nUtils from '../utils/i18n-utils.js';

// 안전한 registry 참조
let registry = null;

// registry 초기화 함수 (지연 로딩)
async function initRegistry() {
  try {
    if (!registry) {
      // registry가 없는 경우에만 로드
      const registryModule = await import('../registry.js');
      registry = registryModule.default;
    }
    return registry;
  } catch (error) {
    console.error('레지스트리 초기화 실패:', error);
    return null;
  }
}

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

// 앱 코어 모듈 API 정의
const appCore = {
  init,
  getCurrentPage,
  navigateTo,
  getConfig: () => CONFIG,
  reloadPage: () => window.location.reload(),
  ModuleLoader,
  UrlUtils,
  getRegistry: () => registry
};

// 내부 상태 관리
let isInitialized = false;
let globalComponentContainer = null;

// 애플리케이션 버전
const APP_VERSION = '2.0.0';

/**
 * 애플리케이션 초기화
 * @returns {Promise<void>}
 */
async function init() {
  console.log(`FileToQR 애플리케이션 초기화 시작 (v${APP_VERSION})`);
  
  try {
    // 모듈 로더 초기화
    initModuleLoader();
    
    // 다국어 지원 초기화
    await initI18n();
    
    // 템플릿 유틸리티 초기화
    await initTemplates();
    
    // 페이지 컴포넌트 로드
    await loadPageComponents();
    
    // 페이지별 초기화
    await initCurrentPage();
    
    console.log('애플리케이션 초기화 완료');
  } catch (error) {
    console.error('애플리케이션 초기화 실패:', error);
  }
}

/**
 * 모듈 로더 초기화
 * @private
 */
function initModuleLoader() {
  // 핵심 모듈만 등록
  ModuleLoader.registerModule('app-core', '/assets/js/core/app-core.js', []);
  ModuleLoader.registerModule('url-utils', '/assets/js/utils/url-utils.js', []);
  ModuleLoader.registerModule('module-loader', '/assets/js/utils/module-loader.js', []);
  ModuleLoader.registerModule('path-utils', '/assets/js/utils/path-utils.js', []);
  ModuleLoader.registerModule('template-utils', '/assets/js/utils/template-utils.js', []);
  ModuleLoader.registerModule('i18n-utils', '/assets/js/utils/i18n-utils.js', []);
  
  // registry 모듈은 app-core 의존성에서 제외하고 별도 등록
  ModuleLoader.registerModule('registry', '/assets/js/registry.js', []);
  
  console.log('모듈 로더 초기화 완료');
}

/**
 * 다국어 지원 초기화
 * @private
 * @returns {Promise<void>}
 */
async function initI18n() {
  try {
    console.log('다국어 지원 초기화 중...');
    
    // URL에서 언어 코드 추출
    let urlLang = null;
    const pathnameParts = window.location.pathname.split('/');
    const supportedLangs = CONFIG.supportedLanguages;
    
    // URL에 언어 코드가 포함되어 있는지 확인 (예: /en/index.html)
    for (let i = 0; i < pathnameParts.length; i++) {
      if (supportedLangs.includes(pathnameParts[i])) {
        urlLang = pathnameParts[i];
        break;
      }
    }
    
    // i18n 모듈 초기화 옵션
    const i18nOptions = {
      defaultLang: 'ko',
      supportedLangs: supportedLangs,
      detectBrowserLang: true,
      useSavedLang: true
    };
    
    // URL에서 언어가 지정된 경우 우선 적용
    if (urlLang) {
      console.log(`URL에서 언어 감지: ${urlLang}`);
      
      // URL 지정 언어를 로컬 스토리지에 저장
      if (window.localStorage) {
        localStorage.setItem('fileToQR_lang', urlLang);
      }
    }
    
    // i18n 모듈 초기화
    await I18nUtils.init(i18nOptions);
    
    // 메타 태그 업데이트
    I18nUtils.updateMetaTags();
    
    console.log(`다국어 지원 초기화 완료 (현재 언어: ${I18nUtils.currentLang})`);
  } catch (error) {
    console.error('다국어 지원 초기화 실패:', error);
    throw error;
  }
}

/**
 * 템플릿 유틸리티 초기화
 * @private
 * @returns {Promise<void>}
 */
async function initTemplates() {
  try {
    console.log('템플릿 시스템 초기화 중...');
    
    // 템플릿 유틸리티 초기화
    await TemplateUtils.init({
      loadPartials: true
    });
    
    console.log('템플릿 시스템 초기화 완료');
  } catch (error) {
    console.error('템플릿 시스템 초기화 실패:', error);
    throw error;
  }
}

/**
 * 페이지 컴포넌트 로드
 * @private
 * @returns {Promise<void>}
 */
async function loadPageComponents() {
  try {
    console.log('페이지 컴포넌트 로드 중...');
    
    // 현재 페이지 ID 가져오기
    const currentPageId = getCurrentPage();
    console.log(`현재 페이지 ID: ${currentPageId}`);
    
    // 페이지별 필요한 컴포넌트 로드
    switch (currentPageId) {
      case 'home':
        // 홈페이지 컴포넌트 로드
        await initHomePage();
        break;
      case 'convert':
        // 변환 페이지 컴포넌트 로드
        await initFileConverter();
        break;
      case 'qrcode':
        // QR 코드 페이지 컴포넌트 로드
        await initQRGenerator();
        break;
      case 'timer':
        // 타이머 페이지 컴포넌트 로드
        await initTimerPage();
        break;
      default:
        console.log(`${currentPageId} 페이지에 대한 특별한 초기화 없음`);
        break;
    }
    
    console.log('페이지 컴포넌트 로드 완료');
  } catch (error) {
    console.error('페이지 컴포넌트 로드 실패:', error);
    throw error;
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
    if (pageInitializers[pageId]) {
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
  console.log('기본 홈페이지 초기화 - 가능한 경우 home.js 모듈을 사용하세요.');
  
  // 슬라이더 기능은 home.js로 이동했으므로 여기서는 더 이상 직접 구현하지 않음
  // 기능 애니메이션 및 홈페이지 관련 기능은 pages/home.js 모듈에서 처리함
  
  // 완전히 제거하지 않고 최소한의 폴백만 구현
  // 시작하기 버튼 이벤트만 남겨둠 (중요한 기능이므로)
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
  
  // 실제 로직은 convert.js에서 구현
  safeImport('pages/convert').catch(error => {
    console.error('변환 페이지 모듈 로드 실패:', error);
  });
}

/**
 * QR 코드 페이지 초기화
 * @private
 */
function initQRCodePage() {
  console.log('QR 코드 페이지 초기화');
  
  // 실제 로직은 qrcode.js에서 구현
  safeImport('pages/qrcode').catch(error => {
    console.error('QR 코드 페이지 모듈 로드 실패:', error);
  });
}

/**
 * 타이머 페이지 초기화
 * @private
 */
function initTimerPage() {
  console.log('타이머 페이지 초기화');
  
  // 실제 로직은 timer.js에서 구현
  safeImport('pages/timer').catch(error => {
    console.error('타이머 페이지 모듈 로드 실패:', error);
  });
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

/**
 * 파일 변환기 초기화
 * @private
 * @async
 */
async function initFileConverter() {
  try {
    console.log('파일 변환기 모듈 로드 시도');
    
    // PathUtils를 사용하여 파일 변환기 모듈 로드
    const module = await PathUtils.importModule('converters/file-converter');
    
    if (!module || !module.default) {
      console.error('파일 변환기 모듈을 찾을 수 없습니다');
      return null;
    }
    
    const fileConverter = module.default;
    
    try {
      await fileConverter.init();
      console.log('파일 변환기가 성공적으로 초기화되었습니다');
      return fileConverter;
    } catch (error) {
      console.error('파일 변환기 초기화 실패:', error);
      return null;
    }
  } catch (error) {
    console.error('파일 변환기 모듈 로드 실패:', error);
    return null;
  }
}

/**
 * QR 코드 생성기 초기화
 * @private
 * @async
 */
async function initQRGenerator() {
  try {
    console.log('QR 생성기 모듈 로드 시도');
    
    // PathUtils를 사용하여 QR 생성기 모듈 로드
    const module = await PathUtils.importModule('qr-generator/qr-generator');
    
    if (!module || !module.default) {
      console.error('QR 생성기 모듈을 찾을 수 없습니다');
      return null;
    }
    
    const qrGenerator = module.default;
    
    try {
      await qrGenerator.init();
      console.log('QR 생성기가 성공적으로 초기화되었습니다');
      return qrGenerator;
    } catch (error) {
      console.error('QR 생성기 초기화 실패:', error);
      return null;
    }
  } catch (error) {
    console.error('QR 생성기 모듈 로드 실패:', error);
    return null;
  }
}

/**
 * 모듈 안전 로드 헬퍼 함수
 * @param {string} modulePath - 모듈 경로
 * @returns {Promise<any>} - 로드된 모듈
 */
async function safeImport(modulePath) {
  try {
    const fullPath = `/assets/js/${modulePath}.js`;
    const module = await import(fullPath);
    return module.default || module;
  } catch (error) {
    console.error(`모듈 로드 실패: ${modulePath}`, error);
    throw error;
  }
}

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
    // 기본 URL 구성
    let targetUrl = url;
    
    // 상대 경로인 경우 현재 언어 경로 유지
    if (!url.startsWith('http') && !url.startsWith('/')) {
      // 현재 언어 코드 가져오기
      const currentLang = I18nUtils.currentLang;
      const isDefaultLang = currentLang === I18nUtils.defaultLang;
      
      // 현재 URL 경로 분석
      const currentPath = window.location.pathname;
      const pathParts = currentPath.split('/').filter(part => part);
      
      // 현재 URL에 언어 코드가 포함되어 있는지 확인
      const hasLangInPath = pathParts.length > 0 && CONFIG.supportedLanguages.includes(pathParts[0]);
      
      // 새 URL 구성
      if (hasLangInPath || !isDefaultLang) {
        const langPrefix = hasLangInPath ? pathParts[0] : currentLang;
        // 기본 언어가 아닌 경우에만 언어 코드 추가
        if (langPrefix !== I18nUtils.defaultLang || hasLangInPath) {
          targetUrl = langPrefix + '/' + url;
        }
      }
    }
    
    // URL 열기
    if (newTab) {
      window.open(targetUrl, '_blank');
    } else {
      window.location.href = targetUrl;
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

// 자동 초기화
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', init);
}

// 글로벌 네임스페이스에 등록
if (typeof window !== 'undefined') {
  window.FileToQR = window.FileToQR || {};
  window.FileToQR.appCore = appCore;
  window.FileToQR.initApp = init;
  window.FileToQR.getBasePath = getBasePath;
  window.FileToQR.getCurrentPage = getCurrentPage;
  window.FileToQR.navigateTo = navigateTo;
  window.FileToQR.version = APP_VERSION;
}

// ES 모듈 내보내기
export {
  init as initApp,
  getBasePath,
  getCurrentPage,
  navigateTo,
  APP_VERSION
}; 