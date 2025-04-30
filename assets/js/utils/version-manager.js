/**
 * version-manager.js - FileToQR 버전 관리 시스템
 * 버전: 1.0.0
 * 최종 업데이트: 2025-06-15
 * 
 * 이 모듈은 FileToQR의 모듈과 컴포넌트 버전 관리를 담당합니다:
 * - 버전 저장, 조회, 비교
 * - 모듈 간 버전 호환성 확인
 * - 버전 업그레이드 알림
 */

// 버전 관리 네임스페이스
const VersionManager = {
  // 버전 정보 저장소
  versions: new Map(),
  
  // 최소 호환 버전 정보
  compatibility: new Map(),
  
  /**
   * 모듈 버전 등록
   * @param {string} moduleName - 모듈 이름
   * @param {string} version - 버전 문자열 (예: "1.0.0")
   * @param {Object} options - 추가 옵션
   * @param {string} options.minCompatible - 최소 호환 버전
   * @param {Array<string>} options.dependencies - 의존성 모듈 목록
   */
  registerVersion(moduleName, version, options = {}) {
    this.versions.set(moduleName, {
      version,
      timestamp: new Date(),
      minCompatible: options.minCompatible || null,
      dependencies: options.dependencies || []
    });
    
    if (options.minCompatible) {
      this.compatibility.set(moduleName, options.minCompatible);
    }
    
    console.log(`모듈 "${moduleName}" 버전 ${version} 등록됨`);
    return true;
  },
  
  /**
   * 모듈 버전 조회
   * @param {string} moduleName - 모듈 이름
   * @returns {string|null} 버전 문자열 또는 null
   */
  getVersion(moduleName) {
    const info = this.versions.get(moduleName);
    return info ? info.version : null;
  },
  
  /**
   * 모든 등록된 모듈의 버전 정보 반환
   * @returns {Object} 모듈별 버전 정보
   */
  getAllVersions() {
    const result = {};
    this.versions.forEach((info, moduleName) => {
      result[moduleName] = { ...info };
    });
    return result;
  },
  
  /**
   * 버전 비교
   * @param {string} version1 - 첫 번째 버전
   * @param {string} version2 - 두 번째 버전
   * @returns {number} version1이 version2보다 크면 1, 같으면 0, 작으면 -1
   */
  compareVersions(version1, version2) {
    const v1parts = version1.split('.').map(Number);
    const v2parts = version2.split('.').map(Number);
    
    for (let i = 0; i < v1parts.length; ++i) {
      if (v2parts.length === i) {
        return 1; // version1이 더 긴 경우
      }
      
      if (v1parts[i] > v2parts[i]) {
        return 1;
      }
      
      if (v1parts[i] < v2parts[i]) {
        return -1;
      }
    }
    
    if (v1parts.length !== v2parts.length) {
      return -1; // version2가 더 긴 경우
    }
    
    return 0; // 버전이 같음
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
      const comparison = this.compareVersions(requiredVersion, info.minCompatible);
      // 요구 버전이 최소 호환 버전보다 크거나 같으면 호환
      return comparison >= 0;
    }
    
    // 메이저 버전이 같으면 호환으로 간주
    const currentMajor = info.version.split('.')[0];
    const requiredMajor = requiredVersion.split('.')[0];
    return currentMajor === requiredMajor;
  },
  
  /**
   * 의존성 호환성 확인
   * @param {string} moduleName - 모듈 이름
   * @returns {Object} 호환성 결과
   */
  checkDependencies(moduleName) {
    const info = this.versions.get(moduleName);
    if (!info || !info.dependencies || info.dependencies.length === 0) {
      return { compatible: true, issues: [] };
    }
    
    const issues = [];
    
    info.dependencies.forEach(dep => {
      // 의존성 이름과 필요 버전 파싱 (ex: "module@1.0.0")
      const [depName, requiredVersion] = dep.split('@');
      
      if (!this.versions.has(depName)) {
        issues.push({
          dependency: depName,
          issue: 'missing',
          message: `의존성 모듈 "${depName}"을(를) 찾을 수 없습니다.`
        });
        return;
      }
      
      if (requiredVersion && !this.isCompatible(depName, requiredVersion)) {
        issues.push({
          dependency: depName,
          issue: 'incompatible',
          requiredVersion,
          currentVersion: this.getVersion(depName),
          message: `의존성 모듈 "${depName}"의 호환성 문제: ${requiredVersion} 필요, 현재 ${this.getVersion(depName)}`
        });
      }
    });
    
    return {
      compatible: issues.length === 0,
      issues
    };
  },
  
  /**
   * 버전이 업데이트 필요한지 확인
   * @param {string} moduleName - 모듈 이름
   * @param {string} latestVersion - 최신 버전
   * @returns {Object} 업데이트 필요 여부 및 정보
   */
  checkForUpdates(moduleName, latestVersion) {
    const currentVersion = this.getVersion(moduleName);
    if (!currentVersion) {
      return { needed: false };
    }
    
    const comparison = this.compareVersions(latestVersion, currentVersion);
    if (comparison <= 0) {
      return { needed: false }; // 이미 최신 버전이거나 더 높은 버전
    }
    
    // 메이저 버전 업데이트 확인
    const currentMajor = Number(currentVersion.split('.')[0]);
    const latestMajor = Number(latestVersion.split('.')[0]);
    const isMajorUpdate = latestMajor > currentMajor;
    
    return {
      needed: true,
      current: currentVersion,
      latest: latestVersion,
      isMajorUpdate
    };
  },
  
  /**
   * 모듈 버전 정보 텍스트 반환
   * @param {string} moduleName - 모듈 이름
   * @returns {string} 버전 정보 텍스트
   */
  getVersionInfo(moduleName) {
    const info = this.versions.get(moduleName);
    if (!info) {
      return `모듈 "${moduleName}"의 버전 정보가 없습니다.`;
    }
    
    const { version, timestamp, dependencies } = info;
    const deps = dependencies.length ? `\n의존성: ${dependencies.join(', ')}` : '';
    
    return `${moduleName} v${version} (${timestamp.toISOString().split('T')[0]})${deps}`;
  }
};

// 레지스트리에 등록
if (typeof window.FileToQR === 'undefined') {
  window.FileToQR = {};
}

window.FileToQR.VersionManager = VersionManager;

// 모듈 내보내기
export default VersionManager; 