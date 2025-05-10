/**
 * content.js - FileToQR 정적 콘텐츠 페이지 컨트롤러
 * 버전: 1.0.0
 * 최종 업데이트: 2025-08-01
 * 
 * 이 모듈은 help, privacy, terms, contact 등 정적 콘텐츠 페이지의 공통 기능을 처리합니다:
 * - 공통 UI 이벤트 처리
 * - 콘텐츠 포매팅
 * - 필요한 경우 목차 자동 생성
 */

import CommonUtils from '../utils/common-utils.js';

// 콘텐츠 페이지 컨트롤러
const ContentPageController = {
  // 상태 관리
  state: {
    initialized: false,
    pageType: null,
    tableOfContents: null
  },
  
  /**
   * 초기화
   * @returns {Promise<boolean>} 초기화 성공 여부
   */
  async init() {
    try {
      console.log('ContentPageController 초기화 시작');
      
      // 페이지 타입 감지
      this._detectPageType();
      
      // 이벤트 리스너 등록
      this._registerEventListeners();
      
      // 내용이 있으면 목차 생성
      if (document.querySelector('.content-section')) {
        this._generateTableOfContents();
      }
      
      // 필요한 경우 외부 링크 처리
      this._processExternalLinks();
      
      this.state.initialized = true;
      console.log('ContentPageController 초기화 완료');
      return true;
    } catch (error) {
      console.error('ContentPageController 초기화 실패:', error);
      return false;
    }
  },
  
  /**
   * 페이지 타입 감지
   * @private
   */
  _detectPageType() {
    const path = window.location.pathname;
    
    if (path.includes('help')) {
      this.state.pageType = 'help';
    } else if (path.includes('privacy')) {
      this.state.pageType = 'privacy';
    } else if (path.includes('terms')) {
      this.state.pageType = 'terms';
    } else if (path.includes('contact')) {
      this.state.pageType = 'contact';
    } else {
      this.state.pageType = 'unknown';
    }
    
    console.log(`페이지 타입 감지: ${this.state.pageType}`);
  },
  
  /**
   * 이벤트 리스너 등록
   * @private
   */
  _registerEventListeners() {
    // 문의 양식이 있는 경우 이벤트 처리
    if (this.state.pageType === 'contact') {
      const contactForm = document.getElementById('contact-form');
      
      if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
          e.preventDefault();
          this._handleContactFormSubmit(e.target);
        });
        
        // 입력 필드 유효성 검사 실시간 처리
        const emailField = contactForm.querySelector('input[type="email"]');
        if (emailField) {
          emailField.addEventListener('input', CommonUtils.general.debounce((e) => {
            this._validateEmailField(e.target);
          }, 300));
        }
      }
    }
    
    // 도움말 페이지 탭 처리
    if (this.state.pageType === 'help') {
      const tabButtons = document.querySelectorAll('.help-tab-button');
      
      tabButtons.forEach(button => {
        button.addEventListener('click', (e) => {
          this._switchHelpTab(e.currentTarget.dataset.tab);
        });
      });
    }
  },
  
  /**
   * 이메일 필드 유효성 검사
   * @param {HTMLInputElement} field - 이메일 입력 필드
   * @private
   */
  _validateEmailField(field) {
    const email = field.value.trim();
    const isValid = CommonUtils.validation.isValidEmail(email);
    
    if (isValid) {
      field.classList.remove('border-red-500');
      field.classList.add('border-green-500');
      
      // 오류 메시지 삭제
      const errorElement = field.nextElementSibling;
      if (errorElement && errorElement.classList.contains('error-message')) {
        errorElement.remove();
      }
    } else if (email.length > 0) {
      field.classList.remove('border-green-500');
      field.classList.add('border-red-500');
      
      // 오류 메시지 표시
      let errorElement = field.nextElementSibling;
      if (!errorElement || !errorElement.classList.contains('error-message')) {
        errorElement = document.createElement('p');
        errorElement.className = 'error-message text-red-500 text-sm mt-1';
        field.parentNode.insertBefore(errorElement, field.nextSibling);
      }
      
      errorElement.textContent = '유효한 이메일 주소를 입력해주세요.';
    }
  },
  
  /**
   * 문의 양식 제출 처리
   * @param {HTMLFormElement} form - 문의 양식
   * @private
   */
  _handleContactFormSubmit(form) {
    // 양식 데이터 수집
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    
    // 이메일 유효성 검사
    if (!CommonUtils.validation.isValidEmail(data.email)) {
      alert('유효한 이메일 주소를 입력해주세요.');
      return;
    }
    
    // 데모 모드에서는 전송하지 않고 성공 메시지 표시
    console.log('문의 양식 제출 데이터:', data);
    
    // 성공 메시지 표시
    const formContainer = form.parentElement;
    formContainer.innerHTML = `
      <div class="bg-green-100 p-4 rounded-lg text-green-800 my-4">
        <h3 class="font-bold text-lg">감사합니다!</h3>
        <p>문의사항이 접수되었습니다. 곧 답변 드리겠습니다.</p>
      </div>
    `;
  },
  
  /**
   * 도움말 탭 전환
   * @param {string} tabId - 표시할 탭 ID
   * @private
   */
  _switchHelpTab(tabId) {
    // 모든 탭 버튼의 활성 상태 제거
    const tabButtons = document.querySelectorAll('.help-tab-button');
    tabButtons.forEach(button => {
      button.classList.remove('bg-blue-500', 'text-white');
      button.classList.add('bg-gray-200', 'text-gray-800');
    });
    
    // 선택한 탭 버튼 활성화
    const activeButton = document.querySelector(`.help-tab-button[data-tab="${tabId}"]`);
    if (activeButton) {
      activeButton.classList.remove('bg-gray-200', 'text-gray-800');
      activeButton.classList.add('bg-blue-500', 'text-white');
    }
    
    // 모든 탭 콘텐츠 숨김
    const tabContents = document.querySelectorAll('.help-tab-content');
    tabContents.forEach(content => {
      content.classList.add('hidden');
    });
    
    // 선택한 탭 콘텐츠 표시
    const activeContent = document.getElementById(`${tabId}-content`);
    if (activeContent) {
      activeContent.classList.remove('hidden');
    }
  },
  
  /**
   * 외부 링크 처리 (target="_blank" 및 rel 속성 추가)
   * @private
   */
  _processExternalLinks() {
    const links = document.querySelectorAll('a[href^="http"]');
    
    links.forEach(link => {
      // 현재 도메인이 아닌 경우에만 처리
      if (!link.href.includes(window.location.hostname)) {
        link.setAttribute('target', '_blank');
        link.setAttribute('rel', 'noopener noreferrer');
        
        // 외부 링크 아이콘 추가 (선택 사항)
        if (!link.querySelector('.external-link-icon')) {
          const icon = document.createElement('span');
          icon.className = 'external-link-icon ml-1 text-xs';
          icon.innerHTML = '↗';
          link.appendChild(icon);
        }
      }
    });
  },
  
  /**
   * 목차 자동 생성
   * @private
   */
  _generateTableOfContents() {
    const contentSection = document.querySelector('.content-section');
    const tocContainer = document.querySelector('.table-of-contents');
    
    if (!contentSection || !tocContainer) return;
    
    // 제목 요소 찾기
    const headings = contentSection.querySelectorAll('h2, h3');
    if (headings.length === 0) {
      tocContainer.classList.add('hidden');
      return;
    }
    
    // 목차 생성
    const toc = document.createElement('ul');
    toc.className = 'space-y-2';
    
    let currentList = toc;
    let previousLevel = 2;
    
    headings.forEach((heading, index) => {
      // 고유 ID 할당
      const id = `heading-${index}`;
      heading.id = id;
      
      // 목차 항목 생성
      const listItem = document.createElement('li');
      const link = document.createElement('a');
      link.href = `#${id}`;
      link.textContent = heading.textContent;
      link.className = 'hover:text-blue-600';
      listItem.appendChild(link);
      
      // h2와 h3 구분
      const currentLevel = parseInt(heading.tagName.charAt(1));
      
      if (currentLevel > previousLevel) {
        // 하위 목록 생성
        const nestedList = document.createElement('ul');
        nestedList.className = 'pl-4 mt-2 space-y-2';
        currentList.lastChild.appendChild(nestedList);
        currentList = nestedList;
      } else if (currentLevel < previousLevel) {
        // 상위 목록으로 이동
        currentList = toc;
      }
      
      currentList.appendChild(listItem);
      previousLevel = currentLevel;
    });
    
    // 목차 컨테이너에 추가
    tocContainer.innerHTML = '';
    tocContainer.appendChild(document.createElement('h3')).textContent = '목차';
    tocContainer.appendChild(toc);
    
    // 목차 추적 저장
    this.state.tableOfContents = toc;
  }
};

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', () => {
  ContentPageController.init();
});

// 하위 호환성을 위한 전역 참조
if (typeof window !== 'undefined') {
  window.FileToQR = window.FileToQR || {};
  window.FileToQR.controllers = window.FileToQR.controllers || {};
  window.FileToQR.controllers.content = ContentPageController;
}

// 모듈 내보내기
export default ContentPageController; 