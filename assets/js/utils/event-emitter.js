// FileToQR 공통 이벤트 관리 유틸리티
// assets/js/utils/event-emitter.js
// 버전: 1.0.0
// 마지막 업데이트: 2025-07-15

export default class EventEmitter {
  constructor() {
    this.events = {};
  }

  /**
   * 이벤트 구독
   * @param {string} event - 이벤트 이름
   * @param {Function} listener - 이벤트 핸들러
   */
  on(event, listener) {
    (this.events[event] = this.events[event] || []).push(listener);
  }

  /**
   * 이벤트 구독 해제
   * @param {string} event - 이벤트 이름
   * @param {Function} listener - 이벤트 핸들러
   */
  off(event, listener) {
    if (!this.events[event]) return;
    this.events[event] = this.events[event].filter(l => l !== listener);
  }

  /**
   * 이벤트 발생
   * @param {string} event - 이벤트 이름
   * @param  {...any} args - 이벤트 데이터
   */
  emit(event, ...args) {
    (this.events[event] || []).forEach(listener => listener(...args));
  }
} 