/**
 * app-core.js - FileToQR 애플리케이션 코어 모듈
 * 버전: 1.0.0
 * 최종 업데이트: 2025-04-28
 * 참조: ../.ai-guides/architecture/module-registry.md
 * 
 * 이 모듈은 애플리케이션의 핵심 기능을 관리합니다:
 * - 모듈 초기화 및 등록
 * - 이벤트 관리
 * - 네비게이션 및 라우팅
 * - 전역 상태 관리
 */

// 즉시 실행 함수로 네임스페이스 보호
(function() {
  'use strict';

  // 앱 네임스페이스
  const FileToQR = window.FileToQR = window.FileToQR || {};

  // 앱 초기화 상태
  let isInitialized = false;

  // 현재 페이지 식별
  const currentPage = getCurrentPage();

  // 앱 초기화 함수
  function init() {
    if (isInitialized) return;
    
    console.log('FileToQR 앱 초기화 중...');
    
    // 모듈 레지스트리 초기화 (아직 구현 전)
    initRegistry();
    
    // 공통 UI 컴포넌트 초기화
    initCommonUI();
    
    // 페이지별 초기화
    initPageSpecific(currentPage);
    
    // 이벤트 리스너 등록
    registerEventListeners();
    
    isInitialized = true;
    console.log('FileToQR 앱 초기화 완료');
  }

  // 현재 페이지 식별 함수
  function getCurrentPage() {
    const path = window.location.pathname;
    
    if (path.endsWith('convert.html')) return 'convert';
    if (path.endsWith('qrcode.html')) return 'qrcode';
    if (path === '/' || path.endsWith('index.html')) return 'home';
    
    return 'other';
  }

  // 모듈 레지스트리 초기화 (실제 구현은 나중에 진행)
  function initRegistry() {
    console.log('모듈 레지스트리 초기화 예정');
    // 향후 구현: registry.js 모듈 로드 및 초기화
  }

  // 공통 UI 컴포넌트 초기화
  function initCommonUI() {
    // 모바일 메뉴 토글 초기화
    const mobileMenuButton = document.querySelector('.mobile-menu-button');
    const mobileMenu = document.querySelector('.mobile-menu');
    
    if (mobileMenuButton && mobileMenu) {
      mobileMenuButton.addEventListener('click', () => {
        mobileMenu.classList.toggle('hidden');
      });
    }
    
    // 다크 모드 토글 초기화 (향후 구현)
    initDarkModeToggle();
  }

  // 다크 모드 토글 초기화
  function initDarkModeToggle() {
    // 향후 구현: 다크 모드 설정 및 토글 기능
    console.log('다크 모드 토글 초기화 예정');
  }

  // 페이지별 초기화
  function initPageSpecific(page) {
    console.log(`${page} 페이지 초기화`);
    
    switch (page) {
      case 'home':
        // 홈 페이지 특정 기능 초기화
        break;
        
      case 'convert':
        // 파일 변환 페이지 초기화 (향후 구현)
        break;
        
      case 'qrcode':
        // QR 코드 페이지 초기화 (향후 구현)
        break;
        
      default:
        // 기타 페이지
        break;
    }
  }

  // 이벤트 리스너 등록
  function registerEventListeners() {
    // 문서 로드 완료 리스너
    document.addEventListener('DOMContentLoaded', () => {
      console.log('DOM 로드 완료');
    });
    
    // 창 크기 변경 리스너
    window.addEventListener('resize', handleResize);
    
    // 스크롤 이벤트 리스너
    window.addEventListener('scroll', handleScroll);
  }

  // 창 크기 변경 핸들러
  function handleResize() {
    // 반응형 UI 조정 (필요시)
  }

  // 스크롤 이벤트 핸들러
  function handleScroll() {
    // 스크롤 위치에 따른 UI 조정 (필요시)
  }

  // 토스트 메시지 표시 유틸리티
  FileToQR.showToast = function(message, type = 'info', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 300);
    }, duration);
  };

  // 앱 초기화
  init();
})(); 