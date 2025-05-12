/**
 * 사용자의 브라우저 언어 설정이나 로케일에 따라 적절한 언어 페이지로 리다이렉션하는 스크립트
 * 
 * 사용법: 모든 루트 HTML 파일에 이 스크립트를 포함시키면 자동으로 리다이렉션됩니다.
 */

document.addEventListener('DOMContentLoaded', function() {
  // 이미 쿠키에 언어 설정이 있는지 확인
  const savedLanguage = getCookie('preferred_language');
  
  // 현재 페이지 경로 가져오기
  const currentPath = window.location.pathname;
  const filename = currentPath.split('/').pop() || 'index.html';
  
  // 리다이렉션이 이미 처리되었는지 확인 (무한 리다이렉션 방지)
  const hasRedirected = sessionStorage.getItem('redirected');
  if (hasRedirected) {
    return;
  }
  
  // 현재 경로에 언어 폴더가 포함되어 있으면 리다이렉션하지 않음
  if (currentPath.includes('/ko/') || 
      currentPath.includes('/en/') || 
      currentPath.includes('/zh/') || 
      currentPath.includes('/ja/')) {
    
    // 현재 경로에서 언어 추출하여 쿠키에 저장
    let langFromPath = null;
    if (currentPath.includes('/ko/')) langFromPath = 'ko';
    else if (currentPath.includes('/en/')) langFromPath = 'en';
    else if (currentPath.includes('/zh/')) langFromPath = 'zh';
    else if (currentPath.includes('/ja/')) langFromPath = 'ja';
    
    if (langFromPath && savedLanguage !== langFromPath) {
      setCookie('preferred_language', langFromPath, 30); // 30일 유효
    }
    
    return;
  }
  
  // 리다이렉션 URL 설정
  let redirectFolder = 'en'; // 기본값은 영어
  
  // 저장된 언어 설정이 있으면 사용, 없으면 브라우저 언어 감지
  if (savedLanguage) {
    redirectFolder = savedLanguage;
  } else {
    // 브라우저 언어 감지
    const userLanguage = navigator.language || navigator.userLanguage;
    const language = userLanguage.split('-')[0].toLowerCase();
    
    // 언어에 따라 리다이렉션 폴더 설정
    if (language === 'ko') {
      redirectFolder = 'ko';  // 한국어
    } else if (language === 'zh') {
      redirectFolder = 'zh';  // 중국어
    } else if (language === 'ja') {
      redirectFolder = 'ja';  // 일본어
    }
    
    // 선택한 언어를 쿠키에 저장
    setCookie('preferred_language', redirectFolder, 30); // 30일 유효
  }
  
  // 리다이렉션 수행 전 세션 스토리지에 표시
  sessionStorage.setItem('redirected', 'true');
  
  // 리다이렉션 URL 생성 및 이동
  window.location.href = redirectFolder + '/' + filename;
});

// 쿠키 관련 유틸리티 함수
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