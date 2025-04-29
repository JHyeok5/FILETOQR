/**
 * qr-generator.js - QR 코드 생성 기능을 구현하는 모듈
 * 버전: 1.1.0
 * 최종 업데이트: 2025-05-10
 */

// 즉시 실행 함수로 네임스페이스 보호
(function() {
  'use strict';

  // 전역 네임스페이스
  const FileToQR = window.FileToQR = window.FileToQR || {};
  
  // QR 코드 생성기 네임스페이스
  const qrGenerator = FileToQR.qrGenerator = {};
  
  // QR 코드 설정
  let qrSettings = {
    foregroundColor: '#000000',
    backgroundColor: '#FFFFFF',
    errorCorrectionLevel: 'M',
    margin: 1,
    size: 256,
    logoEnabled: false,
    logoSize: 15,
    logoImage: null
  };
  
  // 현재 선택된 콘텐츠 유형
  let currentContentType = 'url';
  
  // QR 코드 객체
  let qrCode = null;
  
  // QR 코드 생성된 데이터 URL
  let generatedQRDataURL = null;
  
  /**
   * 모듈 초기화
   */
  function init() {
    console.log('QR 코드 생성기 초기화 중...');
    
    // QRCode 라이브러리 로드 확인
    if (typeof QRCode === 'undefined') {
      console.warn('QRCode 라이브러리가 로드되지 않았습니다. 라이브러리를 로드 중입니다...');
      loadQRCodeLibrary();
    }
    
    // DOM 요소 참조
    const elements = {
      generateButton: document.getElementById('generate-qr'),
      contentTypeTabs: document.getElementById('content-type-tabs'),
      contentForms: document.querySelectorAll('.content-form'),
      qrPreview: document.getElementById('qr-preview'),
      downloadOptions: document.getElementById('download-options'),
      downloadPNG: document.getElementById('download-png'),
      downloadSVG: document.getElementById('download-svg'),
      downloadJPEG: document.getElementById('download-jpeg'),
      
      // QR 코드 설정 요소
      foregroundColor: document.getElementById('foreground-color'),
      backgroundColor: document.getElementById('background-color'),
      errorCorrection: document.getElementById('error-correction'),
      qrSize: document.getElementById('qr-size'),
      margin: document.getElementById('margin'),
      addLogo: document.getElementById('add-logo'),
      logoOptions: document.getElementById('logo-options'),
      logoFile: document.getElementById('logo-file'),
      logoPreview: document.getElementById('logo-preview'),
      logoSize: document.getElementById('logo-size')
    };
    
    // 이벤트 리스너 등록
    bindEvents(elements);
    
    console.log('QR 코드 생성기 초기화 완료');
  }

  /**
   * QRCode 라이브러리 동적 로드
   */
  function loadQRCodeLibrary() {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.rawgit.com/davidshimjs/qrcodejs/gh-pages/qrcode.min.js';
      script.onload = () => {
        console.log('QRCode 라이브러리 로드 성공');
        resolve();
      };
      script.onerror = (error) => {
        console.error('QRCode 라이브러리 로드 실패:', error);
        reject(new Error('QRCode 라이브러리를 로드할 수 없습니다.'));
      };
      document.head.appendChild(script);
    });
  }
  
  /**
   * 이벤트 리스너 등록
   * @param {Object} elements - DOM 요소 참조
   */
  function bindEvents(elements) {
    // QR 코드 생성 버튼 클릭 이벤트
    if (elements.generateButton) {
      elements.generateButton.addEventListener('click', generateQRCode);
    }
    
    // 콘텐츠 유형 탭 클릭 이벤트
    if (elements.contentTypeTabs) {
      const contentTypeTabs = elements.contentTypeTabs.querySelectorAll('button');
      contentTypeTabs.forEach(tab => {
        tab.addEventListener('click', function() {
          // 이전 활성 탭 비활성화
          contentTypeTabs.forEach(t => t.classList.remove('active'));
          // 현재 탭 활성화
          this.classList.add('active');
          
          // 현재 콘텐츠 유형 설정
          currentContentType = this.dataset.type;
          
          // 모든 폼 숨기기
          elements.contentForms.forEach(form => {
            form.classList.add('hidden');
            form.classList.remove('active');
          });
          
          // 선택된 유형의 폼 표시
          const activeForm = document.getElementById(`${currentContentType}-form`);
          if (activeForm) {
            activeForm.classList.remove('hidden');
            activeForm.classList.add('active');
          }
        });
      });
    }
    
    // QR 코드 설정 변경 이벤트
    if (elements.foregroundColor) {
      elements.foregroundColor.addEventListener('change', function() {
        qrSettings.foregroundColor = this.value;
      });
    }
    
    if (elements.backgroundColor) {
      elements.backgroundColor.addEventListener('change', function() {
        qrSettings.backgroundColor = this.value;
      });
    }
    
    if (elements.errorCorrection) {
      elements.errorCorrection.addEventListener('change', function() {
        qrSettings.errorCorrectionLevel = this.value;
      });
    }
    
    if (elements.qrSize) {
      elements.qrSize.addEventListener('change', function() {
        qrSettings.size = parseInt(this.value);
      });
    }
    
    if (elements.margin) {
      elements.margin.addEventListener('input', function() {
        qrSettings.margin = parseInt(this.value);
      });
    }
    
    if (elements.addLogo) {
      elements.addLogo.addEventListener('change', function() {
        qrSettings.logoEnabled = this.checked;
        if (elements.logoOptions) {
          elements.logoOptions.style.display = this.checked ? 'block' : 'none';
        }
      });
    }
    
    if (elements.logoSize) {
      elements.logoSize.addEventListener('input', function() {
        qrSettings.logoSize = parseInt(this.value);
      });
    }
    
    if (elements.logoFile) {
      elements.logoFile.addEventListener('change', function(e) {
        if (e.target.files && e.target.files[0]) {
          const reader = new FileReader();
          reader.onload = function(event) {
            if (elements.logoPreview) {
              elements.logoPreview.src = event.target.result;
            }
            qrSettings.logoImage = event.target.result;
          };
          reader.readAsDataURL(e.target.files[0]);
        }
      });
    }
    
    // 다운로드 버튼 이벤트
    if (elements.downloadPNG) {
      elements.downloadPNG.addEventListener('click', function() {
        downloadQRCode('png');
      });
    }
    
    if (elements.downloadSVG) {
      elements.downloadSVG.addEventListener('click', function() {
        downloadQRCode('svg');
      });
    }
    
    if (elements.downloadJPEG) {
      elements.downloadJPEG.addEventListener('click', function() {
        downloadQRCode('jpeg');
      });
    }
  }
  
  /**
   * 현재 콘텐츠 유형에 맞는 데이터 가져오기
   * @returns {string} QR 코드에 인코딩할 데이터
   */
  function getQRContent() {
    let content = '';
    
    try {
      switch(currentContentType) {
        case 'url':
          const urlInput = document.getElementById('url-input');
          if (urlInput) {
            content = urlInput.value;
            if (content && !content.startsWith('http://') && !content.startsWith('https://')) {
              content = 'https://' + content;
            }
          }
          break;
          
        case 'text':
          const textInput = document.getElementById('text-input');
          if (textInput) {
            content = textInput.value;
          }
          break;
          
        case 'email':
          const email = document.getElementById('email-address')?.value || '';
          const subject = document.getElementById('email-subject')?.value || '';
          const body = document.getElementById('email-body')?.value || '';
          
          content = 'mailto:' + email;
          if (subject || body) {
            content += '?';
            if (subject) content += 'subject=' + encodeURIComponent(subject);
            if (subject && body) content += '&';
            if (body) content += 'body=' + encodeURIComponent(body);
          }
          break;
          
        case 'phone':
          const phone = document.getElementById('phone-input')?.value || '';
          content = 'tel:' + phone.replace(/[^+0-9]/g, '');
          break;
          
        case 'vcard':
          const name = document.getElementById('vcard-name')?.value || '';
          const org = document.getElementById('vcard-org')?.value || '';
          const title = document.getElementById('vcard-title')?.value || '';
          const vcardPhone = document.getElementById('vcard-phone')?.value || '';
          const vcardEmail = document.getElementById('vcard-email')?.value || '';
          const website = document.getElementById('vcard-website')?.value || '';
          const address = document.getElementById('vcard-address')?.value || '';
          
          content = 'BEGIN:VCARD\nVERSION:3.0\n';
          content += 'N:' + name + '\n';
          content += 'FN:' + name + '\n';
          if (org) content += 'ORG:' + org + '\n';
          if (title) content += 'TITLE:' + title + '\n';
          if (vcardPhone) content += 'TEL:' + vcardPhone + '\n';
          if (vcardEmail) content += 'EMAIL:' + vcardEmail + '\n';
          if (website) content += 'URL:' + website + '\n';
          if (address) content += 'ADR:;;' + address + ';;;;\n';
          content += 'END:VCARD';
          break;
          
        case 'wifi':
          const ssid = document.getElementById('wifi-ssid')?.value || '';
          const encryption = document.getElementById('wifi-encryption')?.value || 'WPA';
          const password = document.getElementById('wifi-password')?.value || '';
          const hidden = document.getElementById('wifi-hidden')?.checked || false;
          
          content = 'WIFI:';
          content += 'S:' + ssid + ';';
          content += 'T:' + encryption + ';';
          if (encryption !== 'nopass') content += 'P:' + password + ';';
          if (hidden) content += 'H:true;';
          content += ';';
          break;
      }
    } catch (error) {
      console.error('QR 콘텐츠 가져오기 오류:', error);
      showError('QR 코드 콘텐츠를 처리하는 도중 오류가 발생했습니다.');
      return '';
    }
    
    return content;
  }
  
  /**
   * QR 코드 설정 가져오기
   * @returns {Object} QR 코드 설정 객체
   */
  function getQRSettings() {
    try {
      const settings = {
        foregroundColor: document.getElementById('foreground-color')?.value || '#000000',
        backgroundColor: document.getElementById('background-color')?.value || '#FFFFFF',
        errorCorrectionLevel: document.getElementById('error-correction')?.value || 'M',
        size: parseInt(document.getElementById('qr-size')?.value || 256),
        margin: parseInt(document.getElementById('margin')?.value || 1),
        logoEnabled: document.getElementById('add-logo')?.checked || false
      };
      
      // 유효성 검사
      if (isNaN(settings.size) || settings.size < 100 || settings.size > 1000) {
        settings.size = 256;
      }
      
      if (isNaN(settings.margin) || settings.margin < 0 || settings.margin > 5) {
        settings.margin = 1;
      }
      
      return settings;
    } catch (error) {
      console.error('QR 설정 가져오기 오류:', error);
      // 기본 설정 반환
      return {
        foregroundColor: '#000000',
        backgroundColor: '#FFFFFF',
        errorCorrectionLevel: 'M',
        size: 256,
        margin: 1,
        logoEnabled: false
      };
    }
  }
  
  /**
   * QR 코드 생성
   */
  function generateQRCode() {
    console.log('QR 코드 생성 시작...');
    
    // QR 코드 미리보기 컨테이너 가져오기
    const previewContainer = document.getElementById('qr-preview');
    if (!previewContainer) {
      showError('QR 코드 미리보기 컨테이너를 찾을 수 없습니다.');
      return;
    }
    
    // 진행 표시기 표시
    previewContainer.innerHTML = '<div class="loading-spinner"></div><p>QR 코드 생성 중...</p>';
    
    // 결과 및 다운로드 영역 표시/숨김 설정
    const resultContainer = document.getElementById('qr-result');
    const downloadOptions = document.getElementById('download-options');
    
    if (resultContainer) {
      resultContainer.classList.remove('hidden');
    }
    
    if (downloadOptions) {
      downloadOptions.classList.add('hidden');
    }
    
    // QR 코드 내용 가져오기
    const content = getQRContent();
    if (!content) {
      showError('QR 코드에 포함할 내용을 입력해주세요.');
      previewContainer.innerHTML = '<p class="error-message">내용을 입력해주세요.</p>';
      return;
    }
    
    // QR 코드 설정 가져오기
    const settings = getQRSettings();
    
    // QRCode 라이브러리 확인
    const generateQR = async () => {
      try {
        // QRCode 라이브러리가 없으면 로드
        if (typeof QRCode === 'undefined') {
          await loadQRCodeLibrary();
        }
        
        // 이전 QR 코드 제거
        previewContainer.innerHTML = '';
        
        // 새 QR 코드 생성
        qrCode = new QRCode(previewContainer, {
          text: content,
          width: settings.size,
          height: settings.size,
          colorDark: settings.foregroundColor,
          colorLight: settings.backgroundColor,
          correctLevel: QRCode.CorrectLevel[settings.errorCorrectionLevel] || QRCode.CorrectLevel.M,
          margin: settings.margin
        });
        
        // 로고 추가 옵션이 선택된 경우 로고 추가
        if (settings.logoEnabled) {
          const logoImage = document.getElementById('logo-preview')?.src;
          const logoSize = parseInt(document.getElementById('logo-size')?.value || 15);
          
          if (logoImage) {
            setTimeout(() => {
              const qrImage = previewContainer.querySelector('img');
              if (qrImage) {
                addLogoToQRCode(qrImage.src, logoImage, logoSize);
              }
            }, 200);
          }
        }
        
        // QR 코드 생성 완료 후 다운로드 옵션 표시 (지연 추가)
        setTimeout(function() {
          const qrCodeImg = previewContainer.querySelector('img');
          
          if (qrCodeImg) {
            // 이미지 로드 완료 확인
            if (qrCodeImg.complete) {
              if (downloadOptions) {
                downloadOptions.classList.remove('hidden');
              }
              trackQRGeneration(content, settings);
            } else {
              // 이미지가 아직 로드되지 않은 경우, 로드 이벤트 대기
              qrCodeImg.onload = function() {
                if (downloadOptions) {
                  downloadOptions.classList.remove('hidden');
                }
                trackQRGeneration(content, settings);
              };
              
              // 이미지 로드 오류 처리
              qrCodeImg.onerror = function() {
                showError('QR 코드 이미지를 생성할 수 없습니다. 다시 시도해주세요.');
                previewContainer.innerHTML = '<p class="error-message">QR 코드 생성 실패</p>';
              };
            }
          } else {
            showError('QR 코드 이미지를 생성할 수 없습니다. 다시 시도해주세요.');
            previewContainer.innerHTML = '<p class="error-message">QR 코드 생성 실패</p>';
          }
        }, 500);
      } catch (error) {
        console.error('QR 코드 생성 오류:', error);
        showError('QR 코드를 생성하는 도중 오류가 발생했습니다.');
        previewContainer.innerHTML = '<p class="error-message">QR 코드 생성 실패: ' + (error.message || '알 수 없는 오류') + '</p>';
      }
    };
    
    // QR 코드 생성 실행
    generateQR();
  }
  
  /**
   * 사용자 행동 추적
   * @param {string} content - QR 코드 내용
   * @param {Object} settings - QR 코드 설정
   */
  function trackQRGeneration(content, settings) {
    try {
      if (typeof analytics !== 'undefined' && analytics.trackAction) {
        analytics.trackAction('qr', 'generate', currentContentType, {
          contentLength: content.length,
          size: settings.size,
          errorLevel: settings.errorCorrectionLevel,
          hasLogo: settings.logoEnabled
        });
      }
    } catch (e) {
      console.warn('Analytics를 호출할 수 없습니다:', e);
    }
  }
  
  /**
   * QR 코드에 로고 추가
   * @param {string} qrDataURL - QR 코드 데이터 URL
   * @param {string} logoDataURL - 로고 데이터 URL
   * @param {number} logoSize - 로고 크기 (QR 코드 대비 백분율)
   */
  function addLogoToQRCode(qrDataURL, logoDataURL, logoSize) {
    const previewContainer = document.getElementById('qr-preview');
    if (!previewContainer) return;
    
    // 캔버스 생성
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // QR 코드 이미지 로드
    const qrImage = new Image();
    qrImage.onload = function() {
      canvas.width = qrImage.width;
      canvas.height = qrImage.height;
      
      // QR 코드 그리기
      ctx.drawImage(qrImage, 0, 0);
      
      // 로고 이미지 로드
      const logoImage = new Image();
      logoImage.onload = function() {
        try {
          // 로고 크기 계산 (QR 코드 크기의 %로)
          const logoWidth = qrImage.width * (logoSize / 100);
          const logoHeight = logoWidth;
          
          // 로고를 중앙에 배치
          const logoX = (qrImage.width - logoWidth) / 2;
          const logoY = (qrImage.height - logoHeight) / 2;
          
          // 로고 배경을 흰색으로 지우기
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(logoX, logoY, logoWidth, logoHeight);
          
          // 로고 그리기
          ctx.drawImage(logoImage, logoX, logoY, logoWidth, logoHeight);
          
          // 결과 이미지를 QR 코드 컨테이너에 표시
          const qrWithLogo = canvas.toDataURL('image/png');
          
          // 기존 QR 코드 이미지 교체
          const imgElement = previewContainer.querySelector('img');
          if (imgElement) {
            imgElement.src = qrWithLogo;
            generatedQRDataURL = qrWithLogo;
          }
        } catch (error) {
          console.error('로고 추가 오류:', error);
          showError('QR 코드에 로고를 추가하는 도중 오류가 발생했습니다.');
        }
      };
      
      logoImage.onerror = function() {
        showError('로고 이미지를 로드할 수 없습니다.');
      };
      
      logoImage.src = logoDataURL;
    };
    
    qrImage.onerror = function() {
      showError('QR 코드 이미지를 로드할 수 없습니다.');
    };
    
    qrImage.src = qrDataURL;
  }
  
  /**
   * QR 코드 다운로드
   * @param {string} format - 다운로드 형식 (png, svg, jpeg)
   */
  function downloadQRCode(format) {
    console.log(`QR 코드 다운로드 시작 (${format})...`);
    
    const previewContainer = document.getElementById('qr-preview');
    if (!previewContainer) {
      showError('QR 코드 미리보기 컨테이너를 찾을 수 없습니다.');
      return;
    }
    
    const qrCodeImg = previewContainer.querySelector('img');
    if (!qrCodeImg) {
      showError('다운로드할 QR 코드 이미지를 찾을 수 없습니다. 다시 생성해주세요.');
      return;
    }
    
    // 이미지가 로드되었는지 확인
    if (!qrCodeImg.complete) {
      showError('QR 코드 이미지가 아직 로드 중입니다. 잠시 후 다시 시도해주세요.');
      return;
    }
    
    try {
      // 캔버스 생성 및 QR 코드 그리기
      const canvas = document.createElement('canvas');
      const size = parseInt(document.getElementById('qr-size')?.value || 256);
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      
      // 배경색으로 캔버스 채우기
      const backgroundColor = document.getElementById('background-color')?.value || '#FFFFFF';
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // QR 코드 이미지 그리기
      ctx.drawImage(qrCodeImg, 0, 0, canvas.width, canvas.height);
      
      // 다운로드 링크 생성
      const downloadLink = document.createElement('a');
      let dataURL;
      let mimeType;
      let fileExtension;
      
      // 요청된 형식에 따라 처리
      switch (format) {
        case 'svg':
          try {
            // SVG 변환 처리
            const svgData = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
              <image href="${qrCodeImg.src}" width="${size}" height="${size}"/>
            </svg>`;
            
            const blob = new Blob([svgData], {type: 'image/svg+xml'});
            dataURL = URL.createObjectURL(blob);
            mimeType = 'image/svg+xml';
            fileExtension = 'svg';
          } catch (svgError) {
            console.error('SVG 변환 오류:', svgError);
            // SVG 실패 시 PNG로 대체
            dataURL = canvas.toDataURL('image/png');
            mimeType = 'image/png';
            fileExtension = 'png';
            showError('SVG 형식 변환에 실패하여 PNG로 다운로드합니다.');
          }
          break;
        
        case 'jpeg':
          // JPEG로 변환
          dataURL = canvas.toDataURL('image/jpeg', 0.9);
          mimeType = 'image/jpeg';
          fileExtension = 'jpg';
          break;
        
        default:
          // 기본: PNG
          dataURL = canvas.toDataURL('image/png');
          mimeType = 'image/png';
          fileExtension = 'png';
      }
      
      // 파일명 생성
      const timestamp = new Date().toISOString().replace(/[-:.]/g, '').substr(0, 14);
      const contentType = getCurrentContentName();
      const filename = `qrcode_${contentType}_${timestamp}.${fileExtension}`;
      
      // 다운로드 링크 설정 및 클릭
      downloadLink.href = dataURL;
      downloadLink.download = filename;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      
      // 지연 후 링크 제거 (URL.revokeObjectURL 필요 시)
      setTimeout(() => {
        document.body.removeChild(downloadLink);
        if (format === 'svg' && dataURL.startsWith('blob:')) {
          URL.revokeObjectURL(dataURL);
        }
      }, 100);
      
      // 사용자 행동 추적
      try {
        if (typeof analytics !== 'undefined' && analytics.trackAction) {
          analytics.trackAction('qr', 'download', format, {
            contentType: contentType,
            fileSize: estimateFileSize(dataURL)
          });
        }
      } catch (e) {
        console.warn('Analytics를 호출할 수 없습니다:', e);
      }
    } catch (error) {
      console.error('QR 코드 다운로드 오류:', error);
      showError('QR 코드를 다운로드하는 도중 오류가 발생했습니다: ' + (error.message || '알 수 없는 오류'));
    }
  }
  
  /**
   * 파일 크기 추정
   * @param {string} dataURL - 데이터 URL
   * @returns {number} 바이트 단위의 파일 크기
   */
  function estimateFileSize(dataURL) {
    if (!dataURL) return 0;
    
    // blob: URL인 경우 크기를 알 수 없음
    if (dataURL.startsWith('blob:')) return 0;
    
    // 데이터 URL의 base64 부분 추출
    const base64 = dataURL.split(',')[1];
    if (!base64) return 0;
    
    // Base64 문자열 길이로 크기 추정
    return Math.round(base64.length * 0.75);
  }
  
  /**
   * 현재 콘텐츠 유형에 맞는 이름 가져오기
   * @returns {string} 콘텐츠 유형 이름
   */
  function getCurrentContentName() {
    switch(currentContentType) {
      case 'url': return 'url';
      case 'text': return 'text';
      case 'email': return 'email';
      case 'phone': return 'phone';
      case 'vcard': return 'contact';
      case 'wifi': return 'wifi';
      default: return 'custom';
    }
  }
  
  /**
   * 오류 메시지 표시 함수
   * @param {string} message - 오류 메시지
   */
  function showError(message) {
    console.error('오류:', message);
    
    // 알림 표시 또는 UI 업데이트
    const notification = document.createElement('div');
    notification.className = 'notification error';
    notification.innerHTML = `<span class="icon">❌</span> ${message}`;
    
    // 이미 있는 알림 제거
    const existingNotifications = document.querySelectorAll('.notification.error');
    existingNotifications.forEach(notification => {
      document.body.removeChild(notification);
    });
    
    document.body.appendChild(notification);
    
    // 3초 후 알림 제거
    setTimeout(function() {
      if (document.body.contains(notification)) {
        notification.classList.add('fade-out');
        setTimeout(function() {
          if (document.body.contains(notification)) {
            document.body.removeChild(notification);
          }
        }, 500);
      }
    }, 3000);
  }
  
  // 모듈 API 설정
  qrGenerator.init = init;
  qrGenerator.generateQRCode = generateQRCode;
  qrGenerator.downloadQRCode = downloadQRCode;
  qrGenerator.showError = showError;
  
  // DOM 로드 완료 시 초기화
  document.addEventListener('DOMContentLoaded', init);
})(); 