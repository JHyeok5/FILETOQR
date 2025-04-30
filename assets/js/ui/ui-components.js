/**
 * ui-components.js - FileToQR UI 컴포넌트
 * 버전: 1.0.0
 * 최종 업데이트: 2025-06-15
 * 
 * 이 모듈은 FileToQR의 재사용 가능한 UI 컴포넌트를 제공합니다:
 * - 경고창
 * - 모달
 * - 탭
 * - 토스트 메시지
 * - 파일 업로더
 * - 프로그레스 바
 */

import ComponentSystem from '../core/component-system.js';
import TemplateUtils from '../utils/template-utils.js';
import VersionManager from '../utils/version-manager.js';

// 버전 등록
VersionManager.registerVersion('ui-components', '1.0.0', {
  dependencies: ['component-system@1.0.0', 'template-utils@1.0.0']
});

// UI 컴포넌트 네임스페이스
const UIComponents = {
  // 초기화
  init() {
    this._registerComponents();
    console.log('UI 컴포넌트 모듈 초기화 완료');
  },
  
  // 컴포넌트 등록
  _registerComponents() {
    // 알림 컴포넌트
    ComponentSystem.defineComponent('alert', {
      version: '1.0.0',
      initialState: {
        visible: false,
        type: 'info', // info, success, warning, error
        message: '',
        autoClose: false,
        autoCloseDelay: 3000,
        timer: null
      },
      
      // 생성 시 호출
      onCreate(props) {
        this.state = {
          ...this.state,
          visible: props.visible || false,
          type: props.type || 'info',
          message: props.message || '',
          autoClose: props.autoClose || false,
          autoCloseDelay: props.autoCloseDelay || 3000
        };
      },
      
      // 마운트 시 호출
      onMount() {
        if (this.state.visible && this.state.autoClose) {
          this._startAutoCloseTimer();
        }
      },
      
      // 상태 변경 시 호출
      onUpdate(oldProps, newProps) {
        if (newProps.visible && newProps.visible !== oldProps.visible && this.state.autoClose) {
          this._startAutoCloseTimer();
        }
      },
      
      // 제거 시 호출
      onDestroy() {
        if (this.state.timer) {
          clearTimeout(this.state.timer);
        }
      },
      
      // 렌더링
      render(props, state) {
        if (!state.visible) return '';
        
        // 타입별 클래스
        const typeClasses = {
          info: 'bg-blue-100 border-blue-500 text-blue-800',
          success: 'bg-green-100 border-green-500 text-green-800',
          warning: 'bg-yellow-100 border-yellow-500 text-yellow-800',
          error: 'bg-red-100 border-red-500 text-red-800'
        };
        
        const typeClass = typeClasses[state.type] || typeClasses.info;
        
        return `
          <div class="alert ${typeClass} border-l-4 p-4 rounded mb-4" role="alert" data-event="click:handleClick">
            <div class="flex items-center justify-between">
              <div class="flex-1">
                <p>${TemplateUtils.escapeHTML(state.message)}</p>
              </div>
              <button class="text-sm text-gray-600" data-event="click:handleClose">
                &times;
              </button>
            </div>
          </div>
        `;
      },
      
      // 메서드
      methods: {
        // 닫기 버튼 클릭
        handleClose(event) {
          event.preventDefault();
          this.close();
        },
        
        // 알림 클릭
        handleClick(event) {
          if (event.target.closest('button')) return;
          
          // 사용자 정의 이벤트 발생
          const customEvent = new CustomEvent('alertClick', {
            detail: {
              type: this.state.type,
              message: this.state.message
            },
            bubbles: true
          });
          
          this.container.dispatchEvent(customEvent);
        },
        
        // 알림 표시
        show(options = {}) {
          const newState = {
            visible: true,
            ...options
          };
          
          ComponentSystem.setState(this.id, newState);
          
          if (newState.autoClose !== false) {
            this._startAutoCloseTimer();
          }
        },
        
        // 알림 숨기기
        close() {
          if (this.state.timer) {
            clearTimeout(this.state.timer);
          }
          
          ComponentSystem.setState(this.id, { visible: false, timer: null });
        },
        
        // 자동 닫기 타이머 시작
        _startAutoCloseTimer() {
          if (this.state.timer) {
            clearTimeout(this.state.timer);
          }
          
          const timer = setTimeout(() => {
            this.close();
          }, this.state.autoCloseDelay);
          
          ComponentSystem.setState(this.id, { timer });
        }
      }
    });
    
    // 모달 컴포넌트
    ComponentSystem.defineComponent('modal', {
      version: '1.0.0',
      initialState: {
        visible: false,
        title: '',
        content: '',
        showClose: true,
        backdrop: true,
        width: 'md' // sm, md, lg, xl
      },
      
      // 생성 시 호출
      onCreate(props) {
        this.state = {
          ...this.state,
          visible: props.visible || false,
          title: props.title || '',
          content: props.content || '',
          showClose: props.showClose !== false,
          backdrop: props.backdrop !== false,
          width: props.width || 'md'
        };
      },
      
      // 마운트 시 호출
      onMount() {
        // 키보드 이벤트 등록
        this._handleEscListener = (e) => {
          if (e.key === 'Escape' && this.state.visible) {
            this.close();
          }
        };
        
        document.addEventListener('keydown', this._handleEscListener);
      },
      
      // 제거 시 호출
      onDestroy() {
        document.removeEventListener('keydown', this._handleEscListener);
      },
      
      // 렌더링
      render(props, state) {
        if (!state.visible) return '';
        
        // 너비 클래스
        const widthClasses = {
          sm: 'max-w-md',
          md: 'max-w-lg',
          lg: 'max-w-2xl',
          xl: 'max-w-4xl',
          full: 'max-w-full mx-4'
        };
        
        const widthClass = widthClasses[state.width] || widthClasses.md;
        
        return `
          <div class="fixed inset-0 flex items-center justify-center z-50">
            <!-- 배경 -->
            ${state.backdrop ? '<div class="fixed inset-0 bg-black bg-opacity-50" data-event="click:handleBackdropClick"></div>' : ''}
            
            <!-- 모달 콘텐츠 -->
            <div class="bg-white rounded-lg shadow-xl overflow-hidden ${widthClass} w-full z-10">
              <!-- 헤더 -->
              <div class="px-6 py-4 bg-gray-50 border-b flex items-center justify-between">
                <h3 class="text-lg font-medium text-gray-900">${TemplateUtils.escapeHTML(state.title)}</h3>
                ${state.showClose ? '<button class="text-gray-400 hover:text-gray-500" data-event="click:close">&times;</button>' : ''}
              </div>
              
              <!-- 본문 -->
              <div class="p-6 overflow-y-auto" style="max-height: calc(100vh - 200px);">
                ${state.content}
              </div>
              
              <!-- 푸터 슬롯 -->
              <div class="px-6 py-4 bg-gray-50 border-t flex justify-end space-x-2" id="modal-footer-${this.id}">
                <slot name="footer"></slot>
              </div>
            </div>
          </div>
        `;
      },
      
      // 메서드
      methods: {
        // 모달 표시
        open(options = {}) {
          ComponentSystem.setState(this.id, {
            visible: true,
            ...options
          });
          
          // 바디 스크롤 방지
          document.body.style.overflow = 'hidden';
          
          // 사용자 정의 이벤트
          const event = new CustomEvent('modalOpen', {
            detail: { id: this.id },
            bubbles: true
          });
          this.container.dispatchEvent(event);
        },
        
        // 모달 닫기
        close() {
          ComponentSystem.setState(this.id, { visible: false });
          
          // 바디 스크롤 복원
          document.body.style.overflow = '';
          
          // 사용자 정의 이벤트
          const event = new CustomEvent('modalClose', {
            detail: { id: this.id },
            bubbles: true
          });
          this.container.dispatchEvent(event);
        },
        
        // 배경 클릭
        handleBackdropClick(event) {
          if (event.target === event.currentTarget) {
            this.close();
          }
        },
        
        // 컨텐츠 설정
        setContent(content) {
          ComponentSystem.setState(this.id, { content });
        },
        
        // 푸터 설정
        setFooter(footerHTML) {
          const footerEl = document.getElementById(`modal-footer-${this.id}`);
          if (footerEl) {
            footerEl.innerHTML = footerHTML;
          }
        }
      }
    });
    
    // 탭 컴포넌트
    ComponentSystem.defineComponent('tabs', {
      version: '1.0.0',
      initialState: {
        activeTab: 0,
        tabs: [] // {id, label, content}
      },
      
      // 생성 시 호출
      onCreate(props) {
        this.state = {
          ...this.state,
          activeTab: props.activeTab || 0,
          tabs: props.tabs || []
        };
      },
      
      // 렌더링
      render(props, state) {
        const tabs = state.tabs || [];
        if (tabs.length === 0) return '<div>탭이 정의되지 않았습니다.</div>';
        
        // 탭 헤더
        let tabsHTML = `
          <div class="border-b border-gray-200">
            <nav class="flex -mb-px">
        `;
        
        // 각 탭 버튼
        tabs.forEach((tab, index) => {
          const isActive = index === state.activeTab;
          const activeClass = isActive 
            ? 'border-indigo-500 text-indigo-600 font-medium'
            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300';
          
          tabsHTML += `
            <button 
              class="py-4 px-6 border-b-2 ${activeClass} transition-colors" 
              data-tab-index="${index}"
              data-event="click:handleTabClick"
            >
              ${TemplateUtils.escapeHTML(tab.label)}
            </button>
          `;
        });
        
        tabsHTML += `
            </nav>
          </div>
        `;
        
        // 탭 콘텐츠
        tabsHTML += `
          <div class="tab-content py-4">
        `;
        
        // 활성 탭 콘텐츠만 표시
        if (tabs[state.activeTab]) {
          tabsHTML += tabs[state.activeTab].content;
        }
        
        tabsHTML += `
          </div>
        `;
        
        return tabsHTML;
      },
      
      // 메서드
      methods: {
        // 탭 클릭 처리
        handleTabClick(event) {
          const tabIndex = parseInt(event.currentTarget.dataset.tabIndex, 10);
          if (tabIndex !== this.state.activeTab) {
            this.setActiveTab(tabIndex);
          }
        },
        
        // 활성 탭 설정
        setActiveTab(tabIndex) {
          if (tabIndex >= 0 && tabIndex < this.state.tabs.length) {
            ComponentSystem.setState(this.id, { activeTab: tabIndex });
            
            // 사용자 정의 이벤트
            const event = new CustomEvent('tabChange', {
              detail: { 
                previousTab: this.state.activeTab,
                currentTab: tabIndex,
                tabInfo: this.state.tabs[tabIndex]
              },
              bubbles: true
            });
            this.container.dispatchEvent(event);
          }
        },
        
        // 탭 추가
        addTab(tab) {
          const newTabs = [...this.state.tabs, tab];
          ComponentSystem.setState(this.id, { tabs: newTabs });
        },
        
        // 탭 업데이트
        updateTab(index, tabData) {
          if (index >= 0 && index < this.state.tabs.length) {
            const newTabs = [...this.state.tabs];
            newTabs[index] = { ...newTabs[index], ...tabData };
            ComponentSystem.setState(this.id, { tabs: newTabs });
          }
        },
        
        // 탭 제거
        removeTab(index) {
          if (index >= 0 && index < this.state.tabs.length) {
            const newTabs = [...this.state.tabs];
            newTabs.splice(index, 1);
            
            // 현재 탭이 제거되는 경우 첫 번째 탭으로 이동
            let newActiveTab = this.state.activeTab;
            if (newTabs.length === 0) {
              newActiveTab = 0;
            } else if (index === this.state.activeTab) {
              newActiveTab = 0;
            } else if (index < this.state.activeTab) {
              newActiveTab = this.state.activeTab - 1;
            }
            
            ComponentSystem.setState(this.id, { 
              tabs: newTabs,
              activeTab: newActiveTab
            });
          }
        }
      }
    });
    
    // 프로그레스바 컴포넌트
    ComponentSystem.defineComponent('progressBar', {
      version: '1.0.0',
      initialState: {
        progress: 0, // 0 ~ 100
        showLabel: true,
        color: 'blue', // blue, green, yellow, red, indigo
        size: 'md', // sm, md, lg
        animated: true
      },
      
      // 생성 시 호출
      onCreate(props) {
        this.state = {
          ...this.state,
          progress: props.progress || 0,
          showLabel: props.showLabel !== false,
          color: props.color || 'blue',
          size: props.size || 'md',
          animated: props.animated !== false
        };
      },
      
      // 렌더링
      render(props, state) {
        // 색상 클래스
        const colorClasses = {
          blue: 'bg-blue-600',
          green: 'bg-green-500',
          yellow: 'bg-yellow-500',
          red: 'bg-red-500',
          indigo: 'bg-indigo-500'
        };
        
        // 크기 클래스
        const sizeClasses = {
          sm: 'h-2',
          md: 'h-4',
          lg: 'h-6'
        };
        
        const colorClass = colorClasses[state.color] || colorClasses.blue;
        const sizeClass = sizeClasses[state.size] || sizeClasses.md;
        const animatedClass = state.animated ? 'transition-all duration-300 ease-out' : '';
        
        // 진행률 제한 (0-100)
        const progress = Math.min(100, Math.max(0, state.progress));
        
        return `
          <div class="w-full">
            ${state.showLabel ? `
              <div class="flex justify-between mb-1">
                <span class="text-sm font-medium text-gray-700">진행률</span>
                <span class="text-sm font-medium text-gray-700">${progress}%</span>
              </div>
            ` : ''}
            
            <div class="w-full bg-gray-200 rounded-full ${sizeClass} overflow-hidden">
              <div 
                class="${colorClass} ${sizeClass} rounded-full ${animatedClass}" 
                style="width: ${progress}%"
              ></div>
            </div>
          </div>
        `;
      },
      
      // 메서드
      methods: {
        // 진행률 설정
        setProgress(value) {
          const progress = Math.min(100, Math.max(0, value));
          ComponentSystem.setState(this.id, { progress });
          
          // 사용자 정의 이벤트
          if (progress === 100) {
            const event = new CustomEvent('progressComplete', {
              bubbles: true
            });
            this.container.dispatchEvent(event);
          }
        },
        
        // 진행률 증가
        increment(amount = 10) {
          const newProgress = Math.min(100, this.state.progress + amount);
          this.setProgress(newProgress);
        },
        
        // 진행률 감소
        decrement(amount = 10) {
          const newProgress = Math.max(0, this.state.progress - amount);
          this.setProgress(newProgress);
        },
        
        // 컬러 설정
        setColor(color) {
          ComponentSystem.setState(this.id, { color });
        }
      }
    });
    
    // 토스트 메시지 컴포넌트
    ComponentSystem.defineComponent('toast', {
      version: '1.0.0',
      initialState: {
        messages: [], // {id, type, text, duration}
        position: 'bottom-right' // top-right, top-left, bottom-right, bottom-left
      },
      
      // 생성 시 호출
      onCreate(props) {
        this.state = {
          ...this.state,
          position: props.position || 'bottom-right'
        };
      },
      
      // 렌더링
      render(props, state) {
        // 위치 클래스
        const positionClasses = {
          'top-right': 'top-4 right-4',
          'top-left': 'top-4 left-4',
          'bottom-right': 'bottom-4 right-4',
          'bottom-left': 'bottom-4 left-4'
        };
        
        const positionClass = positionClasses[state.position] || positionClasses['bottom-right'];
        
        if (state.messages.length === 0) {
          return `<div class="fixed ${positionClass} z-50" style="pointer-events: none;"></div>`;
        }
        
        let toastHTML = `<div class="fixed ${positionClass} z-50 space-y-2">`;
        
        // 각 토스트 메시지 렌더링
        state.messages.forEach(msg => {
          // 타입별 클래스
          const typeClasses = {
            info: 'bg-blue-500',
            success: 'bg-green-500',
            warning: 'bg-yellow-500',
            error: 'bg-red-500'
          };
          
          const typeClass = typeClasses[msg.type] || typeClasses.info;
          
          toastHTML += `
            <div class="${typeClass} text-white px-4 py-3 rounded shadow-lg flex items-center justify-between" style="pointer-events: auto; min-width: 250px; max-width: 350px;">
              <div>${TemplateUtils.escapeHTML(msg.text)}</div>
              <button class="ml-4 text-white" data-message-id="${msg.id}" data-event="click:handleDismiss">&times;</button>
            </div>
          `;
        });
        
        toastHTML += '</div>';
        return toastHTML;
      },
      
      // 메서드
      methods: {
        // 토스트 메시지 추가
        show(options) {
          const { type = 'info', text = '', duration = 3000 } = options;
          
          // 새 메시지 생성
          const newMessage = {
            id: Date.now().toString(),
            type,
            text,
            duration
          };
          
          // 상태 업데이트
          ComponentSystem.setState(this.id, state => {
            return {
              messages: [...state.messages, newMessage]
            };
          });
          
          // 자동 제거 타이머 설정
          if (duration > 0) {
            setTimeout(() => {
              this.dismiss(newMessage.id);
            }, duration);
          }
          
          return newMessage.id;
        },
        
        // 토스트 메시지 제거
        dismiss(messageId) {
          ComponentSystem.setState(this.id, state => {
            return {
              messages: state.messages.filter(msg => msg.id !== messageId)
            };
          });
        },
        
        // 모든 토스트 메시지 제거
        clear() {
          ComponentSystem.setState(this.id, { messages: [] });
        },
        
        // 닫기 버튼 클릭 핸들러
        handleDismiss(event) {
          const messageId = event.currentTarget.dataset.messageId;
          if (messageId) {
            this.dismiss(messageId);
          }
        },
        
        // 위치 설정
        setPosition(position) {
          ComponentSystem.setState(this.id, { position });
        }
      }
    });
  }
};

// 레지스트리에 등록
if (typeof window.FileToQR === 'undefined') {
  window.FileToQR = {};
}

window.FileToQR.UIComponents = UIComponents;

// 모듈 내보내기
export default UIComponents; 