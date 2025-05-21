/**
 * app-core.js - FileToQR 애플리케이션 코어 모듈
 * 버전: 1.2.1 (애니메이션 초기화 로직 개선)
 * 최종 업데이트: 2025-05-19
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
import '/assets/js/core/components.js';
// 홈페이지 스크립트를 명시적으로 임포트하여 HomePage 객체를 사용 가능하도록 합니다.
// 만약 HomePage가 전역 window.FileToQR.pages.home에 이미 할당된다면 이 import는 생략 가능합니다.
// 하지만 명시적 임포트가 더 나은 모듈 관리 방식입니다.
// import HomePage from '../pages/home.js'; // 주석 처리: home.js가 HomePage를 전역으로 노출하므로

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

    // 3. 헤더/푸터 동적 치환 (components.js)
    if (window.FileToQR && window.FileToQR.components && typeof window.FileToQR.components.loadDefault === 'function') {
      console.log('loadDefault 함수 호출 전');
      await window.FileToQR.components.loadDefault();
      console.log('loadDefault 함수 호출 후');
    } else {
      console.warn('FileToQR.components.loadDefault()를 찾을 수 없습니다. components.js가 올바르게 로드되었는지 확인하세요.');
    }

    // 4. 템플릿 유틸리티 초기화 (필요한 경우)
    try {
      if (typeof window.FileToQR !== 'undefined' && typeof window.FileToQR.TemplateUtils !== 'undefined') {
        console.log('템플릿 유틸리티 발견, 초기화 시작');
        if (!window.Handlebars) {
          const handlebarsScript = document.createElement('script');
          handlebarsScript.src = 'https://cdn.jsdelivr.net/npm/handlebars@latest/dist/handlebars.min.js';
          await new Promise((resolve, reject) => {
            handlebarsScript.onload = resolve;
            handlebarsScript.onerror = reject;
            document.head.appendChild(handlebarsScript);
          });
          console.log('Handlebars 라이브러리 동적 로드 완료');
        }
        await window.FileToQR.TemplateUtils.init();
        console.log('템플릿 유틸리티 초기화 완료');
        // 템플릿 처리 함수가 processTemplates -> loadComponent 등으로 변경되었을 수 있으니 확인 필요
        // await window.FileToQR.TemplateUtils.processTemplates();
      } else {
        console.log('템플릿 유틸리티(TemplateUtils)가 로드되지 않았습니다.');
      }
    } catch (error) {
      console.error('템플릿 유틸리티 초기화 실패:', error);
    }

    // 4. 페이지별 초기화
    await initCurrentPage();

    // 5. 페이지 내 링크 업데이트
    updateInternalLinks();

    // 6. 언어 선택기 설정
    initLanguageSelector();

    // 7. 로딩 인디케이터 숨기기
    console.log('초기화 완료 - 로딩 인디케이터 숨김');
    hideLoadingIndicator();

    // 8. 초기화 완료 후 추가 작업 실행
    onAppInitialized();

    console.log('애플리케이션 초기화 완료');
  } catch (error) {
    console.error('애플리케이션 초기화 실패:', error);
    hideLoadingIndicator();
    showErrorMessage('애플리케이션 초기화 중 오류가 발생했습니다.');
  }
}

/**
 * 로딩 인디케이터 표시
 */
function showLoadingIndicator() {
  let loadingIndicator = document.getElementById('loading-indicator');
  if (!loadingIndicator) {
    loadingIndicator = document.createElement('div');
    loadingIndicator.id = 'loading-indicator';
    loadingIndicator.className = 'loading-overlay';
    loadingIndicator.innerHTML = `
      <div class="loading-container">
        <div class="loading-spinner"></div>
        <p class="loading-text">로딩 중...</p>
      </div>
    `;
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
  loadingIndicator.style.display = 'flex';
}

/**
 * 로딩 인디케이터 숨기기
 */
function hideLoadingIndicator() {
  const loadingIndicator = document.getElementById('loading-indicator');
  if (loadingIndicator) {
    loadingIndicator.style.display = 'none';
  }
}

/**
 * 현재 페이지 초기화 (페이지별 로직)
 * @private
 * @returns {Promise<void>}
 */
async function initCurrentPage() {
  try {
    const pageId = getCurrentPage();
    console.log(`페이지별 초기화 시작: ${pageId}`);

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
async function initHomePage() {
  console.log('홈페이지 초기화 (app-core.js)');
  // HomePage 모듈이 전역 FileToQR.pages.home으로 노출된다고 가정
  if (window.FileToQR && window.FileToQR.pages && window.FileToQR.pages.home && typeof window.FileToQR.pages.home.init === 'function') {
    console.log('FileToQR.pages.home.init() 호출 시도');
    try {
      await window.FileToQR.pages.home.init(); // pages/home.js의 HomePage.init() 호출
      console.log('HomePage 초기화 성공 (애니메이션 포함)');
    } catch (err) {
      console.error("HomePage.init() 호출 중 오류:", err);
    }
  } else {
    console.error('FileToQR.pages.home.init 함수를 찾을 수 없습니다. assets/js/pages/home.js가 제대로 로드되고 HomePage 객체가 전역으로 노출되었는지 확인하세요.');
  }

  // 기존의 CTA 버튼 로직 등은 유지하거나 pages/home.js로 이전 고려
  const getStartedBtns = document.querySelectorAll('.get-started-btn');
  getStartedBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      // navigateTo 함수는 app-core.js 내에 정의되어 있어야 함
      navigateTo(UrlUtils.getI18nUrl('convert.html'));
    });
  });
}

/**
 * 변환 페이지 초기화
 * @private
 */
function initConvertPage() {
  console.log('변환 페이지 초기화');
  // convert.js가 자체적으로 DOMContentLoaded에서 초기화하므로 별도 호출 불필요
  // if (window.FileToQR && window.FileToQR.ConvertPageController && typeof window.FileToQR.ConvertPageController.init === 'function') {
  //   window.FileToQR.ConvertPageController.init();
  // } else {
  //   console.warn('ConvertPageController.init을 찾을 수 없습니다. convert.js가 로드되었는지 확인하세요.');
  // }
}

/**
 * QR 코드 페이지 초기화
 * @private
 */
function initQRCodePage() {
  console.log('QR 코드 페이지 초기화');
  if (window.FileToQR && window.FileToQR.QRGenerator && typeof window.FileToQR.QRGenerator.init === 'function') {
    if (!window.FileToQR.QRGenerator.state || !window.FileToQR.QRGenerator.state.initialized) {
      window.FileToQR.QRGenerator.init();
    }
  } else {
    console.warn('QRGenerator.init을 찾을 수 없습니다. qr-generator.js가 로드되었는지 확인하세요.');
  }
}

/**
 * 타이머 페이지 초기화
 * @private
 */
function initTimerPage() {
  console.log('타이머 페이지 초기화');
  // timer.js는 자체적으로 DOMContentLoaded에서 초기화 로직을 가질 수 있음
  // 또는 여기서 명시적으로 해당 페이지의 초기화 함수 호출
  // 예: if (window.FileToQR && window.FileToQR.TimerPage) { window.FileToQR.TimerPage.init(); }
}

/**
 * 도움말 페이지 초기화
 * @private
 */
function initHelpPage() {
  console.log('도움말 페이지 초기화');
  if (window.FileToQR && window.FileToQR.controllers && window.FileToQR.controllers.content) {
    window.FileToQR.controllers.content.init();
  }
}

/**
 * 문의하기 페이지 초기화
 * @private
 */
function initContactPage() {
  console.log('문의하기 페이지 초기화');
   if (window.FileToQR && window.FileToQR.controllers && window.FileToQR.controllers.content) {
    window.FileToQR.controllers.content.init();
  }
}

/**
 * 개인정보 처리방침 페이지 초기화
 * @private
 */
function initPrivacyPage() {
  console.log('개인정보 처리방침 페이지 초기화');
   if (window.FileToQR && window.FileToQR.controllers && window.FileToQR.controllers.content) {
    window.FileToQR.controllers.content.init();
  }
}

/**
 * 이용약관 페이지 초기화
 * @private
 */
function initTermsPage() {
  console.log('이용약관 페이지 초기화');
  if (window.FileToQR && window.FileToQR.controllers && window.FileToQR.controllers.content) {
    window.FileToQR.controllers.content.init();
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
  const links = document.querySelectorAll('a');
  for (const link of links) {
    const href = link.getAttribute('href');
    if (!href || href.startsWith('http') || href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:')) {
      continue;
    }
    if (link.hasAttribute('data-i18n-url')) {
      const urlKey = link.getAttribute('data-i18n-url');
      const newHref = I18n.getUrlFromKey(urlKey); // I18n 유틸리티에 이 함수가 있다고 가정
      if (newHref) link.setAttribute('href', newHref);
      continue;
    }
    if (!UrlUtils.isExternalUrl(href)) {
      try {
        const newHref = UrlUtils.getI18nUrl(href); // 현재 언어에 맞게 URL 조정
        link.setAttribute('href', newHref);
      } catch (error) {
        console.warn(`링크 ${href} 처리 실패:`, error);
      }
    }

    // --- SPA 내부 링크 동적 처리 ---
    link.addEventListener('click', async function(e) {
      // Ctrl/Shift/Meta 클릭, 새 탭 등은 기본 동작 허용
      if (e.ctrlKey || e.shiftKey || e.metaKey || e.altKey || link.target === '_blank') return;
      // 외부 링크, 해시, 메일 등은 무시
      const href = link.getAttribute('href');
      if (!href || href.startsWith('http') || href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
      e.preventDefault();
      // --- pageId 추출 보정 ---
      let pageId = null;
      try {
        const urlParts = href.split('/');
        let fileName = urlParts[urlParts.length - 1] || 'index.html';
        // index.html → home, 나머지는 .html 제거
        if (fileName === '' || fileName === 'index.html') {
          pageId = 'home';
        } else if (fileName.endsWith('.html')) {
          pageId = fileName.replace('.html', '');
        } else {
          pageId = 'home';
        }
      } catch (err) {
        pageId = 'home';
      }
      // 메인 컨테이너(예: #main-container) 동적 교체 (실제 프로젝트 구조에 맞게 수정 필요)
      const mainContainer = document.getElementById('main-container') || document.querySelector('main');
      if (mainContainer) {
        try {
          // HTML 동적 로드
          const response = await fetch(href);
          if (!response.ok) throw new Error('페이지 HTML 로드 실패: ' + href);
          const html = await response.text();
          // main 태그만 추출 (불필요한 경우 전체 삽입)
          let tempDiv = document.createElement('div');
          tempDiv.innerHTML = html;
          let newMain = tempDiv.querySelector('main') || tempDiv;
          mainContainer.innerHTML = newMain.innerHTML;
          // 주소 변경 (pushState)
          window.history.pushState({}, '', href);
          // --- [SPA 개선] 페이지별 JS 동적 삽입 ---
          // 이미 script가 head에 존재하는지 확인 (src 기준)
          const pageScriptMap = {
            'home': 'assets/js/pages/home.js',
            'convert': 'assets/js/pages/convert.js',
            'qrcode': 'assets/js/qr-generator/qr-generator.js',
            'timer': 'assets/js/pages/timer.js',
            'help': 'assets/js/pages/content.js',
            'contact': 'assets/js/pages/content.js',
            'privacy': 'assets/js/pages/content.js',
            'terms': 'assets/js/pages/content.js'
          };
          const scriptUrl = pageScriptMap[pageId];
          let scriptAlready = false;
          if (scriptUrl) {
            const scripts = Array.from(document.head.querySelectorAll('script[type="module"]'));
            scriptAlready = scripts.some(s => s.src && s.src.includes(scriptUrl));
            if (!scriptAlready) {
              await new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = scriptUrl;
                script.async = true;
                script.type = 'module';
                script.onload = () => {
                  console.log(`[SPA] ${pageId} JS 동적 로드 완료. 초기화 함수 호출.`);
                  resolve();
                };
                script.onerror = (e) => {
                  console.error(`[SPA] ${pageId} JS 동적 로드 실패:`, e);
                  reject(e);
                };
                document.head.appendChild(script);
              });
            }
          }
          // --- [SPA 개선 끝] ---
          // 페이지별 JS 동적 로드 및 초기화 (이미 로드된 경우도 포함)
          await loadPageScript(pageId);
          // 내부 링크 재바인딩
          updateInternalLinks();
        } catch (err) {
          console.error('SPA 내부 링크 처리 중 오류:', err);
          // Fallback: 전체 페이지 이동
          window.location.href = href;
        }
      } else {
        // Fallback: 전체 페이지 이동
        window.location.href = href;
      }
    });
    // --- SPA 내부 링크 동적 처리 끝 ---
  }
}

/**
 * 언어 선택기 초기화 함수
 */
function initLanguageSelector() {
  try {
    const langSelector = document.querySelector('.language-selector');
    const langToggle = document.getElementById('lang-selector-toggle');
    const langDropdown = document.getElementById('lang-dropdown-menu');
    
    if (!langSelector || !langToggle || !langDropdown) {
      console.warn('언어 선택기 요소를 찾을 수 없음. 전체 페이지 로딩 또는 템플릿 로딩 지연 문제일 수 있습니다.');
      return;
    }
    
    updateLanguageDisplay(); // 현재 언어 표시

    // 드롭다운 토글
    langToggle.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      const isOpen = langSelector.classList.toggle('open');
      langToggle.setAttribute('aria-expanded', isOpen.toString());
      langDropdown.setAttribute('aria-hidden', (!isOpen).toString());
      if (isOpen) {
        const firstOption = langDropdown.querySelector('.lang-option');
        if (firstOption) firstOption.focus();
      }
    });

    // 외부 클릭 시 드롭다운 닫기
    document.addEventListener('click', function(e) {
      if (!langSelector.contains(e.target)) {
        // 1. 포커스 해제 및 비동기 포커스 이동
        if (langDropdown.contains(document.activeElement)) {
          document.activeElement.blur();
          setTimeout(() => {
            langToggle.focus();
          }, 0);
        }
        // 2. aria 속성 및 클래스 변경
        langSelector.classList.remove('open');
        langToggle.setAttribute('aria-expanded', 'false');
        langDropdown.setAttribute('aria-hidden', 'true');
      }
    });
    
    // ESC 키로 닫기 및 키보드 접근성
    langToggle.addEventListener('keydown', function(e) {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        langSelector.classList.add('open');
        langToggle.setAttribute('aria-expanded', 'true');
        const firstOption = langDropdown.querySelector('.lang-option');
        if (firstOption) firstOption.focus();
      }
    });

    langDropdown.addEventListener('keydown', function(e) {
      const langOptions = Array.from(langDropdown.querySelectorAll('.lang-option'));
      const currentIndex = langOptions.indexOf(document.activeElement);

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const nextIndex = (currentIndex + 1) % langOptions.length;
        langOptions[nextIndex].focus();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const prevIndex = (currentIndex - 1 + langOptions.length) % langOptions.length;
        langOptions[prevIndex].focus();
      } else if (e.key === 'Escape') {
        // 1. 포커스 해제 및 비동기 포커스 이동
        document.activeElement.blur();
        setTimeout(() => {
          langToggle.focus();
        }, 0);
        // 2. aria 속성 및 클래스 변경
        langSelector.classList.remove('open');
        langToggle.setAttribute('aria-expanded', 'false');
        langDropdown.setAttribute('aria-hidden', 'true');
      } else if (e.key === 'Tab') {
        // 드롭다운 내에서만 순환
        if (e.shiftKey && currentIndex === 0) {
            e.preventDefault();
            langOptions[langOptions.length - 1].focus();
        } else if (!e.shiftKey && currentIndex === langOptions.length - 1) {
            e.preventDefault();
            langOptions[0].focus();
        }
      }
    });
    
    // 언어 옵션 클릭/선택
    const langOptions = langDropdown.querySelectorAll('.lang-option');
    langOptions.forEach(option => {
      option.setAttribute('tabindex', '0'); // 키보드 포커스 가능하게
      option.addEventListener('click', function(e) {
        e.preventDefault();
        const lang = this.dataset.lang;
        if (window.FileToQR.i18n && typeof window.FileToQR.i18n.navigateToLanguage === 'function') {
          window.FileToQR.i18n.navigateToLanguage(lang);
        } else {
          console.error('I18n.navigateToLanguage 함수를 찾을 수 없습니다.');
          // 폴백: 직접 URL 변경
          const currentPath = window.location.pathname;
          const pageName = currentPath.substring(currentPath.lastIndexOf('/') + 1) || 'index.html';
          window.location.href = `/${lang}/${pageName}`;
        }
      });
      // 키보드 엔터/스페이스로 선택
      option.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            this.click();
        }
      });
    });
    // ARIA 속성 보강
    langToggle.setAttribute('aria-haspopup', 'listbox');
    langToggle.setAttribute('aria-controls', 'lang-dropdown-menu');
    langDropdown.setAttribute('role', 'listbox');
    langDropdown.setAttribute('aria-hidden', 'true');
    langOptions.forEach(option => {
        option.setAttribute('role', 'option');
    });

    console.log('언어 선택기 초기화 완료');
  } catch (error) {
    console.error('언어 선택기 초기화 오류:', error);
  }
}

/**
 * 현재 언어에 맞게 언어 선택기 표시 업데이트
 */
function updateLanguageDisplay() {
  try {
    const langToggle = document.getElementById('lang-selector-toggle');
    if (!langToggle) return;

    const currentLang = getCurrentLanguage();
    const langNames = Config.LANGUAGE_CONFIG.names || { // Config에서 언어 이름 가져오도록 수정
      'ko': '한국어',
      'en': 'English',
      'zh': '中文',
      'ja': '日本語'
    };

    const langLabel = langToggle.querySelector('.lang-label');
    if (langLabel) {
      langLabel.textContent = langNames[currentLang] || currentLang.toUpperCase();
    }

    const flagIcon = langToggle.querySelector('.lang-flag-icon');
    if (flagIcon) {
      flagIcon.className = `lang-flag-icon ${currentLang}-flag`;
      // 이미지가 CSS 배경으로 설정되어 있다면 이 부분은 필요 없을 수 있습니다.
      // 만약 JS로 직접 이미지 경로를 설정한다면 다음을 사용:
      // flagIcon.src = `${getBasePath()}assets/images/flags/${currentLang}.svg`;
    }

    const langOptions = document.querySelectorAll('#lang-dropdown-menu .lang-option');
    langOptions.forEach(option => {
      option.classList.remove('active');
      option.removeAttribute('aria-selected');
      if (option.dataset.lang === currentLang) {
        option.classList.add('active');
        option.setAttribute('aria-selected', 'true');
      }
    });
  } catch (error) {
    console.error('언어 표시 업데이트 중 오류:', error);
  }
}

/**
 * 애플리케이션 초기화 이후 추가 작업
 */
function onAppInitialized() {
  window.addEventListener('languageChanged', (event) => {
    const lang = event.detail.language;
    updateInternalLinks();
    updateLanguageDisplay(); // 언어 변경 시 표시 업데이트
    console.log(`언어 변경 감지: ${lang}. 내부 링크 및 언어 선택기 표시 업데이트됨.`);
  });
}

/**
 * 에러 메시지 표시 함수 (간단 버전)
 */
function showErrorMessage(message) {
    // 기존에 만들어둔 토스트 메시지나 알림 컴포넌트 활용 가능
    // 여기서는 간단히 alert으로 대체
    console.error("오류 발생:", message);
    // alert(message); // 실제 서비스에서는 더 나은 UI로 대체
}

/**
 * 페이지별 JS 파일 동적 로드 및 초기화 함수 호출 (SPA 개선)
 * @param {string} pageId - 페이지 식별자 (예: 'convert', 'timer', 'qrcode')
 * @returns {Promise<void>}
 *
 * - 항상 새 script로 동적 삽입(캐시 무력화)
 * - 기존 컨트롤러 객체 및 script 태그 삭제
 * - onload 시 init(force)로 강제 재초기화
 */
async function loadPageScript(pageIdRaw) {
  let pageId = pageIdRaw;
  if (!pageId || pageId === '' || pageId === 'index') pageId = 'home';
  const pageScriptMap = {
    'home': 'assets/js/pages/home.js',
    'convert': 'assets/js/pages/convert.js',
    'qrcode': 'assets/js/qr-generator/qr-generator.js',
    'timer': 'assets/js/pages/timer.js',
    'help': 'assets/js/pages/content.js',
    'contact': 'assets/js/pages/content.js',
    'privacy': 'assets/js/pages/content.js',
    'terms': 'assets/js/pages/content.js'
  };
  const scriptUrl = pageScriptMap[pageId];
  if (!scriptUrl) {
    console.warn(`[loadPageScript] pageId(${pageId})에 대한 스크립트 경로가 없습니다.`);
    return;
  }
  // 1. 기존 컨트롤러 객체 및 script 태그 삭제
  try {
    switch (pageId) {
      case 'convert':
        if (window.FileToQR && window.FileToQR.ConvertPageController) delete window.FileToQR.ConvertPageController;
        break;
      case 'qrcode':
        if (window.FileToQR && window.FileToQR.QRGenerator) delete window.FileToQR.QRGenerator;
        break;
      case 'timer':
        if (window.FileToQR && window.FileToQR.TimerPage) delete window.FileToQR.TimerPage;
        break;
      case 'home':
        if (window.FileToQR && window.FileToQR.pages && window.FileToQR.pages.home) delete window.FileToQR.pages.home;
        break;
      case 'help':
      case 'contact':
      case 'privacy':
      case 'terms':
        if (window.FileToQR && window.FileToQR.controllers && window.FileToQR.controllers.content) delete window.FileToQR.controllers.content;
        break;
    }
    // 기존 script 태그 삭제 (data-page-script 속성 활용)
    document.querySelectorAll('script[data-page-script]').forEach(s => s.remove());
  } catch (e) {
    console.warn('[loadPageScript] 기존 컨트롤러/스크립트 삭제 중 오류:', e);
  }
  // 2. 새 script 동적 삽입(캐시 무력화)
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `${scriptUrl}?ts=${Date.now()}`;
    script.async = true;
    script.type = 'module';
    script.setAttribute('data-page-script', 'true');
    script.onload = async () => {
      console.log(`[loadPageScript] ${pageId} JS 동적 로드 완료. 강제 재초기화(init(true)) 호출.`);
      // 3. onload 시 강제 재초기화
      if (window.FileToQR) {
        switch (pageId) {
          case 'convert':
            if (window.FileToQR.ConvertPageController && typeof window.FileToQR.ConvertPageController.init === 'function') {
              await window.FileToQR.ConvertPageController.init(true);
            }
            break;
          case 'qrcode':
            if (window.FileToQR.QRGenerator && typeof window.FileToQR.QRGenerator.init === 'function') {
              await window.FileToQR.QRGenerator.init(true);
            }
            break;
          case 'timer':
            if (window.FileToQR.TimerPage && typeof window.FileToQR.TimerPage.init === 'function') {
              await window.FileToQR.TimerPage.init(true);
            }
            break;
          case 'home':
            if (window.FileToQR.pages && window.FileToQR.pages.home && typeof window.FileToQR.pages.home.init === 'function') {
              await window.FileToQR.pages.home.init(true);
            }
            break;
          case 'help':
          case 'contact':
          case 'privacy':
          case 'terms':
            if (window.FileToQR.controllers && window.FileToQR.controllers.content && typeof window.FileToQR.controllers.content.init === 'function') {
              await window.FileToQR.controllers.content.init(true);
            }
            break;
        }
      }
      resolve();
    };
    script.onerror = (e) => {
      console.error(`[loadPageScript] ${pageId} JS 동적 로드 실패:`, e);
      reject(e);
    };
    document.head.appendChild(script);
  });
}

// 전역 FileToQR 객체 및 app 네임스페이스 확인 및 생성
window.FileToQR = window.FileToQR || {};
window.FileToQR.app = {
  init,
  getCurrentPage,
  navigateTo,
  getBasePath,
  getCurrentLanguage
};

// DOMContentLoaded 이벤트 시 앱 초기화
// 이 리스너는 app-core.js가 HTML에 직접 포함될 때 유효합니다.
// 모듈 번들러(webpack 등)를 사용하고 app-core.js가 다른 모듈에 의해 임포트된다면,
// 최상위 진입점(예: main.js 또는 index.js)에서 init()을 호출해야 합니다.
// 현재 프로젝트 구조에서는 각 HTML 파일에서 app-core.js를 직접 로드하고,
// 그 안에서 DOMContentLoaded를 기다렸다가 init()을 호출하는 것이 안전합니다.
document.addEventListener('DOMContentLoaded', () => {
  init();
});

export default window.FileToQR.app; 