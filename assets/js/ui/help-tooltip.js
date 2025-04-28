/**
 * help-tooltip.js - FileToQR 도움말 툴팁 모듈
 * 버전: 1.0.0
 * 최종 업데이트: 2025-04-28
 * 참조: ../.ai-guides/architecture/module-registry.md
 * 
 * 이 모듈은 사용자에게 컨텍스트 기반 도움말을 제공하는
 * 툴팁 시스템을 구현합니다:
 * - 직관적인 도움말 아이콘 및 툴팁 UI
 * - 다양한 위치 옵션(상단, 하단, 좌측, 우측)
 * - 간단한 텍스트부터 복잡한 HTML 콘텐츠까지 지원
 * - 사용자 행동 기반 자동 표시 기능
 */

class HelpTooltip {
  constructor(options = {}) {
    // 기본 설정 값
    this.options = {
      tooltipClass: 'help-tooltip',
      iconClass: 'help-icon',
      arrowClass: 'tooltip-arrow',
      triggerAttribute: 'data-tooltip',
      placement: 'top', // top, bottom, left, right
      showDelay: 300,
      hideDelay: 200,
      autoHide: true,
      showOnFocus: true,
      trackUsage: true,
      maxWidth: 300,
      ...options
    };

    // 툴팁 요소 컨테이너
    this.tooltipContainer = null;
    
    // 현재 활성 툴팁
    this.activeTooltip = null;
    
    // 타이머 아이디 (딜레이용)
    this.showTimer = null;
    this.hideTimer = null;
    
    // 초기화
    this.init();
  }

  /**
   * 초기화
   */
  init() {
    // 툴팁 컨테이너 생성
    this.createTooltipContainer();
    
    // 이벤트 리스너 등록
    this.bindEvents();
    
    // 도움말 아이콘 자동 추가 (옵션 활성화 시)
    if (this.options.autoAddIcons) {
      this.addHelpIconsToElements();
    }
  }

  /**
   * 툴팁 컨테이너 생성
   */
  createTooltipContainer() {
    // 이미 존재하는 경우 재사용
    const existingContainer = document.getElementById('tooltip-container');
    if (existingContainer) {
      this.tooltipContainer = existingContainer;
      return;
    }
    
    // 새 컨테이너 생성
    this.tooltipContainer = document.createElement('div');
    this.tooltipContainer.id = 'tooltip-container';
    this.tooltipContainer.style.position = 'absolute';
    this.tooltipContainer.style.top = '0';
    this.tooltipContainer.style.left = '0';
    this.tooltipContainer.style.zIndex = '9999';
    this.tooltipContainer.style.pointerEvents = 'none';
    
    // body에 추가
    document.body.appendChild(this.tooltipContainer);
  }

  /**
   * 이벤트 리스너 바인딩
   */
  bindEvents() {
    // 모든 툴팁 트리거 요소에 이벤트 리스너 추가
    document.addEventListener('mouseover', (event) => {
      const trigger = this.findTooltipTrigger(event.target);
      if (trigger) {
        this.handleTooltipTrigger(trigger, 'show');
      }
    });
    
    document.addEventListener('mouseout', (event) => {
      const trigger = this.findTooltipTrigger(event.target);
      if (trigger) {
        this.handleTooltipTrigger(trigger, 'hide');
      }
    });
    
    // 포커스 이벤트 처리 (접근성 향상)
    if (this.options.showOnFocus) {
      document.addEventListener('focus', (event) => {
        const trigger = this.findTooltipTrigger(event.target);
        if (trigger) {
          this.handleTooltipTrigger(trigger, 'show');
        }
      }, true);
      
      document.addEventListener('blur', (event) => {
        const trigger = this.findTooltipTrigger(event.target);
        if (trigger) {
          this.handleTooltipTrigger(trigger, 'hide');
        }
      }, true);
    }
    
    // 키보드 접근성
    document.addEventListener('keydown', (event) => {
      // ESC 키로 툴팁 닫기
      if (event.key === 'Escape' && this.activeTooltip) {
        this.hideTooltip();
      }
    });
    
    // 창 크기 변경 시 툴팁 위치 조정
    window.addEventListener('resize', () => {
      if (this.activeTooltip) {
        const trigger = document.querySelector(`[aria-describedby="${this.activeTooltip.id}"]`);
        if (trigger) {
          this.positionTooltip(this.activeTooltip, trigger);
        }
      }
    });
    
    // 페이지 스크롤 시 툴팁 위치 조정
    window.addEventListener('scroll', () => {
      if (this.activeTooltip) {
        const trigger = document.querySelector(`[aria-describedby="${this.activeTooltip.id}"]`);
        if (trigger) {
          this.positionTooltip(this.activeTooltip, trigger);
        }
      }
    }, { passive: true });
  }

  /**
   * 툴팁 트리거 요소 찾기
   * @param {HTMLElement} element - 이벤트 대상 요소
   * @returns {HTMLElement|null} 툴팁 트리거 요소 또는 null
   */
  findTooltipTrigger(element) {
    // 요소 자체가 트리거인지 확인
    if (element.hasAttribute(this.options.triggerAttribute) || 
        element.classList.contains(this.options.iconClass)) {
      return element;
    }
    
    // 상위 요소 중 트리거 찾기 (이벤트 위임)
    let parent = element.closest(`[${this.options.triggerAttribute}]`);
    if (parent) {
      return parent;
    }
    
    // 도움말 아이콘 찾기
    parent = element.closest(`.${this.options.iconClass}`);
    if (parent) {
      return parent;
    }
    
    return null;
  }

  /**
   * 툴팁 트리거 처리
   * @param {HTMLElement} trigger - 트리거 요소
   * @param {String} action - 'show' 또는 'hide'
   */
  handleTooltipTrigger(trigger, action) {
    if (action === 'show') {
      // 이전 타이머 취소
      clearTimeout(this.hideTimer);
      
      // 지연 표시
      this.showTimer = setTimeout(() => {
        this.showTooltip(trigger);
      }, this.options.showDelay);
    } else if (action === 'hide') {
      // 이전 타이머 취소
      clearTimeout(this.showTimer);
      
      // 지연 숨김
      this.hideTimer = setTimeout(() => {
        this.hideTooltip();
      }, this.options.hideDelay);
    }
  }

  /**
   * 툴팁 표시
   * @param {HTMLElement} trigger - 트리거 요소
   */
  showTooltip(trigger) {
    // 이미 표시된 툴팁이 있으면 숨김
    if (this.activeTooltip) {
      this.hideTooltip();
    }
    
    // 툴팁 콘텐츠 가져오기
    const content = this.getTooltipContent(trigger);
    if (!content) return;
    
    // 툴팁 요소 생성
    const tooltip = this.createTooltipElement(content);
    this.tooltipContainer.appendChild(tooltip);
    
    // 툴팁 위치 설정
    this.positionTooltip(tooltip, trigger);
    
    // 접근성 속성 설정
    const tooltipId = tooltip.id;
    trigger.setAttribute('aria-describedby', tooltipId);
    
    // 표시 애니메이션
    setTimeout(() => {
      tooltip.classList.add('visible');
    }, 10);
    
    // 현재 툴팁 저장
    this.activeTooltip = tooltip;
    
    // 사용량 추적 (옵션 활성화 시)
    if (this.options.trackUsage && window.analytics) {
      try {
        window.analytics.trackAction('help', 'tooltip_viewed', trigger.getAttribute('data-tooltip-title') || 'unnamed');
      } catch (error) {
        console.error('사용량 추적 실패:', error);
      }
    }
  }

  /**
   * 툴팁 숨김
   */
  hideTooltip() {
    if (!this.activeTooltip) return;
    
    // 접근성 속성 제거
    const trigger = document.querySelector(`[aria-describedby="${this.activeTooltip.id}"]`);
    if (trigger) {
      trigger.removeAttribute('aria-describedby');
    }
    
    // 숨김 애니메이션
    this.activeTooltip.classList.remove('visible');
    
    // 요소 제거 (애니메이션 후)
    setTimeout(() => {
      if (this.activeTooltip && this.activeTooltip.parentNode) {
        this.activeTooltip.parentNode.removeChild(this.activeTooltip);
      }
      this.activeTooltip = null;
    }, 200);
  }

  /**
   * 툴팁 콘텐츠 가져오기
   * @param {HTMLElement} trigger - 트리거 요소
   * @returns {String|HTMLElement} 툴팁 콘텐츠
   */
  getTooltipContent(trigger) {
    // 직접 속성에서 가져오기
    const content = trigger.getAttribute(this.options.triggerAttribute);
    if (content) {
      return content;
    }
    
    // 도움말 아이콘인 경우
    if (trigger.classList.contains(this.options.iconClass)) {
      return trigger.getAttribute('title') || trigger.getAttribute('data-tooltip-content');
    }
    
    // ID 참조로 가져오기
    const contentId = trigger.getAttribute('data-tooltip-content-id');
    if (contentId) {
      const contentElement = document.getElementById(contentId);
      if (contentElement) {
        return contentElement.innerHTML;
      }
    }
    
    return null;
  }

  /**
   * 툴팁 요소 생성
   * @param {String|HTMLElement} content - 툴팁 콘텐츠
   * @returns {HTMLElement} 생성된 툴팁 요소
   */
  createTooltipElement(content) {
    const tooltip = document.createElement('div');
    tooltip.className = this.options.tooltipClass;
    tooltip.id = `tooltip-${Date.now()}`;
    tooltip.setAttribute('role', 'tooltip');
    
    // 스타일 설정
    tooltip.style.position = 'absolute';
    tooltip.style.maxWidth = `${this.options.maxWidth}px`;
    tooltip.style.opacity = '0';
    tooltip.style.transition = 'opacity 0.2s ease-in-out';
    
    // 기본 스타일 추가 (CSS 파일에서 재정의 가능)
    tooltip.style.backgroundColor = '#333';
    tooltip.style.color = '#fff';
    tooltip.style.padding = '8px 12px';
    tooltip.style.borderRadius = '4px';
    tooltip.style.fontSize = '14px';
    tooltip.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.15)';
    tooltip.style.zIndex = '10000';
    tooltip.style.pointerEvents = 'none';
    
    // 화살표 요소 추가
    const arrow = document.createElement('div');
    arrow.className = this.options.arrowClass;
    
    // 화살표 기본 스타일
    arrow.style.position = 'absolute';
    arrow.style.width = '8px';
    arrow.style.height = '8px';
    arrow.style.backgroundColor = '#333';
    arrow.style.transform = 'rotate(45deg)';
    
    tooltip.appendChild(arrow);
    
    // 콘텐츠 컨테이너 추가
    const contentContainer = document.createElement('div');
    contentContainer.className = 'tooltip-content';
    
    // 콘텐츠 설정
    if (typeof content === 'string') {
      contentContainer.innerHTML = content;
    } else {
      contentContainer.appendChild(content.cloneNode(true));
    }
    
    tooltip.appendChild(contentContainer);
    
    return tooltip;
  }

  /**
   * 툴팁 위치 설정
   * @param {HTMLElement} tooltip - 툴팁 요소
   * @param {HTMLElement} trigger - 트리거 요소
   */
  positionTooltip(tooltip, trigger) {
    // 트리거 위치 및 크기
    const triggerRect = trigger.getBoundingClientRect();
    
    // 툴팁 크기 (요소가 DOM에 있을 때만 정확함)
    const tooltipRect = tooltip.getBoundingClientRect();
    
    // 배치 방향 (기본값: top)
    let placement = trigger.getAttribute('data-tooltip-placement') || this.options.placement;
    
    // 스크롤 오프셋
    const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
    const scrollY = window.pageYOffset || document.documentElement.scrollTop;
    
    // 위치 계산 변수
    let top, left;
    const arrow = tooltip.querySelector(`.${this.options.arrowClass}`);
    
    // 배치에 따른 위치 계산
    switch (placement) {
      case 'top':
        top = triggerRect.top + scrollY - tooltipRect.height - 8;
        left = triggerRect.left + scrollX + (triggerRect.width / 2) - (tooltipRect.width / 2);
        
        // 화살표 위치
        if (arrow) {
          arrow.style.bottom = '-4px';
          arrow.style.left = '50%';
          arrow.style.marginLeft = '-4px';
        }
        break;
        
      case 'bottom':
        top = triggerRect.bottom + scrollY + 8;
        left = triggerRect.left + scrollX + (triggerRect.width / 2) - (tooltipRect.width / 2);
        
        // 화살표 위치
        if (arrow) {
          arrow.style.top = '-4px';
          arrow.style.left = '50%';
          arrow.style.marginLeft = '-4px';
        }
        break;
        
      case 'left':
        top = triggerRect.top + scrollY + (triggerRect.height / 2) - (tooltipRect.height / 2);
        left = triggerRect.left + scrollX - tooltipRect.width - 8;
        
        // 화살표 위치
        if (arrow) {
          arrow.style.right = '-4px';
          arrow.style.top = '50%';
          arrow.style.marginTop = '-4px';
        }
        break;
        
      case 'right':
        top = triggerRect.top + scrollY + (triggerRect.height / 2) - (tooltipRect.height / 2);
        left = triggerRect.right + scrollX + 8;
        
        // 화살표 위치
        if (arrow) {
          arrow.style.left = '-4px';
          arrow.style.top = '50%';
          arrow.style.marginTop = '-4px';
        }
        break;
    }
    
    // 창 바깥으로 나가지 않도록 조정
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    
    // 가로 조정
    if (left < scrollX) {
      left = scrollX + 8;
    } else if (left + tooltipRect.width > scrollX + windowWidth) {
      left = scrollX + windowWidth - tooltipRect.width - 8;
    }
    
    // 세로 조정
    if (top < scrollY) {
      top = scrollY + 8;
    } else if (top + tooltipRect.height > scrollY + windowHeight) {
      top = scrollY + windowHeight - tooltipRect.height - 8;
    }
    
    // 위치 적용
    tooltip.style.top = `${top}px`;
    tooltip.style.left = `${left}px`;
  }

  /**
   * 도움말 아이콘 자동 추가
   */
  addHelpIconsToElements() {
    // 데이터 속성으로 표시된 요소들 찾기
    const elements = document.querySelectorAll('[data-help-tooltip]');
    
    elements.forEach(element => {
      // 이미 아이콘이 있는지 확인
      if (element.querySelector(`.${this.options.iconClass}`)) {
        return;
      }
      
      // 도움말 아이콘 생성
      const icon = document.createElement('span');
      icon.className = this.options.iconClass;
      icon.setAttribute('data-tooltip-content', element.getAttribute('data-help-tooltip'));
      icon.setAttribute('aria-label', '도움말');
      icon.tabIndex = 0; // 키보드 접근성
      
      // 아이콘 스타일
      icon.innerHTML = '?';
      icon.style.display = 'inline-flex';
      icon.style.justifyContent = 'center';
      icon.style.alignItems = 'center';
      icon.style.width = '16px';
      icon.style.height = '16px';
      icon.style.borderRadius = '50%';
      icon.style.backgroundColor = '#3B82F6';
      icon.style.color = '#fff';
      icon.style.fontSize = '12px';
      icon.style.fontWeight = 'bold';
      icon.style.marginLeft = '4px';
      icon.style.cursor = 'pointer';
      
      // 요소에 아이콘 추가
      element.appendChild(icon);
    });
  }

  /**
   * 특정 요소에 툴팁 추가
   * @param {HTMLElement} element - 대상 요소
   * @param {String} content - 툴팁 콘텐츠
   * @param {Object} options - 추가 옵션
   */
  addTooltip(element, content, options = {}) {
    if (!element || !content) return;
    
    // 기존 속성 제거
    element.removeAttribute(this.options.triggerAttribute);
    
    // 툴팁 설정
    element.setAttribute(this.options.triggerAttribute, content);
    
    // 추가 옵션 설정
    if (options.placement) {
      element.setAttribute('data-tooltip-placement', options.placement);
    }
    
    if (options.maxWidth) {
      element.setAttribute('data-tooltip-max-width', options.maxWidth);
    }
    
    // 접근성 설정
    if (options.title) {
      element.setAttribute('data-tooltip-title', options.title);
    }
  }

  /**
   * 전체 요소에 툴팁 이벤트 리스너 다시 연결
   * (동적으로 추가된 요소 처리용)
   */
  refreshTooltips() {
    // 현재 바인딩된 이벤트 리스너는 이벤트 위임으로 자동 적용됨
    
    // 도움말 아이콘 자동 추가 (옵션 활성화 시)
    if (this.options.autoAddIcons) {
      this.addHelpIconsToElements();
    }
  }
}

// 전역 인스턴스 생성 및 내보내기
const helpTooltip = new HelpTooltip();

export default helpTooltip; 