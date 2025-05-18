/**
 * home.js - FileToQR 홈페이지 모듈
 * 버전: 1.0.0
 * 최종 업데이트: 2025-06-15
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
  init() {
    console.log('홈페이지 모듈 초기화');
    
    this.initFeatureAnimation();
    this.animateServiceFlow();
    this.initExampleSlider();
    this.initCallToAction();
    
    return this;
  },
  
  /**
   * 기능 애니메이션 초기화 (체험형 플로우)
   */
  initFeatureAnimation() {
    const features = document.querySelectorAll('.feature');
    if (features.length === 0) return;

    // 단계별 애니메이션 클래스 매핑
    const stepToClass = {
      1: 'slide-in-left',
      2: 'slide-in-right',
      3: 'slide-up-scale',
      4: 'scan-glow',
    };

    // Intersection Observer로 각 단계별 애니메이션 적용
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const step = entry.target.dataset.step;
          const animClass = stepToClass[step] || 'slide-up';
          entry.target.classList.add(animClass);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });

    features.forEach(feature => {
      observer.observe(feature);
    });
  },
  
  /**
   * 서비스 플로우 SVG 오브젝트 체험형 애니메이션
   * - 각 단계 등장 시, 이전 SVG가 fade/slide로 사라지고 다음 SVG가 자연스럽게 이동/변환/강조됨
   */
  animateServiceFlow() {
    // 각 SVG 오브젝트
    const svgFile = document.getElementById('svg-file');
    const svgQR = document.getElementById('svg-qr');
    const svgShare = document.getElementById('svg-share');
    const svgMobile = document.getElementById('svg-mobile');

    // 각 feature 영역
    const featureUpload = document.getElementById('feature-upload');
    const featureQR = document.getElementById('feature-qrcode');
    const featureShare = document.getElementById('feature-share');
    const featureMobile = document.getElementById('feature-mobile');

    // 초기 상태: 파일만 보임
    svgFile.style.opacity = '1';
    svgQR.style.opacity = '0';
    svgShare.style.opacity = '0';
    svgMobile.style.opacity = '0';
    svgFile.style.transform = 'none';
    svgQR.style.transform = 'none';
    svgShare.style.transform = 'none';
    svgMobile.style.transform = 'none';

    // Intersection Observer로 각 단계별 SVG 애니메이션 트리거
    const stepObservers = [
      { elem: featureUpload, onEnter: () => {
          svgFile.style.transition = 'opacity 0.7s, transform 0.7s';
          svgFile.style.opacity = '1';
          svgFile.style.transform = 'none';
        } },
      { elem: featureQR, onEnter: () => {
          // 파일 → QR로 이동/변환
          svgFile.style.transition = 'opacity 0.7s, transform 0.7s';
          svgFile.style.opacity = '0';
          svgFile.style.transform = 'translateX(80px) scale(0.7)';
          svgQR.style.transition = 'opacity 0.7s, transform 0.7s';
          svgQR.style.opacity = '1';
          svgQR.style.transform = 'none';
        } },
      { elem: featureShare, onEnter: () => {
          // QR → 공유로 이동
          svgQR.style.transition = 'opacity 0.7s, transform 0.7s';
          svgQR.style.opacity = '0';
          svgQR.style.transform = 'translateY(-40px) scale(0.7)';
          svgShare.style.transition = 'opacity 0.7s, transform 0.7s';
          svgShare.style.opacity = '1';
          svgShare.style.transform = 'none';
        } },
      { elem: featureMobile, onEnter: () => {
          // 공유 → 모바일로 이동, 모바일 강조
          svgShare.style.transition = 'opacity 0.7s, transform 0.7s';
          svgShare.style.opacity = '0';
          svgShare.style.transform = 'translateX(-80px) scale(0.7)';
          svgMobile.style.transition = 'opacity 0.7s, transform 0.7s, box-shadow 0.7s';
          svgMobile.style.opacity = '1';
          svgMobile.style.transform = 'none';
          svgMobile.classList.add('scan-glow');
        } },
    ];

    stepObservers.forEach(({ elem, onEnter }) => {
      if (!elem) return;
      const obs = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            onEnter();
            obs.unobserve(entry.target);
          }
        });
      }, { threshold: 0.4 });
      obs.observe(elem);
    });
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

// 글로벌 네임스페이스에 등록
if (typeof window !== 'undefined') {
  window.FileToQR = window.FileToQR || {};
  window.FileToQR.pages = window.FileToQR.pages || {};
  window.FileToQR.pages.home = HomePage;
}

// Registry에 등록
if (typeof window !== 'undefined' && window.FileToQR && window.FileToQR.registry) {
  try {
    window.FileToQR.registry.register('pages', 'home', HomePage);
  } catch (error) {
    console.warn('홈페이지 모듈을 레지스트리에 등록하는 중 오류 발생:', error);
  }
}

export default HomePage; 