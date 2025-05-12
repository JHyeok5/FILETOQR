/**
 * 언어 전환 기능을 위한 유틸리티 스크립트
 * 페이지 내에서 언어 전환 UI 요소를 관리하고 언어 변경 시 쿠키 설정 및 페이지 리다이렉션을 처리합니다.
 */

// 언어 목록 정의
const SUPPORTED_LANGUAGES = {
  ko: { name: '한국어', flag: 'ko-flag', dir: 'ko' },
  en: { name: 'English', flag: 'en-flag', dir: 'en' },
  zh: { name: '中文', flag: 'zh-flag', dir: 'zh' },
  ja: { name: '日本語', flag: 'ja-flag', dir: 'ja' }
};

// 현재 활성화된 언어 감지
function detectCurrentLanguage() {
  // URL에서 언어 감지
  const path = window.location.pathname;
  const langFromPath = Object.keys(SUPPORTED_LANGUAGES).find(lang => 
    path.includes(`/${lang}/`)
  );
  
  if (langFromPath) {
    return langFromPath;
  }
  
  // 쿠키에서 언어 설정 확인
  const cookieLang = getCookie('preferred_language');
  if (cookieLang && SUPPORTED_LANGUAGES[cookieLang]) {
    return cookieLang;
  }
  
  // 브라우저 언어 감지
  const browserLang = (navigator.language || navigator.userLanguage).split('-')[0].toLowerCase();
  if (SUPPORTED_LANGUAGES[browserLang]) {
    return browserLang;
  }
  
  // 기본 언어
  return 'en';
}

// 언어 전환 UI 초기화
function initLanguageSwitcher() {
  const langSwitcher = document.getElementById('language-switcher');
  if (!langSwitcher) return;
  
  const currentLang = detectCurrentLanguage();
  
  // 현재 언어 표시
  const currentLangInfo = SUPPORTED_LANGUAGES[currentLang];
  if (currentLangInfo) {
    const currentLangDisplay = langSwitcher.querySelector('.current-language');
    if (currentLangDisplay) {
      const flagEl = currentLangDisplay.querySelector('.flag');
      const nameEl = currentLangDisplay.querySelector('.lang-name');
      
      if (flagEl) flagEl.className = `flag ${currentLangInfo.flag}`;
      if (nameEl) nameEl.textContent = currentLangInfo.name;
    }
  }
  
  // 드롭다운 메뉴 항목 생성
  const dropdown = langSwitcher.querySelector('.language-dropdown');
  if (dropdown) {
    // 기존 항목 제거
    dropdown.innerHTML = '';
    
    // 새 항목 추가
    Object.entries(SUPPORTED_LANGUAGES).forEach(([code, langInfo]) => {
      const item = document.createElement('a');
      item.href = '#';
      item.className = `lang-option ${currentLang === code ? 'active' : ''}`;
      item.dataset.lang = code;
      item.setAttribute('role', 'menuitem');
      
      const flagSpan = document.createElement('span');
      flagSpan.className = `flag ${langInfo.flag}`;
      
      const nameSpan = document.createElement('span');
      nameSpan.className = 'lang-name';
      nameSpan.textContent = langInfo.name;
      
      item.appendChild(flagSpan);
      item.appendChild(nameSpan);
      
      // 언어 선택 이벤트 처리
      item.addEventListener('click', function(e) {
        e.preventDefault();
        switchLanguage(code);
      });
      
      dropdown.appendChild(item);
    });
  }
  
  // 드롭다운 토글 버튼 이벤트
  const toggleBtn = langSwitcher.querySelector('.toggle-dropdown');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', function(e) {
      e.preventDefault();
      langSwitcher.classList.toggle('open');
    });
    
    // 외부 클릭 시 드롭다운 닫기
    document.addEventListener('click', function(e) {
      if (!langSwitcher.contains(e.target)) {
        langSwitcher.classList.remove('open');
      }
    });
  }
}

// 언어 전환 함수
function switchLanguage(lang) {
  if (!SUPPORTED_LANGUAGES[lang]) return;
  
  // 쿠키에 언어 설정 저장
  setCookie('preferred_language', lang, 30);
  
  // 현재 페이지 경로에서 같은 페이지의 다른 언어 버전으로 리다이렉션
  const currentPath = window.location.pathname;
  const filename = currentPath.split('/').pop() || 'index.html';
  
  // 현재 URL에서 언어 디렉토리 경로 제거
  let newPath = '';
  Object.keys(SUPPORTED_LANGUAGES).forEach(langCode => {
    if (currentPath.includes(`/${langCode}/`)) {
      const parts = currentPath.split(`/${langCode}/`);
      if (parts.length > 1) {
        newPath = parts[1];
      }
    }
  });
  
  // 경로가 없으면 현재 파일명 사용
  if (!newPath) {
    newPath = filename;
  }
  
  // 새 언어로 리다이렉션
  window.location.href = `/${lang}/${newPath}`;
}

// 쿠키 유틸리티 함수
function setCookie(name, value, days) {
  let expires = '';
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    expires = '; expires=' + date.toUTCString();
  }
  document.cookie = name + '=' + value + expires + '; path=/';
}

function getCookie(name) {
  const nameEQ = name + '=';
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
}

// 페이지 로드 시 언어 전환 UI 초기화
document.addEventListener('DOMContentLoaded', initLanguageSwitcher); 