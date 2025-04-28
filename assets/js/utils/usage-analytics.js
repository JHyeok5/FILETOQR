/**
 * usage-analytics.js - FileToQR 사용자 행동 및 경험 데이터 수집 모듈
 * 버전: 1.0.0
 * 최종 업데이트: 2025-04-28
 * 참조: ../.ai-guides/architecture/module-registry.md
 * 
 * 이 모듈은 사용자 행동과 사용 패턴을 익명으로 수집하여
 * 서비스 개선에 활용하는 기능을 제공합니다:
 * - 사용자 행동 추적 (페이지 방문, 기능 사용)
 * - 성능 메트릭 수집 (로딩 시간, 변환 시간)
 * - 오류 및 문제 상황 기록
 * - 사용자 피드백 저장 및 분석
 */

// 클래스 기반으로 모듈 구현
class UsageAnalytics {
  constructor(options = {}) {
    // 기본 설정 값
    this.options = {
      storageKey: 'filetoqr_analytics',
      anonymizeData: true,
      collectPerformance: true,
      collectErrors: true,
      collectPageViews: true,
      collectActions: true,
      sessionTimeout: 30 * 60 * 1000, // 30분
      ...options
    };

    // 세션 관리
    this.sessionId = this.getOrCreateSessionId();
    
    // 방문자 ID (익명)
    this.visitorId = this.getOrCreateVisitorId();
    
    // 현재 페이지 정보
    this.currentPage = window.location.pathname;
    
    // 추적 데이터 저장소
    this.eventQueue = [];
    
    // 페이지 성능 측정
    this.performanceMetrics = {};
    
    // 초기화
    this.init();
  }
  
  /**
   * 모듈 초기화
   */
  init() {
    // 로컬 스토리지에서 대기 중인 이벤트 불러오기
    this.loadQueuedEvents();
    
    // 페이지 로드 이벤트 추적
    if (this.options.collectPageViews) {
      this.trackPageView();
    }
    
    // 성능 정보 수집
    if (this.options.collectPerformance) {
      this.collectPerformanceMetrics();
    }
    
    // 오류 추적 설정
    if (this.options.collectErrors) {
      this.setupErrorTracking();
    }
    
    // 주기적으로 데이터 저장 (30초마다)
    setInterval(() => this.saveQueuedEvents(), 30000);
    
    // 페이지 종료 전 데이터 저장
    window.addEventListener('beforeunload', () => this.saveQueuedEvents());
  }
  
  /**
   * 방문자 ID 생성 또는 조회
   * @returns {String} 익명 방문자 ID
   */
  getOrCreateVisitorId() {
    let visitorId = localStorage.getItem('filetoqr_visitor_id');
    
    if (!visitorId) {
      // 랜덤 ID 생성 (익명)
      visitorId = 'v_' + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('filetoqr_visitor_id', visitorId);
    }
    
    return visitorId;
  }
  
  /**
   * 세션 ID 생성 또는 조회
   * @returns {String} 세션 ID
   */
  getOrCreateSessionId() {
    const lastActivity = localStorage.getItem('filetoqr_last_activity');
    const existingSessionId = localStorage.getItem('filetoqr_session_id');
    const now = Date.now();
    
    // 이전 활동 시간 확인 및 세션 타임아웃 체크
    if (lastActivity && existingSessionId) {
      const timeSinceLastActivity = now - parseInt(lastActivity);
      
      // 세션 타임아웃 이내면 기존 세션 사용
      if (timeSinceLastActivity < this.options.sessionTimeout) {
        localStorage.setItem('filetoqr_last_activity', now.toString());
        return existingSessionId;
      }
    }
    
    // 새 세션 생성
    const sessionId = 's_' + now + '_' + Math.random().toString(36).substring(2, 9);
    localStorage.setItem('filetoqr_session_id', sessionId);
    localStorage.setItem('filetoqr_last_activity', now.toString());
    
    return sessionId;
  }
  
  /**
   * 성능 메트릭 수집
   */
  collectPerformanceMetrics() {
    // Navigation Timing API 사용
    if (window.performance && window.performance.timing) {
      const timing = window.performance.timing;
      
      // 페이지 로드 시간
      window.addEventListener('load', () => {
        setTimeout(() => {
          const pageLoadTime = timing.loadEventEnd - timing.navigationStart;
          const domReadyTime = timing.domComplete - timing.domLoading;
          
          this.performanceMetrics = {
            pageLoadTime,
            domReadyTime,
            dnsTime: timing.domainLookupEnd - timing.domainLookupStart,
            connectTime: timing.connectEnd - timing.connectStart,
            ttfb: timing.responseStart - timing.requestStart,
            contentLoad: timing.responseEnd - timing.responseStart
          };
          
          this.trackEvent('performance', {
            category: 'performance',
            action: 'page_load',
            metrics: this.performanceMetrics
          });
        }, 0);
      });
    }
    
    // 리소스 로딩 시간 측정 (옵션)
    if (window.performance && window.performance.getEntriesByType) {
      window.addEventListener('load', () => {
        setTimeout(() => {
          const resources = window.performance.getEntriesByType('resource');
          
          // 주요 리소스 유형별 로딩 시간 추적
          const resourceMetrics = {
            js: [],
            css: [],
            image: [],
            other: []
          };
          
          resources.forEach(resource => {
            const url = resource.name;
            const duration = resource.duration;
            const size = resource.decodedBodySize || 0;
            
            // 리소스 유형 확인
            let type = 'other';
            if (url.endsWith('.js')) type = 'js';
            else if (url.endsWith('.css')) type = 'css';
            else if (/\.(png|jpg|jpeg|gif|svg|webp)/.test(url)) type = 'image';
            
            resourceMetrics[type].push({ url, duration, size });
          });
          
          // 각 유형별 평균 로딩 시간 계산
          for (const type in resourceMetrics) {
            if (resourceMetrics[type].length > 0) {
              const totalDuration = resourceMetrics[type].reduce((sum, item) => sum + item.duration, 0);
              const avgDuration = totalDuration / resourceMetrics[type].length;
              this.performanceMetrics[`avg${type.charAt(0).toUpperCase() + type.slice(1)}LoadTime`] = avgDuration;
            }
          }
        }, 1000);
      });
    }
  }
  
  /**
   * 오류 추적 설정
   */
  setupErrorTracking() {
    // 전역 오류 핸들러
    window.addEventListener('error', (event) => {
      const errorData = {
        message: event.message,
        source: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error ? event.error.stack : null,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString()
      };
      
      this.trackEvent('error', {
        category: 'error',
        action: 'javascript_error',
        label: event.message,
        data: errorData
      });
    });
    
    // Promise 오류 핸들러
    window.addEventListener('unhandledrejection', (event) => {
      const errorData = {
        message: event.reason ? (event.reason.message || String(event.reason)) : 'Promise 거부됨',
        stack: event.reason && event.reason.stack ? event.reason.stack : null,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString()
      };
      
      this.trackEvent('error', {
        category: 'error',
        action: 'unhandled_promise_rejection',
        label: errorData.message,
        data: errorData
      });
    });
  }
  
  /**
   * 페이지 뷰 추적
   * @param {String} pagePath - 페이지 경로 (기본값: 현재 페이지)
   */
  trackPageView(pagePath = null) {
    const page = pagePath || window.location.pathname;
    this.currentPage = page;
    
    // 타임스탬프 및 기본 정보
    const pageViewData = {
      type: 'pageview',
      category: 'navigation',
      action: 'view',
      page,
      referrer: document.referrer || null,
      timestamp: new Date().toISOString(),
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height
    };
    
    this.trackEvent('pageview', pageViewData);
  }
  
  /**
   * 사용자 행동 추적
   * @param {String} category - 이벤트 카테고리
   * @param {String} action - 이벤트 액션
   * @param {String} label - 이벤트 라벨 (선택사항)
   * @param {Object} data - 추가 데이터 (선택사항)
   */
  trackAction(category, action, label = null, data = {}) {
    if (!this.options.collectActions) return;
    
    const actionData = {
      type: 'action',
      category,
      action,
      label,
      page: this.currentPage,
      timestamp: new Date().toISOString(),
      ...data
    };
    
    this.trackEvent('action', actionData);
  }
  
  /**
   * 파일 변환 이벤트 추적
   * @param {Object} data - 변환 데이터
   */
  trackConversion(data = {}) {
    // 필수 정보 확인
    const conversionData = {
      type: 'conversion',
      category: 'file_conversion',
      action: 'convert',
      inputFormat: data.inputFormat || 'unknown',
      outputFormat: data.outputFormat || 'unknown',
      fileSize: data.fileSize || 0,
      duration: data.duration || 0,
      success: data.success !== undefined ? data.success : true,
      timestamp: new Date().toISOString()
    };
    
    // 추가 정보 병합
    if (data.options) {
      conversionData.options = data.options;
    }
    
    if (data.error) {
      conversionData.error = data.error;
    }
    
    this.trackEvent('conversion', conversionData);
  }
  
  /**
   * 사용자 피드백 추적
   * @param {Object} feedback - 피드백 데이터
   */
  trackFeedback(feedback = {}) {
    const feedbackData = {
      type: 'feedback',
      category: 'user_feedback',
      action: 'submit_feedback',
      rating: feedback.rating,
      comment: feedback.comment || null,
      context: feedback.context || null,
      timestamp: new Date().toISOString()
    };
    
    this.trackEvent('feedback', feedbackData);
  }
  
  /**
   * 일반 이벤트 추적
   * @param {String} type - 이벤트 타입
   * @param {Object} data - 이벤트 데이터
   */
  trackEvent(type, data) {
    // 기본 이벤트 데이터
    const eventData = {
      eventId: this.generateEventId(),
      sessionId: this.sessionId,
      visitorId: this.visitorId,
      userAgent: navigator.userAgent,
      language: navigator.language,
      ...data
    };
    
    // 사용자 식별 정보 익명화 (옵션에 따라)
    if (this.options.anonymizeData) {
      // IP 주소 수집 안함
      delete eventData.ip;
      
      // 필요에 따라 추가 익명화 로직
    }
    
    // 이벤트 큐에 추가
    this.eventQueue.push(eventData);
    
    // 디버깅
    if (this.options.debug) {
      console.log('[Analytics]', type, eventData);
    }
    
    // 큐 크기가 10개 이상이면 저장
    if (this.eventQueue.length >= 10) {
      this.saveQueuedEvents();
    }
  }
  
  /**
   * 고유한 이벤트 ID 생성
   * @returns {String} 이벤트 ID
   */
  generateEventId() {
    return 'e_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
  }
  
  /**
   * 저장된 이벤트 불러오기
   */
  loadQueuedEvents() {
    try {
      const storedEvents = localStorage.getItem(this.options.storageKey);
      if (storedEvents) {
        const parsedEvents = JSON.parse(storedEvents);
        if (Array.isArray(parsedEvents)) {
          this.eventQueue = parsedEvents;
        }
      }
    } catch (error) {
      console.error('이벤트 불러오기 실패:', error);
      // 오류 시 이벤트 큐 초기화
      this.eventQueue = [];
    }
  }
  
  /**
   * 이벤트 큐를 로컬 스토리지에 저장
   */
  saveQueuedEvents() {
    if (this.eventQueue.length === 0) return;
    
    try {
      localStorage.setItem(this.options.storageKey, JSON.stringify(this.eventQueue));
      
      // TODO: 실제 구현에서는 서버로 데이터 전송
      // this.sendEventsToServer();
      
      if (this.options.debug) {
        console.log(`[Analytics] ${this.eventQueue.length}개 이벤트 저장됨`);
      }
    } catch (error) {
      console.error('이벤트 저장 실패:', error);
    }
  }
  
  /**
   * 서버로 이벤트 전송 (향후 구현)
   */
  sendEventsToServer() {
    // 구현 예정: 데이터를 서버로 전송하는 로직
    // 성공적으로 전송 후 큐 비우기
    // this.eventQueue = [];
  }
  
  /**
   * 사용자 정의 이벤트 기록
   * @param {String} category - 이벤트 카테고리
   * @param {String} action - 이벤트 액션
   * @param {String} label - 이벤트 라벨 (선택사항)
   * @param {Object} data - 추가 데이터 (선택사항)
   */
  logCustomEvent(category, action, label = null, data = {}) {
    const customEventData = {
      type: 'custom',
      category,
      action,
      label,
      data,
      timestamp: new Date().toISOString()
    };
    
    this.trackEvent('custom', customEventData);
  }
  
  /**
   * 수집된 데이터 분석 및 요약 (클라이언트 측)
   * @returns {Object} 데이터 분석 결과
   */
  analyzeData() {
    const summary = {
      totalEvents: this.eventQueue.length,
      eventTypes: {},
      topActions: {},
      conversionStats: {
        total: 0,
        successful: 0,
        failed: 0,
        avgDuration: 0
      }
    };
    
    // 이벤트 유형별 카운트
    this.eventQueue.forEach(event => {
      const type = event.type || 'unknown';
      
      if (!summary.eventTypes[type]) {
        summary.eventTypes[type] = 0;
      }
      summary.eventTypes[type]++;
      
      // 액션 유형 추적
      if (event.type === 'action' && event.action) {
        const actionKey = `${event.category}_${event.action}`;
        if (!summary.topActions[actionKey]) {
          summary.topActions[actionKey] = 0;
        }
        summary.topActions[actionKey]++;
      }
      
      // 변환 통계
      if (event.type === 'conversion') {
        summary.conversionStats.total++;
        if (event.success) {
          summary.conversionStats.successful++;
        } else {
          summary.conversionStats.failed++;
        }
        
        if (event.duration) {
          const currentTotal = summary.conversionStats.avgDuration * (summary.conversionStats.total - 1);
          summary.conversionStats.avgDuration = (currentTotal + event.duration) / summary.conversionStats.total;
        }
      }
    });
    
    return summary;
  }
}

// 전역 인스턴스 생성 및 내보내기
const analytics = new UsageAnalytics();

export default analytics; 