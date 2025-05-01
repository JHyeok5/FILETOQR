/**
 * qr-generator.js - FileToQR QR 코드 생성 모듈
 * 버전: 1.0.0
 * 최종 업데이트: 2025-06-15
 * 
 * 이 모듈은 다양한 콘텐츠로 QR 코드를 생성하는 기능을 제공합니다:
 * - URL, 텍스트, 연락처 정보 등을 QR 코드로 변환
 * - 색상, 크기, 로고 등 커스터마이징 옵션
 * - 생성된 QR 코드 다운로드 (PNG, SVG, PDF)
 */

// QR 코드 생성 라이브러리 임포트 (QRCode.js 사용)
const importQRCodeLibrary = async () => {
  // 라이브러리가 이미 로드되었는지 확인
  if (window.QRCode) {
    console.log('QRCode 라이브러리가 이미 전역 객체에 있습니다.');
    return window.QRCode;
  }
  
  try {
    // QRCode 라이브러리 번들에서 가져오기 또는 CDN에서 로드
    console.log('QRCode 라이브러리 로드 시도');
    
    // 첫 번째 방법: 글로벌 스크립트 태그에서 로드된 경우
    if (typeof QRCode !== 'undefined') {
      console.log('QRCode가 글로벌 스코프에서 발견되었습니다.');
      window.QRCode = QRCode;
      return QRCode;
    }
    
    // 두 번째 방법: CDN에서 로드
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js';
      script.onload = () => {
        console.log('QRCode 라이브러리 CDN에서 로드 성공');
        window.QRCode = QRCode;
        resolve(QRCode);
      };
      script.onerror = (error) => {
        console.error('QRCode 라이브러리 로드 실패, 백업 CDN 시도:', error);
        
        // 백업 CDN 시도
        const backupScript = document.createElement('script');
        backupScript.src = 'https://cdn.rawgit.com/davidshimjs/qrcodejs/gh-pages/qrcode.min.js';
        backupScript.onload = () => {
          console.log('QRCode 라이브러리 백업 CDN에서 로드 성공');
          resolve(window.QRCode);
        };
        backupScript.onerror = () => reject(new Error('모든 QRCode 라이브러리 로드 실패'));
        document.head.appendChild(backupScript);
      };
      document.head.appendChild(script);
    });
  } catch (error) {
    console.error('QRCode 라이브러리 로드 중 오류 발생:', error);
    throw error;
  }
};

// QR 코드 생성기 모듈
const QRGenerator = {
  // 내부 상태
  state: {
    initialized: false,
    qrLibrary: null,
    currentOptions: {
      content: '',
      type: 'text',
      foreground: '#000000',
      background: '#FFFFFF',
      size: 256,
      margin: 4,
      errorCorrectionLevel: 'M',
      logo: null
    },
    generatedQR: null
  },
  
  /**
   * 모듈 초기화
   * @returns {Promise<boolean>} 초기화 성공 여부
   */
  async init() {
    if (this.state.initialized) {
      console.log('QRGenerator가 이미 초기화되어 있습니다.');
      return true;
    }
    
    try {
      console.log('QR 코드 생성기 초기화 시작...');
      
      // QR 코드 라이브러리 로드
      console.log('QR 코드 라이브러리 로드 시도');
      this.state.qrLibrary = await importQRCodeLibrary();
      console.log('QR 코드 라이브러리 로드 성공:', this.state.qrLibrary);
      
      // UI 요소 초기화
      console.log('UI 요소 초기화 시작');
      this._initUI();
      
      // 이벤트 리스너 등록
      console.log('이벤트 리스너 등록 시작');
      this._registerEventListeners();
      
      this.state.initialized = true;
      console.log('QR 코드 생성기 초기화 완료. 상태:', this.state);
      return true;
    } catch (error) {
      console.error('QR 코드 생성기 초기화 중 에러 발생:', error);
      // 에러 상세 추적
      console.error('스택 트레이스:', error.stack);
      console.error('에러 발생 시 모듈 상태:', JSON.stringify(this.state));
      return false;
    }
  },
  
  /**
   * QR 코드 생성 (공개 메서드)
   * 폼에서 데이터를 수집하여 QR 코드 생성
   */
  generateQRCode() {
    console.log('QRGenerator.generateQRCode 호출됨');
    
    // 상태 확인
    if (!this.state.initialized) {
      console.error('QRGenerator가 초기화되지 않았습니다. init() 먼저 호출하세요.');
      return;
    }
    
    console.log('QR 코드 생성 시작, 현재 상태:', this.state);
    this._handleFormSubmit();
  },
  
  /**
   * QR 코드 다운로드 (공개 메서드)
   * @param {string} format - 다운로드 형식 (png, svg, jpeg)
   */
  downloadQRCode(format) {
    console.log(`QRGenerator.downloadQRCode 호출됨: ${format}`);
    
    // 상태 확인
    if (!this.state.initialized) {
      console.error('QRGenerator가 초기화되지 않았습니다. init() 먼저 호출하세요.');
      return;
    }
    
    if (!this.state.generatedQR) {
      console.error('생성된 QR 코드가 없습니다. generateQRCode()를 먼저 호출하세요.');
      return;
    }
    
    this._downloadQRCode(format);
  },
  
  /**
   * UI 요소 초기화
   * @private
   */
  _initUI() {
    // UI 요소가 로드되기를 기다림
    const checkElements = () => {
      const qrForm = document.getElementById('qr-form');
      const contentInput = document.getElementById('qr-content');
      const qrPreview = document.getElementById('qr-preview');
      
      if (!qrForm || !contentInput || !qrPreview) {
        // DOM 요소가 아직 없으면 100ms 후 다시 시도
        setTimeout(checkElements, 100);
        return;
      }
      
      // URL에서 초기 내용 가져오기
      const queryParams = new URLSearchParams(window.location.search);
      const initialContent = queryParams.get('content') || '';
      const initialType = queryParams.get('type') || 'text';
      
      if (initialContent) {
        contentInput.value = initialContent;
        this.state.currentOptions.content = initialContent;
        this.state.currentOptions.type = initialType;
        
        // URL 파라미터가 있으면 자동으로 QR 코드 생성
        this._generateQRCode();
      }
      
      // 색상 선택기 초기화
      const fgColorPicker = document.getElementById('qr-foreground');
      const bgColorPicker = document.getElementById('qr-background');
      
      if (fgColorPicker) fgColorPicker.value = this.state.currentOptions.foreground;
      if (bgColorPicker) bgColorPicker.value = this.state.currentOptions.background;
      
      // 크기 슬라이더 초기화
      const sizeSlider = document.getElementById('qr-size');
      if (sizeSlider) {
        sizeSlider.value = this.state.currentOptions.size;
        const sizeValue = document.getElementById('qr-size-value');
        if (sizeValue) sizeValue.textContent = `${this.state.currentOptions.size}px`;
      }
      
      // 여백 슬라이더 초기화
      const marginSlider = document.getElementById('qr-margin');
      if (marginSlider) {
        marginSlider.value = this.state.currentOptions.margin;
        const marginValue = document.getElementById('qr-margin-value');
        if (marginValue) marginValue.textContent = this.state.currentOptions.margin;
      }
      
      // 오류 수정 레벨 선택기 초기화
      const ecLevelSelect = document.getElementById('qr-error-correction');
      if (ecLevelSelect) ecLevelSelect.value = this.state.currentOptions.errorCorrectionLevel;
    };
    
    checkElements();
  },
  
  /**
   * 이벤트 리스너 등록
   * @private
   */
  _registerEventListeners() {
    document.addEventListener('DOMContentLoaded', () => {
      // QR 코드 생성 폼
      const qrForm = document.getElementById('qr-form');
      if (qrForm) {
        qrForm.addEventListener('submit', (e) => {
          e.preventDefault();
          this._handleFormSubmit();
        });
      }
      
      // 내용 타입 변경
      const typeSelector = document.getElementById('qr-type');
      if (typeSelector) {
        typeSelector.addEventListener('change', () => {
          this._updateContentPlaceholder();
        });
      }
      
      // 색상 변경
      const fgColorPicker = document.getElementById('qr-foreground');
      const bgColorPicker = document.getElementById('qr-background');
      
      if (fgColorPicker) {
        fgColorPicker.addEventListener('change', () => {
          this.state.currentOptions.foreground = fgColorPicker.value;
          if (this.state.generatedQR) this._generateQRCode();
        });
      }
      
      if (bgColorPicker) {
        bgColorPicker.addEventListener('change', () => {
          this.state.currentOptions.background = bgColorPicker.value;
          if (this.state.generatedQR) this._generateQRCode();
        });
      }
      
      // 크기 변경
      const sizeSlider = document.getElementById('qr-size');
      if (sizeSlider) {
        sizeSlider.addEventListener('input', () => {
          this.state.currentOptions.size = parseInt(sizeSlider.value, 10);
          const sizeValue = document.getElementById('qr-size-value');
          if (sizeValue) sizeValue.textContent = `${this.state.currentOptions.size}px`;
          if (this.state.generatedQR) this._generateQRCode();
        });
      }
      
      // 여백 변경
      const marginSlider = document.getElementById('qr-margin');
      if (marginSlider) {
        marginSlider.addEventListener('input', () => {
          this.state.currentOptions.margin = parseInt(marginSlider.value, 10);
          const marginValue = document.getElementById('qr-margin-value');
          if (marginValue) marginValue.textContent = this.state.currentOptions.margin;
          if (this.state.generatedQR) this._generateQRCode();
        });
      }
      
      // 오류 수정 레벨 변경
      const ecLevelSelect = document.getElementById('qr-error-correction');
      if (ecLevelSelect) {
        ecLevelSelect.addEventListener('change', () => {
          this.state.currentOptions.errorCorrectionLevel = ecLevelSelect.value;
          if (this.state.generatedQR) this._generateQRCode();
        });
      }
      
      // 로고 이미지 변경
      const logoInput = document.getElementById('qr-logo');
      if (logoInput) {
        logoInput.addEventListener('change', (e) => {
          const file = e.target.files[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
              this.state.currentOptions.logo = e.target.result;
              if (this.state.generatedQR) this._generateQRCode();
            };
            reader.readAsDataURL(file);
          } else {
            this.state.currentOptions.logo = null;
            if (this.state.generatedQR) this._generateQRCode();
          }
        });
      }
      
      // 다운로드 버튼
      const pngDownloadBtn = document.getElementById('download-png');
      const svgDownloadBtn = document.getElementById('download-svg');
      
      if (pngDownloadBtn) {
        pngDownloadBtn.addEventListener('click', () => {
          this._downloadQRCode('png');
        });
      }
      
      if (svgDownloadBtn) {
        svgDownloadBtn.addEventListener('click', () => {
          this._downloadQRCode('svg');
        });
      }
    });
  },
  
  /**
   * 콘텐츠 타입에 따른 입력 플레이스홀더 업데이트
   * @private
   */
  _updateContentPlaceholder() {
    const typeSelector = document.getElementById('qr-type');
    const contentInput = document.getElementById('qr-content');
    
    if (!typeSelector || !contentInput) return;
    
    const type = typeSelector.value;
    let placeholder = '';
    
    switch (type) {
      case 'url':
        placeholder = 'https://example.com';
        break;
      case 'email':
        placeholder = 'mailto:example@example.com';
        break;
      case 'tel':
        placeholder = 'tel:+821012345678';
        break;
      case 'sms':
        placeholder = 'sms:+821012345678?body=Hello';
        break;
      case 'wifi':
        placeholder = 'WIFI:S:NetworkName;T:WPA;P:Password;;';
        break;
      case 'geo':
        placeholder = 'geo:37.5665,126.9780';
        break;
      case 'vcard':
        placeholder = 'BEGIN:VCARD\nVERSION:3.0\nN:홍길동\nTEL:+821012345678\nEMAIL:example@example.com\nEND:VCARD';
        break;
      default:
        placeholder = '텍스트를 입력하세요';
    }
    
    contentInput.placeholder = placeholder;
  },
  
  /**
   * 폼 제출 핸들러
   * @private
   */
  _handleFormSubmit() {
    console.log('QRGenerator._handleFormSubmit 호출됨');
    
    // URL 또는 텍스트 입력 필드 확인
    const contentInputs = {
      'url': document.getElementById('url-input'),
      'text': document.getElementById('text-input'),
      'email': document.getElementById('email-address'),
      'phone': document.getElementById('phone-input'),
      'vcard': document.getElementById('vcard-name')
    };
    
    // 활성화된 입력 폼 찾기
    const activeForm = document.querySelector('.content-form.active');
    console.log('활성화된 입력 폼:', activeForm?.id);
    
    if (!activeForm) {
      console.error('활성화된 입력 폼을 찾을 수 없습니다.');
      return;
    }
    
    // 폼 유형 결정
    const formType = activeForm.id.split('-')[0]; // 'url-form' -> 'url'
    console.log('결정된 폼 유형:', formType);
    
    // 해당 유형의 입력 필드 확인
    const contentInput = contentInputs[formType];
    
    if (!contentInput) {
      console.error(`폼 유형 ${formType}에 대한 입력 필드를 찾을 수 없습니다.`);
      return;
    }
    
    const content = contentInput.value.trim();
    console.log('입력된 콘텐츠:', content);
    
    if (!content) {
      console.warn('QR 코드 내용이 비어 있습니다.');
      alert('QR 코드 내용을 입력해주세요.');
      return;
    }
    
    // 상태 업데이트
    this.state.currentOptions.content = content;
    this.state.currentOptions.type = formType;
    console.log('QR 코드 옵션 업데이트:', this.state.currentOptions);
    
    // QR 코드 생성
    this._generateQRCode();
  },
  
  /**
   * QR 코드 생성
   * @private
   */
  async _generateQRCode() {
    console.log('QRGenerator._generateQRCode 호출됨');
    
    const qrPreview = document.getElementById('qr-preview');
    const downloadBtns = document.getElementById('download-options');
    
    if (!qrPreview) {
      console.error('QR 코드 프리뷰 컨테이너를 찾을 수 없습니다.');
      return;
    }
    
    try {
      // 로딩 상태 표시
      console.log('QR 코드 생성 중... 로딩 상태 표시');
      qrPreview.innerHTML = `
        <div class="flex justify-center items-center h-64">
          <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
        </div>
      `;
      
      // 내용 포맷팅
      console.log('내용 포맷팅 시작');
      const formattedContent = this._formatContent();
      console.log('포맷팅된 내용:', formattedContent);
      
      // QR 코드 옵션 설정
      const options = {
        text: formattedContent,
        width: this.state.currentOptions.size,
        height: this.state.currentOptions.size,
        colorDark: this.state.currentOptions.foreground,
        colorLight: this.state.currentOptions.background,
        margin: this.state.currentOptions.margin,
        correctLevel: this._getErrorCorrectionLevel()
      };
      console.log('QR 코드 옵션:', options);
      
      // QR 코드 라이브러리 확인
      if (!this.state.qrLibrary) {
        console.error('QR 코드 라이브러리가 로드되지 않았습니다.');
        throw new Error('QR 코드 라이브러리가 초기화되지 않았습니다.');
      }
      
      // QR 코드 생성 (캔버스)
      console.log('QR 코드 캔버스 생성 시작');
      const canvas = document.createElement('canvas');
      
      // 라이브러리 메서드 확인
      if (typeof this.state.qrLibrary.toCanvas !== 'function') {
        console.error('QR 라이브러리 toCanvas 메서드를 찾을 수 없습니다.');
        console.log('QR 라이브러리 구조:', this.state.qrLibrary);
        throw new Error('QR 코드 라이브러리가 필요한 메서드를 지원하지 않습니다.');
      }
      
      await this.state.qrLibrary.toCanvas(canvas, formattedContent, options);
      console.log('QR 코드 캔버스 생성 완료');
      
      // 로고 추가 (있는 경우)
      if (this.state.currentOptions.logo) {
        console.log('로고 추가 시작');
        this._addLogoToCanvas(canvas);
      } else {
        // 결과 표시
        console.log('QR 코드 프리뷰 표시');
        qrPreview.innerHTML = '';
        qrPreview.appendChild(canvas);
        
        // 다운로드 버튼 표시
        if (downloadBtns) {
          console.log('다운로드 버튼 표시');
          downloadBtns.style.display = 'block';
        }
        
        // 생성된 QR 코드 저장
        this.state.generatedQR = canvas;
        console.log('생성된 QR 코드가 상태에 저장됨');
      }
    } catch (error) {
      console.error('QR 코드 생성 중 오류 발생:', error);
      console.error('스택 트레이스:', error.stack);
      
      qrPreview.innerHTML = `
        <div class="p-4 bg-red-100 rounded-lg text-red-800">
          <h3 class="font-medium">QR 코드 생성 실패</h3>
          <p>${error.message}</p>
          <div class="mt-2 text-xs bg-red-50 p-2 rounded-md overflow-auto">
            <pre>${error.stack || '스택 트레이스 없음'}</pre>
          </div>
        </div>
      `;
    }
  },
  
  /**
   * 내용 타입에 따른 포맷팅
   * @returns {string} 포맷팅된 내용
   * @private
   */
  _formatContent() {
    const content = this.state.currentOptions.content;
    const type = this.state.currentOptions.type;
    
    if (!content) return '';
    
    switch (type) {
      case 'url':
        if (!content.startsWith('http://') && !content.startsWith('https://')) {
          return `https://${content}`;
        }
        return content;
        
      case 'email':
        if (!content.startsWith('mailto:')) {
          return `mailto:${content}`;
        }
        return content;
        
      case 'tel':
        if (!content.startsWith('tel:')) {
          return `tel:${content}`;
        }
        return content;
        
      case 'sms':
        if (!content.startsWith('sms:')) {
          return `sms:${content}`;
        }
        return content;
        
      case 'wifi':
        if (!content.startsWith('WIFI:')) {
          // 기본 WiFi 형식 확인
          if (content.includes(';') && content.includes(':')) {
            return content;
          }
          // 간단한 입력을 WiFi 형식으로 변환
          return `WIFI:S:${content};T:WPA;P:password;;`;
        }
        return content;
        
      case 'geo':
        if (!content.startsWith('geo:')) {
          return `geo:${content}`;
        }
        return content;
        
      case 'vcard':
        if (!content.startsWith('BEGIN:VCARD')) {
          return `BEGIN:VCARD\nVERSION:3.0\nN:${content}\nEND:VCARD`;
        }
        return content;
        
      default:
        return content;
    }
  },
  
  /**
   * 오류 수정 레벨 반환
   * @returns {number} QRCode.js 오류 수정 레벨
   * @private
   */
  _getErrorCorrectionLevel() {
    switch (this.state.currentOptions.errorCorrectionLevel) {
      case 'L': return this.state.qrLibrary.CorrectLevel.L; // 약 7%
      case 'M': return this.state.qrLibrary.CorrectLevel.M; // 약 15%
      case 'Q': return this.state.qrLibrary.CorrectLevel.Q; // 약 25%
      case 'H': return this.state.qrLibrary.CorrectLevel.H; // 약 30%
      default: return this.state.qrLibrary.CorrectLevel.M;
    }
  },
  
  /**
   * 캔버스에 로고 추가
   * @param {HTMLCanvasElement} canvas - QR 코드 캔버스
   * @private
   */
  _addLogoToCanvas(canvas) {
    const qrPreview = document.getElementById('qr-preview');
    const downloadBtns = document.getElementById('download-buttons');
    
    if (!qrPreview) return;
    
    const ctx = canvas.getContext('2d');
    const size = this.state.currentOptions.size;
    
    const logoImg = new Image();
    logoImg.onload = () => {
      // 로고 크기 계산 (QR 코드 크기의 약 20%)
      const logoSize = size * 0.2;
      const logoX = (size - logoSize) / 2;
      const logoY = (size - logoSize) / 2;
      
      // 로고 배경 (흰색 원)
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, logoSize / 1.8, 0, 2 * Math.PI);
      ctx.fill();
      
      // 로고 그리기
      ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize);
      
      // 결과 표시
      qrPreview.innerHTML = '';
      qrPreview.appendChild(canvas);
      
      // 다운로드 버튼 표시
      if (downloadBtns) downloadBtns.classList.remove('hidden');
      
      // 생성된 QR 코드 저장
      this.state.generatedQR = canvas;
    };
    
    logoImg.onerror = () => {
      console.error('로고 이미지 로드 실패');
      
      // 로고 없이 결과 표시
      qrPreview.innerHTML = '';
      qrPreview.appendChild(canvas);
      
      // 다운로드 버튼 표시
      if (downloadBtns) downloadBtns.classList.remove('hidden');
      
      // 생성된 QR 코드 저장
      this.state.generatedQR = canvas;
    };
    
    logoImg.src = this.state.currentOptions.logo;
  },
  
  /**
   * QR 코드 다운로드
   * @param {string} format - 다운로드 형식 ('png', 'svg')
   * @private
   */
  _downloadQRCode(format) {
    if (!this.state.generatedQR) {
      alert('먼저 QR 코드를 생성해주세요.');
      return;
    }
    
    const canvas = this.state.generatedQR;
    const content = this.state.currentOptions.content;
    
    // 파일명 생성
    const filename = `qrcode_${new Date().getTime()}`;
    
    if (format === 'png') {
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `${filename}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (format === 'svg') {
      // 캔버스를 SVG로 변환
      this._canvasToSVG(canvas, `${filename}.svg`);
    }
  },
  
  /**
   * 캔버스를 SVG로 변환
   * @param {HTMLCanvasElement} canvas - 변환할 캔버스
   * @param {string} filename - 다운로드 파일명
   * @private
   */
  _canvasToSVG(canvas, filename) {
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${canvas.width} ${canvas.height}" width="${canvas.width}" height="${canvas.height}">`;
    
    // 배경 추가
    svgContent += `<rect width="${canvas.width}" height="${canvas.height}" fill="${this.state.currentOptions.background}"/>`;
    
    // 픽셀 데이터 처리
    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const i = (y * canvas.width + x) * 4;
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];
        
        // 어두운 픽셀만 QR 코드 데이터로 처리
        const isDark = r < 128 && g < 128 && b < 128 && a > 0;
        
        if (isDark) {
          svgContent += `<rect x="${x}" y="${y}" width="1" height="1" fill="${this.state.currentOptions.foreground}"/>`;
        }
      }
    }
    
    svgContent += '</svg>';
    
    // SVG 다운로드
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};

// 글로벌 네임스페이스에 등록
if (typeof window !== 'undefined') {
  window.FileToQR = window.FileToQR || {};
  window.FileToQR.QRGenerator = QRGenerator;
}

export default QRGenerator; 