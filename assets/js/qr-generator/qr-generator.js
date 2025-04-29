/**
 * qr-generator.js - QR 코드 생성 기능을 구현하는 모듈
 * 버전: 1.0.0
 * 최종 업데이트: 2025-04-28
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
   * 이벤트 리스너 등록
   * @param {Object} elements - DOM 요소 참조
   */
  function bindEvents(elements) {
    // QR 코드 생성 버튼 클릭 이벤트
    elements.generateButton.addEventListener('click', generateQRCode);
    
    // 콘텐츠 유형 탭 클릭 이벤트
    const contentTypeTabs = elements.contentTypeTabs.querySelectorAll('button');
    contentTypeTabs.forEach(tab => {
      tab.addEventListener('click', function() {
        currentContentType = this.dataset.type;
      });
    });
    
    // QR 코드 설정 변경 이벤트
    elements.foregroundColor.addEventListener('change', function() {
      qrSettings.foregroundColor = this.value;
    });
    
    elements.backgroundColor.addEventListener('change', function() {
      qrSettings.backgroundColor = this.value;
    });
    
    elements.errorCorrection.addEventListener('change', function() {
      qrSettings.errorCorrectionLevel = this.value;
    });
    
    elements.qrSize.addEventListener('change', function() {
      qrSettings.size = parseInt(this.value);
    });
    
    elements.margin.addEventListener('input', function() {
      qrSettings.margin = parseInt(this.value);
    });
    
    elements.addLogo.addEventListener('change', function() {
      qrSettings.logoEnabled = this.checked;
    });
    
    elements.logoSize.addEventListener('input', function() {
      qrSettings.logoSize = parseInt(this.value);
    });
    
    elements.logoFile.addEventListener('change', function(e) {
      if (e.target.files && e.target.files[0]) {
        const reader = new FileReader();
        reader.onload = function(event) {
          elements.logoPreview.src = event.target.result;
          qrSettings.logoImage = event.target.result;
        };
        reader.readAsDataURL(e.target.files[0]);
      }
    });
    
    // 다운로드 버튼 이벤트
    elements.downloadPNG.addEventListener('click', function() {
      downloadQRCode('png');
    });
    
    elements.downloadSVG.addEventListener('click', function() {
      downloadQRCode('svg');
    });
    
    elements.downloadJPEG.addEventListener('click', function() {
      downloadQRCode('jpeg');
    });
  }
  
  /**
   * 현재 콘텐츠 유형에 맞는 데이터 가져오기
   * @returns {string} QR 코드에 인코딩할 데이터
   */
  function getQRContent() {
    let content = '';
    
    switch(currentContentType) {
      case 'url':
        content = document.getElementById('url-input').value;
        if (!content.startsWith('http://') && !content.startsWith('https://')) {
          content = 'https://' + content;
        }
        break;
        
      case 'text':
        content = document.getElementById('text-input').value;
        break;
        
      case 'email':
        const email = document.getElementById('email-address').value;
        const subject = document.getElementById('email-subject').value;
        const body = document.getElementById('email-body').value;
        
        content = 'mailto:' + email;
        if (subject || body) {
          content += '?';
          if (subject) content += 'subject=' + encodeURIComponent(subject);
          if (subject && body) content += '&';
          if (body) content += 'body=' + encodeURIComponent(body);
        }
        break;
        
      case 'phone':
        const phone = document.getElementById('phone-input').value;
        content = 'tel:' + phone.replace(/[^+0-9]/g, '');
        break;
        
      case 'vcard':
        const name = document.getElementById('vcard-name').value;
        const org = document.getElementById('vcard-org').value;
        const title = document.getElementById('vcard-title').value;
        const vcardPhone = document.getElementById('vcard-phone').value;
        const vcardEmail = document.getElementById('vcard-email').value;
        const website = document.getElementById('vcard-website').value;
        const address = document.getElementById('vcard-address').value;
        
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
        const ssid = document.getElementById('wifi-ssid').value;
        const encryption = document.getElementById('wifi-encryption').value;
        const password = document.getElementById('wifi-password').value;
        const hidden = document.getElementById('wifi-hidden').checked;
        
        content = 'WIFI:';
        content += 'S:' + ssid + ';';
        content += 'T:' + encryption + ';';
        if (encryption !== 'nopass') content += 'P:' + password + ';';
        if (hidden) content += 'H:true;';
        content += ';';
        break;
    }
    
    return content;
  }
  
  /**
   * QR 코드 생성
   */
  function generateQRCode() {
    const content = getQRContent();
    
    if (!content) {
      alert('내용을 입력해주세요.');
      return;
    }
    
    const previewContainer = document.getElementById('qr-preview');
    
    // QR 코드 생성 라이브러리 초기화
    if (!qrCode) {
      qrCode = new QRCode(previewContainer, {
        text: content,
        width: qrSettings.size,
        height: qrSettings.size,
        colorDark: qrSettings.foregroundColor,
        colorLight: qrSettings.backgroundColor,
        correctLevel: QRCode.CorrectLevel[qrSettings.errorCorrectionLevel],
        margin: qrSettings.margin
      });
    } else {
      // 기존 QR 코드 지우기
      previewContainer.innerHTML = '';
      
      // 새로운 QR 코드 생성
      qrCode = new QRCode(previewContainer, {
        text: content,
        width: qrSettings.size,
        height: qrSettings.size,
        colorDark: qrSettings.foregroundColor,
        colorLight: qrSettings.backgroundColor,
        correctLevel: QRCode.CorrectLevel[qrSettings.errorCorrectionLevel],
        margin: qrSettings.margin
      });
    }
    
    // 생성된 QR 코드 이미지에서 데이터 URL 추출
    setTimeout(() => {
      const qrImage = previewContainer.querySelector('img');
      if (qrImage) {
        generatedQRDataURL = qrImage.src;
        
        // 로고 추가
        if (qrSettings.logoEnabled && qrSettings.logoImage) {
          addLogoToQRCode(generatedQRDataURL, qrSettings.logoImage, qrSettings.logoSize);
        }
        
        // 다운로드 옵션 표시
        document.getElementById('download-options').style.display = 'block';
      }
    }, 100);
  }
  
  /**
   * QR 코드에 로고 추가
   * @param {string} qrDataURL - QR 코드 데이터 URL
   * @param {string} logoDataURL - 로고 데이터 URL
   * @param {number} logoSize - 로고 크기 (QR 코드 대비 백분율)
   */
  function addLogoToQRCode(qrDataURL, logoDataURL, logoSize) {
    const previewContainer = document.getElementById('qr-preview');
    
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
        previewContainer.querySelector('img').src = qrWithLogo;
        generatedQRDataURL = qrWithLogo;
      };
      logoImage.src = logoDataURL;
    };
    qrImage.src = qrDataURL;
  }
  
  /**
   * QR 코드 다운로드
   * @param {string} format - 다운로드 형식 (png, svg, jpeg)
   */
  function downloadQRCode(format) {
    if (!generatedQRDataURL) {
      alert('먼저 QR 코드를 생성해주세요.');
      return;
    }
    
    const contentType = getCurrentContentName();
    let filename = `qrcode-${contentType}-${new Date().getTime()}`;
    let dataURL = generatedQRDataURL;
    
    // SVG 형식인 경우 변환
    if (format === 'svg') {
      // QR 코드를 SVG로 변환 (간단한 구현, 실제로는 더 복잡할 수 있음)
      const qrImage = document.querySelector('#qr-preview img');
      const canvas = document.createElement('canvas');
      canvas.width = qrImage.width;
      canvas.height = qrImage.height;
      
      const ctx = canvas.getContext('2d');
      ctx.drawImage(qrImage, 0, 0);
      
      // Canvas를 SVG로 변환 (라이브러리 필요)
      // 여기서는 canvg 같은 라이브러리를 사용해야 함
      // 임시 구현으로 PNG로 대체
      dataURL = canvas.toDataURL('image/png');
      filename += '.svg';
    } else if (format === 'jpeg') {
      // PNG를 JPEG로 변환
      const qrImage = document.querySelector('#qr-preview img');
      const canvas = document.createElement('canvas');
      canvas.width = qrImage.width;
      canvas.height = qrImage.height;
      
      const ctx = canvas.getContext('2d');
      // 배경을 흰색으로 채우기 (JPEG는 투명 배경을 지원하지 않음)
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(qrImage, 0, 0);
      
      dataURL = canvas.toDataURL('image/jpeg', 0.9);
      filename += '.jpg';
    } else {
      // PNG 형식
      filename += '.png';
    }
    
    // 다운로드 링크 생성
    const downloadLink = document.createElement('a');
    downloadLink.href = dataURL;
    downloadLink.download = filename;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
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
  
  // 모듈 API 설정
  qrGenerator.init = init;
  qrGenerator.generateQRCode = generateQRCode;
  qrGenerator.downloadQRCode = downloadQRCode;
  
  // DOM 로드 완료 시 초기화
  document.addEventListener('DOMContentLoaded', init);
  
})(); 