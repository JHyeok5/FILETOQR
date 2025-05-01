/**
 * app-core.js - FileToQR 애플리케이션 코어 모듈
 * 버전: 1.0.1
 * 최종 업데이트: 2025-06-15
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
 */

// 코어 유틸리티 임포트
import ModuleLoader from '../utils/module-loader.js';
import UrlUtils from '../utils/url-utils.js';

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
    home: '/',
    convert: '/convert.html',
    qrcode: '/qrcode.html',
    privacy: '/privacy.html',
    terms: '/terms.html',
    help: '/help.html'
  }
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

/**
 * 앱 초기화
 * 전체 애플리케이션 초기화 프로세스를 담당
 * @async
 */
async function init() {
  if (isInitialized) {
    console.warn('앱이 이미 초기화되었습니다.');
    return;
  }

  console.log('FileToQR 앱 초기화 중...');
  
  try {
    // registry 초기화 (지연 로딩)
    await initRegistry();
    
    // 글로벌 네임스페이스에 등록 (하위 호환성)
    if (typeof window !== 'undefined' && registry) {
      window.FileToQR = window.FileToQR || {};
      window.FileToQR.registry = registry;
    }
    
    // 모듈 로더 초기화
    initModuleLoader();
    
    // 레지스트리 초기화
    await ensureRegistryInitialized();
    
    // URL 표준화
    standardizeUrls();
    
    // 컴포넌트 시스템 초기화
    await initComponentSystem();
    
    // 공통 UI 컴포넌트 초기화
    await initCommonUI();
    
    // 다크 모드 토글 초기화
    initDarkModeToggle();
    
    // 현재 페이지 초기화
    const currentPage = getCurrentPage();
    await initPageSpecific(currentPage);
    
    // 이벤트 리스너 등록
    registerEventListeners();
    
    isInitialized = true;
    console.log('FileToQR 앱 초기화 완료');
  } catch (error) {
    console.error('앱 초기화 중 오류 발생:', error);
  }
}

/**
 * 현재 페이지 식별 함수
 * @returns {string} 페이지 식별자
 */
function getCurrentPage() {
  const path = window.location.pathname;
  
  // URL 패턴 정규화
  if (path.endsWith('/') || path === '') return 'home';
  if (path.endsWith('index.html')) return 'home';
  if (path.endsWith('convert.html')) return 'convert';
  if (path.endsWith('qrcode.html')) return 'qrcode';
  if (path.endsWith('privacy.html')) return 'privacy';
  if (path.endsWith('terms.html')) return 'terms';
  if (path.endsWith('help.html')) return 'help';
  
  // 확장자 없는 URL 처리
  const pathWithoutExtension = path.split('.')[0];
  const segments = pathWithoutExtension.split('/').filter(Boolean);
  if (segments.length > 0) {
    const lastSegment = segments[segments.length - 1];
    if (['convert', 'qrcode', 'privacy', 'terms', 'help'].includes(lastSegment)) {
      return lastSegment;
    }
  }
  
  return 'other';
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
  
  // registry 모듈은 app-core 의존성에서 제외하고 별도 등록
  ModuleLoader.registerModule('registry', '/assets/js/registry.js', []);
  
  console.log('모듈 로더 초기화 완료');
}

/**
 * 레지스트리 초기화 확인
 * @private
 * @async
 */
async function ensureRegistryInitialized() {
  if (!registry) {
    await initRegistry();
  }
  
  if (registry) {
    // 레지스트리가 이미 초기화되었는지 확인
    if (!registry.isInitialized()) {
      registry.setInitialized(true);
    }
    console.log('모듈 레지스트리 초기화 완료');
  } else {
    console.warn('모듈 레지스트리가 로드되지 않았습니다. registry.js 파일을 확인하세요.');
  }
}

/**
 * URL 표준화 적용
 * @private
 */
function standardizeUrls() {
  // 모든 내부 링크 표준화
  UrlUtils.standardizeLinks(CONFIG.linkStandardization.includeExtension);
  console.log('URL 표준화 완료');
}

/**
 * 컴포넌트 시스템 초기화
 * @private
 * @async
 * @returns {boolean} 초기화 성공 여부
 */
async function initComponentSystem() {
  try {
    console.log('컴포넌트 시스템 초기화 중...');
    
    // 새로운 컴포넌트 시스템 모듈 로드
    const ComponentSystem = await import('../core/component-system.js').then(module => module.default);
    const VersionManager = await import('../utils/version-manager.js').then(module => module.default);
    const TemplateUtils = await import('../utils/template-utils.js').then(module => module.default);
    
    // 글로벌 네임스페이스에 등록 (하위 호환성)
    if (typeof window !== 'undefined') {
      window.FileToQR = window.FileToQR || {};
      window.FileToQR.ComponentSystem = ComponentSystem;
      window.FileToQR.VersionManager = VersionManager;
      window.FileToQR.TemplateUtils = TemplateUtils;
    }
    
    // 버전 등록
    VersionManager.registerVersion('component-system', '1.0.0');
    VersionManager.registerVersion('template-utils', '1.0.0');
    
    // UI 컴포넌트 모듈 로드 및 초기화
    const UIComponents = await import('../ui/ui-components.js').then(module => module.default);
    if (typeof window !== 'undefined') {
      window.FileToQR.UIComponents = UIComponents;
    }
    UIComponents.init();
    
    console.log('컴포넌트 시스템 초기화 완료');
    
    // 전역 컴포넌트 컨테이너 추가
    ensureComponentContainer();
    
    // 자주 사용되는 전역 컴포넌트 초기화
    initGlobalComponents();
    
    return true;
  } catch (error) {
    console.error('컴포넌트 시스템 초기화 실패:', error);
    return false;
  }
}

/**
 * 컴포넌트 컨테이너 생성 확인
 * 전역 컴포넌트를 위한 컨테이너를 확인하고 필요시 생성
 * @private
 * @returns {HTMLElement} 컴포넌트 컨테이너 요소
 */
function ensureComponentContainer() {
  let container = document.getElementById('global-components');
  
  if (!container) {
    container = document.createElement('div');
    container.id = 'global-components';
    container.style.position = 'fixed';
    container.style.zIndex = '9000';
    container.style.pointerEvents = 'none'; // 기본적으로 클릭 이벤트를 무시하고 하위로 전달
    document.body.appendChild(container);
  }
  
  globalComponentContainer = container;
  
  if (typeof window !== 'undefined') {
    window.FileToQR = window.FileToQR || {};
    window.FileToQR.globalComponentContainer = container;
  }
  
  return container;
}

/**
 * 전역 컴포넌트 초기화
 * 알림, 토스트, 모달 등 전역에서 접근 가능한 컴포넌트 생성
 * @private
 */
function initGlobalComponents() {
  const container = globalComponentContainer;
  
  // 전역 컴포넌트 컨테이너가 없으면 생성 중단
  if (!container) {
    console.warn('전역 컴포넌트 컨테이너가 없습니다. ensureComponentContainer() 함수를 먼저 호출하세요.');
    return;
  }
  
  // 알림 시스템이 있는 경우 초기화
  try {
    if (typeof window !== 'undefined' && window.FileToQR && window.FileToQR.Notification) {
      window.FileToQR.Notification.init(container);
    }
  } catch (error) {
    console.warn('알림 시스템 초기화 실패:', error);
  }
  
  // 토스트 시스템이 있는 경우 초기화
  try {
    if (typeof window !== 'undefined' && window.FileToQR && window.FileToQR.Toast) {
      window.FileToQR.Toast.init(container);
    }
  } catch (error) {
    console.warn('토스트 시스템 초기화 실패:', error);
  }
  
  // 모달 시스템이 있는 경우 초기화
  try {
    if (typeof window !== 'undefined' && window.FileToQR && window.FileToQR.Modal) {
      window.FileToQR.Modal.init(container);
    }
  } catch (error) {
    console.warn('모달 시스템 초기화 실패:', error);
  }
}

/**
 * 공통 UI 컴포넌트 초기화
 * @async
 * @private
 */
async function initCommonUI() {
  try {
    console.log('공통 UI 컴포넌트 초기화 중...');
    
    // 헤더 푸터 로드
    await loadHeaderFooter();
    
    console.log('공통 UI 컴포넌트 초기화 완료');
    return true;
  } catch (error) {
    console.error('공통 UI 컴포넌트 초기화 실패:', error);
    return false;
  }
}

/**
 * 헤더와 푸터 로드
 * @async
 * @private
 * @param {number} retryCount - 재시도 횟수 (기본값: 3)
 * @returns {Promise<boolean>} 로드 성공 여부
 */
async function loadHeaderFooter(retryCount = 3) {
  // DOM 요소 확인
  const headerContainer = document.getElementById('header-container');
  const footerContainer = document.getElementById('footer-container');
  
  // 요소가 없으면 중단
  if (!headerContainer && !footerContainer) {
    console.warn('헤더/푸터 컨테이너를 찾을 수 없습니다.');
    return false;
  }
  
  try {
    // 템플릿 유틸리티 로드
    const TemplateUtils = await loadTemplateUtils();
    
    if (!TemplateUtils) {
      throw new Error('템플릿 유틸리티를 로드할 수 없습니다.');
    }
    
    let success = true;
    
    // 헤더 로드
    if (headerContainer) {
      console.log('헤더 컴포넌트 로드 중...');
      const headerSuccess = await TemplateUtils.loadComponent('header', headerContainer);
      
      if (!headerSuccess) {
        console.warn('헤더 컴포넌트 로드 실패');
        success = false;
      } else {
        console.log('헤더 컴포넌트 로드 완료');
      }
    }
    
    // 푸터 로드
    if (footerContainer) {
      console.log('푸터 컴포넌트 로드 중...');
      const footerSuccess = await TemplateUtils.loadComponent('footer', footerContainer);
      
      if (!footerSuccess) {
        console.warn('푸터 컴포넌트 로드 실패');
        success = false;
      } else {
        console.log('푸터 컴포넌트 로드 완료');
      }
    }
    
    // 하나라도 실패했고 재시도 횟수가 남아있으면 재시도
    if (!success && retryCount > 0) {
      console.log(`헤더/푸터 로드 재시도 (남은 시도: ${retryCount})...`);
      setTimeout(() => loadHeaderFooter(retryCount - 1), 300);
      return false;
    }
    
    return success;
  } catch (error) {
    console.error('헤더/푸터 로드 중 오류 발생:', error);
    
    // 재시도 횟수가 남아있으면 재시도
    if (retryCount > 0) {
      console.log(`헤더/푸터 로드 재시도 (남은 시도: ${retryCount})...`);
      setTimeout(() => loadHeaderFooter(retryCount - 1), 300);
      return false;
    }
    
    return false;
  }
}

/**
 * 다크 모드 토글 초기화
 * @private
 */
function initDarkModeToggle() {
  const darkModeToggle = document.getElementById('dark-mode-toggle');
  if (darkModeToggle) {
    darkModeToggle.addEventListener('click', toggleDarkMode);
  }
}

/**
 * 페이지별 초기화
 * @private
 * @async
 * @param {string} page - 페이지 식별자
 */
async function initPageSpecific(page) {
  console.log(`페이지 초기화: ${page}`);
  
  switch (page) {
    case 'home':
      try {
        // 상대 경로 사용으로 변경
        const homePage = await import('../pages/home.js').then(module => module.default);
        if (homePage && typeof homePage.init === 'function') {
          homePage.init();
        } else {
          console.warn('홈페이지 모듈을 찾을 수 없거나 초기화 메서드가 없습니다. 기본 초기화를 사용합니다.');
          initHomePage();
        }
      } catch (error) {
        console.error('홈페이지 모듈 초기화 실패:', error);
        // 폴백: 기본 홈페이지 초기화 사용
        initHomePage();
      }
      break;
      
    case 'convert':
      // 파일 변환기 초기화
      try {
        const fileConverter = await import('../converters/file-converter.js').then(module => module.default);
        if (fileConverter && typeof fileConverter.init === 'function') {
          fileConverter.init();
        } else {
          console.warn('파일 변환기 모듈을 찾을 수 없거나 초기화 메서드가 없습니다.');
        }
      } catch (error) {
        console.error('파일 변환기 초기화 실패:', error);
        // 첫 로드 실패 시 대체 경로 시도
        try {
          const fileConverter = await import('/assets/js/converters/file-converter.js').then(module => module.default);
          if (fileConverter && typeof fileConverter.init === 'function') {
            fileConverter.init();
            console.log('파일 변환기 모듈을 대체 경로로 로드했습니다.');
          }
        } catch (altError) {
          console.error('파일 변환기 모듈 대체 경로 로드도 실패:', altError);
        }
      }
      break;
      
    case 'qrcode':
      // QR 코드 생성기 초기화
      try {
        const qrGenerator = await import('../qr-generator/qr-generator.js').then(module => module.default);
        if (qrGenerator && typeof qrGenerator.init === 'function') {
          qrGenerator.init();
        } else {
          console.warn('QR 코드 생성기 모듈을 찾을 수 없거나 초기화 메서드가 없습니다.');
        }
      } catch (error) {
        console.error('QR 코드 생성기 초기화 실패:', error);
        // 첫 로드 실패 시 대체 경로 시도
        try {
          const qrGenerator = await import('/assets/js/qr-generator/qr-generator.js').then(module => module.default);
          if (qrGenerator && typeof qrGenerator.init === 'function') {
            qrGenerator.init();
            console.log('QR 코드 생성기 모듈을 대체 경로로 로드했습니다.');
          }
        } catch (altError) {
          console.error('QR 코드 생성기 모듈 대체 경로 로드도 실패:', altError);
        }
      }
      break;
      
    case 'privacy':
    case 'terms':
    case 'help':
      // 정적 페이지에 특별한 초기화가 필요하지 않음
      break;
      
    default:
      console.log(`알 수 없는 페이지 유형: ${page}`);
      break;
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
    btn.addEventListener('click', () => {
      window.location.href = '/convert.html';
    });
  });
}

/**
 * 이벤트 리스너 등록
 * @private
 */
function registerEventListeners() {
  // 창 크기 변경 이벤트
  window.addEventListener('resize', handleResize);
  
  // 스크롤 이벤트
  window.addEventListener('scroll', handleScroll);
  
  // 다크 모드 변경 감지
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', ({ matches }) => {
    const darkModeEnabled = localStorage.getItem('darkMode') === 'enabled';
    if (matches && !darkModeEnabled) {
      document.body.classList.add('dark-mode');
    } else if (!matches && !darkModeEnabled) {
      document.body.classList.remove('dark-mode');
    }
  });
}

/**
 * 창 크기 변경 이벤트 핸들러
 * @private
 */
function handleResize() {
  // 반응형 UI 조정
  updateResponsiveUI();
}

/**
 * 스크롤 이벤트 핸들러
 * @private
 */
function handleScroll() {
  // 스크롤 기반 UI 업데이트
  updateScrollBasedUI();
}

/**
 * 반응형 UI 업데이트
 * @private
 */
function updateResponsiveUI() {
  // 화면 크기에 따른 UI 요소 조정
  const isMobile = window.innerWidth < 768;
  const header = document.querySelector('header');
  
  if (header) {
    if (isMobile) {
      header.classList.add('mobile');
    } else {
      header.classList.remove('mobile');
    }
  }
}

/**
 * 스크롤 기반 UI 업데이트
 * @private
 */
function updateScrollBasedUI() {
  // 스크롤 위치에 따른 UI 업데이트
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  const header = document.querySelector('header');
  
  if (header) {
    if (scrollTop > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  }
  
  // 맨 위로 스크롤 버튼 표시/숨김
  const scrollTopBtn = document.getElementById('scroll-to-top');
  if (scrollTopBtn) {
    if (scrollTop > 300) {
      scrollTopBtn.classList.add('visible');
    } else {
      scrollTopBtn.classList.remove('visible');
    }
  }
}

/**
 * 다크 모드 토글
 * @private
 */
function toggleDarkMode() {
  const body = document.body;
  
  if (body.classList.contains('dark-mode')) {
    body.classList.remove('dark-mode');
    localStorage.setItem('darkMode', 'disabled');
  } else {
    body.classList.add('dark-mode');
    localStorage.setItem('darkMode', 'enabled');
  }
}

/**
 * 특정 페이지로 이동
 * @param {string} page - 이동할 페이지 식별자
 * @param {Object} params - URL 파라미터 (선택사항)
 */
function navigateTo(page, params = {}) {
  const route = CONFIG.routes[page];
  
  if (!route) {
    console.warn(`알 수 없는 페이지: ${page}`);
    return;
  }
  
  let url = route;
  
  // URL 파라미터 추가
  if (Object.keys(params).length > 0) {
    const urlParams = new URLSearchParams();
    
    for (const [key, value] of Object.entries(params)) {
      urlParams.append(key, value);
    }
    
    url = `${url}?${urlParams.toString()}`;
  }
  
  window.location.href = url;
}

/**
 * 페이지 로딩 완료 시 초기화 수행
 * @private
 */
document.addEventListener('DOMContentLoaded', async function() {
  console.log('app-core.js 로드됨 - 초기화 시작...');
  try {
    // 초기화 함수 호출
    await init();
    console.log('앱 초기화 완료');
  } catch (error) {
    console.error('앱 초기화 실패:', error);
  }
});

/**
 * 모듈을 안전하게 임포트하는 함수
 * @param {string} modulePath - 임포트할 모듈 경로
 * @returns {Promise<Object>} 임포트된 모듈
 */
async function safeImport(modulePath) {
  try {
    // 경로가 /로 시작하는지 확인 (절대 경로)
    if (modulePath.startsWith('/')) {
      // 앞의 / 제거
      modulePath = modulePath.substring(1);
    }
    
    // 상대 경로인지 확인
    if (!modulePath.startsWith('./') && !modulePath.startsWith('../')) {
      // 상대 경로로 변환
      modulePath = './' + modulePath;
    }
    
    console.log(`모듈 임포트 시도: ${modulePath}`);
    return await import(modulePath);
  } catch (error) {
    console.error(`모듈 임포트 실패 (${modulePath}):`, error);
    
    // 두 번째 시도: 다른 경로 패턴 시도
    try {
      const altPath = modulePath.startsWith('./') 
        ? modulePath.substring(2) // './' 제거
        : './' + modulePath;
      
      console.log(`대체 경로로 모듈 임포트 시도: ${altPath}`);
      return await import(altPath);
    } catch (altError) {
      console.error(`대체 경로 모듈 임포트도 실패 (${modulePath}):`, altError);
      throw new Error(`모듈 로드 실패: ${modulePath}`);
    }
  }
}

/**
 * 템플릿 유틸리티 로드
 * @returns {Promise<Object>} 템플릿 유틸리티 모듈
 */
async function loadTemplateUtils() {
  try {
    // 모듈 경로 목록 (시도할 순서대로)
    const paths = [
      './assets/js/utils/template-utils.js',
      '../utils/template-utils.js',
      '/assets/js/utils/template-utils.js'
    ];
    
    let lastError = null;
    
    // 각 경로 시도
    for (const path of paths) {
      try {
        console.log(`템플릿 유틸리티 로드 시도: ${path}`);
        const module = await import(path);
        console.log('템플릿 유틸리티 로드 성공');
        return module.default;
      } catch (error) {
        console.warn(`경로 ${path}에서 로드 실패:`, error);
        lastError = error;
      }
    }
    
    // 모든 시도 실패
    throw lastError || new Error('템플릿 유틸리티 로드 실패');
  } catch (error) {
    console.error('템플릿 유틸리티 로드 중 오류 발생:', error);
    throw error;
  }
}

// 하위 호환성을 위한 전역 참조
if (typeof window !== 'undefined') {
  window.FileToQR = window.FileToQR || {};
  window.FileToQR.appCore = appCore;
}

export default appCore; 