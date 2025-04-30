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
import ModuleLoader from '../utils/module-loader.js';
import UrlUtils from '../utils/url-utils.js';

// 즉시 실행 함수로 네임스페이스 보호
(function() {
  'use strict';

  // 앱 네임스페이스
  const FileToQR = window.FileToQR = window.FileToQR || {};

  // =========================================================================
  // 버전 관리 시스템
  // =========================================================================
  
  // 외부 버전 관리 시스템으로 대체되었습니다.
  // import '../utils/version-manager.js' 참조

  // =========================================================================
  // 코어 앱 초기화
  // =========================================================================
  
  /**
   * 앱 초기화
   * 전체 애플리케이션 초기화 프로세스를 담당
   * @async
   */
  async function init() {
    console.log('FileToQR 앱 초기화 중...');
    
    try {
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
      
      console.log('FileToQR 앱 초기화 완료');
    } catch (error) {
      console.error('앱 초기화 중 오류 발생:', error);
    }
  }

  // 현재 페이지 식별 함수
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
  
  // 모듈 로더 초기화
  function initModuleLoader() {
    // 핵심 모듈만 등록 - 나머지는 registry.js에서 통합 관리
    ModuleLoader.registerModule('app-core', '/assets/js/core/app-core.js', []);
    ModuleLoader.registerModule('url-utils', '/assets/js/utils/url-utils.js', []);
    ModuleLoader.registerModule('module-loader', '/assets/js/utils/module-loader.js', []);
    ModuleLoader.registerModule('registry', '/assets/js/registry.js', ['app-core']);
    
    console.log('모듈 로더 초기화 완료');
  }

  // 모듈 레지스트리 초기화
  function initRegistry() {
    // registry.js에서 ModuleRegistry 클래스를 정의하고 인스턴스화하므로 여기서는 생략
    
    // 레지스트리 로드 확인
    if (FileToQR.registry) {
      console.log('모듈 레지스트리 초기화 완료');
    } else {
      console.warn('모듈 레지스트리가 로드되지 않았습니다. registry.js 파일을 확인하세요.');
    }
  }
  
  // URL 표준화 적용
  function standardizeUrls() {
    // 모든 내부 링크 표준화
    UrlUtils.standardizeLinks(CONFIG.linkStandardization.includeExtension);
    console.log('URL 표준화 완료');
  }

  // 컴포넌트 시스템 초기화
  async function initComponentSystem() {
    try {
      console.log('컴포넌트 시스템 초기화 중...');
      
      // 새로운 컴포넌트 시스템 모듈 로드
      const ComponentSystem = await import('../core/component-system.js').then(module => module.default);
      const VersionManager = await import('../utils/version-manager.js').then(module => module.default);
      const TemplateUtils = await import('../utils/template-utils.js').then(module => module.default);
      
      // 글로벌 네임스페이스에 등록
      FileToQR.ComponentSystem = ComponentSystem;
      FileToQR.VersionManager = VersionManager;
      FileToQR.TemplateUtils = TemplateUtils;
      
      // 버전 등록
      VersionManager.registerVersion('component-system', '1.0.0');
      VersionManager.registerVersion('template-utils', '1.0.0');
      
      // UI 컴포넌트 모듈 로드 및 초기화
      const UIComponents = await import('../ui/ui-components.js').then(module => module.default);
      FileToQR.UIComponents = UIComponents;
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
    
    FileToQR.globalComponentContainer = container;
    return container;
  }
  
  /**
   * 전역 컴포넌트 초기화
   * 알림, 토스트, 모달 등 전역에서 접근 가능한 컴포넌트 생성
   */
  function initGlobalComponents() {
    const container = FileToQR.globalComponentContainer;
    
    // 토스트 메시지 컴포넌트
    const toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.style.pointerEvents = 'auto'; // 이 컨테이너 내부에서는 클릭 허용
    container.appendChild(toastContainer);
    
    const toastId = FileToQR.ComponentSystem.mountComponent('toast', toastContainer, {
      position: 'bottom-right'
    });
    
    // 전역 토스트 함수 등록
    FileToQR.showToast = function(options) {
      const instance = FileToQR.ComponentSystem.instances.get(toastId);
      if (instance) {
        return instance.definition.show.call(instance, options);
      }
    };
    
    // 모달 컴포넌트
    const modalContainer = document.createElement('div');
    modalContainer.id = 'modal-container';
    modalContainer.style.pointerEvents = 'auto'; // 이 컨테이너 내부에서는 클릭 허용
    container.appendChild(modalContainer);
    
    const modalId = FileToQR.ComponentSystem.mountComponent('modal', modalContainer, {
      visible: false
    });
    
    // 전역 모달 함수 등록
    FileToQR.showModal = function(options) {
      const instance = FileToQR.ComponentSystem.instances.get(modalId);
      if (instance) {
        instance.definition.open.call(instance, options);
      }
    };
    
    FileToQR.closeModal = function() {
      const instance = FileToQR.ComponentSystem.instances.get(modalId);
      if (instance) {
        instance.definition.close.call(instance);
      }
    };
    
    console.log('전역 컴포넌트 초기화 완료');
  }

  // 공통 UI 컴포넌트 초기화
  async function initCommonUI() {
    // 기본 컴포넌트 로드 (헤더 및 푸터)
    await FileToQR.components.loadDefault();
    
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
    
    console.log('공통 UI 컴포넌트 초기화 완료');
  }

  // 다크 모드 토글 초기화
  function initDarkModeToggle() {
    // 향후 구현: 다크 모드 설정 및 토글 기능
    console.log('다크 모드 토글 초기화 예정');
  }

  // 페이지별 초기화
  async function initPageSpecific(page) {
    console.log(`'${page}' 페이지 초기화 중...`);
    
    switch (page) {
      case 'home':
        initHomePage();
        break;
        
      case 'convert':
        // 파일 변환기 모듈 초기화
        if (typeof fileConverter !== 'undefined' && fileConverter.init) {
          fileConverter.init();
          console.log('파일 변환기 모듈 초기화 완료');
        } else {
          console.warn('파일 변환기 모듈을 찾을 수 없습니다.');
        }
        break;
        
      case 'qrcode':
        // QR 코드 생성기 모듈 초기화
        if (typeof qrGenerator !== 'undefined' && qrGenerator.init) {
          qrGenerator.init();
          console.log('QR 코드 생성기 모듈 초기화 완료');
        } else {
          console.warn('QR 코드 생성기 모듈을 찾을 수 없습니다.');
        }
        
        // QR 코드 스캐너 모듈 초기화
        if (typeof qrScanner !== 'undefined' && qrScanner.init) {
          qrScanner.init();
          console.log('QR 코드 스캐너 모듈 초기화 완료');
        }
        break;
        
      case 'privacy':
      case 'terms':
      case 'help':
        // 정적 페이지에서는 특별한 초기화 작업 없음
        break;
        
      default:
        console.log(`'${page}' 페이지에 대한 특별한 초기화 처리가 정의되지 않았습니다.`);
    }
    
    // 공통 컴포넌트 초기화
    initCommonComponents();
    
    console.log(`'${page}' 페이지 초기화 완료`);
    return true;
  }

  // 홈 페이지 초기화
  function initHomePage() {
    // 특징 섹션 애니메이션 효과
    initFeatureAnimation();
    
    // 예제 섹션 슬라이더 초기화
    initExampleSlider();
  }

  /**
   * 특징 섹션의 아이콘 및 텍스트에 애니메이션 효과 적용
   */
  function initFeatureAnimation() {
    const features = document.querySelectorAll('.feature-item');
    
    if (features.length === 0) return;
    
    // 간단한 등장 애니메이션
    features.forEach((feature, index) => {
      setTimeout(() => {
        feature.classList.add('animated');
      }, 200 * index);
    });
  }

  /**
   * 예제 슬라이더 초기화 (있을 경우)
   */
  function initExampleSlider() {
    const slider = document.querySelector('.example-slider');
    if (!slider) return;
    
    // 슬라이더 내비게이션 버튼 이벤트
    const prevBtn = slider.querySelector('.prev-slide');
    const nextBtn = slider.querySelector('.next-slide');
    
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        // 이전 슬라이드로 이동
        navigateSlider('prev');
      });
    }
    
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        // 다음 슬라이드로 이동
        navigateSlider('next');
      });
    }
  }

  /**
   * 슬라이더 내비게이션 처리
   * @param {string} direction - 슬라이드 방향 ('prev' 또는 'next')
   */
  function navigateSlider(direction) {
    const slider = document.querySelector('.example-slider');
    if (!slider) return;
    
    const slides = slider.querySelectorAll('.slide');
    if (slides.length === 0) return;
    
    const activeSlide = slider.querySelector('.slide.active');
    let nextIndex = 0;
    
    // 현재 활성 슬라이드 인덱스 찾기
    for (let i = 0; i < slides.length; i++) {
      if (slides[i] === activeSlide) {
        if (direction === 'next') {
          nextIndex = (i + 1) % slides.length;
        } else {
          nextIndex = (i - 1 + slides.length) % slides.length;
        }
        break;
      }
    }
    
    // 활성 슬라이드 변경
    activeSlide.classList.remove('active');
    slides[nextIndex].classList.add('active');
  }

  // 이벤트 리스너 등록
  function registerEventListeners() {
    // 문서 로드 완료 리스너
    document.addEventListener('DOMContentLoaded', () => {
      console.log('DOM 로드 완료');
      
      // URL 표준화 적용
      standardizeUrls();
    });
    
    // 창 크기 변경 리스너
    window.addEventListener('resize', handleResize);
    
    // 스크롤 이벤트 리스너
    window.addEventListener('scroll', handleScroll);
    
    // 내비게이션 이벤트 리스너
    window.addEventListener('popstate', () => {
      // 페이지 이동 시 URL 표준화 재적용
      standardizeUrls();
    });
  }

  // 창 크기 변경 핸들러
  function handleResize() {
    // 반응형 UI 조정 (필요시)
  }

  // 스크롤 이벤트 핸들러
  function handleScroll() {
    // 스크롤 위치에 따른 UI 조정 (필요시)
  }

  // 앱 초기화
  document.addEventListener('DOMContentLoaded', init);
  
  // 공개 API
  FileToQR.init = init;
  FileToQR.getCurrentPage = getCurrentPage;
  FileToQR.standardizeUrls = standardizeUrls;
})();

// 모듈 익스포트
export default window.FileToQR; 