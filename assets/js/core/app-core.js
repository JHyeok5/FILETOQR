/**
 * app-core.js - FileToQR 애플리케이션 코어 모듈
 * 버전: 1.2.0
 * 최종 업데이트: 2023-06-15
 * 참조: ../.ai-guides/architecture/module-registry.md
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
import ModuleLoader from '@utils/module-loader.js';
import UrlUtils from '@utils/url-utils.js';
import registry from '@core/registry.js';

// registry는 동적으로 로드
let registry = null;

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
  UrlUtils
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
    // registry 동적 로드
    const registryModule = await import('../registry.js');
    registry = registryModule.default;
    
    // 모듈 로더 초기화
    initModuleLoader();
    
    // 레지스트리 초기화
    initRegistry();
    
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
  // 핵심 모듈만 등록 - 나머지는 registry.js에서 통합 관리
  ModuleLoader.registerModule('app-core', '/assets/js/core/app-core.js', []);
  ModuleLoader.registerModule('url-utils', '/assets/js/utils/url-utils.js', []);
  ModuleLoader.registerModule('module-loader', '/assets/js/utils/module-loader.js', []);
  ModuleLoader.registerModule('registry', '/assets/js/registry.js', ['app-core']);
  
  console.log('모듈 로더 초기화 완료');
}

/**
 * 모듈 레지스트리 초기화
 * @private
 */
function initRegistry() {
  if (registry) {
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
 * 헤더, 푸터 등 모든 페이지에서 공통으로 사용되는 UI 컴포넌트 초기화
 * @private
 * @async
 */
async function initCommonUI() {
  try {
    // 헤더와 푸터 로드
    const headerContainer = document.getElementById('header-container');
    const footerContainer = document.getElementById('footer-container');
    
    // 템플릿 유틸리티 확인
    const templateUtils = (typeof window !== 'undefined' && window.FileToQR && window.FileToQR.TemplateUtils) ? 
      window.FileToQR.TemplateUtils : null;
    
    if (templateUtils) {
      // 헤더 로드
      if (headerContainer) {
        await templateUtils.loadComponent('header', headerContainer);
      }
      
      // 푸터 로드
      if (footerContainer) {
        await templateUtils.loadComponent('footer', footerContainer);
      }
    } else {
      console.warn('템플릿 유틸리티를 찾을 수 없습니다.');
    }
  } catch (error) {
    console.error('공통 UI 컴포넌트 초기화 실패:', error);
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
 * 현재 페이지에 맞는 초기화 로직 실행
 * @private
 * @async
 * @param {string} page - 페이지 식별자
 */
async function initPageSpecific(page) {
  console.log(`페이지 초기화: ${page}`);
  
  switch (page) {
    case 'home':
      initHomePage();
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
  // 기능 애니메이션
  initFeatureAnimation();
  
  // 예제 슬라이더
  initExampleSlider();
  
  // 시작하기 버튼 이벤트 리스너
  const getStartedBtns = document.querySelectorAll('.get-started-btn');
  getStartedBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      window.location.href = '/convert.html';
    });
  });
}

/**
 * 기능 애니메이션 초기화
 * @private
 */
function initFeatureAnimation() {
  const features = document.querySelectorAll('.feature');
  
  // 기능 요소가 화면에 나타날 때 애니메이션 적용
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animated');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });
  
  features.forEach(feature => {
    observer.observe(feature);
  });
}

/**
 * 예제 슬라이더 초기화
 * @private
 */
function initExampleSlider() {
  const slider = document.querySelector('.example-slider');
  const slides = document.querySelectorAll('.example-slide');
  const prevBtn = document.querySelector('.slider-prev');
  const nextBtn = document.querySelector('.slider-next');
  const dots = document.querySelector('.slider-dots');
  
  if (!slider || slides.length === 0) return;
  
  let currentSlide = 0;
  let slideInterval;
  
  // 슬라이더 자동 재생
  const startSlider = () => {
    slideInterval = setInterval(() => {
      navigateSlider(1);
    }, 5000);
  };
  
  // 슬라이더 정지
  const stopSlider = () => {
    clearInterval(slideInterval);
  };
  
  // 인디케이터 점 생성
  if (dots) {
    for (let i = 0; i < slides.length; i++) {
      const dot = document.createElement('span');
      dot.classList.add('slider-dot');
      if (i === 0) dot.classList.add('active');
      dot.addEventListener('click', () => {
        showSlide(i);
      });
      dots.appendChild(dot);
    }
  }
  
  // 슬라이더 제어 버튼
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      navigateSlider(-1);
    });
  }
  
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      navigateSlider(1);
    });
  }
  
  // 슬라이더 시작
  startSlider();
  
  // 마우스 호버 시 슬라이더 일시 정지
  slider.addEventListener('mouseenter', stopSlider);
  slider.addEventListener('mouseleave', startSlider);
}

/**
 * 슬라이더 탐색
 * @private
 * @param {number} direction - 이동 방향 (1: 다음, -1: 이전)
 */
function navigateSlider(direction) {
  const slides = document.querySelectorAll('.example-slide');
  const dots = document.querySelectorAll('.slider-dot');
  
  if (slides.length === 0) return;
  
  // 현재 슬라이드 숨기기
  slides[currentSlide].classList.remove('active');
  if (dots.length > 0) {
    dots[currentSlide].classList.remove('active');
  }
  
  // 다음/이전 슬라이드 인덱스 계산
  currentSlide = (currentSlide + direction + slides.length) % slides.length;
  
  // 새 슬라이드 표시
  slides[currentSlide].classList.add('active');
  if (dots.length > 0) {
    dots[currentSlide].classList.add('active');
  }
}

/**
 * 특정 슬라이드 표시
 * @private
 * @param {number} index - 표시할 슬라이드 인덱스
 */
function showSlide(index) {
  const slides = document.querySelectorAll('.example-slide');
  const dots = document.querySelectorAll('.slider-dot');
  
  if (index < 0 || index >= slides.length) return;
  
  // 현재 슬라이드 숨기기
  slides[currentSlide].classList.remove('active');
  if (dots.length > 0) {
    dots[currentSlide].classList.remove('active');
  }
  
  // 새 슬라이드 표시
  currentSlide = index;
  slides[currentSlide].classList.add('active');
  if (dots.length > 0) {
    dots[currentSlide].classList.add('active');
  }
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

// 앱 자동 초기화 (index.html과 같은 진입점에서 직접 호출해도 됨)
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// 하위 호환성을 위한 전역 참조
if (typeof window !== 'undefined') {
  window.FileToQR = window.FileToQR || {};
  window.FileToQR.appCore = appCore;
}

export default appCore; 