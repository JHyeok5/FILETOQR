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
    // 1. 로딩 인디케이터 표시
    showLoadingIndicator();
    
    // 2. 템플릿 유틸리티 초기화 (필요한 경우)
    try {
      // 템플릿 유틸리티가 로드되었는지 확인
      if (typeof window.FileToQR.TemplateUtils !== 'undefined') {
        console.log('템플릿 유틸리티 발견, 초기화 시작');
        
        // 동적으로 Handlebars 로드 시도
        if (!window.Handlebars) {
          const handlebarsScript = document.createElement('script');
          handlebarsScript.src = 'https://cdn.jsdelivr.net/npm/handlebars@latest/dist/handlebars.min.js';
          
          // Handlebars 로드 대기
          await new Promise((resolve, reject) => {
            handlebarsScript.onload = resolve;
            handlebarsScript.onerror = reject;
            document.head.appendChild(handlebarsScript);
          });
          
          console.log('Handlebars 라이브러리 동적 로드 완료');
        }
        
        await window.FileToQR.TemplateUtils.init();
        console.log('템플릿 유틸리티 초기화 완료');
        
        // 템플릿 처리
        await window.FileToQR.TemplateUtils.processTemplates();
      }
    } catch (error) {
      console.error('템플릿 유틸리티 초기화 실패:', error);
      // 계속 진행 - 템플릿 없이도 기본 기능은 작동할 수 있도록
    }
    
    // 3. 페이지별 초기화
    await initCurrentPage();
    
    // 4. 로딩 인디케이터 숨기기 - 즉시 호출로 수정
    console.log('초기화 완료 - 로딩 인디케이터 숨김');
    hideLoadingIndicator();
    
    // 5. 초기화 완료 후 추가 작업 실행
    onAppInitialized();
    
    console.log('애플리케이션 초기화 완료');
  } catch (error) {
    console.error('애플리케이션 초기화 실패:', error);
    // 로딩 인디케이터 숨기기
    hideLoadingIndicator();
    // 오류 메시지 표시
    showErrorMessage('애플리케이션 초기화 중 오류가 발생했습니다.');
  }
}

/**
 * 로딩 인디케이터 표시
 */
function showLoadingIndicator() {
  // 이미 존재하는 로딩 인디케이터 확인
  let loadingIndicator = document.getElementById('loading-indicator');
  
  // 없는 경우만 생성
  if (!loadingIndicator) {
    loadingIndicator = document.createElement('div');
    loadingIndicator.id = 'loading-indicator';
    loadingIndicator.className = 'loading-overlay';
    loadingIndicator.innerHTML = `
      <div class="loading-container">
        <div class="loading-spinner"></div>
        <p class="loading-text">로딩 중... 페이지가 로드되지 않으면 새로고침하세요.</p>
      </div>
    `;
    
    // 스타일 추가
    const style = document.createElement('style');
    style.textContent = `
      .loading-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(255, 255, 255, 0.9);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 9999;
        transition: opacity 0.5s;
      }
      .loading-overlay.fade-out {
        opacity: 0;
      }
      .loading-container {
        text-align: center;
        padding: 2rem;
        background-color: white;
        border-radius: 0.5rem;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      }
      .loading-spinner {
        display: inline-block;
        width: 40px;
        height: 40px;
        border: 4px solid rgba(66, 153, 225, 0.2);
        border-radius: 50%;
        border-top-color: #4299e1;
        animation: spin 1s ease-in-out infinite;
        margin-bottom: 1rem;
      }
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
      .loading-text {
        color: #4a5568;
        font-size: 1rem;
        margin: 0;
      }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(loadingIndicator);
  }
}

/**
 * 로딩 인디케이터 숨기기
 */
function hideLoadingIndicator() {
  const loadingIndicator = document.getElementById('loading-indicator');
  if (loadingIndicator) {
    console.log('로딩 인디케이터 숨기기 실행');
    // 즉시 제거로 변경
    if (loadingIndicator.parentNode) {
      loadingIndicator.parentNode.removeChild(loadingIndicator);
      console.log('로딩 인디케이터 제거 완료');
    }
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
  
  // convert.js 스크립트 로드 상태 확인
  const convertScripts = Array.from(document.scripts).filter(script => 
    script.src && (script.src.includes('/convert.js') || script.src.includes('convert.bundle.js'))
  );
  
  if (convertScripts.length === 0) {
    console.warn('convert.js 스크립트를 찾을 수 없습니다. 동적으로 로드합니다.');
    
    // 필요시 동적으로 스크립트 로드
    const script = document.createElement('script');
    script.src = 'assets/js/pages/convert.js';
    script.type = 'module';
    document.head.appendChild(script);
    
    // 스크립트 로드 완료 후 컨트롤러 초기화
    script.onload = function() {
      initConvertPageController();
    };
  } else {
    // 스크립트가 이미 로드된 경우 컨트롤러 초기화
    setTimeout(initConvertPageController, 100);
  }
}

/**
 * 변환 페이지 컨트롤러 초기화 헬퍼 함수
 */
function initConvertPageController() {
  if (window.FileToQR && window.FileToQR.ConvertPageController) {
    console.log('변환 페이지 컨트롤러 초기화 시작');
    window.FileToQR.ConvertPageController.init();
    console.log('변환 페이지 컨트롤러 초기화 완료');
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

/**
 * 템플릿 처리 및 렌더링
 */
function processTemplates() {
  try {
    if (window.Handlebars && window.FileToQR.TemplateUtils) {
      // 템플릿 요소 검색
      const templateElements = document.querySelectorAll('[data-template]');
      console.log(`템플릿 요소 발견: ${templateElements.length}개`);
      
      // 각 템플릿 요소 처리
      templateElements.forEach(element => {
        const templateName = element.getAttribute('data-template');
        const templateData = element.getAttribute('data-template-data');
        
        if (templateName) {
          console.log(`템플릿 렌더링 시도: ${templateName}`);
          
          let data = {};
          
          // 템플릿 데이터 파싱 시도
          if (templateData) {
            try {
              data = JSON.parse(templateData);
            } catch (err) {
              console.error(`템플릿 데이터 JSON 파싱 오류: ${templateName}`, err);
            }
          }
          
          // 현재 페이지 및 언어 정보 추가
          const currentLang = getCurrentLanguage();
          data.pageId = getCurrentPage();
          data.currentLang = currentLang;
          data.basePath = getBasePath();
          
          // 템플릿 렌더링
          window.FileToQR.TemplateUtils.loadComponent(templateName, element, data.basePath, data)
            .then(() => {
              console.log(`템플릿 렌더링 성공: ${templateName}`);
              
              // 렌더링 후 이벤트 발생
              const event = new CustomEvent('template:rendered', {
                detail: { templateName, element }
              });
              document.dispatchEvent(event);
            })
            .catch(err => {
              console.error(`템플릿 렌더링 실패: ${templateName}`, err);
            });
        }
      });
      
      // 인라인 파티셜 처리
      const partialElements = document.querySelectorAll('[data-partial]');
      partialElements.forEach(element => {
        const partialName = element.getAttribute('data-partial');
        const partialData = element.getAttribute('data-partial-data');
        
        if (partialName && window.Handlebars.partials[partialName]) {
          let data = {};
          
          // 파티셜 데이터 파싱 시도
          if (partialData) {
            try {
              data = JSON.parse(partialData);
            } catch (err) {
              console.error(`파티셜 데이터 JSON 파싱 오류: ${partialName}`, err);
            }
          }
          
          // 기본 데이터 추가
          data.currentLang = getCurrentLanguage();
          data.basePath = getBasePath();
          
          // 파티셜 렌더링
          const template = window.Handlebars.partials[partialName];
          const compiledTemplate = typeof template === 'function' ? template : window.Handlebars.compile(template);
          element.innerHTML = compiledTemplate(data);
          
          console.log(`파티셜 렌더링 완료: ${partialName}`);
        }
      });
    }
  } catch (error) {
    console.error('템플릿 처리 중 오류:', error);
  }
}

/**
 * 현재 언어 코드 가져오기
 * @returns {string} 언어 코드
 */
function getCurrentLanguage() {
  // URL에서 언어 코드 추출
  const path = window.location.pathname;
  const pathParts = path.split('/').filter(part => part);
  
  // 첫 번째 경로 세그먼트가 지원 언어인지 확인
  if (pathParts.length > 0 && CONFIG.supportedLanguages.includes(pathParts[0])) {
    return pathParts[0];
  }
  
  // 브라우저 언어 가져오기
  const browserLang = navigator.language || navigator.userLanguage;
  const langCode = browserLang ? browserLang.split('-')[0] : 'ko';
  
  // 지원 언어 확인
  return CONFIG.supportedLanguages.includes(langCode) ? langCode : 'ko';
}

/**
 * 모든 내부 링크를 현재 언어에 맞게 업데이트
 * i18n URL 처리 및 언어 경로 추가
 */
function updateInternalLinks() {
  try {
    console.log('내부 링크 업데이트 시작');
    
    // URL 유틸리티 확인
    const urlUtils = window.FileToQR && window.FileToQR.utils && window.FileToQR.utils.url;
    if (!urlUtils) {
      console.warn('URL 유틸리티를 찾을 수 없어 내부 링크 업데이트를 건너뜁니다.');
      return;
    }
    
    // i18n 모듈 확인
    const i18n = window.FileToQR && window.FileToQR.i18n;
    if (!i18n) {
      console.warn('i18n 모듈을 찾을 수 없어 내부 링크 업데이트를 건너뜁니다.');
      return;
    }
    
    // 현재 언어 및 기본 언어 가져오기
    const currentLang = i18n.getCurrentLang();
    const defaultLang = i18n.getDefaultLang();
    const supportedLangs = i18n.getSupportedLangs();
    
    console.log(`현재 언어: ${currentLang}, 기본 언어: ${defaultLang}`);
    
    // 알려진 내부 페이지 목록
    const internalPages = [
      { key: 'urls.home', path: 'index.html' },
      { key: 'urls.convert', path: 'convert.html' },
      { key: 'urls.qrcode', path: 'qrcode.html' },
      { key: 'urls.timer', path: 'timer.html' },
      { key: 'urls.help', path: 'help.html' },
      { key: 'urls.contact', path: 'contact.html' },
      { key: 'urls.privacy', path: 'privacy.html' },
      { key: 'urls.terms', path: 'terms.html' }
    ];
    
    // 모든 링크 요소 가져오기
    const links = document.querySelectorAll('a');
    
    // 각 링크 처리
    links.forEach(link => {
      const href = link.getAttribute('href');
      if (!href) return;
      
      // 외부 링크는 건너뛰기
      if (href.startsWith('http://') || href.startsWith('https://') || 
          href.startsWith('mailto:') || href.startsWith('tel:') || 
          href.startsWith('#')) {
        return;
      }
      
      // 내부 경로인지 확인
      const pageName = href.endsWith('.html') ? 
        href.substring(0, href.length - 5) : href;
      
      // 기존 페이지 이름과 일치하는지 확인
      const matchedPage = internalPages.find(page => {
        return pageName === page.path.replace('.html', '') || 
               href === page.path;
      });
      
      if (matchedPage) {
        // i18n URL 키를 사용하여 현재 언어에 맞는 URL 생성
        const localizedUrl = urlUtils.getNavUrl(matchedPage.key);
        console.log(`링크 업데이트: ${href} → ${localizedUrl}`);
        link.setAttribute('href', localizedUrl);
      } else {
        // 알려진 내부 페이지가 아닌 경우, 직접 현재 언어 경로 추가
        const newUrl = urlUtils.getI18nUrl(href, currentLang);
        console.log(`직접 경로 추가: ${href} → ${newUrl}`);
        link.setAttribute('href', newUrl);
      }
    });
    
    console.log('내부 링크 업데이트 완료');
  } catch (error) {
    console.error('내부 링크 업데이트 중 오류 발생:', error);
  }
}

/**
 * 애플리케이션 초기화가 완료된 후 추가 설정 및 초기화 작업 수행
 */
function onAppInitialized() {
  try {
    console.log('애플리케이션 초기화 후 추가 작업 시작');
    
    // 1. 내부 링크 업데이트
    updateInternalLinks();
    
    // 2. 언어 선택기 이벤트 핸들러 업데이트
    setupLanguageSelector();
    
    // 3. 기타 필요한 초기화 작업...
    
    console.log('추가 초기화 작업 완료');
  } catch (error) {
    console.error('추가 초기화 작업 중 오류 발생:', error);
  }
}

/**
 * 언어 선택기 이벤트 핸들러 설정
 */
function setupLanguageSelector() {
  try {
    const langLinks = document.querySelectorAll('.lang-option');
    if (langLinks.length === 0) {
      console.log('언어 선택기 요소를 찾을 수 없습니다.');
      return;
    }
    
    console.log(`${langLinks.length}개의 언어 선택 링크 발견`);
    
    // i18n 모듈 확인
    const i18n = window.FileToQR && window.FileToQR.i18n;
    if (!i18n) {
      console.warn('i18n 모듈을 찾을 수 없어 언어 선택기 설정을 건너뜁니다.');
      return;
    }
    
    // 각 언어 링크에 이벤트 핸들러 추가
    langLinks.forEach(link => {
      // 기본 이벤트 방지 및 커스텀 처리를 위해 클릭 이벤트 재설정
      link.addEventListener('click', function(event) {
        event.preventDefault();
        
        const lang = this.getAttribute('data-lang');
        if (lang) {
          console.log(`언어 선택: ${lang}`);
          
          // i18n 모듈을 통해 언어 변경 처리
          i18n.navigateToLanguage(lang);
        }
      });
    });
    
    console.log('언어 선택기 설정 완료');
  } catch (error) {
    console.error('언어 선택기 설정 중 오류 발생:', error);
  }
}

// 자동 초기화
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
    console.log('DOMContentLoaded 이벤트 핸들러 등록 완료');
  } else {
    // 문서가 이미 로드된 경우 즉시 초기화
    console.log('문서가 이미 로드됨 - 초기화 즉시 실행');
    setTimeout(init, 0);
  }
}

// 글로벌 네임스페이스에 등록
window.FileToQR.appCore = {
  init,
  getCurrentPage,
  navigateTo,
  getConfig: () => CONFIG,
  getBasePath,
  showLoadingIndicator,
  hideLoadingIndicator
};
window.FileToQR.initApp = init;
window.FileToQR.getBasePath = getBasePath;
window.FileToQR.getCurrentPage = getCurrentPage;
window.FileToQR.navigateTo = navigateTo;
window.FileToQR.showLoadingIndicator = showLoadingIndicator;
window.FileToQR.hideLoadingIndicator = hideLoadingIndicator;
window.FileToQR.version = APP_VERSION;