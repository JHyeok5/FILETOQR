/**
 * file-preview.js - FileToQR 파일 미리보기 모듈
 * 버전: 1.0.0
 * 최종 업데이트: 2025-06-15
 * 참조: ../../../docs/architecture/module-registry.md
 * 
 * 이 모듈은 다양한 파일 유형의 미리보기를 처리합니다:
 * - 이미지 파일 미리보기
 * - 텍스트 파일 미리보기
 * - 오디오 파일 미리보기
 * - 비디오 파일 미리보기
 * - 기타 파일 유형 기본 미리보기
 */

import registry from '../../../assets/js/registry.js';

// 파일 미리보기 모듈 (외부로 노출되는 API)
const filePreview = {};

// 즉시 실행 함수로 내부 로직 캡슐화
(function() {
  'use strict';
  
  // 모듈 네임스페이스
  const filePreviewModule = {};
  
  /**
   * 파일 미리보기 렌더링
   * @param {File} file - 미리보기할 파일
   * @param {HTMLElement} container - 미리보기를 표시할 컨테이너
   * @param {Object} options - 미리보기 옵션
   * @returns {Promise} 미리보기 완료 Promise
   */
  function renderPreview(file, container, options = {}) {
    return new Promise((resolve, reject) => {
      if (!file || !container) {
        reject(new Error('파일 또는 컨테이너가 제공되지 않았습니다.'));
        return;
      }
      
      // 옵션 설정
      const settings = {
        maxPreviewSize: options.maxPreviewSize || 200, // 미리보기 최대 크기 (px)
        maxTextLength: options.maxTextLength || 1000,  // 텍스트 최대 길이
        ...options
      };
      
      try {
        // 파일 유형에 따른 미리보기 생성
        if (file.type.match('image.*')) {
          createImagePreview(file, container, settings)
            .then(resolve)
            .catch(reject);
        } else if (file.type.match('text.*') || file.type === 'application/json') {
          createTextPreview(file, container, settings)
            .then(resolve)
            .catch(reject);
        } else if (file.type.match('audio.*')) {
          createAudioPreview(file, container, settings)
            .then(resolve)
            .catch(reject);
        } else if (file.type.match('video.*')) {
          createVideoPreview(file, container, settings)
            .then(resolve)
            .catch(reject);
        } else {
          createGenericPreview(file, container, settings);
          resolve();
        }
      } catch (error) {
        reject(error);
      }
    });
  }
  
  /**
   * 이미지 파일 미리보기 생성
   * @param {File} file - 이미지 파일
   * @param {HTMLElement} container - 컨테이너
   * @param {Object} settings - 설정
   * @returns {Promise} 완료 Promise
   */
  function createImagePreview(file, container, settings) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = function(e) {
        try {
          const img = document.createElement('img');
          img.src = e.target.result;
          img.alt = file.name;
          img.className = 'preview-image';
          img.style.maxWidth = '100%';
          img.style.maxHeight = settings.maxPreviewSize + 'px';
          
          container.innerHTML = '';
          container.appendChild(img);
          resolve();
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = function(error) {
        reject(error);
      };
      
      reader.readAsDataURL(file);
    });
  }
  
  /**
   * 텍스트 파일 미리보기 생성
   * @param {File} file - 텍스트 파일
   * @param {HTMLElement} container - 컨테이너
   * @param {Object} settings - 설정
   * @returns {Promise} 완료 Promise
   */
  function createTextPreview(file, container, settings) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = function(e) {
        try {
          // 텍스트 길이 제한
          const text = e.target.result;
          const previewText = text.length > settings.maxTextLength 
            ? text.substr(0, settings.maxTextLength) + '...' 
            : text;
          
          // 텍스트 이스케이프
          const escapedText = previewText
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
          
          // 미리보기 컨테이너 생성
          const previewElement = document.createElement('div');
          previewElement.className = 'text-preview';
          previewElement.style.maxHeight = settings.maxPreviewSize + 'px';
          previewElement.style.overflow = 'auto';
          previewElement.style.border = '1px solid #ddd';
          previewElement.style.padding = '8px';
          previewElement.style.fontFamily = 'monospace';
          previewElement.style.fontSize = '12px';
          previewElement.style.whiteSpace = 'pre-wrap';
          previewElement.style.wordBreak = 'break-all';
          previewElement.innerHTML = escapedText;
          
          container.innerHTML = '';
          container.appendChild(previewElement);
          resolve();
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = function(error) {
        reject(error);
      };
      
      reader.readAsText(file);
    });
  }
  
  /**
   * 오디오 파일 미리보기 생성
   * @param {File} file - 오디오 파일
   * @param {HTMLElement} container - 컨테이너
   * @param {Object} settings - 설정
   * @returns {Promise} 완료 Promise
   */
  function createAudioPreview(file, container, settings) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = function(e) {
        try {
          const audio = document.createElement('audio');
          audio.controls = true;
          audio.className = 'preview-audio';
          audio.style.width = '100%';
          
          const source = document.createElement('source');
          source.src = e.target.result;
          source.type = file.type;
          
          audio.appendChild(source);
          audio.appendChild(document.createTextNode('브라우저가 오디오 재생을 지원하지 않습니다.'));
          
          container.innerHTML = '';
          container.appendChild(audio);
          resolve();
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = function(error) {
        reject(error);
      };
      
      reader.readAsDataURL(file);
    });
  }
  
  /**
   * 비디오 파일 미리보기 생성
   * @param {File} file - 비디오 파일
   * @param {HTMLElement} container - 컨테이너
   * @param {Object} settings - 설정
   * @returns {Promise} 완료 Promise
   */
  function createVideoPreview(file, container, settings) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = function(e) {
        try {
          const video = document.createElement('video');
          video.controls = true;
          video.className = 'preview-video';
          video.style.maxWidth = '100%';
          video.style.maxHeight = settings.maxPreviewSize + 'px';
          
          const source = document.createElement('source');
          source.src = e.target.result;
          source.type = file.type;
          
          video.appendChild(source);
          video.appendChild(document.createTextNode('브라우저가 비디오 재생을 지원하지 않습니다.'));
          
          container.innerHTML = '';
          container.appendChild(video);
          resolve();
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = function(error) {
        reject(error);
      };
      
      reader.readAsDataURL(file);
    });
  }
  
  /**
   * 일반 파일 미리보기 생성 (확장자 기반)
   * @param {File} file - 파일
   * @param {HTMLElement} container - 컨테이너
   * @param {Object} settings - 설정
   */
  function createGenericPreview(file, container, settings) {
    // 파일 확장자 추출
    const extension = getFileExtension(file.name).toUpperCase();
    
    // 미리보기 컨테이너 생성
    const previewElement = document.createElement('div');
    previewElement.className = 'generic-preview';
    previewElement.style.textAlign = 'center';
    previewElement.style.padding = '20px';
    previewElement.style.background = '#f5f5f5';
    previewElement.style.borderRadius = '4px';
    
    // 확장자 표시
    const extensionElement = document.createElement('div');
    extensionElement.style.fontSize = '32px';
    extensionElement.style.fontWeight = 'bold';
    extensionElement.style.color = '#666';
    extensionElement.style.marginBottom = '10px';
    extensionElement.textContent = extension;
    
    // 파일명 표시
    const filenameElement = document.createElement('div');
    filenameElement.textContent = file.name;
    
    // 요소 조합
    previewElement.appendChild(extensionElement);
    previewElement.appendChild(filenameElement);
    
    container.innerHTML = '';
    container.appendChild(previewElement);
  }
  
  /**
   * 파일 확장자 추출
   * @param {string} filename - 파일명
   * @returns {string} 파일 확장자
   */
  function getFileExtension(filename) {
    return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2).toLowerCase();
  }
  
  // 모듈 API 설정
  filePreview.renderPreview = renderPreview;
  filePreview.createImagePreview = createImagePreview;
  filePreview.createTextPreview = createTextPreview;
  filePreview.createAudioPreview = createAudioPreview;
  filePreview.createVideoPreview = createVideoPreview;
  filePreview.createGenericPreview = createGenericPreview;
  filePreview.getFileExtension = getFileExtension;
  
  // CSS 스타일 추가
  function addStyles() {
    const styleId = 'file-preview-styles';
    
    // 이미 스타일이 있으면 추가하지 않음
    if (document.getElementById(styleId)) return;
    
    const styleElement = document.createElement('style');
    styleElement.id = styleId;
    styleElement.textContent = `
      /* 파일 미리보기 기본 스타일 */
      .image-preview-container {
        text-align: center;
        margin-bottom: 10px;
      }
      .preview-image {
        max-width: 100%;
        max-height: 200px;
        border-radius: 4px;
      }
      .text-preview-container {
        margin-bottom: 10px;
      }
      .text-preview {
        background: #f5f5f5;
        border: 1px solid #ddd;
        border-radius: 4px;
        padding: 10px;
        max-height: 200px;
        overflow: auto;
        font-family: monospace;
        font-size: 12px;
        white-space: pre-wrap;
        word-break: break-all;
      }
      .audio-preview-container, .video-preview-container {
        margin-bottom: 10px;
      }
      .preview-audio, .preview-video {
        width: 100%;
        max-height: 200px;
        border-radius: 4px;
      }
      .generic-preview-container {
        display: flex;
        align-items: center;
        background: #f5f5f5;
        border-radius: 4px;
        padding: 15px;
        margin-bottom: 10px;
      }
      .file-icon {
        font-size: 24px;
        font-weight: bold;
        background: #ddd;
        color: #666;
        width: 60px;
        height: 60px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
        margin-right: 15px;
      }
      .file-details {
        flex: 1;
      }
      .file-name {
        font-weight: bold;
        margin: 0 0 5px 0;
      }
      .file-size, .file-type {
        color: #666;
        margin: 0 0 5px 0;
        font-size: 12px;
      }
      .preview-error {
        color: #d32f2f;
        padding: 10px;
        background: #ffebee;
        border-radius: 4px;
        text-align: center;
      }
    `;
    
    document.head.appendChild(styleElement);
  }
  
  // 초기화 함수
  function init() {
    // 스타일 추가
    if (typeof document !== 'undefined') {
      addStyles();
    }
    
    // 레지스트리에 등록
    if (registry) {
      try {
        registry.register('ui.previews', 'file-preview', filePreview);
      } catch (e) {
        console.warn('레지스트리 등록 실패:', e);
      }
    }
  }
  
  // 초기화 실행
  init();
})();

export default filePreview; 