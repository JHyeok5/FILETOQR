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
import PathUtils from '../utils/path-utils.js';

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
 * 현재 페이지 식별자 반환
 * @returns {string} 페이지 식별자
 */
function getCurrentPage() {
  try {
    // 페이지 경로를 가져와서 분석
    const path = window.location.pathname;
    
    // 루트 페이지 확인
    if (path === '/' || path.endsWith('/index.html')) return 'home';
    
    // 변환 페이지 확인
    if (path.endsWith('convert.html')) return 'convert';
    
    // QR 코드 페이지 확인
    if (path.endsWith('qrcode.html')) return 'qrcode';
    
    // 도움말 페이지 확인
    if (path.endsWith('help.html')) return 'help';
    
    // 개인정보 처리방침 페이지 확인
    if (path.endsWith('privacy.html')) return 'privacy';
    
    // 이용약관 페이지 확인
    if (path.endsWith('terms.html')) return 'terms';
    
    // 타이머 페이지 확인
    if (path.endsWith('timer.html')) return 'timer';
    
    // 문의하기 페이지 확인
    if (path.endsWith('contact.html')) return 'contact';
    
    // 페이지 식별자를 파일명에서 추출
    const lastSegment = path.split('/').pop().split('.')[0];
    
    // 특정 페이지 식별자 확인
    if (['convert', 'qrcode', 'privacy', 'terms', 'help'].includes(lastSegment)) {
      return lastSegment;
    }
    
    console.warn(`알 수 없는 페이지 경로: ${path}`);
    return 'unknown';
  } catch (error) {
    console.error('getCurrentPage 함수 오류:', error);
    return 'unknown';
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
    
    // 헤더와 푸터 로드
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
 * @private
 * @async
 * @param {number} retryCount - 실패 시 재시도 횟수
 */
async function loadHeaderFooter(retryCount = 3) {
  const headerContainer = document.getElementById('header-container');
  const footerContainer = document.getElementById('footer-container');
  
  if (!headerContainer && !footerContainer) {
    console.warn('헤더/푸터 컨테이너가 DOM에 존재하지 않습니다.');
    return;
  }
  
  console.log('헤더와 푸터 로딩 시작...');
  
  // 헤더 컨테이너에 로딩 상태 클래스 추가
  if (headerContainer) {
    headerContainer.classList.add('header-loading');
    
    // 초기 로딩 시 최소한의 스타일을 갖도록 하는 구조를 예비로 추가 (CSS 로딩 전 단계를 대비)
    if (!headerContainer.querySelector('nav')) {
      headerContainer.innerHTML = `
        <nav>
          <div class="logo">
            <a href="index.html">FileToQR</a>
          </div>
          <ul class="nav-links">
            <li><a href="index.html" class="active">홈</a></li>
            <li><a href="convert.html">파일 변환</a></li>
            <li><a href="qrcode.html">QR 코드</a></li>
            <li><a href="timer.html">타이머</a></li>
            <li><a href="help.html">도움말</a></li>
          </ul>
        </nav>
      `;
    }
  }
  
  try {
    // 템플릿 유틸리티 로드
    const TemplateUtils = await loadTemplateUtils();
    
    if (!TemplateUtils) {
      throw new Error('템플릿 유틸리티를 로드할 수 없습니다.');
    }
    
    // 현재 경로에 따라 basePath 설정 - 개선된 방식
    let basePath = '';
    try {
      const path = window.location.pathname;
      console.log(`현재 URL 경로: ${path}`);
      
      // 루트 패턴 일치 체크 (/, /index.html)
      if (path === '/' || path === '/index.html' || path.endsWith('/index.html')) {
        basePath = './';
      } 
      // 첫 번째 계층 HTML 파일 체크 (/*.html)
      else if (/^\/[^\/]+\.html$/.test(path) || path.match(/[^\/]+\.html$/)) {
        basePath = './';
      }
      // 그 외의 경우 (하위 디렉토리)
      else {
        const pathSegments = path.split('/').filter(Boolean);
        basePath = '../'.repeat(pathSegments.length > 0 ? pathSegments.length : 0);
      }
      
      // 경로가 비어있는 경우 기본값 설정
      if (basePath === '') {
        basePath = './';
      }
      
      console.log(`계산된 basePath: ${basePath}`);
    } catch (pathError) {
      console.warn('경로 계산 중 오류 발생, 기본 경로 사용:', pathError);
      basePath = './'; // 오류 시 기본값
    }
    
    // 헤더와 푸터를 동시에 로드하여 성능 개선
    await Promise.all([
      // 헤더 로드
      (async () => {
        if (headerContainer) {
          console.log('헤더 로드 시도...');
          try {
            // 헤더 로드 시도 - 주 경로
            let headerSuccess = await TemplateUtils.loadComponent('header', headerContainer, basePath, {
              basePath: basePath
            });
            
            // 첫 번째 시도 실패 시 다른 경로 시도
            if (!headerSuccess) {
              console.log('첫 번째 경로로 헤더 로드 실패, 대체 경로 시도...');
              
              // 대체 경로 목록
              const alternativePaths = ['./components/header.html', './header.html', '../components/header.html'];
              
              for (const altPath of alternativePaths) {
                try {
                  console.log(`대체 경로 시도: ${altPath}`);
                  const template = await fetch(altPath)
                    .then(response => response.ok ? response.text() : null)
                    .catch(() => null);
                  
                  if (template) {
                    console.log(`대체 경로에서 헤더 템플릿 로드 성공: ${altPath}`);
                    
                    // 템플릿에서 {{basePath}} 치환
                    const processedTemplate = template.replace(/\{\{basePath\}\}/g, basePath);
                    headerContainer.innerHTML = processedTemplate;
                    headerSuccess = true;
                    break;
                  }
                } catch (altError) {
                  console.warn(`대체 경로 ${altPath}에서 헤더 로드 실패:`, altError);
                }
              }
            }
            
            // 최종 실패 처리
            if (!headerSuccess) {
              console.warn('모든 경로에서 헤더 로드 실패, 하드코딩된 헤더 사용');
              // 대체 헤더 직접 삽입 (blog.html용 링크 포함)
              headerContainer.innerHTML = `
                <header class="bg-white shadow-sm sticky top-0 z-50">
                  <div class="container mx-auto px-4 py-4">
                    <div class="flex justify-between items-center">
                      <a href="index.html" class="flex items-center">
                        <img src="assets/images/logo.svg" alt="FileToQR Logo" class="h-8 mr-2" onerror="this.onerror=null; this.src='data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMjU2M0VCIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIgY2xhc3M9ImZlYXRoZXIgZmVhdGhlci1maWxlIj48cGF0aCBkPSJNMTMgMkgxOEMyMC4yMDkxIDIgMjIgMy43OTA4NiAyMiA2VjE4QzIyIDIwLjIwOTEgMjAuMjA5MSAyMiAxOCAyMkg2QzMuNzkwODYgMjIgMiAyMC4yMDkxIDIgMThWNkMyIDMuNzkwODYgMy43OTA4NiAyIDYgMkgxMFoiPjwvcGF0aD48cGF0aCBkPSJNNyAxNkwxMSAxMkwxNSAxNiI+PC9wYXRoPjxwYXRoIGQ9Ik03IDEyTDExIDhMMTUgMTIiPjwvcGF0aD48L3N2Zz4='; this.classList.add('h-8');">
                        <span class="text-2xl font-bold text-blue-600">FileToQR</span>
                      </a>
                      <nav>
                        <ul class="flex space-x-6">
                          <li><a href="index.html" class="text-gray-700 hover:text-blue-600 font-medium">홈</a></li>
                          <li><a href="convert.html" class="text-gray-700 hover:text-blue-600 font-medium">파일 변환</a></li>
                          <li><a href="qrcode.html" class="text-gray-700 hover:text-blue-600 font-medium">QR 코드</a></li>
                          <li><a href="blog.html" class="text-gray-700 hover:text-blue-600 font-medium">블로그</a></li>
                          <li><a href="help.html" class="text-gray-700 hover:text-blue-600 font-medium">도움말</a></li>
                        </ul>
                      </nav>
                    </div>
                  </div>
                </header>
              `;
            }
            
            // 로딩 상태 클래스 제거
            headerContainer.classList.remove('header-loading');
            // 완료 클래스 추가
            headerContainer.classList.add('header-loaded');
          } catch (headerError) {
            console.error('헤더 로드 중 오류 발생:', headerError);
            // 로딩 상태 클래스 제거
            headerContainer.classList.remove('header-loading');
          }
        }
      })(),
      
      // 푸터 로드
      (async () => {
        if (footerContainer) {
          console.log('푸터 로드 시도...');
          try {
            // 푸터 로드 시도 - 주 경로
            let footerSuccess = await TemplateUtils.loadComponent('footer', footerContainer, basePath, {
              basePath: basePath
            });
            
            // 첫 번째 시도 실패 시 다른 경로 시도
            if (!footerSuccess) {
              console.log('첫 번째 경로로 푸터 로드 실패, 대체 경로 시도...');
              
              // 대체 경로 목록
              const alternativePaths = ['./components/footer.html', './footer.html', '../components/footer.html'];
              
              for (const altPath of alternativePaths) {
                try {
                  console.log(`대체 경로 시도: ${altPath}`);
                  const template = await fetch(altPath)
                    .then(response => response.ok ? response.text() : null)
                    .catch(() => null);
                  
                  if (template) {
                    console.log(`대체 경로에서 푸터 템플릿 로드 성공: ${altPath}`);
                    
                    // 템플릿에서 {{basePath}} 치환
                    const processedTemplate = template.replace(/\{\{basePath\}\}/g, basePath);
                    footerContainer.innerHTML = processedTemplate;
                    footerSuccess = true;
                    break;
                  }
                } catch (altError) {
                  console.warn(`대체 경로 ${altPath}에서 푸터 로드 실패:`, altError);
                }
              }
            }
            
            // 최종 실패 처리
            if (!footerSuccess) {
              console.warn('모든 경로에서 푸터 로드 실패, 하드코딩된 푸터 사용');
              // 대체 푸터 직접 삽입
              footerContainer.innerHTML = `
                <footer class="bg-gray-100 mt-12">
                  <div class="container mx-auto px-4 py-8">
                    <div class="grid md:grid-cols-3 gap-8">
                      <div>
                        <h3 class="text-lg font-bold mb-4">FileToQR</h3>
                        <p class="text-gray-600 mb-4">서버에 파일을 업로드하지 않고 브라우저에서 직접 파일을 변환하고 QR 코드를 생성하세요.</p>
                      </div>
                      <div>
                        <h3 class="text-lg font-bold mb-4">바로가기</h3>
                        <ul class="space-y-2">
                          <li><a href="index.html" class="text-gray-600 hover:text-blue-600">홈</a></li>
                          <li><a href="convert.html" class="text-gray-600 hover:text-blue-600">파일 변환</a></li>
                          <li><a href="qrcode.html" class="text-gray-600 hover:text-blue-600">QR 코드 생성</a></li>
                          <li><a href="timer.html" class="text-gray-600 hover:text-blue-600">타이머</a></li>
                          <li><a href="blog.html" class="text-gray-600 hover:text-blue-600">블로그</a></li>
                          <li><a href="help.html" class="text-gray-600 hover:text-blue-600">도움말</a></li>
                        </ul>
                      </div>
                      <div>
                        <h3 class="text-lg font-bold mb-4">법적 정보</h3>
                        <ul class="space-y-2">
                          <li><a href="privacy.html" class="text-gray-600 hover:text-blue-600">개인정보 처리방침</a></li>
                          <li><a href="terms.html" class="text-gray-600 hover:text-blue-600">이용약관</a></li>
                        </ul>
                      </div>
                    </div>
                    <div class="border-t border-gray-200 mt-8 pt-6 text-center text-gray-500">
                      <p>&copy; 2025 FileToQR. All rights reserved.</p>
                      <p class="mt-1">최종 업데이트: 2025년 5월 2일</p>
                    </div>
                  </div>
                </footer>
              `;
            }
          } catch (footerError) {
            console.error('푸터 로드 중 오류 발생:', footerError);
          }
        }
      })()
    ]);
  } catch (error) {
    console.error('헤더/푸터 로드 중 오류 발생:', error);
    
    // 로딩 상태 클래스 제거
    if (headerContainer) {
      headerContainer.classList.remove('header-loading');
    }
    
    // 재시도 로직
    if (retryCount > 0) {
      console.log(`헤더/푸터 로드 재시도... (남은 시도: ${retryCount})`);
      setTimeout(() => loadHeaderFooter(retryCount - 1), 1000);
    } else {
      console.error('헤더/푸터 로드 최대 재시도 횟수 초과');
      
      // 대체 헤더/푸터 사용
      if (headerContainer && headerContainer.innerHTML === '') {
        headerContainer.innerHTML = `
          <header class="bg-white shadow-sm sticky top-0 z-50">
            <div class="container mx-auto px-4 py-4">
              <div class="flex justify-between items-center">
                <a href="index.html" class="flex items-center">
                  <img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMjU2M0VCIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIgY2xhc3M9ImZlYXRoZXIgZmVhdGhlci1maWxlIj48cGF0aCBkPSJNMTMgMkgxOEMyMC4yMDkxIDIgMjIgMy43OTA4NiAyMiA2VjE4QzIyIDIwLjIwOTEgMjAuMjA5MSAyMiAxOCAyMkg2QzMuNzkwODYgMjIgMiAyMC4yMDkxIDIgMThWNkMyIDMuNzkwODYgMy43OTA4NiAyIDYgMkgxMFoiPjwvcGF0aD48cGF0aCBkPSJNNyAxNkwxMSAxMkwxNSAxNiI+PC9wYXRoPjxwYXRoIGQ9Ik03IDEyTDExIDhMMTUgMTIiPjwvcGF0aD48L3N2Zz4=" alt="FileToQR Logo" class="h-8 mr-2">
                  <span class="text-2xl font-bold text-blue-600">FileToQR</span>
                </a>
                <nav>
                  <ul class="flex space-x-6">
                    <li><a href="index.html" class="text-gray-700 hover:text-blue-600 font-medium">홈</a></li>
                    <li><a href="convert.html" class="text-gray-700 hover:text-blue-600 font-medium">파일 변환</a></li>
                    <li><a href="qrcode.html" class="text-gray-700 hover:text-blue-600 font-medium">QR 코드</a></li>
                    <li><a href="blog.html" class="text-gray-700 hover:text-blue-600 font-medium">블로그</a></li>
                    <li><a href="help.html" class="text-gray-700 hover:text-blue-600 font-medium">도움말</a></li>
                  </ul>
                </nav>
              </div>
            </div>
          </header>
        `;
      }
      
      if (footerContainer && footerContainer.innerHTML === '') {
        footerContainer.innerHTML = `
          <footer class="bg-gray-100 mt-12">
            <div class="container mx-auto px-4 py-8">
              <div class="border-t border-gray-200 mt-8 pt-6 text-center text-gray-500">
                <p>&copy; 2025 FileToQR. All rights reserved.</p>
              </div>
            </div>
          </footer>
        `;
      }
    }
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
 * 현재 페이지에 따라 적절한 초기화 로직 실행
 * @param {string} page - 초기화할 페이지 식별자
 * @private
 */
async function initPageSpecific(page) {
  console.log(`페이지별 초기화 시작: ${page}`);
  
  try {
    switch (page) {
      case 'home':
        // 홈 페이지 초기화
        await initHomePage();
        break;
        
      case 'convert':
        // 변환 페이지 초기화
        await initConvertPage();
        break;
        
      case 'qrcode':
        // QR 코드 페이지 초기화
        await initQRCodePage();
        break;
        
      case 'help':
        // 도움말 페이지 초기화
        initHelpPage();
        break;
        
      case 'privacy':
      case 'terms':
        // 법적 페이지 초기화
        initLegalPage(page);
        break;
        
      case 'timer':
        // 타이머 페이지 초기화
        await initTimerPage();
        break;
        
      case 'contact':
        // 문의하기 페이지 초기화
        initContactPage();
        break;
        
      default:
        console.log(`정의된 초기화 로직이 없는 페이지: ${page}`);
    }
    
    console.log(`페이지별 초기화 완료: ${page}`);
  } catch (error) {
    console.error(`페이지 초기화 중 오류 발생 (${page}):`, error);
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
    return await PathUtils.importModule(modulePath);
  } catch (error) {
    console.error(`모듈 임포트 실패 (${modulePath}):`, error);
    throw new Error(`모듈 로드 실패: ${modulePath}`);
  }
}

/**
 * 템플릿 유틸리티 로드
 * @returns {Promise<Object>} 템플릿 유틸리티 모듈
 */
async function loadTemplateUtils() {
  try {
    console.log('템플릿 유틸리티 로드 시도 중...');
    
    // PathUtils를 사용하여 템플릿 유틸리티 모듈 로드
    const module = await PathUtils.importModule('utils/template-utils');
    
    if (module && module.default) {
      console.log('템플릿 유틸리티 모듈 로드 성공');
      
      // 템플릿 유틸리티 유효성 확인 (주요 메서드 존재 여부)
      if (typeof module.default.loadComponent === 'function') {
        console.log('유효한 템플릿 유틸리티 모듈 확인됨');
        
        // 모듈을 글로벌 네임스페이스에 등록 (필요시)
        if (typeof window !== 'undefined') {
          window.FileToQR = window.FileToQR || {};
          window.FileToQR.TemplateUtils = module.default;
        }
        
        return module.default;
      } else {
        console.warn('로드된 모듈이 예상된 템플릿 유틸리티 인터페이스를 구현하지 않음');
      }
    }
    
    throw new Error('템플릿 유틸리티 모듈을 로드할 수 없습니다.');
  } catch (error) {
    console.error('템플릿 유틸리티 로드 실패:', error);
    return null;
  }
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

// 하위 호환성을 위한 전역 참조
if (typeof window !== 'undefined') {
  window.FileToQR = window.FileToQR || {};
  window.FileToQR.appCore = appCore;
}

export default appCore; 