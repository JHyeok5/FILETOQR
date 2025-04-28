/**
 * registry.js - FileToQR 모듈 레지스트리
 * 버전: 1.0.0
 * 최종 업데이트: 2025-04-28
 * 참조: ../.ai-guides/architecture/module-registry.md
 * 
 * 이 모듈은 FileToQR 프로젝트의 핵심 아키텍처 구성 요소로,
 * 모든 기능 모듈을 관리하고 의존성을 추적하는 중앙 시스템입니다.
 */

import filePreview from './ui/previews/file-preview.js';
import fileConverter from './converters/file-converter.js';
import qrGenerator from './qr-generator/qr-generator.js';

// 모듈 레지스트리 객체
const registry = {
  // 모듈 저장소
  _modules: {
    'ui.previews': {
      'file-preview': filePreview
    },
    'converters': {
      'file-converter': fileConverter
    },
    'qr-generator': {
      'qr-generator': qrGenerator
    }
  },
  
  // 모듈 등록
  register: function(namespace, name, module) {
    if (!this._modules[namespace]) {
      this._modules[namespace] = {};
    }
    
    this._modules[namespace][name] = module;
    console.log(`모듈 등록: ${namespace}.${name}`);
    
    return this;
  },
  
  // 모듈 가져오기
  get: function(namespace, name) {
    if (!this._modules[namespace] || !this._modules[namespace][name]) {
      console.warn(`모듈을 찾을 수 없음: ${namespace}.${name}`);
      return null;
    }
    
    return this._modules[namespace][name];
  },
  
  // 모듈 목록 가져오기
  getModules: function(namespace) {
    return this._modules[namespace] || {};
  },
  
  // 모듈 네임스페이스 목록 가져오기
  getNamespaces: function() {
    return Object.keys(this._modules);
  }
};

export default registry; 