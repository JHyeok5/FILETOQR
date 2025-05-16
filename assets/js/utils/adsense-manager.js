/**
 * adsense-manager.js - FileToQR Google AdSense 관리 모듈
 * 버전: 1.0.0
 * 최종 업데이트: 2025-05-25
 * 참조: ../.ai-guides/architecture/module-registry.md
 * 
 * 이 모듈은 웹사이트 전반에 걸쳐 Google AdSense 광고를 관리합니다:
 * - 광고 컨테이너 로드 및 삽입
 * - 광고 슬롯 최적화
 * - 광고 블로커 감지
 * - 응답형 광고 관리
 */

// 즉시 실행 함수로 네임스페이스 보호
(function() {
  'use strict';

  // 전역 네임스페이스
  const FileToQR = window.FileToQR = window.FileToQR || {};
  
  // 모듈 네임스페이스
  const adsenseManager = FileToQR.adsenseManager = {};
  
  // 광고 설정
  let adConfig = {
    enabled: true,
    adClient: 'ca-pub-XXXXXXXXXXXXXXXX',
    headerSlot: 'XXXXXXXXXX',
    sidebarSlot: 'XXXXXXXXXX',
    contentSlot: 'XXXXXXXXXX',
    footerSlot: 'XXXXXXXXXX',
    responsive: true,
    loadOnScroll: true,
    blockerDetection: true
  };
  
  // 광고 로드 상태
  let adState = {
    initialized: false,
    headerLoaded: false,
    sidebarLoaded: false,
    contentLoaded: false,
    footerLoaded: false
  };
  
  /**
   * 모듈 초기화
   * @param {Object} config - 광고 설정 (선택사항)
   */
  function init(config = {}) {
    // 이미 초기화된 경우 중복 실행 방지
    if (adState.initialized) return;
    
    console.log('AdSense 관리자 초기화 중...');
    
    // 설정 병합
    adConfig = { ...adConfig, ...config };
    
    // Google AdSense 스크립트 로드
    loadAdSenseScript();
    
    // 광고 컨테이너 로드
    loadAdContainers();
    
    // 광고 차단기 감지
    if (adConfig.blockerDetection) {
      detectAdBlocker();
    }
    
    // 스크롤 이벤트에 따른 광고 로드 (선택 사항)
    if (adConfig.loadOnScroll) {
      window.addEventListener('scroll', handleScroll);
    }
    
    adState.initialized = true;
    console.log('AdSense 관리자 초기화 완료');
  }
  
  /**
   * Google AdSense 스크립트 로드
   */
  function loadAdSenseScript() {
    if (document.querySelector('script[src*="adsbygoogle"]')) return;
    
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js';
    script.onerror = () => console.error('AdSense 스크립트 로드 실패');
    
    document.head.appendChild(script);
  }
  
  /**
   * 광고 컨테이너 로드 및 삽입
   */
  function loadAdContainers() {
    fetch('/components/ad-containers.html')
      .then(response => {
        if (!response.ok) {
          throw new Error('광고 컨테이너 로드 실패');
        }
        return response.text();
      })
      .then(html => {
        // DOM에 파싱
        const parser = new DOMParser();
        const adContainers = parser.parseFromString(html, 'text/html');
        
        // 각 광고 컨테이너 삽입
        insertAdContainer('header', adContainers.getElementById('ad-header'));
        insertAdContainer('sidebar', adContainers.getElementById('ad-sidebar'));
        insertAdContainer('content', adContainers.getElementById('ad-content'));
        insertAdContainer('footer', adContainers.getElementById('ad-footer'));
        
        // 필요한 경우 AdSense 초기화
        if (window.adsbygoogle && window.adsbygoogle.push) {
          updateAdSlots();
        }
      })
      .catch(error => {
        console.error('광고 컨테이너 로드 중 오류:', error);
      });
  }
  
  /**
   * 특정 광고 컨테이너 삽입
   * @param {String} location - 삽입 위치 (header, sidebar, content, footer)
   * @param {HTMLElement} container - 광고 컨테이너 요소
   */
  function insertAdContainer(location, container) {
    if (!container) return;
    
    // 삽입 위치에 따라 다른 처리
    switch (location) {
      case 'header':
        // 헤더 광고 삽입 (페이지 상단)
        const header = document.querySelector('header');
        if (header) {
          header.parentNode.insertBefore(container, header.nextSibling);
          adState.headerLoaded = true;
        }
        break;
        
      case 'sidebar':
        // 사이드바 광고 삽입 (적절한 사이드바 요소 찾기)
        const sidebar = document.querySelector('.sidebar') || document.querySelector('aside');
        if (sidebar) {
          sidebar.appendChild(container);
          adState.sidebarLoaded = true;
        }
        break;
        
      case 'content':
        // 컨텐츠 중간 광고 삽입 (메인 콘텐츠 영역 내 중간 지점)
        const main = document.querySelector('main');
        if (main) {
          const sections = main.querySelectorAll('section');
          if (sections.length > 1) {
            // 첫 번째와 두 번째 섹션 사이에 삽입
            sections[0].parentNode.insertBefore(container, sections[1]);
          } else {
            // 첫 번째 단락 뒤에 삽입
            const paragraphs = main.querySelectorAll('p');
            if (paragraphs.length > 1) {
              paragraphs[0].parentNode.insertBefore(container, paragraphs[1].nextSibling);
            } else {
              main.appendChild(container);
            }
          }
          adState.contentLoaded = true;
        }
        break;
        
      case 'footer':
        // 푸터 광고 삽입 (푸터 바로 위)
        const footer = document.querySelector('footer');
        if (footer) {
          footer.parentNode.insertBefore(container, footer);
          adState.footerLoaded = true;
        }
        break;
    }
  }
  
  /**
   * AdSense 슬롯 업데이트
   */
  function updateAdSlots() {
    // 각 광고 슬롯의 클라이언트 ID 및 슬롯 ID 설정
    const adSlots = document.querySelectorAll('.ad-slot ins.adsbygoogle');
    
    adSlots.forEach(slot => {
      slot.setAttribute('data-ad-client', adConfig.adClient);
      
      // 위치에 따라 다른 슬롯 ID 설정
      const container = slot.closest('.ad-container');
      if (container) {
        if (container.id === 'ad-header') {
          slot.setAttribute('data-ad-slot', adConfig.headerSlot);
        } else if (container.id === 'ad-sidebar') {
          slot.setAttribute('data-ad-slot', adConfig.sidebarSlot);
        } else if (container.id === 'ad-content') {
          slot.setAttribute('data-ad-slot', adConfig.contentSlot);
        } else if (container.id === 'ad-footer') {
          slot.setAttribute('data-ad-slot', adConfig.footerSlot);
        }
      }
    });
    
    // 광고 초기화
    (adsbygoogle = window.adsbygoogle || []).push({});
  }
  
  /**
   * 광고 차단기 감지
   */
  function detectAdBlocker() {
    // 간단한 광고 차단기 감지 방법
    setTimeout(() => {
      const testAd = document.createElement('div');
      testAd.innerHTML = '&nbsp;';
      testAd.className = 'adsbox';
      document.body.appendChild(testAd);
      
      setTimeout(() => {
        const isAdBlocker = testAd.offsetHeight === 0;
        document.body.removeChild(testAd);
        
        if (isAdBlocker) {
          console.log('광고 차단기가 감지되었습니다.');
          // 여기에 광고 차단기 대응 로직 추가
        }
      }, 100);
    }, 500);
  }
  
  /**
   * 스크롤 이벤트 핸들러 (지연 로딩용)
   */
  function handleScroll() {
    // 이미 모든 광고가 로드된 경우 이벤트 리스너 제거
    if (adState.headerLoaded && adState.contentLoaded && adState.footerLoaded) {
      window.removeEventListener('scroll', handleScroll);
      return;
    }
    
    // 페이지의 스크롤 위치에 따라 광고 로드
    const scrollPosition = window.scrollY;
    const pageHeight = document.body.scrollHeight;
    const viewportHeight = window.innerHeight;
    
    // 페이지의 중간 지점에 도달하면 콘텐츠 광고 로드
    if (!adState.contentLoaded && scrollPosition > viewportHeight * 0.5) {
      const contentAdContainer = document.getElementById('ad-content');
      if (contentAdContainer) {
        const adSlot = contentAdContainer.querySelector('.ad-slot ins.adsbygoogle');
        if (adSlot && window.adsbygoogle) {
          window.adsbygoogle.push({});
          adState.contentLoaded = true;
        }
      }
    }
    
    // 페이지의 70% 지점에 도달하면 푸터 광고 로드
    if (!adState.footerLoaded && scrollPosition > (pageHeight - viewportHeight) * 0.7) {
      const footerAdContainer = document.getElementById('ad-footer');
      if (footerAdContainer) {
        const adSlot = footerAdContainer.querySelector('.ad-slot ins.adsbygoogle');
        if (adSlot && window.adsbygoogle) {
          window.adsbygoogle.push({});
          adState.footerLoaded = true;
        }
      }
    }
  }
  
  // 모듈 API 설정
  adsenseManager.init = init;
  adsenseManager.loadAdContainers = loadAdContainers;
  adsenseManager.updateAdSlots = updateAdSlots;
  
  // 페이지 로드 시 자동 초기화
  document.addEventListener('DOMContentLoaded', init);
  
})(); 