/**
 * config.js - FileToQR 애플리케이션 공통 설정
 * 버전: 1.0.0 (DEPRECATED)
 * 최종 업데이트: 2025-07-26
 * 
 * !!!!! 주의: 이 파일은 더 이상 사용되지 않습니다 !!!!!
 * 대신 'assets/js/core/config.js'를 사용하세요.
 * 이 파일은 2025년 12월까지 호환성을 위해 유지됩니다.
 * 마이그레이션 계획:
 * 1. 기존 import 문을 'assets/js/core/config.js'로 업데이트
 * 2. 기존 코드의 Config 참조를 config.js에서 core/config.js로 변경
 * 3. 2025년 12월 이후 이 파일은 완전히 제거될 예정입니다
 */

// 코어 설정 모듈 가져오기
import CoreConfig from '../core/config.js';

// 전역 객체 설정
window.FileToQR = window.FileToQR || {};
window.FileToQR.config = window.FileToQR.config || {};

// 콘솔 경고
console.warn('경고: assets/js/utils/config.js는 더 이상 사용되지 않습니다. 대신 assets/js/core/config.js를 사용하세요.');

// 코어 설정을 내보냄
export default CoreConfig; 