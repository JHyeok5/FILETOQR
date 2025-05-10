/**
 * app-core.js - FileToQR 애플리케이션 코어 모듈
 * 버전: 1.2.0
 * 최종 업데이트: 2025-07-26
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
 * 
 * 참고: 이 모듈과 main.js의 역할 구분
 * - app-core.js: 애플리케이션의 핵심 구성 요소, 공통 유틸리티 및 모듈 정의
 * - main.js: 특정 페이지 로직과 컴포넌트의 초기화를 처리합니다.
 * 
 * 두 모듈 모두 유지하는 이유는 다음과 같습니다:
 * 1. app-core.js는 구성 및 유틸리티에 집중하며 전체 애플리케이션에서 공유됩니다.
 * 2. main.js는 페이지별 특정 로직과 컴포넌트 초기화를 처리합니다.
 * 3. 이러한 분리는 단일 책임 원칙을 지키며 유지보수성을 높입니다.
 */

// 디버깅을 위한 로그 추가
console.log('app-core.js 로딩 시작');

// 필요한 모듈 임포트
import Config from './config.js';
import UrlUtils from '../utils/url-utils.js';
import I18n from '../utils/i18n-utils.js';

// 글로벌 네임스페이스 설정
window.FileToQR = window.FileToQR || {};

// 애플리케이션 버전
const APP_VERSION = Config.APP_VERSION;

/**
 * 현재 페이지 식별자 반환
 * @returns {string} 페이지 식별자
 */
function getCurrentPage() {
  try {
    return UrlUtils.getPageIdFromUrl() || 'unknown';
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
  return UrlUtils.getBasePath();
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
    
    // 2. 유틸리티 모듈 초기화 (순서 중요)
    console.log('기본 유틸리티 모듈 초기화 시작');
    
    // a. URL 유틸리티 초기화
    console.log('URL 유틸리티 초기화');
    // URL 유틸리티는 자체 초기화 함수가 없으므로 넘어감
    
    // b. 다국어 지원 초기화
    console.log('다국어 지원 초기화');
    await I18n.init({
      useSavedLang: true,
      detectBrowserLang: true
    });
    
    // 3. 템플릿 유틸리티 초기화 (필요한 경우)
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
    
    // 4. 페이지별 초기화
    await initCurrentPage();
    
    // 5. 페이지 내 링크 업데이트
    updateInternalLinks();
    
    // 6. 언어 선택기 설정
    setupLanguageSelector();
    
    // 7. 로딩 인디케이터 숨기기
    console.log('초기화 완료 - 로딩 인디케이터 숨김');
    hideLoadingIndicator();
    
    // 8. 초기화 완료 후 추가 작업 실행
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
  return I18n.getCurrentLang();
}

/**
 * 페이지 내 모든 내부 링크 업데이트
 */
function updateInternalLinks() {
  // 모든 앵커 태그 가져오기
  const links = document.querySelectorAll('a');
  
  for (const link of links) {
    const href = link.getAttribute('href');
    
    // href 속성이 없거나 외부 링크, 앵커 링크, 자바스크립트 링크인 경우 건너뛰기
    if (!href || href.startsWith('http') || href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:')) {
      continue;
    }
    
    // 특수 data-i18n-url 속성이 있는 경우 (다국어 URL)
    if (link.hasAttribute('data-i18n-url')) {
      const urlKey = link.getAttribute('data-i18n-url');
      const newHref = I18n.getUrlFromKey(urlKey);
      
      if (newHref) {
        link.setAttribute('href', newHref);
      }
      
      continue;
    }
    
    // 일반 내부 링크인 경우, 현재 언어 설정에 맞게 URL 업데이트
    if (!UrlUtils.isExternalUrl(href)) {
      const currentLang = I18n.getCurrentLang();
      const defaultLang = Config.LANGUAGE_CONFIG.defaultLanguage;
      
      // 기본 언어가 아닌 경우에만 변경
      if (currentLang !== defaultLang) {
        try {
          const newHref = UrlUtils.getI18nUrl(href, currentLang);
          link.setAttribute('href', newHref);
        } catch (error) {
          console.warn(`링크 ${href} 처리 실패:`, error);
        }
      }
    }
  }
}

/**
 * 언어 선택기 설정
 */
function setupLanguageSelector() {
  const langSelector = document.getElementById('lang-selector-toggle');
  const langDropdown = document.getElementById('lang-dropdown-menu');
  
  if (!langSelector || !langDropdown) {
    console.warn('언어 선택기 요소를 찾을 수 없습니다');
    return;
  }
  
  // 언어 선택기 클릭 시 드롭다운 토글
  langSelector.addEventListener('click', (event) => {
    event.preventDefault();
    langDropdown.classList.toggle('show');
  });
  
  // 다른 곳 클릭 시 드롭다운 닫기
  document.addEventListener('click', (event) => {
    if (!langSelector.contains(event.target) && !langDropdown.contains(event.target)) {
      langDropdown.classList.remove('show');
    }
  });
  
  // 언어 옵션 클릭 시 언어 변경
  const langOptions = document.querySelectorAll('.lang-option');
  langOptions.forEach(option => {
    option.addEventListener('click', (event) => {
      event.preventDefault();
      
      const lang = option.getAttribute('data-lang');
      I18n.navigateToLanguage(lang);
    });
  });
}

/**
 * 애플리케이션 초기화 이후 추가 작업
 */
function onAppInitialized() {
  // 언어 변경 이벤트 리스너 추가
  window.addEventListener('languageChanged', (event) => {
    const lang = event.detail.language;
    updateInternalLinks();
    console.log(`언어 변경 감지: ${lang}`);
  });
  
  // 기타 전역 이벤트 리스너 설정
  // ...
}

// 전역 객체에 등록
window.FileToQR.app = {
  init,
  getCurrentPage,
  navigateTo,
  getBasePath,
  getCurrentLanguage
};

// DOMContentLoaded 이벤트 시 앱 초기화
document.addEventListener('DOMContentLoaded', () => {
  window.FileToQR.app.init();
});

// Export for ES modules
export default {
  init,
  getCurrentPage,
  navigateTo,
  getBasePath,
  getCurrentLanguage
};