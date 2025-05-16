/**
 * version-manager.js - FileToQR 버전 관리 유틸리티
 * 버전: 1.1.0
 * 최종 업데이트: 2025-08-01
 * 
 * 이 모듈은 애플리케이션 및 모듈의 버전 정보를 관리합니다:
 * - 버전 등록 및 추적
 * - 버전 호환성 확인
 * - 버전 알림 관리
 */

import CommonUtils from './common-utils.js';

// 버전 관리자 모듈 정의
const VersionManager = {
  // 버전 정보 저장소
  versions: new Map(),
  
  /**
   * 버전 등록
   * @param {string} moduleName - 모듈 이름
   * @param {string} version - 버전
   * @param {Object} options - 추가 옵션
   * @param {string} [options.minCompatible] - 최소 호환 버전
   * @param {string} [options.description] - 버전 설명
   * @param {Date} [options.releaseDate] - 출시 날짜
   * @returns {boolean} 등록 성공 여부
   */
  register(moduleName, version, options = {}) {
    if (this.versions.has(moduleName)) {
      console.warn(`모듈 "${moduleName}"의 버전이 이미 등록되어 있습니다.`);
      return false;
    }
    
    this.versions.set(moduleName, {
      version,
      minCompatible: options.minCompatible || null,
      description: options.description || null,
      releaseDate: options.releaseDate || new Date(),
      registered: new Date()
    });
    
    console.log(`모듈 "${moduleName}" 버전 ${version} 등록됨`);
    return true;
  },
  
  /**
   * 버전 업데이트
   * @param {string} moduleName - 모듈 이름
   * @param {string} version - 새 버전
   * @param {Object} options - 추가 옵션
   * @returns {boolean} 업데이트 성공 여부
   */
  update(moduleName, version, options = {}) {
    if (!this.versions.has(moduleName)) {
      console.warn(`모듈 "${moduleName}"이(가) 등록되어 있지 않습니다. register()를 먼저 호출하세요.`);
      return false;
    }
    
    const existingInfo = this.versions.get(moduleName);
    
    this.versions.set(moduleName, {
      ...existingInfo,
      version,
      ...options,
      updated: new Date()
    });
    
    console.log(`모듈 "${moduleName}" 버전이 ${existingInfo.version}에서 ${version}(으)로 업데이트됨`);
    return true;
  },
  
  /**
   * 버전 호환성 확인
   * @param {string} moduleName - 모듈 이름
   * @param {string} requiredVersion - 필요한 버전
   * @returns {boolean} 호환성 여부
   */
  isCompatible(moduleName, requiredVersion) {
    const info = this.versions.get(moduleName);
    if (!info) {
      console.warn(`모듈 "${moduleName}"을(를) 찾을 수 없습니다.`);
      return false;
    }
    
    // 버전이 동일하면 항상 호환
    if (info.version === requiredVersion) {
      return true;
    }
    
    // 최소 호환 버전이 있는 경우
    if (info.minCompatible) {
      const comparison = CommonUtils.compareVersions(requiredVersion, info.minCompatible);
      // 요구 버전이 최소 호환 버전보다 크거나 같으면 호환
      return comparison >= 0;
    }
    
    // 메이저 버전이 같으면 호환으로 간주
    const currentMajor = info.version.split('.')[0];
    const requiredMajor = requiredVersion.split('.')[0];
    return currentMajor === requiredMajor;
  },
  
  /**
   * 버전 정보 가져오기
   * @param {string} moduleName - 모듈 이름
   * @returns {Object|null} 버전 정보 또는 모듈이 없는 경우 null
   */
  getVersion(moduleName) {
    return this.versions.get(moduleName) || null;
  },
  
  /**
   * 모든 버전 정보 가져오기
   * @returns {Object} 버전 정보 객체
   */
  getAllVersions() {
    const versions = {};
    
    this.versions.forEach((info, moduleName) => {
      versions[moduleName] = { ...info };
    });
    
    return versions;
  },
  
  /**
   * 메이저 버전 호환성 목록 가져오기
   * @param {string} majorVersion - 메이저 버전 (ex: "1")
   * @returns {Array} 호환 모듈 목록
   */
  getCompatibleModules(majorVersion) {
    const compatibleModules = [];
    
    this.versions.forEach((info, moduleName) => {
      const modMajorVersion = info.version.split('.')[0];
      if (modMajorVersion === majorVersion) {
        compatibleModules.push(moduleName);
      }
    });
    
    return compatibleModules;
  }
};

// 하위 호환성을 위한 전역 참조
if (typeof window !== 'undefined') {
  window.FileToQR = window.FileToQR || {};
  window.FileToQR.utils = window.FileToQR.utils || {};
  window.FileToQR.utils.versionManager = VersionManager;
}

// 모듈 내보내기
export default VersionManager; 