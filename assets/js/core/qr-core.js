/**
 * qr-core.js - FileToQR QR 코드 생성 핵심 모듈
 * 버전: 1.0.0
 * 최종 업데이트: 2025-06-15
 * 
 * 이 모듈은 QR 코드 생성 기능의 핵심 로직을 제공합니다:
 * - 다양한 콘텐츠 유형의 QR 코드 생성
 * - 커스텀 스타일링 (색상, 크기, 오류 수정 레벨 등)
 * - 로고 추가 기능
 * - 다양한 형식으로 내보내기 (PNG, SVG, JPEG)
 */

// 공통 유틸리티 모듈 임포트
import FileUtils from '../utils/file-utils.js';

// QR 코드 생성기 코어 모듈
const QRCore = {};

// QR 코드 설정 기본값
QRCore.defaultSettings = {
  foregroundColor: '#000000',
  backgroundColor: '#FFFFFF',
  errorCorrectionLevel: 'M',
  margin: 1,
  size: 256,
  logoEnabled: false,
  logoSize: 15,  // QR 코드 크기 대비 퍼센트
  logoMargin: 2, // 로고 마진 픽셀
  dotStyle: 'square', // square, rounded, dots
  cornerStyle: 'square' // square, rounded, dot
};

// 지원하는 콘텐츠 유형
QRCore.contentTypes = {
  'url': {
    name: 'URL',
    prefix: '',
    validation: input => /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w .-]*)*\/?$/.test(input)
  },
  'text': {
    name: '텍스트',
    prefix: '',
    validation: input => input.length > 0
  },
  'email': {
    name: '이메일',
    prefix: 'mailto:',
    validation: input => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input)
  },
  'phone': {
    name: '전화번호',
    prefix: 'tel:',
    validation: input => /^[\d+\-() ]+$/.test(input)
  },
  'vcard': {
    name: '연락처',
    prefix: '',
    validation: input => true // vCard는 복잡한 객체 형태로 받아서 처리
  },
  'wifi': {
    name: 'WiFi 설정',
    prefix: '',
    validation: input => true // WiFi 설정도 객체 형태로 받아서 처리
  },
  'file': {
    name: '파일',
    prefix: '',
    validation: input => true // 파일은 dataURI로 받아서 처리
  }
};

/**
 * QR 코드 생성 데이터 검증
 * @param {string} contentType - 콘텐츠 유형 (url, text, email 등)
 * @param {string|Object} content - 인코딩할 콘텐츠
 * @returns {boolean} 유효성 여부
 */
QRCore.validateContent = function(contentType, content) {
  const type = this.contentTypes[contentType];
  
  if (!type) {
    console.error('지원하지 않는 콘텐츠 유형:', contentType);
    return false;
  }
  
  // 단순 문자열 콘텐츠 경우 직접 검증
  if (typeof content === 'string') {
    return type.validation(content);
  }
  
  // 객체 형태 콘텐츠 (vcard, wifi 등)는 필수 필드 검사
  if (contentType === 'vcard') {
    return content.name && content.phone;
  } else if (contentType === 'wifi') {
    return content.ssid;
  } else if (contentType === 'file') {
    return content.dataUri && content.fileName;
  }
  
  return false;
};

/**
 * QR 코드 콘텐츠 형식화
 * @param {string} contentType - 콘텐츠 유형
 * @param {string|Object} content - 원본 콘텐츠
 * @returns {string} QR 코드에 인코딩할 형식화된 문자열
 */
QRCore.formatContent = function(contentType, content) {
  switch (contentType) {
    case 'url':
      let url = content;
      if (!/^https?:\/\//i.test(url)) {
        url = 'https://' + url;
      }
      return url;
      
    case 'text':
      return content;
      
    case 'email':
      let emailContent = this.contentTypes.email.prefix + content;
      return emailContent;
      
    case 'phone':
      // 전화번호 형식 정리 (공백, 하이픈 등 제거하고 국제 형식으로)
      let phoneNumber = content.replace(/[\s-]/g, '');
      if (!phoneNumber.startsWith('+')) {
        phoneNumber = '+' + phoneNumber;
      }
      return this.contentTypes.phone.prefix + phoneNumber;
      
    case 'vcard':
      return this.formatVCard(content);
      
    case 'wifi':
      return this.formatWifi(content);
      
    case 'file':
      // 파일 데이터는 이미 데이터 URI 형태로 제공됨
      return content.dataUri;
      
    default:
      console.warn('지원하지 않는 콘텐츠 유형:', contentType);
      return content;
  }
};

/**
 * vCard 형식으로 변환
 * @param {Object} contact - 연락처 정보 객체
 * @returns {string} vCard 형식 문자열
 */
QRCore.formatVCard = function(contact) {
  let vcard = 'BEGIN:VCARD\nVERSION:3.0\n';
  
  // 필수 필드
  vcard += `N:${contact.lastName || ''};${contact.firstName || ''};;\n`;
  vcard += `FN:${contact.name}\n`;
  
  // 선택적 필드들
  if (contact.org) vcard += `ORG:${contact.org}\n`;
  if (contact.title) vcard += `TITLE:${contact.title}\n`;
  if (contact.phone) vcard += `TEL;TYPE=CELL:${contact.phone}\n`;
  if (contact.email) vcard += `EMAIL:${contact.email}\n`;
  if (contact.address) vcard += `ADR:;;${contact.address};;;\n`;
  if (contact.url) vcard += `URL:${contact.url}\n`;
  if (contact.note) vcard += `NOTE:${contact.note}\n`;
  
  vcard += 'END:VCARD';
  return vcard;
};

/**
 * WiFi 설정 형식으로 변환
 * @param {Object} wifi - WiFi 설정 정보
 * @returns {string} WiFi 설정 문자열
 */
QRCore.formatWifi = function(wifi) {
  let result = 'WIFI:';
  
  // 인증 타입
  result += `T:${wifi.authType || 'WPA'};`;
  
  // SSID (필수)
  result += `S:${this.escapeWifiString(wifi.ssid)};`;
  
  // 비밀번호 (선택)
  if (wifi.password) {
    result += `P:${this.escapeWifiString(wifi.password)};`;
  }
  
  // 숨김 네트워크 여부
  if (wifi.hidden) {
    result += 'H:true;';
  }
  
  return result + ';';
};

/**
 * WiFi 문자열 이스케이프 처리
 * @param {string} str - 이스케이프할 문자열
 * @returns {string} 이스케이프된 문자열
 */
QRCore.escapeWifiString = function(str) {
  return str.replace(/[\\";\,:]/g, '\\$&');
};

/**
 * QR 코드 생성 옵션 파라미터화
 * @param {Object} options - 사용자 지정 옵션
 * @returns {Object} 병합된 최종 옵션
 */
QRCore.getOptions = function(options = {}) {
  // 기본 설정과 사용자 옵션 병합
  return {
    ...this.defaultSettings,
    ...options
  };
};

/**
 * QR 코드 생성 함수
 * @param {string} contentType - 콘텐츠 유형
 * @param {string|Object} content - QR 코드에 인코딩할 콘텐츠
 * @param {Object} options - 생성 옵션
 * @returns {Promise<Object>} QR 코드 데이터 및 메타데이터
 */
QRCore.generateQR = function(contentType, content, options = {}) {
  return new Promise((resolve, reject) => {
    try {
      // 콘텐츠 검증
      if (!this.validateContent(contentType, content)) {
        reject(new Error('유효하지 않은 콘텐츠입니다.'));
        return;
      }
      
      // 콘텐츠 형식화
      const formattedContent = this.formatContent(contentType, content);
      
      // 옵션 병합
      const mergedOptions = this.getOptions(options);
      
      // QR 코드 생성 (qrcode.js 라이브러리 사용)
      // 내부 구현은 qrcode.js 라이브러리에 의존
      // 라이브러리가 로드되지 않았을 경우를 대비한 처리
      if (typeof QRCode === 'undefined') {
        this.loadQRCodeLibrary()
          .then(() => {
            this.renderQRCode(formattedContent, mergedOptions, resolve, reject);
          })
          .catch(error => {
            reject(new Error('QR 코드 라이브러리를 로드하지 못했습니다: ' + error.message));
          });
      } else {
        this.renderQRCode(formattedContent, mergedOptions, resolve, reject);
      }
    } catch (error) {
      reject(new Error('QR 코드 생성 중 오류가 발생했습니다: ' + error.message));
    }
  });
};

/**
 * QR 코드 라이브러리 동적 로드
 * @returns {Promise<void>} 로드 완료 프로미스
 */
QRCore.loadQRCodeLibrary = function() {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = '/node_modules/qrcode/build/qrcode.min.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('QR 코드 라이브러리 로드 실패'));
    document.head.appendChild(script);
  });
};

/**
 * QR 코드 렌더링 실행
 * @param {string} formattedContent - 형식화된 콘텐츠
 * @param {Object} options - 렌더링 옵션
 * @param {Function} resolve - 성공 시 호출할 resolve 함수
 * @param {Function} reject - 실패 시 호출할 reject 함수
 */
QRCore.renderQRCode = function(formattedContent, options, resolve, reject) {
  // 캔버스 요소 생성
  const canvas = document.createElement('canvas');
  canvas.width = options.size;
  canvas.height = options.size;
  
  try {
    // QRCode 라이브러리 옵션
    const qrOptions = {
      errorCorrectionLevel: options.errorCorrectionLevel,
      margin: options.margin,
      width: options.size,
      height: options.size,
      color: {
        dark: options.foregroundColor,
        light: options.backgroundColor
      }
    };
    
    // QR 코드 생성
    QRCode.toCanvas(canvas, formattedContent, qrOptions, (error) => {
      if (error) {
        reject(new Error('QR 코드 생성 실패: ' + error.message));
        return;
      }
      
      // 로고 추가 처리
      if (options.logoEnabled && options.logoImage) {
        this.addLogoToQRCode(canvas, options.logoImage, options, () => {
          finishRendering();
        });
      } else {
        finishRendering();
      }
      
      // 렌더링 완료 처리
      function finishRendering() {
        const imageDataUrl = canvas.toDataURL('image/png');
        
        // 결과 객체 반환
        resolve({
          dataUrl: imageDataUrl,
          size: options.size,
          content: formattedContent,
          contentType,
          options
        });
      }
    });
  } catch (error) {
    reject(new Error('QR 코드 렌더링 중 오류가 발생했습니다: ' + error.message));
  }
};

/**
 * QR 코드에 로고 추가
 * @param {HTMLCanvasElement} canvas - QR 코드가 그려진 캔버스
 * @param {string} logoSrc - 로고 이미지 소스 (URL 또는 Data URL)
 * @param {Object} options - 로고 관련 옵션
 * @param {Function} callback - 처리 완료 후 콜백
 */
QRCore.addLogoToQRCode = function(canvas, logoSrc, options, callback) {
  const logoImg = new Image();
  logoImg.crossOrigin = 'Anonymous';
  
  logoImg.onload = function() {
    const ctx = canvas.getContext('2d');
    
    // 로고 크기 계산 (QR 코드 크기의 퍼센트)
    const logoSize = Math.floor((options.size * options.logoSize) / 100);
    const logoX = (canvas.width - logoSize) / 2;
    const logoY = (canvas.height - logoSize) / 2;
    
    // 로고 영역 지우기 (배경색으로)
    ctx.fillStyle = options.backgroundColor;
    ctx.fillRect(logoX - options.logoMargin, logoY - options.logoMargin, 
                 logoSize + options.logoMargin * 2, logoSize + options.logoMargin * 2);
    
    // 로고 그리기
    ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize);
    
    callback();
  };
  
  logoImg.onerror = function() {
    console.error('로고 이미지 로드 실패:', logoSrc);
    callback();
  };
  
  logoImg.src = logoSrc;
};

/**
 * QR 코드를 다양한 형식으로 내보내기
 * @param {string} dataUrl - QR 코드 데이터 URL
 * @param {string} format - 출력 형식 (png, svg, jpeg)
 * @param {string} filename - 파일 이름 (확장자 제외)
 * @returns {Promise<Blob>} 변환된 파일 Blob
 */
QRCore.exportQRCode = function(dataUrl, format = 'png', filename = 'qrcode') {
  return new Promise((resolve, reject) => {
    try {
      // 데이터 URL에서 이미지 생성
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      
      img.onload = function() {
        // 출력 형식에 따른 처리
        switch (format.toLowerCase()) {
          case 'png':
            exportPNG();
            break;
            
          case 'jpeg':
          case 'jpg':
            exportJPEG();
            break;
            
          case 'svg':
            exportSVG();
            break;
            
          default:
            reject(new Error('지원하지 않는 출력 형식입니다: ' + format));
        }
        
        // PNG 형식으로 내보내기
        function exportPNG() {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          
          canvas.toBlob(blob => {
            resolve({
              blob,
              dataURL: canvas.toDataURL('image/png'),
              format: 'png',
              filename: `${filename}.png`
            });
          }, 'image/png');
        }
        
        // JPEG 형식으로 내보내기
        function exportJPEG() {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          
          // JPEG는 배경이 투명하지 않으므로 배경을 흰색으로 채움
          const ctx = canvas.getContext('2d');
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
          
          canvas.toBlob(blob => {
            resolve({
              blob,
              dataURL: canvas.toDataURL('image/jpeg'),
              format: 'jpeg',
              filename: `${filename}.jpg`
            });
          }, 'image/jpeg', 0.9);
        }
        
        // SVG 형식으로 내보내기
        function exportSVG() {
          // 이 부분은 SVG 변환 라이브러리가 필요하거나 더 복잡한 구현이 필요합니다.
          // 간단한 구현으로 대체합니다.
          reject(new Error('SVG 내보내기는 현재 구현되지 않았습니다.'));
        }
      };
      
      img.onerror = function() {
        reject(new Error('QR 코드 이미지 로드 실패'));
      };
      
      img.src = dataUrl;
    } catch (error) {
      reject(new Error('QR 코드 내보내기 중 오류가 발생했습니다: ' + error.message));
    }
  });
};

/**
 * 데이터 URL을 Blob으로 변환
 * @param {string} dataURL - 데이터 URL
 * @returns {Blob} Blob 객체
 */
QRCore.dataURLtoBlob = function(dataURL) {
  const arr = dataURL.split(',');
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  
  return new Blob([u8arr], { type: mime });
};

/**
 * QR 코드 파싱 (스캔 결과 처리)
 * @param {string} qrData - QR 코드에서 추출된 데이터
 * @returns {Object} 파싱된 데이터 객체
 */
QRCore.parseQRCodeData = function(qrData) {
  try {
    // 데이터 유형 감지
    if (qrData.startsWith('BEGIN:VCARD')) {
      return this.parseVCardData(qrData);
    } else if (qrData.startsWith('WIFI:')) {
      return this.parseWifiData(qrData);
    } else if (qrData.startsWith('mailto:')) {
      return {
        type: 'email',
        email: qrData.substring(7)
      };
    } else if (qrData.startsWith('tel:')) {
      return {
        type: 'phone',
        phone: qrData.substring(4)
      };
    } else if (/^https?:\/\//i.test(qrData)) {
      return {
        type: 'url',
        url: qrData
      };
    } else if (qrData.startsWith('data:')) {
      return {
        type: 'file',
        dataUri: qrData
      };
    } else {
      return {
        type: 'text',
        text: qrData
      };
    }
  } catch (error) {
    console.error('QR 코드 데이터 파싱 중 오류:', error);
    return {
      type: 'text',
      text: qrData,
      error: '형식을 인식할 수 없습니다.'
    };
  }
};

/**
 * vCard 데이터 파싱
 * @param {string} vcardData - vCard 형식 문자열
 * @returns {Object} 파싱된 연락처 정보
 */
QRCore.parseVCardData = function(vcardData) {
  const result = {
    type: 'vcard',
    raw: vcardData
  };
  
  const lines = vcardData.split('\n');
  
  for (const line of lines) {
    if (line.startsWith('FN:')) {
      result.name = line.substring(3);
    } else if (line.startsWith('TEL;')) {
      result.phone = line.split(':')[1];
    } else if (line.startsWith('EMAIL:')) {
      result.email = line.substring(6);
    } else if (line.startsWith('ADR:')) {
      const parts = line.substring(4).split(';');
      result.address = parts.join(' ').trim();
    } else if (line.startsWith('ORG:')) {
      result.org = line.substring(4);
    } else if (line.startsWith('URL:')) {
      result.url = line.substring(4);
    }
  }
  
  return result;
};

/**
 * WiFi 설정 데이터 파싱
 * @param {string} wifiData - WiFi 설정 문자열
 * @returns {Object} 파싱된 WiFi 설정 정보
 */
QRCore.parseWifiData = function(wifiData) {
  const result = {
    type: 'wifi',
    raw: wifiData
  };
  
  // 'WIFI:' 접두어 제거
  const data = wifiData.substring(5);
  
  // 각 세그먼트 파싱
  const segments = data.split(';');
  
  for (const segment of segments) {
    if (!segment) continue;
    
    const [key, value] = segment.split(':');
    
    if (key === 'S') {
      result.ssid = this.unescapeWifiString(value);
    } else if (key === 'P') {
      result.password = this.unescapeWifiString(value);
    } else if (key === 'T') {
      result.authType = value;
    } else if (key === 'H') {
      result.hidden = value === 'true';
    }
  }
  
  return result;
};

/**
 * WiFi 문자열 이스케이프 해제
 * @param {string} str - 이스케이프된 문자열
 * @returns {string} 원본 문자열
 */
QRCore.unescapeWifiString = function(str) {
  if (!str) return '';
  return str.replace(/\\(.)/g, '$1');
};

// 하위 호환성을 위한 전역 참조
if (typeof window !== 'undefined') {
  window.FileToQR = window.FileToQR || {};
  window.FileToQR.QRCore = QRCore;
}

// 모듈 레지스트리에 등록 (하위 호환성)
if (typeof window !== 'undefined' && window.FileToQR && window.FileToQR.registry) {
  window.FileToQR.registry.register('core', 'qr', QRCore);
}

export default QRCore; 