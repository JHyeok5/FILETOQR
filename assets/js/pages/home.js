/**
 * home.js - FileToQR 홈페이지 모듈
 * 버전: 1.0.1 (초기화 로직 app-core.js로 이전)
 * 최종 업데이트: 2025-05-19
 * 
 * 이 모듈은 홈페이지 관련 기능을 관리합니다:
 * - 홈페이지 UI 이벤트 처리
 * - 애니메이션 및 슬라이더 관리
 * - 페이지 초기화
 */

// 홈페이지 모듈
const HomePage = {
  /**
   * 초기화 함수
   */
  async init() {
    console.log('HomePage.init() 호출됨 (pages/home.js)');
    
    this.initFeatureAnimation();
    
    // GSAP 및 ScrollTrigger 라이브러리 로드 확인 후 애니메이션 실행
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
      gsap.registerPlugin(ScrollTrigger); // ScrollTrigger 플러그인 등록
      this.animateServiceFlowGSAP();
    } else {
      console.warn('GSAP 또는 ScrollTrigger 라이브러리가 로드되지 않았습니다. 서비스 흐름 애니메이션을 건너뜁니다.');
    }
    
    // 기타 홈페이지 초기화 로직 (예: 슬라이더, CTA 버튼 이벤트 등)
    // this.initExampleSlider(); // 필요시 주석 해제
    // this.initCallToAction(); // 필요시 주석 해제
    
    return this;
  },
  
  /**
   * 기능 애니메이션 초기화 (체험형 플로우)
   */
  initFeatureAnimation() {
    const features = document.querySelectorAll('.feature');
    if (features.length === 0) {
      console.log('애니메이션 대상 (.feature) 없음');
      return;
    }
    console.log(`.feature 요소 ${features.length}개 발견`);

    const stepToClass = {
      1: 'slide-in-left',
      2: 'slide-in-right',
      3: 'slide-up-scale',
      4: 'scan-glow', // SVG에 box-shadow 직접 적용 불가. 래퍼 div 사용 또는 SVG 필터 고려.
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          console.log('요소 교차:', entry.target);
          const step = entry.target.dataset.step;
          const animClass = stepToClass[step] || 'slide-up'; // 기본값 slide-up
          entry.target.classList.add(animClass);
          console.log(`${entry.target.id || 'element'}에 ${animClass} 클래스 추가`);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });

    features.forEach(feature => {
      observer.observe(feature);
    });
    console.log('기능 애니메이션(IntersectionObserver) 초기화 완료');
  },
  
  /**
   * Apple 스타일 GSAP+ScrollTrigger 기반 고급 스크롤 플로우 애니메이션
   */
  animateServiceFlowGSAP() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
        console.warn('GSAP 또는 ScrollTrigger를 찾을 수 없습니다.');
        return;
    }
    console.log('서비스 흐름 GSAP 애니메이션 초기화 시작');

    const svgFile = document.getElementById('svg-file');
    const svgQR = document.getElementById('svg-qr');
    const svgShare = document.getElementById('svg-share');
    const svgMobile = document.getElementById('svg-mobile');

    if (!svgFile || !svgQR || !svgShare || !svgMobile) {
        console.warn('하나 이상의 SVG 요소를 찾을 수 없습니다. 애니메이션을 건너뜁니다.');
        return;
    }

    gsap.set([svgFile, svgQR, svgShare, svgMobile], { opacity: 0, scale: 0.8, y: 40 });
    gsap.set(svgFile, { opacity: 1, scale: 1, y: 0 });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: '.service-flow-section',
        start: 'top 60%',
        end: 'bottom 10%',
        scrub: 1,
        pin: false,
        markers: false // 디버깅 완료 후 false 또는 제거
      }
    });

    // Step 1: 파일 등장
    tl.to(svgFile, { opacity: 1, scale: 1, y: 0, duration: 0.5, ease: 'power2.out' }, 0);
    // Step 2: 파일 → QR로 이동/변형
    tl.to(svgFile, { opacity: 0, scale: 0.7, x: 80, y: -20, duration: 0.6, ease: 'power2.in' }, '+=0.5');
    tl.to(svgQR, { opacity: 1, scale: 1, x: 0, y: 0, duration: 0.7, ease: 'power2.out' }, '<');
    // Step 3: QR → 공유로 이동/변형
    tl.to(svgQR, { opacity: 0, scale: 0.7, x: -60, y: -40, duration: 0.6, ease: 'power2.in' }, '+=0.7');
    tl.to(svgShare, { opacity: 1, scale: 1, x: 0, y: 0, duration: 0.7, ease: 'power2.out' }, '<');
    // Step 4: 공유 → 모바일로 이동/강조
    tl.to(svgShare, { opacity: 0, scale: 0.7, x: 60, y: 40, duration: 0.6, ease: 'power2.in' }, '+=0.7');
    tl.to(svgMobile, { 
        opacity: 1, 
        scale: 1, 
        x: 0, 
        y: 0, 
        duration: 0.7, 
        ease: 'power2.out', 
        onStart: () => {
            // svgMobile.classList.add('scan-glow'); // scan-glow는 SVG에 직접 적용 시 box-shadow 문제 발생 가능
            // SVG 필터 또는 래퍼 div에 적용 고려
            console.log('모바일 SVG 등장, scan-glow 적용 시도');
        } 
    }, '<');
    console.log('서비스 흐름 GSAP 애니메이션 초기화 완료');
  },
  
  /**
   * 예제 슬라이더 초기화
   */
  initExampleSlider() {
    const slider = document.querySelector('.example-slider');
    const slides = document.querySelectorAll('.example-slide');
    
    if (!slider || slides.length === 0) return;
    
    const prevBtn = document.querySelector('.slider-prev');
    const nextBtn = document.querySelector('.slider-next');
    const dots = document.querySelector('.slider-dots');
    
    let currentSlide = 0;
    let slideInterval;
    
    // 슬라이더 자동 재생
    const startSlider = () => {
      slideInterval = setInterval(() => {
        this.navigateSlider(1, slides, dots);
      }, 5000);
    };
    
    // 슬라이더 정지
    const stopSlider = () => {
      clearInterval(slideInterval);
    };
    
    // 인디케이터 점 생성
    if (dots && slides.length > 0) {
      // 기존 점 제거
      dots.innerHTML = '';
      
      for (let i = 0; i < slides.length; i++) {
        const dot = document.createElement('span');
        dot.classList.add('slider-dot');
        if (i === 0) dot.classList.add('active');
        
        dot.addEventListener('click', () => {
          this.showSlide(i, slides, dots);
        });
        
        dots.appendChild(dot);
      }
    }
    
    // 슬라이더 제어 버튼
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        this.navigateSlider(-1, slides, dots);
        stopSlider();
        startSlider();
      });
    }
    
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        this.navigateSlider(1, slides, dots);
        stopSlider();
        startSlider();
      });
    }
    
    // 슬라이더 시작
    startSlider();
    
    // 마우스 호버 시 슬라이더 일시 정지
    slider.addEventListener('mouseenter', stopSlider);
    slider.addEventListener('mouseleave', startSlider);
  },
  
  /**
   * 슬라이더 탐색
   * @param {number} direction - 이동 방향 (1: 다음, -1: 이전)
   * @param {NodeList} slides - 슬라이드 요소 목록
   * @param {HTMLElement} dots - 슬라이더 도트 컨테이너
   */
  navigateSlider(direction, slides, dots) {
    if (slides.length === 0) return;
    
    // 전역 상태 대신 DOM에서 현재 슬라이드 찾기
    let currentSlide = 0;
    for (let i = 0; i < slides.length; i++) {
      if (slides[i].classList.contains('active')) {
        currentSlide = i;
        break;
      }
    }
    
    // 현재 슬라이드 숨기기
    slides[currentSlide].classList.remove('active');
    
    if (dots) {
      const dotsList = dots.querySelectorAll('.slider-dot');
      if (dotsList.length > 0) {
        dotsList[currentSlide].classList.remove('active');
      }
    }
    
    // 다음/이전 슬라이드 인덱스 계산
    currentSlide = (currentSlide + direction + slides.length) % slides.length;
    
    // 새 슬라이드 표시
    slides[currentSlide].classList.add('active');
    
    if (dots) {
      const dotsList = dots.querySelectorAll('.slider-dot');
      if (dotsList.length > 0) {
        dotsList[currentSlide].classList.add('active');
      }
    }
  },
  
  /**
   * 특정 슬라이드 표시
   * @param {number} index - 표시할 슬라이드 인덱스
   * @param {NodeList} slides - 슬라이드 요소 목록
   * @param {HTMLElement} dots - 슬라이더 도트 컨테이너
   */
  showSlide(index, slides, dots) {
    if (slides.length === 0 || index < 0 || index >= slides.length) return;
    
    // 모든 슬라이드 비활성화
    for (let i = 0; i < slides.length; i++) {
      slides[i].classList.remove('active');
    }
    
    // 선택한 슬라이드 활성화
    slides[index].classList.add('active');
    
    if (dots) {
      const dotsList = dots.querySelectorAll('.slider-dot');
      
      if (dotsList.length > 0) {
        // 모든 점 비활성화
        for (let i = 0; i < dotsList.length; i++) {
          dotsList[i].classList.remove('active');
        }
        
        // 선택한 점 활성화
        dotsList[index].classList.add('active');
      }
    }
  },
  
  /**
   * 호출 액션 초기화
   */
  initCallToAction() {
    const ctaButtons = document.querySelectorAll('.get-started-btn');
    
    ctaButtons.forEach(button => {
      button.addEventListener('click', (event) => {
        // 클릭 이벤트 애널리틱스 기록 (옵션)
        if (window.FileToQR && window.FileToQR.analytics) {
          window.FileToQR.analytics.trackEvent('homepage', 'cta_click', 'get_started');
        }
      });
    });
  }
};

if (typeof window !== 'undefined') {
  window.FileToQR = window.FileToQR || {};
  window.FileToQR.pages = window.FileToQR.pages || {};
  window.FileToQR.pages.home = HomePage;
  console.log('HomePage 모듈이 window.FileToQR.pages.home에 등록됨');
}

// 기존의 DOMContentLoaded 리스너는 app-core.js에서 HomePage.init()을 호출하므로 주석 처리 또는 삭제
/*
document.addEventListener('DOMContentLoaded', () => {
  HomePage.init().catch(error => {
    console.error('HomePage 직접 초기화 실패:', error);
  });
});
*/

export default HomePage; 