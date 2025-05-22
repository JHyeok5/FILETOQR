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
import '../core/components.js';
// TemplateUtils를 명시적으로 import합니다.
import TemplateUtils from '../utils/template-utils.js';
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
    console.log('[AppCore] Core utility modules initialization started.');
    console.log('[AppCore] URL Utils initialization (no specific init function needed).');
    console.log('[AppCore] I18n Utils initialization started.');
    await I18n.init({
      useSavedLang: true,
      detectBrowserLang: true
    });
    console.log('[AppCore] I18n Utils initialization completed.');

    // 3. 템플릿 유틸리티 초기화 (components.js 보다 먼저 또는 동시에 로드될 수 있도록)
    // TemplateUtils는 위에서 직접 import 했으므로, 이를 사용합니다.
    if (TemplateUtils && typeof TemplateUtils.init === 'function') {
      console.log('[AppCore] Imported TemplateUtils module found, attempting initialization...');
      try {
        // TemplateUtils.init()은 Promise를 반환하며, 성공 시 resolve, 실패 시 reject 합니다.
        await TemplateUtils.init(); 
        console.log('[AppCore] TemplateUtils.init() completed successfully.');
      } catch (initError) {
        // TemplateUtils.init() 자체가 실패한 경우 (e.g., Handlebars 로드 실패)
        // initError는 template-utils.js의 init()에서 reject된 Error 객체입니다.
        const specificMessage = initError.message || 'TemplateUtils.init()에서 원인 불명의 오류 발생';
        const errorMsg = `[AppCore] CRITICAL: TemplateUtils.init() failed. Reason: ${specificMessage}`;
        console.error(errorMsg, initError); // 전체 에러 객체도 로깅
        // 사용자에게 표시될 오류 메시지는 initError.message (더 구체적) 또는 일반 메시지
        showErrorMessage(initError.message || '필수 UI 라이브러리(TemplateUtils) 초기화에 실패했습니다. 페이지를 새로고침하거나 관리자에게 문의하십시오.');
        throw initError; // 초기화 프로세스 중단 위해 에러 다시 throw
      }
    } else {
      // 이 경우는 import TemplateUtils from '../utils/template-utils.js'; 자체가 실패했거나,
      // 해당 모듈이 TemplateUtils 객체를 default export 하지 않거나, init 함수가 없는 경우입니다.
      const errorMsg = '[AppCore] CRITICAL: Imported TemplateUtils module or its init function is not found. Check the import path and the template-utils.js module structure.';
      console.error(errorMsg);
      showErrorMessage('필수 UI 라이브러리(TemplateUtils) 구성 요소를 찾을 수 없습니다. 페이지를 새로고침하거나 관리자에게 문의하십시오.');
      throw new Error(errorMsg); // 초기화 프로세스 중단
    }
    
    // 4. 헤더/푸터 동적 치환 및 내부 스크립트 실행 대기 (components.js)
    // 이 단계에서 헤더/푸터의 DOM이 준비되고 내부 스크립트가 실행 완료됨
    if (window.FileToQR && window.FileToQR.components && typeof window.FileToQR.components.loadDefault === 'function') {
      console.log('기본 컴포넌트(헤더/푸터) 로드 시작...');
      await window.FileToQR.components.loadDefault(); 
      console.log('기본 컴포넌트(헤더/푸터) 로드 및 초기화 완료.');
      
      // 4.1 헤더 네비게이션 링크 활성화 (헤더 로드 및 초기화 완료 후)
      if (window.FileToQR && window.FileToQR.Header && typeof window.FileToQR.Header.activateNavLinks === 'function') {
        console.log('헤더 네비게이션 링크 활성화 시도...');
        window.FileToQR.Header.activateNavLinks();
        console.log('헤더 네비게이션 링크 활성화 완료.');
      } else {
        console.warn('FileToQR.Header.activateNavLinks 함수를 찾을 수 없습니다.');
      }

      // 4.2 언어 선택기 설정 (헤더/푸터 로드 및 초기화 완료 후)
      // initLanguageSelector는 내부적으로 헤더의 DOM 요소를 참조하므로, 헤더가 준비된 후 호출
      console.log('언어 선택기 초기화 시도...');
      initLanguageSelector(); 
      console.log('언어 선택기 초기화 완료.');

      // 4.3 페이지 내 내부 링크 업데이트 (헤더/푸터 로드 및 초기화 완료 후)
      // updateInternalLinks는 헤더/푸터 내의 링크도 처리할 수 있으므로 이 시점에 호출
      console.log('내부 링크 업데이트 시도...');
      updateInternalLinks();
      console.log('내부 링크 업데이트 완료.');

    } else {
      console.warn('FileToQR.components.loadDefault()를 찾을 수 없습니다. components.js가 올바르게 로드되었는지 확인하세요.');
      throw new Error('필수 공통 컴포넌트 로더(components.js)를 찾을 수 없습니다. 페이지를 새로고침하거나 관리자에게 문의하세요.');
    }

    // 5. 페이지별 초기화 (공통 컴포넌트 및 관련 기능 초기화 완료 후)
    console.log('페이지별 모듈 초기화 단계 진입...');
    await initCurrentPage();

    // 6. 로딩 인디케이터 숨기기 (모든 주요 초기화 완료 후)
    console.log('모든 초기화 완료 - 로딩 인디케이터 숨김');
    hideLoadingIndicator();

    // 7. 초기화 완료 후 추가 작업 실행 (예: 이벤트 리스너 등록 등)
    onAppInitialized();

    console.log('애플리케이션 초기화 성공적으로 완료');

  } catch (error) {
    console.error('애플리케이션 초기화 중 심각한 오류 발생:', error);
    hideLoadingIndicator();
    showErrorMessage(error.message || '애플리케이션 초기화 중 오류가 발생했습니다. 페이지를 새로고침하거나 문제가 지속되면 관리자에게 문의하세요.');
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
    console.log(`페이지별 초기화 시작 (app-core.js): ${pageId}`);
    // loadPageScript는 pageId에 해당하는 스크립트를 로드하고 초기화 함수를 호출
    await loadPageScript(pageId);
    console.log(`${pageId} 페이지 초기화 완료 (app-core.js)`);
  } catch (error) {
    console.error(`페이지 초기화 실패 (app-core.js, 페이지 ID: ${getCurrentPage()}):`, error);
    // 페이지별 초기화 실패 시 사용자에게 알릴 수 있지만, 앱 전체를 중단시키지는 않을 수 있음
    // showErrorMessage(`페이지 '${getCurrentPage()}' 로딩 중 문제가 발생했습니다.`);
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
  // 1. data-i18n-url이 있는 a 태그의 href를 실제 경로로 변환하고, 기존 이벤트 제거(복제/교체)
  const links = document.querySelectorAll('a[data-i18n-url]');
  links.forEach(link => {
    const urlKey = link.getAttribute('data-i18n-url');
    let newHref = null;
    if (typeof I18n.getUrlFromKey === 'function') {
      newHref = I18n.getUrlFromKey(urlKey);
    } else if (window.FileToQR && window.FileToQR.i18n && typeof window.FileToQR.i18n.getUrlFromKey === 'function') {
      newHref = window.FileToQR.i18n.getUrlFromKey(urlKey);
    }
    if (newHref) link.setAttribute('href', newHref);
    // 기존 이벤트 제거: 복제/교체 방식
    const newLink = link.cloneNode(true);
    link.parentNode.replaceChild(newLink, link);
  });

  // 2. 다시 선택해서 SPA 라우팅 이벤트 바인딩 (내부 경로에만)
  const newLinks = document.querySelectorAll('a[data-i18n-url]');
  newLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (!href || href === '#' || href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
    link.addEventListener('click', async function(e) {
      // Ctrl/Shift/Meta 클릭, 새 탭 등은 기본 동작 허용
      if (e.ctrlKey || e.shiftKey || e.metaKey || e.altKey || link.target === '_blank') return;
      e.preventDefault();
      // --- pageId 추출 보정 ---
      let pageId = null;
      try {
        const urlParts = href.split('/');
        let fileName = urlParts[urlParts.length - 1] || 'index.html';
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
      const mainContainer = document.getElementById('main-container') || document.querySelector('main');
      if (mainContainer) {
        // [SPA 중복 UI 방지] 기존 main 내용 완전히 비움
        mainContainer.innerHTML = '';
        console.log('[SPA] main-container cleared for navigation to', href, 'at', new Date().toISOString());
        // HTML 동적 로드
        const response = await fetch(href);
        if (!response.ok) throw new Error('페이지 HTML 로드 실패: ' + href);
        const html = await response.text();
        let tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        // 새 main 태그가 있으면 그 innerHTML만 삽입, 없으면 전체 삽입
        let newMain = tempDiv.querySelector('main') || tempDiv;
        mainContainer.innerHTML = newMain.innerHTML;
        console.log('[SPA] main-container innerHTML set for', href, 'at', new Date().toISOString());
        // [SPA 중복 UI 방지] main 내부에 main 태그가 중첩되어 있으면 첫 번째 main만 남기고 나머지 제거
        const nestedMains = mainContainer.querySelectorAll('main');
        if (nestedMains.length > 1) {
          for (let i = 1; i < nestedMains.length; i++) {
            nestedMains[i].remove();
          }
        }
        // 주소 변경 (pushState)
        window.history.pushState({}, '', href);
        // 페이지별 JS 동적 로드 및 초기화
        await loadPageScript(pageId);
        // 내부 링크 재바인딩
        updateInternalLinks();
      } else {
        window.location.href = href;
      }
    });
  });

  // 3. 기존 방식의 외부/상대 경로 a 태그도 동일하게 처리 (필요시)
  const externalLinks = document.querySelectorAll('a');
  externalLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (!href || href.startsWith('http') || href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:')) {
      return;
    }
    if (!UrlUtils.isExternalUrl(href)) {
      try {
        const newHref = UrlUtils.getI18nUrl(href); // 현재 언어에 맞게 URL 조정
        link.setAttribute('href', newHref);
      } catch (error) {
        console.warn(`링크 ${href} 처리 실패:`, error);
      }
    }
  });
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
  try {
    const existingModal = document.getElementById('error-modal-container');
    if (existingModal) {
      existingModal.remove(); // 이전 오류 메시지 제거
    }

    const modalContainer = document.createElement('div');
    modalContainer.id = 'error-modal-container';
    modalContainer.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background-color: rgba(0,0,0,0.6); display: flex;
      justify-content: center; align-items: center; z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    `;

    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
      background-color: white; padding: 30px; border-radius: 8px;
      box-shadow: 0 5px 15px rgba(0,0,0,0.3); text-align: center;
      max-width: 400px; width: 90%;
    `;

    const errorTitle = document.createElement('h2');
    errorTitle.textContent = '오류 발생';
    errorTitle.style.cssText = 'color: #dc3545; margin-top: 0; margin-bottom: 15px; font-size: 1.5em;';

    const errorMessage = document.createElement('p');
    errorMessage.textContent = message;
    errorMessage.style.cssText = 'margin-bottom: 20px; font-size: 1em; color: #333; line-height: 1.6;';

    const closeButton = document.createElement('button');
    closeButton.textContent = '닫기';
    closeButton.style.cssText = `
      background-color: #007bff; color: white; border: none;
      padding: 10px 20px; border-radius: 5px; cursor: pointer;
      font-size: 1em; transition: background-color 0.2s;
    `;
    closeButton.onmouseover = () => closeButton.style.backgroundColor = '#0056b3';
    closeButton.onmouseout = () => closeButton.style.backgroundColor = '#007bff';
    closeButton.onclick = () => modalContainer.remove();

    modalContent.appendChild(errorTitle);
    modalContent.appendChild(errorMessage);
    modalContent.appendChild(closeButton);
    modalContainer.appendChild(modalContent);
    document.body.appendChild(modalContainer);

  } catch (e) {
    console.error('오류 메시지 표시 중 추가 오류 발생:', e);
    // 최후의 수단으로 alert 사용
    alert(message);
  }
}

/**
 * 페이지별 JS 파일 동적 로드 및 초기화 함수 호출 (SPA 개선, 렌더링 타이밍 보장)
 * @param {string} pageId - 페이지 식별자 (예: 'convert', 'timer', 'qrcode')
 * @returns {Promise<void>}
 *
 * - 항상 새 script로 동적 삽입(캐시 무력화)
 * - 기존 컨트롤러 객체 및 script 태그 삭제
 * - main/header/footer가 모두 렌더링된 후에만 script 삽입 및 init(force) 실행
 */
async function loadPageScript(pageIdRaw) {
  if (!pageIdRaw || typeof pageIdRaw !== 'string') {
    console.warn('loadPageScript: 유효하지 않은 pageIdRaw입니다.', pageIdRaw);
    return; 
  }
  const pageId = pageIdRaw.toLowerCase();
  console.log(`페이지 스크립트 로드 시도: ${pageId}`);

  // Config.pages에서 페이지 설정 가져오기. pageId가 'ko/index' 같은 형태일 수 있으므로 마지막 부분 사용
  const pageKey = pageId.includes('/') ? pageId.split('/').pop() : pageId;
  const pageConfig = Config.pages[pageKey];

  if (pageConfig && pageConfig.script) {
    try {
      console.log(`페이지 스크립트 동적 import 시도: ${pageConfig.script}`);
      const pageModule = await import(pageConfig.script);
      console.log(`페이지 스크립트(${pageConfig.script}) 로드 완료: ${pageId}`);

      // 1. 모듈 직접 export (ES6 모듈 스타일)
      if (pageModule && typeof pageModule.init === 'function') {
        console.log(`페이지 모듈(${pageId})의 init 함수 직접 호출 시도...`);
        await pageModule.init(true); 
        console.log(`페이지 모듈(${pageId})의 init 함수 직접 호출 완료.`);
      } 
      // 2. 전역 네임스페이스에 할당된 페이지 객체 (기존 방식 호환)
      // window.FileToQR.pages.home 또는 window.FileToQR.HomePage 등 다양한 형태 고려
      else if (window.FileToQR && window.FileToQR.pages && window.FileToQR.pages[pageKey] && typeof window.FileToQR.pages[pageKey].init === 'function') {
        console.log(`전역 페이지 객체(window.FileToQR.pages.${pageKey})의 init 함수 호출 시도...`);
        await window.FileToQR.pages[pageKey].init(true);
        console.log(`전역 페이지 객체(window.FileToQR.pages.${pageKey})의 init 함수 호출 완료.`);
      } 
      // 3. 페이지 ID를 이름으로 하는 전역 컨트롤러 객체 (예: window.FileToQR.Home)
      // pageKey에서 첫 글자를 대문자로 변경하여 컨트롤러 이름 생성 (e.g., 'home' -> 'Home')
      else {
        const controllerName = pageKey.charAt(0).toUpperCase() + pageKey.slice(1);
        if (window.FileToQR && window.FileToQR[controllerName] && typeof window.FileToQR[controllerName].init === 'function') {
          console.log(`전역 컨트롤러 객체(window.FileToQR.${controllerName})의 init 함수 호출 시도...`);
          await window.FileToQR[controllerName].init(true);
          console.log(`전역 컨트롤러 객체(window.FileToQR.${controllerName})의 init 함수 호출 완료.`);
        } else {
          console.warn(`페이지(${pageId})에 대한 초기화 함수(init)를 찾을 수 없습니다. 스크립트(${pageConfig.script})가 올바르게 init 함수를 export하거나 전역(window.FileToQR.pages.${pageKey} 또는 window.FileToQR.${controllerName})에 할당하는지 확인하세요.`);
        }
      }
    } catch (error) {
      console.error(`페이지 스크립트(${pageConfig.script}) 로드 또는 초기화 실패 (페이지 ID: ${pageId}):`, error);
      showErrorMessage(`페이지 '${pageId}'의 내용을 로드하거나 초기화하는 중 오류가 발생했습니다. 콘솔을 확인해주세요.`);
    }
  } else {
    console.log(`페이지(${pageId})에 대한 스크립트가 Config에 정의되지 않았습니다.`);
  }
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

// [SPA popstate 지원] 뒤로가기/앞으로가기 시 SPA 라우팅 재실행
window.addEventListener('popstate', async function(event) {
  try {
    const currentUrl = window.location.pathname + window.location.search + window.location.hash;
    // pageId 추출 로직 재사용
    let pageId = null;
    try {
      const urlParts = currentUrl.split('/');
      let fileName = urlParts[urlParts.length - 1] || 'index.html';
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
    const mainContainer = document.getElementById('main-container') || document.querySelector('main');
    if (mainContainer) {
      mainContainer.innerHTML = '';
      console.log('[SPA][popstate] main-container cleared for navigation to', currentUrl, 'at', new Date().toISOString());
      const response = await fetch(currentUrl);
      if (!response.ok) throw new Error('페이지 HTML 로드 실패: ' + currentUrl);
      const html = await response.text();
      let tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;
      let newMain = tempDiv.querySelector('main') || tempDiv;
      mainContainer.innerHTML = newMain.innerHTML;
      console.log('[SPA][popstate] main-container innerHTML set for', currentUrl, 'at', new Date().toISOString());
      const nestedMains = mainContainer.querySelectorAll('main');
      if (nestedMains.length > 1) {
        for (let i = 1; i < nestedMains.length; i++) {
          nestedMains[i].remove();
        }
      }
      await loadPageScript(pageId);
      updateInternalLinks();
    } else {
      window.location.href = currentUrl;
    }
  } catch (e) {
    console.error('[SPA][popstate] 처리 중 오류:', e);
  }
});

export default window.FileToQR.app; 