/**
 * qr-generator.js - QR 코드 생성 기능을 구현하는 모듈
 * 버전: 1.2.0
 * 최종 업데이트: 2025-06-25
 */

// 공통 유틸리티 모듈 임포트
import FileUtils from '../utils/file-utils.js';
// QR 코드 생성 핵심 모듈 임포트
import QRCore from '../core/qr-core.js';

// 모듈 내부 상태 변수들
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

// 파일 유틸리티 참조
let fileUtils = null;

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
 * UI 초기화 및 이벤트 바인딩
 */
function initUI() {
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
  
  // URL 파라미터 및 세션 스토리지 데이터 확인
  checkForFileData();
  
  console.log('QR 코드 생성기 초기화 완료');
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
  
  // QR 코드 설정 변경 이벤트 처리
  bindSettingsEvents(elements);
  
  // 다운로드 버튼 이벤트
  bindDownloadEvents(elements);
}

/**
 * QR 코드 설정 변경 이벤트 처리
 * @param {Object} elements - DOM 요소 참조
 */
function bindSettingsEvents(elements) {
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
      
      // 로고 옵션 표시/숨김
      if (elements.logoOptions) {
        elements.logoOptions.style.display = this.checked ? 'block' : 'none';
      }
    });
  }
  
  if (elements.logoFile) {
    elements.logoFile.addEventListener('change', function(event) {
      if (event.target.files && event.target.files[0]) {
        const file = event.target.files[0];
        const reader = new FileReader();
        
        reader.onload = function(e) {
          // 로고 미리보기 업데이트
          if (elements.logoPreview) {
            elements.logoPreview.src = e.target.result;
            elements.logoPreview.style.display = 'block';
          }
          
          // 로고 이미지 데이터 저장
          qrSettings.logoImage = e.target.result;
        };
        
        reader.readAsDataURL(file);
      }
    });
  }
  
  if (elements.logoSize) {
    elements.logoSize.addEventListener('input', function() {
      qrSettings.logoSize = parseInt(this.value);
    });
  }
}

/**
 * 다운로드 버튼 이벤트 바인딩
 * @param {Object} elements - DOM 요소 참조
 */
function bindDownloadEvents(elements) {
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
 * QR 코드 콘텐츠 가져오기
 * @returns {string|null} QR 코드 콘텐츠
 */
function getQRContent() {
  const contentForm = document.querySelector(`.content-form.active`);
  if (!contentForm) {
    showError('콘텐츠 폼을 찾을 수 없습니다.');
    return null;
  }
  
  try {
    switch (currentContentType) {
      case 'url':
        const urlInput = document.getElementById('url-input');
        if (!urlInput || !urlInput.value.trim()) {
          showError('URL을 입력해주세요.');
          return null;
        }
        return QRCore.formatContent('url', urlInput.value.trim());
      
      case 'text':
        const textInput = document.getElementById('text-input');
        if (!textInput || !textInput.value.trim()) {
          showError('텍스트를 입력해주세요.');
          return null;
        }
        return textInput.value.trim();
      
      case 'email':
        const emailInput = document.getElementById('email-input');
        if (!emailInput || !emailInput.value.trim()) {
          showError('이메일 주소를 입력해주세요.');
          return null;
        }
        return QRCore.formatContent('email', emailInput.value.trim());
      
      case 'phone':
        const phoneInput = document.getElementById('phone-input');
        if (!phoneInput || !phoneInput.value.trim()) {
          showError('전화번호를 입력해주세요.');
          return null;
        }
        return QRCore.formatContent('phone', phoneInput.value.trim());
      
      case 'vcard':
        const nameInput = document.getElementById('vcard-name');
        const phoneContactInput = document.getElementById('vcard-phone');
        
        if (!nameInput || !nameInput.value.trim() || !phoneContactInput || !phoneContactInput.value.trim()) {
          showError('연락처 정보를 입력해주세요.');
          return null;
        }
        
        const contact = {
          name: nameInput.value.trim(),
          phone: phoneContactInput.value.trim(),
          firstName: document.getElementById('vcard-firstname')?.value.trim() || '',
          lastName: document.getElementById('vcard-lastname')?.value.trim() || '',
          email: document.getElementById('vcard-email')?.value.trim() || '',
          org: document.getElementById('vcard-org')?.value.trim() || '',
          title: document.getElementById('vcard-title')?.value.trim() || '',
          address: document.getElementById('vcard-address')?.value.trim() || '',
          url: document.getElementById('vcard-url')?.value.trim() || '',
          note: document.getElementById('vcard-note')?.value.trim() || ''
        };
        
        return QRCore.formatContent('vcard', contact);
      
      case 'wifi':
        const ssidInput = document.getElementById('wifi-ssid');
        if (!ssidInput || !ssidInput.value.trim()) {
          showError('Wi-Fi SSID를 입력해주세요.');
          return null;
        }
        
        const wifi = {
          ssid: ssidInput.value.trim(),
          password: document.getElementById('wifi-password')?.value.trim() || '',
          authType: document.querySelector('input[name="wifi-type"]:checked')?.value || 'WPA',
          hidden: document.getElementById('wifi-hidden')?.checked || false
        };
        
        return QRCore.formatContent('wifi', wifi);
      
      case 'file':
        if (!fileData) {
          showError('변환된 파일 데이터가 없습니다.');
          return null;
        }
        return fileData;
      
      default:
        showError(`지원하지 않는 콘텐츠 유형: ${currentContentType}`);
        return null;
    }
  } catch (error) {
    console.error('QR 코드 콘텐츠 가져오기 실패:', error);
    showError(`콘텐츠 처리 중 오류: ${error.message}`);
    return null;
  }
}

/**
 * QR 코드 설정 가져오기
 * @returns {Object} QR 코드 설정
 */
function getQRSettings() {
  try {
    const settings = { ...qrSettings };
    
    // 유효성 검사
    if (isNaN(settings.size) || settings.size < 100 || settings.size > 1000) {
      settings.size = 256;
    }
    
    return settings;
  } catch (error) {
    console.error('QR 코드 설정 가져오기 실패:', error);
    showError(`설정 처리 중 오류: ${error.message}`);
    return { ...qrSettings };
  }
}

/**
 * QR 코드 생성
 */
function generateQRCode() {
  try {
    const content = getQRContent();
    if (!content) return;
    
    const settings = getQRSettings();
    
    // QR 코드 미리보기 요소 가져오기
    const previewContainer = document.getElementById('qr-preview');
    if (!previewContainer) {
      showError('QR 코드 미리보기 요소를 찾을 수 없습니다.');
      return;
    }
    
    // 기존 QR 코드 객체 정리
    if (qrCode) {
      qrCode = null;
    }
    
    // 미리보기 컨테이너 비우기
    previewContainer.innerHTML = '';
    
    // 다운로드 옵션 숨기기
    const downloadOptions = document.getElementById('download-options');
    if (downloadOptions) {
      downloadOptions.classList.add('hidden');
    }
    
    // QR 코드 생성
    qrCode = new QRCode(previewContainer, {
      text: content,
      width: settings.size,
      height: settings.size,
      colorDark: settings.foregroundColor,
      colorLight: settings.backgroundColor,
      correctLevel: QRCode[`CorrectLevel`][settings.errorCorrectionLevel]
    });
    
    // 로고 추가
    if (settings.logoEnabled && settings.logoImage) {
      // 로고 추가 기능은 커스텀 로직 필요
      addLogoToQR(previewContainer, settings);
    }
    
    // QR 코드 이미지 URL 저장
    const qrCodeImg = previewContainer.querySelector('img');
    if (qrCodeImg) {
      qrCodeImg.onload = function() {
        generatedQRDataURL = qrCodeImg.src;
        
        // 다운로드 옵션 표시
        if (downloadOptions) {
          downloadOptions.classList.remove('hidden');
        }
        
        // 사용 통계 추적
        trackQRGeneration(content, settings);
      };
    }
    
  } catch (error) {
    console.error('QR 코드 생성 실패:', error);
    showError(`QR 코드 생성 중 오류: ${error.message}`);
  }
}

/**
 * QR 코드에 로고 추가
 * @param {HTMLElement} container - QR 코드 컨테이너
 * @param {Object} settings - QR 코드 설정
 */
function addLogoToQR(container, settings) {
  setTimeout(() => {
    const qrCodeImg = container.querySelector('img');
    if (!qrCodeImg) return;
    
    // QR 코드 로고 처리 로직 추가
    // (이 부분에는 별도의 로고 처리 로직이 들어갑니다)
  }, 100);
}

/**
 * QR 코드 생성 추적
 * @param {string} content - QR 코드 콘텐츠
 * @param {Object} settings - QR 코드 설정
 */
function trackQRGeneration(content, settings) {
  try {
    if (typeof analytics !== 'undefined' && analytics.trackAction) {
      analytics.trackAction('qr', 'generate', currentContentType, {
        contentType: currentContentType,
        contentLength: typeof content === 'string' ? content.length : 0,
        size: settings.size,
        hasLogo: settings.logoEnabled,
        errorLevel: settings.errorCorrectionLevel
      });
    }
  } catch (e) {
    console.warn('Analytics를 호출할 수 없습니다:', e);
  }
}

/**
 * QR 코드 다운로드
 * @param {string} format - 다운로드 형식 (png, svg, jpeg)
 */
function downloadQRCode(format) {
  if (!generatedQRDataURL) {
    showError('다운로드할 QR 코드가 없습니다. 먼저 QR 코드를 생성해주세요.');
    return;
  }
  
  // QR 코드 이미지 요소 가져오기
  const qrCodeImg = document.querySelector('#qr-preview img');
  if (!qrCodeImg) {
    showError('QR 코드 이미지를 찾을 수 없습니다.');
    return;
  }
  
  // 이미지 로드 상태 확인
  if (!qrCodeImg.complete) {
    showError('QR 코드 이미지가 아직 로드 중입니다. 잠시 후 다시 시도해주세요.');
    return;
  }
  
  try {
    // 형식에 따른 다운로드 처리
    const contentName = getCurrentContentName();
    const timestamp = new Date().toISOString().replace(/[-:.]/g, '').substring(0, 14);
    const filename = `qrcode_${contentName}_${timestamp}`;
    
    switch (format) {
      case 'svg':
        downloadAsSVG(qrCodeImg, filename);
        break;
      
      case 'jpeg':
        downloadAsJPEG(qrCodeImg, filename);
        break;
      
      default:
        downloadAsPNG(qrCodeImg, filename);
        break;
    }
    
    // 다운로드 이벤트 추적
    try {
      if (typeof analytics !== 'undefined') {
        analytics.trackAction('qr', 'download', format);
      }
    } catch (e) {
      console.warn('Analytics를 호출할 수 없습니다:', e);
    }
    
  } catch (error) {
    console.error('QR 코드 다운로드 실패:', error);
    showError(`다운로드 중 오류: ${error.message}`);
  }
}

/**
 * PNG로 다운로드
 * @param {HTMLImageElement} img - QR 코드 이미지
 * @param {string} filename - 파일명
 */
function downloadAsPNG(img, filename) {
  const a = document.createElement('a');
  a.href = img.src;
  a.download = `${filename}.png`;
  a.click();
}

/**
 * SVG로 다운로드
 * @param {HTMLImageElement} img - QR 코드 이미지
 * @param {string} filename - 파일명
 */
function downloadAsSVG(img, filename) {
  // 이 예제에서는 SVG 변환 기능이 구현되지 않았으므로 PNG로 대체
  showError('SVG 다운로드는 아직 구현되지 않았습니다. PNG로 다운로드됩니다.');
  downloadAsPNG(img, filename);
}

/**
 * JPEG로 다운로드
 * @param {HTMLImageElement} img - QR 코드 이미지
 * @param {string} filename - 파일명
 */
function downloadAsJPEG(img, filename) {
  // 캔버스를 사용하여 이미지를 JPEG로 변환
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  // 캔버스 크기 설정
  canvas.width = img.naturalWidth || img.width;
  canvas.height = img.naturalHeight || img.height;
  
  // 이미지를 흰색 배경으로 그리기
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0);
  
  // JPEG로 변환
  const jpegURL = canvas.toDataURL('image/jpeg', 0.9);
  
  // 다운로드
  const a = document.createElement('a');
  a.href = jpegURL;
  a.download = `${filename}.jpg`;
  a.click();
}

/**
 * 현재 콘텐츠 타입에 따른 파일명 생성
 * @returns {string} 파일명 부분
 */
function getCurrentContentName() {
  let name = currentContentType;
  
  try {
    switch (currentContentType) {
      case 'url':
        const urlInput = document.getElementById('url-input');
        if (urlInput && urlInput.value) {
          try {
            const url = new URL(urlInput.value.startsWith('http') ? urlInput.value : `https://${urlInput.value}`);
            name = url.hostname.replace(/^www\./, '');
          } catch (e) {
            name = 'url';
          }
        }
        break;
      
      case 'text':
        name = 'text';
        break;
      
      case 'email':
        const emailInput = document.getElementById('email-input');
        if (emailInput && emailInput.value) {
          name = emailInput.value.split('@')[0] || 'email';
        }
        break;
      
      case 'phone':
        name = 'phone';
        break;
      
      case 'vcard':
        const nameInput = document.getElementById('vcard-name');
        if (nameInput && nameInput.value) {
          name = nameInput.value.replace(/\s+/g, '_').toLowerCase() || 'contact';
        } else {
          name = 'contact';
        }
        break;
      
      case 'wifi':
        const ssidInput = document.getElementById('wifi-ssid');
        if (ssidInput && ssidInput.value) {
          name = `wifi_${ssidInput.value.replace(/\s+/g, '_').toLowerCase()}`;
        } else {
          name = 'wifi';
        }
        break;
      
      case 'file':
        name = 'file';
        break;
    }
  } catch (e) {
    console.warn('파일명 생성 중 오류:', e);
  }
  
  return name;
}

/**
 * 오류 메시지 표시
 * @param {string} message - 오류 메시지
 */
function showError(message) {
  console.error(message);
  
  // 오류 메시지 표시 UI
  const errorContainer = document.getElementById('error-message');
  if (errorContainer) {
    errorContainer.textContent = message;
    errorContainer.classList.remove('hidden');
    
    // 5초 후 자동으로 숨기기
    setTimeout(() => {
      errorContainer.classList.add('hidden');
    }, 5000);
  } else {
    // 기본 alert 사용
    alert(message);
  }
}

// 파일 데이터 전달을 위한 변수
let fileData = null;

/**
 * URL 파라미터 및 세션 스토리지 데이터 확인
 */
function checkForFileData() {
  try {
    // 세션 스토리지에서 파일 데이터 확인
    const sessionData = sessionStorage.getItem('fileToQR');
    if (sessionData) {
      try {
        const data = JSON.parse(sessionData);
        fileData = data.dataUri;
        const fileInfo = document.getElementById('file-info');
        
        if (fileInfo && data.fileName) {
          fileInfo.textContent = `변환할 파일: ${data.fileName} (${data.fileSize || '크기 정보 없음'})`;
          fileInfo.classList.remove('hidden');
        }
        
        // 파일 탭 자동 선택
        const fileTab = document.querySelector('[data-type="file"]');
        if (fileTab) {
          fileTab.click();
        }
        
        // 세션 데이터 사용 후 삭제
        sessionStorage.removeItem('fileToQR');
      } catch (e) {
        console.error('세션 데이터 파싱 오류:', e);
      }
    }
    
    // URL 파라미터 확인
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('type') && urlParams.has('data')) {
      const type = urlParams.get('type');
      const data = urlParams.get('data');
      
      // 유효한 타입 확인
      if (Object.keys(QRCore.contentTypes).includes(type)) {
        // 탭 선택
        const tab = document.querySelector(`[data-type="${type}"]`);
        if (tab) {
          tab.click();
        }
        
        // 데이터 자동 채우기
        if (type === 'url') {
          const urlInput = document.getElementById('url-input');
          if (urlInput) {
            urlInput.value = data;
          }
        } else if (type === 'text') {
          const textInput = document.getElementById('text-input');
          if (textInput) {
            textInput.value = data;
          }
        }
        
        // 자동 생성 (옵션)
        const autoGenerate = urlParams.get('auto');
        if (autoGenerate === 'true') {
          setTimeout(() => {
            const generateButton = document.getElementById('generate-qr');
            if (generateButton) {
              generateButton.click();
            }
          }, 500);
        }
      }
    }
  } catch (error) {
    console.error('파일 데이터 확인 중 오류:', error);
  }
}

// 공개 API를 가진 모듈 객체
const qrGenerator = {
  /**
   * 모듈 초기화
   */
  init() {
    console.log('QR 코드 생성기 초기화 중...');
    
    // QRCode 라이브러리가 로드되었는지 확인
    const initializeAfterDependencies = () => {
      // FileUtils 참조 설정
      if (typeof window !== 'undefined' && window.FileToQR?.utils?.file) {
        fileUtils = window.FileToQR.utils.file;
        console.log('파일 유틸리티 참조 설정 완료');
      } else if (typeof FileUtils !== 'undefined') {
        fileUtils = FileUtils;
        console.log('파일 유틸리티 모듈 참조 설정 완료');
      } else {
        console.error('파일 유틸리티를 찾을 수 없습니다. UI 초기화를 계속합니다.');
      }
      
      // QRCore 참조 확인
      if (typeof window !== 'undefined' && window.QRCore) {
        console.log('QRCore 참조 설정 완료');
      } else if (typeof QRCore === 'undefined') {
        console.warn('QRCore 모듈을 찾을 수 없습니다. 일부 기능이 제한될 수 있습니다.');
      }
      
      // UI 초기화
      initUI();
    };
    
    // QRCode 라이브러리 로드 확인 및 동적 로드
    if (typeof QRCode === 'undefined') {
      console.warn('QRCode 라이브러리가 로드되지 않았습니다. 라이브러리를 로드 중입니다...');
      loadQRCodeLibrary()
        .then(() => {
          console.log('QRCode 라이브러리 로드 완료');
          initializeAfterDependencies();
        })
        .catch(error => {
          console.error('QRCode 라이브러리 로드 실패:', error);
          // 실패해도 UI 초기화 시도
          initializeAfterDependencies();
        });
    } else {
      initializeAfterDependencies();
    }
    
    return this;
  },
  
  /**
   * QR 코드 설정 업데이트
   * @param {Object} settings - 새 설정 값
   */
  updateSettings(settings) {
    qrSettings = { ...qrSettings, ...settings };
    return this;
  },
  
  /**
   * 외부 파일 데이터 설정
   * @param {string} dataUri - 파일 데이터 URI
   * @param {string} fileName - 파일명
   * @param {string} fileSize - 포맷팅된 파일 크기
   */
  setFileData(dataUri, fileName, fileSize) {
    fileData = dataUri;
    
    // 세션 스토리지에 임시 저장
    if (window.sessionStorage) {
      sessionStorage.setItem('fileToQR', JSON.stringify({
        dataUri,
        fileName,
        fileSize
      }));
    }
    
    return this;
  },
  
  generateQRCode,
  downloadQRCode
};

// 하위 호환성을 위한 전역 참조
if (typeof window !== 'undefined') {
  window.FileToQR = window.FileToQR || {};
  window.FileToQR.qrGenerator = qrGenerator;
}

// 모듈 내보내기 추가
export default qrGenerator; 