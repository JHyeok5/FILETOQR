/**
 * qr-generator.js - FileToQR QR 코드 생성 모듈
 * 버전: 1.0.0
 * 최종 업데이트: 2025-05-20
 * 참조: ../.ai-guides/architecture/module-registry.md
 * 
 * 이 모듈은 QR 코드 생성 기능을 처리합니다:
 * - 다양한 콘텐츠 유형 (URL, 텍스트, 연락처 등) 지원
 * - QR 코드 디자인 커스터마이징 (색상, 크기, 로고 등)
 * - 다양한 포맷 (PNG, SVG, JPEG)으로 다운로드
 * - 실시간 미리보기
 * - 파일 기반 QR 코드 생성
 */

import registry from '../registry.js';
import fileConverter from '../converters/file-converter.js';
import QRCode from 'https://cdn.jsdelivr.net/npm/qrcode/lib/browser.js';
import { showToast } from '../ui/notifications.js';
import { trackEvent } from '../utils/usage-analytics.js';

// 즉시 실행 함수로 네임스페이스 보호
(function() {
  'use strict';

  // 페이지 로드 후 초기화
  document.addEventListener('DOMContentLoaded', function() {
    // Initialize the module
    initQRGenerator();
    
    // Check if we were redirected from file converter with data
    checkForFileData();
  });

  // 전역 변수
  let qrCodeInstance = null;
  let logoImage = null;
  let fileToEncode = null;
  let maxFileSizeKB = 2; // 최대 2KB 파일 크기 (QR 코드 용량 제한)
  let filePreviewModule = null;
  let generatedQRCode = null;
  let customLogo = null;

  // QR 코드 생성기 초기화
  function initQRGenerator() {
    console.log('QR 코드 생성기 초기화 중...');
    
    // 파일 미리보기 모듈 가져오기
    filePreviewModule = registry.get('ui.previews', 'file-preview');
    if (!filePreviewModule) {
      console.warn('파일 미리보기 모듈을 찾을 수 없습니다. 기본 미리보기 기능을 사용합니다.');
    }
    
    // 콘텐츠 유형 변경 이벤트 등록
    const contentTypeSelect = document.getElementById('content-type');
    if (contentTypeSelect) {
      contentTypeSelect.addEventListener('change', handleContentTypeChange);
    }
    
    // 로고 체크박스 이벤트 등록
    const useLogoCheckbox = document.getElementById('use-logo');
    if (useLogoCheckbox) {
      useLogoCheckbox.addEventListener('change', function() {
        document.getElementById('logo-options').classList.toggle('hidden', !this.checked);
      });
    }
    
    // 로고 파일 선택 이벤트 등록
    const logoFileInput = document.getElementById('logo-file');
    if (logoFileInput) {
      logoFileInput.addEventListener('change', handleLogoFileChange);
    }
    
    // 현재 위치 가져오기 버튼 이벤트 등록
    const getCurrentLocationBtn = document.getElementById('get-current-location');
    if (getCurrentLocationBtn) {
      getCurrentLocationBtn.addEventListener('click', getCurrentLocation);
    }
    
    // Wi-Fi 보안 유형 변경 이벤트 등록
    const wifiTypeSelect = document.getElementById('wifi-type');
    if (wifiTypeSelect) {
      wifiTypeSelect.addEventListener('change', function() {
        const passwordContainer = document.getElementById('wifi-password-container');
        passwordContainer.classList.toggle('hidden', this.value === 'nopass');
      });
    }
    
    // QR 코드 생성 버튼 이벤트 등록
    const generateQRButton = document.getElementById('generate-qr');
    if (generateQRButton) {
      generateQRButton.addEventListener('click', generateQRCode);
    }
    
    // QR 코드 다운로드 버튼 이벤트 등록
    const downloadQRButton = document.getElementById('download-qr');
    if (downloadQRButton) {
      downloadQRButton.addEventListener('click', downloadQRCode);
    }
    
    // 파일 선택 이벤트 등록
    const fileInput = document.getElementById('file-selector');
    if (fileInput) {
      fileInput.addEventListener('change', handleFileSelect);
    }
    
    // jscolor 초기화 (색상 선택기 라이브러리)
    if (typeof jscolor !== 'undefined') {
      jscolor.trigger();
    }
    
    console.log('QR 코드 생성기 초기화 완료');
  }

  // 콘텐츠 유형 변경 핸들러
  function handleContentTypeChange(e) {
    const contentType = e.target.value;
    
    // 모든 입력 섹션 숨기기
    const inputSections = document.querySelectorAll('.content-input-section');
    inputSections.forEach(section => {
      section.classList.add('hidden');
    });
    
    // 선택된 유형에 해당하는 입력 섹션 표시
    const selectedSection = document.getElementById(`${contentType}-input`);
    if (selectedSection) {
      selectedSection.classList.remove('hidden');
    }
    
    console.log('콘텐츠 유형 변경:', contentType);
  }

  // 로고 파일 선택 핸들러
  function handleLogoFileChange(e) {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      // 이미지 파일 유효성 검사
      if (!file.type.match('image.*')) {
        alert('이미지 파일만 선택할 수 있습니다.');
        e.target.value = '';
        return;
      }
      
      // 파일 크기 검사 (3MB 제한)
      if (file.size > 3 * 1024 * 1024) {
        alert('로고 이미지 크기는 3MB 이하여야 합니다.');
        e.target.value = '';
        return;
      }
      
      // 이미지 로드
      const reader = new FileReader();
      reader.onload = function(e) {
        logoImage = new Image();
        logoImage.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  // 파일 선택 핸들러
  function handleFileSelect(e) {
    const fileSelector = document.getElementById('file-selector');
    if (fileSelector && fileSelector.files && fileSelector.files.length > 0) {
      const file = fileSelector.files[0];
      const fileInfo = document.getElementById('file-info');
      const filePreview = document.getElementById('file-preview');
      const fileSizeKB = Math.round(file.size / 1024);
      
      // 파일 크기 검사
      if (fileSizeKB > maxFileSizeKB) {
        alert(`파일 크기가 제한(${maxFileSizeKB}KB)을 초과합니다. QR 코드에는 작은 파일만 사용할 수 있습니다.`);
        fileSelector.value = '';
        fileToEncode = null;
        fileInfo.textContent = '';
        filePreview.innerHTML = '';
        return;
      }
      
      // 파일 저장
      fileToEncode = file;
      
      // 파일 정보 표시 - 더 자세한 정보로 업데이트
      fileInfo.innerHTML = `
        <p><strong>파일명:</strong> ${file.name}</p>
        <p><strong>크기:</strong> ${formatFileSize(file.size)}</p>
        <p><strong>유형:</strong> ${file.type || '알 수 없음'}</p>
      `;
      
      // 파일 미리보기 표시
      displayFilePreview(file, filePreview);
    }
  }
  
  /**
   * Format file size in human-readable format
   * @param {number} bytes - File size in bytes
   * @returns {string} Formatted file size
   */
  function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
  
  /**
   * 파일 미리보기 표시
   * @param {File} file - 미리보기할 파일
   * @param {HTMLElement} container - 미리보기를 표시할 컨테이너
   */
  function displayFilePreview(file, container) {
    // 레지스트리에서 가져온 파일 미리보기 모듈 사용
    if (filePreviewModule) {
      filePreviewModule.renderPreview(file, container)
        .catch(error => {
          console.error('파일 미리보기 모듈 사용 중 오류:', error);
          // 오류 발생 시 기본 미리보기로 폴백
          displayBasicFilePreview(file, container);
        });
    } else {
      // 모듈을 찾을 수 없는 경우 기본 미리보기 사용
      displayBasicFilePreview(file, container);
    }
  }
  
  /**
   * 기본 파일 미리보기 표시 (모듈 없을 경우 폴백)
   * @param {File} file - 미리보기할 파일
   * @param {HTMLElement} container - 미리보기를 표시할 컨테이너
   */
  function displayBasicFilePreview(file, container) {
    // 파일 유형에 따라 적절한 미리보기 표시
    if (file.type.match('image.*')) {
      // 이미지 파일 미리보기
      const reader = new FileReader();
      reader.onload = function(e) {
        container.innerHTML = `<img src="${e.target.result}" alt="이미지 미리보기" class="preview-image" style="max-width:100%; max-height:200px;">`;
      };
      reader.readAsDataURL(file);
    } else if (file.type.match('text.*') || file.type === 'application/json') {
      // 텍스트 파일 미리보기
      const reader = new FileReader();
      reader.onload = function(e) {
        // 텍스트 길이 제한 (표시를 위해)
        const text = e.target.result;
        const previewText = text.length > 500 ? text.substr(0, 500) + '...' : text;
        container.innerHTML = `
          <div class="text-preview" style="max-height:200px; overflow:auto; border:1px solid #ddd; padding:8px; font-family:monospace; font-size:12px;">
            ${previewText.replace(/</g, '&lt;').replace(/>/g, '&gt;')}
          </div>
        `;
      };
      reader.readAsText(file);
    } else if (file.type.match('audio.*')) {
      // 오디오 파일 미리보기
      const reader = new FileReader();
      reader.onload = function(e) {
        container.innerHTML = `
          <audio controls class="preview-audio" style="width:100%;">
            <source src="${e.target.result}" type="${file.type}">
            브라우저가 오디오 재생을 지원하지 않습니다.
          </audio>
        `;
      };
      reader.readAsDataURL(file);
    } else if (file.type.match('video.*')) {
      // 비디오 파일 미리보기
      const reader = new FileReader();
      reader.onload = function(e) {
        container.innerHTML = `
          <video controls class="preview-video" style="max-width:100%; max-height:200px;">
            <source src="${e.target.result}" type="${file.type}">
            브라우저가 비디오 재생을 지원하지 않습니다.
          </video>
        `;
      };
      reader.readAsDataURL(file);
    } else {
      // 기타 파일 유형 - 확장자 기반 일반 미리보기
      const extension = getFileExtension(file.name).toUpperCase();
      container.innerHTML = `
        <div class="generic-preview" style="text-align:center; padding:20px; background:#f5f5f5; border-radius:4px;">
          <div style="font-size:32px; font-weight:bold; color:#666; margin-bottom:10px;">${extension}</div>
          <div>${file.name}</div>
        </div>
      `;
    }
  }

  // 현재 위치 가져오기
  function getCurrentLocation(e) {
    e.preventDefault();
    
    if (!navigator.geolocation) {
      alert('이 브라우저에서는 위치 정보를 지원하지 않습니다.');
      return;
    }
    
    const geoLatInput = document.getElementById('geo-lat');
    const geoLonInput = document.getElementById('geo-lon');
    
    navigator.geolocation.getCurrentPosition(
      function(position) {
        geoLatInput.value = position.coords.latitude.toFixed(6);
        geoLonInput.value = position.coords.longitude.toFixed(6);
      },
      function(error) {
        let errorMessage = '위치 정보를 가져올 수 없습니다.';
        
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = '위치 정보 접근 권한이 거부되었습니다.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = '위치 정보를 사용할 수 없습니다.';
            break;
          case error.TIMEOUT:
            errorMessage = '위치 정보 요청 시간이 초과되었습니다.';
            break;
        }
        
        alert(errorMessage);
      }
    );
  }

  // 파일 확장자 추출
  function getFileExtension(filename) {
    return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2).toLowerCase();
  }

  // 파일을 QR 코드로 인코딩
  function encodeFileToQR(file) {
    return new Promise((resolve, reject) => {
      if (!file) {
        reject(new Error('파일이 선택되지 않았습니다.'));
        return;
      }
      
      fileConverter.fileToDataUri(file)
        .then(dataUri => {
          resolve(dataUri);
        })
        .catch(error => {
          reject(error);
        });
    });
  }

  // QR 코드 콘텐츠 생성
  function generateQRContent() {
    const contentType = document.getElementById('content-type').value;
    
    switch (contentType) {
      case 'url':
        return document.getElementById('url').value;
      
      case 'text':
        return document.getElementById('text').value;
      
      case 'vcard': {
        const name = document.getElementById('vcard-name').value;
        const org = document.getElementById('vcard-org').value;
        const tel = document.getElementById('vcard-tel').value;
        const email = document.getElementById('vcard-email').value;
        const url = document.getElementById('vcard-url').value;
        const address = document.getElementById('vcard-address').value;
        
        let vcard = 'BEGIN:VCARD\nVERSION:3.0\n';
        
        if (name) vcard += `FN:${name}\n`;
        if (org) vcard += `ORG:${org}\n`;
        if (tel) vcard += `TEL:${tel}\n`;
        if (email) vcard += `EMAIL:${email}\n`;
        if (url) vcard += `URL:${url}\n`;
        if (address) vcard += `ADR:;;${address};;;\n`;
        
        vcard += 'END:VCARD';
        
        return vcard;
      }
      
      case 'wifi': {
        const ssid = document.getElementById('wifi-ssid').value;
        const type = document.getElementById('wifi-type').value;
        const password = type !== 'nopass' ? document.getElementById('wifi-password').value : '';
        const hidden = document.getElementById('wifi-hidden').checked;
        
        let wifi = 'WIFI:';
        wifi += `S:${ssid};`;
        wifi += `T:${type};`;
        
        if (password) wifi += `P:${password};`;
        if (hidden) wifi += 'H:true;';
        
        wifi += ';';
        
        return wifi;
      }
      
      case 'email': {
        const address = document.getElementById('email-address').value;
        const subject = document.getElementById('email-subject').value;
        const body = document.getElementById('email-body').value;
        
        let email = `mailto:${address}`;
        
        if (subject || body) {
          email += '?';
          if (subject) email += `subject=${encodeURIComponent(subject)}`;
          if (subject && body) email += '&';
          if (body) email += `body=${encodeURIComponent(body)}`;
        }
        
        return email;
      }
      
      case 'sms': {
        const number = document.getElementById('sms-number').value;
        const message = document.getElementById('sms-message').value;
        
        let sms = `smsto:${number}`;
        
        if (message) {
          sms += `:${message}`;
        }
        
        return sms;
      }
      
      case 'geo': {
        const lat = document.getElementById('geo-lat').value;
        const lon = document.getElementById('geo-lon').value;
        
        return `geo:${lat},${lon}`;
      }
      
      case 'file': {
        // 파일은 비동기로 처리되어야 하므로 null 반환
        // 실제 처리는 generateQRCode 함수에서 수행
        return null;
      }
      
      default:
        return '';
    }
  }

  // QR 코드 생성
  function generateQRCode() {
    const contentType = document.getElementById('content-type').value;
    const qrPreview = document.getElementById('qr-preview');
    const downloadOptions = document.getElementById('download-options');
    
    // 콘텐츠 검증
    if (contentType !== 'file') {
      const content = generateQRContent();
      
      if (!content) {
        alert('QR 코드에 포함할 내용을 입력해주세요.');
        return;
      }
      
      // QR 코드 설정
      const foregroundColor = '#' + document.getElementById('foreground-color').value;
      const backgroundColor = '#' + document.getElementById('background-color').value;
      const errorCorrection = document.getElementById('error-correction').value;
      const size = parseInt(document.getElementById('qr-size').value, 10);
      const margin = parseInt(document.getElementById('qr-margin').value, 10);
      
      // QR 코드 생성
      qrCodeInstance = new QRious({
        element: document.createElement('canvas'),
        value: content,
        size: size,
        level: errorCorrection,
        background: backgroundColor,
        foreground: foregroundColor,
        padding: margin
      });
      
      // 로고 추가 옵션 처리
      const useLogoCheckbox = document.getElementById('use-logo');
      
      if (useLogoCheckbox.checked && logoImage) {
        const canvas = addLogoToQR(qrCodeInstance.element, logoImage);
        
        // 미리보기 표시
        qrPreview.innerHTML = '';
        qrPreview.appendChild(canvas);
      } else {
        // 미리보기 표시
        qrPreview.innerHTML = '';
        qrPreview.appendChild(qrCodeInstance.element);
      }
      
      // 다운로드 옵션 표시
      downloadOptions.classList.remove('hidden');
      
    } else {
      // 파일 QR 코드 생성
      if (!fileToEncode) {
        alert('QR 코드로 변환할 파일을 선택해주세요.');
        return;
      }
      
      // 로딩 표시
      qrPreview.innerHTML = '<div class="spinner"></div><p>파일을 QR 코드로 변환하는 중...</p>';
      
      encodeFileToQR(fileToEncode)
        .then(dataUri => {
          // 콘텐츠가 QR 코드 용량을 초과하는지 확인
          if (dataUri.length > 4296) { // QR 코드 버전 40의 최대 용량 (약) - Low ECC
            throw new Error('파일이 QR 코드 최대 용량을 초과합니다. 더 작은 파일을 선택해주세요.');
          }
          
          // QR 코드 설정
          const foregroundColor = '#' + document.getElementById('foreground-color').value;
          const backgroundColor = '#' + document.getElementById('background-color').value;
          const errorCorrection = document.getElementById('error-correction').value;
          const size = parseInt(document.getElementById('qr-size').value, 10);
          const margin = parseInt(document.getElementById('qr-margin').value, 10);
          
          // QR 코드 생성
          qrCodeInstance = new QRious({
            element: document.createElement('canvas'),
            value: dataUri,
            size: size,
            level: errorCorrection,
            background: backgroundColor,
            foreground: foregroundColor,
            padding: margin
          });
          
          // 미리보기 표시
          qrPreview.innerHTML = '';
          qrPreview.appendChild(qrCodeInstance.element);
          
          // 다운로드 옵션 표시
          downloadOptions.classList.remove('hidden');
        })
        .catch(error => {
          // 오류 표시
          qrPreview.innerHTML = `<div class="error-message">${error.message}</div>`;
        });
    }
  }

  // QR 코드에 로고 추가
  function addLogoToQR(canvas, logoImg) {
    const ctx = canvas.getContext('2d');
    const size = canvas.width;
    const logoSize = size * 0.2; // 로고 크기는 QR 코드의 20%
    
    // 로고를 중앙에 배치
    const logoX = (size - logoSize) / 2;
    const logoY = (size - logoSize) / 2;
    
    // 로고 배경에 흰색 원 그리기 (로고가 더 잘 보이도록)
    ctx.save();
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, logoSize * 0.55, 0, 2 * Math.PI);
    ctx.fillStyle = 'white';
    ctx.fill();
    ctx.restore();
    
    // 로고 그리기
    ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize);
  }

  // QR 코드 다운로드
  function downloadQRCode() {
    if (!qrCodeInstance) {
      alert('먼저 QR 코드를 생성해주세요.');
      return;
    }
    
    const format = document.getElementById('download-format').value;
    let filename = document.getElementById('download-filename').value || 'qrcode';
    filename = filename.trim();
    
    if (!filename) {
      filename = 'qrcode';
    }
    
    // QR 코드 이미지 가져오기
    const canvas = qrCodeInstance.element;
    
    // 다운로드 링크 생성
    const link = document.createElement('a');
    
    if (format === 'svg') {
      // Canvas를 SVG로 변환
      const svgContent = canvasToSVG(canvas);
      const blob = new Blob([svgContent], { type: 'image/svg+xml' });
      link.href = URL.createObjectURL(blob);
      link.download = `${filename}.svg`;
    } else {
      // PNG 또는 JPEG로 다운로드
      const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
      link.href = canvas.toDataURL(mimeType);
      link.download = `${filename}.${format}`;
    }
    
    // 다운로드 링크 클릭
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    console.log('QR 코드 다운로드:', format);
  }

  // Canvas를 SVG로 변환 (기본적인 변환)
  function canvasToSVG(canvas) {
    const width = canvas.width;
    const height = canvas.height;
    const context = canvas.getContext('2d');
    const imageData = context.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`;
    
    // 배경색 추가
    const backgroundColor = document.getElementById('background-color').value || '#FFFFFF';
    svg += `<rect width="${width}" height="${height}" fill="${backgroundColor}"/>`;
    
    // QR 코드 픽셀 추가
    const foregroundColor = document.getElementById('foreground-color').value || '#000000';
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const index = (y * width + x) * 4;
        const r = data[index];
        const g = data[index + 1];
        const b = data[index + 2];
        
        // 검은색 픽셀을 사용자 지정 색상으로 변환
        if (r === 0 && g === 0 && b === 0) {
          svg += `<rect x="${x}" y="${y}" width="1" height="1" fill="${foregroundColor}"/>`;
        }
      }
    }
    
    svg += '</svg>';
    return svg;
  }

  /**
   * Checks for file data passed from the file converter page
   */
  function checkForFileData() {
    // Check URL params for content type
    const urlParams = new URLSearchParams(window.location.search);
    const contentType = urlParams.get('contentType');
    
    if (contentType === 'file') {
      // Get file data from session storage
      const fileDataJson = sessionStorage.getItem('fileToQR');
      if (fileDataJson) {
        try {
          const fileData = JSON.parse(fileDataJson);
          
          // Select file content type in UI
          const contentTypeSelect = document.getElementById('content-type');
          if (contentTypeSelect) {
            contentTypeSelect.value = 'file';
            // Trigger change event to update UI
            contentTypeSelect.dispatchEvent(new Event('change'));
          }
          
          // Set the file data
          fileToEncode = fileData;
          
          // Update the file info display
          const fileNameElement = document.getElementById('selected-filename');
          const fileSizeElement = document.getElementById('selected-filesize');
          
          if (fileNameElement && fileData.name) {
            fileNameElement.textContent = fileData.name;
          }
          
          if (fileSizeElement && fileData.size) {
            fileSizeElement.textContent = formatFileSize(fileData.size);
          }
          
          // Show file info container
          const fileInfoElement = document.getElementById('file-info');
          if (fileInfoElement) {
            fileInfoElement.style.display = 'block';
          }
          
          // Generate QR code automatically
          generateQRCode();
          
          // Clean up session storage
          sessionStorage.removeItem('fileToQR');
        } catch (error) {
          console.error('Error processing file data:', error);
        }
      }
    }
  }
})(); 