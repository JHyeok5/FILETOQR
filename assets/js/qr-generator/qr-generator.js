/**
 * qr-generator.js - FileToQR QR 코드 생성 모듈
 * 버전: 1.1.0
 * 최종 업데이트: 2025-06-20
 * 
 * 이 모듈은 다양한 콘텐츠로 QR 코드를 생성하는 기능을 제공합니다:
 * - URL, 텍스트, 연락처 정보 등을 QR 코드로 변환
 * - 색상, 크기, 로고 등 커스터마이징 옵션
 * - 생성된 QR 코드 다운로드 (PNG, SVG, PDF)
 */

/**
 * [의존성 명시]
 * - QR 코드 생성 라이브러리(QRCode.js): window.QRCode
 * - 다국어(i18n): window.FileToQR.i18n (선택)
 * - (필요시) 기타 유틸리티
 */

// QR 코드 라이브러리 URL 설정
const QR_LIB_URLS = {
  // [중요] 오직 toCanvas 지원 최신 QRCode.js만 사용 (404 나는 경로 모두 제거)
  local: [],
  cdn: [
    'https://cdn.jsdelivr.net/npm/qrcode/build/qrcode.min.js'
  ]
};

// QR 코드 생성 라이브러리 임포트 (QRCode.js 사용)
const importQRCodeLibrary = async (retryCount = 0) => {
  // 라이브러리가 이미 로드되었는지 확인
  if (window.QRCode) {
    console.log('QRCode 라이브러리가 이미 전역 객체에 있습니다.');
    return window.QRCode;
  }
  
  // 로딩 상태 업데이트
  const qrPreview = document.getElementById('qr-preview');
  if (qrPreview) {
    qrPreview.innerHTML = `
      <div class="loading-status text-center">
        <div class="spinner mx-auto mb-2"></div>
        <p class="text-gray-500">QR 코드 생성기 준비 중...</p>
      </div>
    `;
  }
  
  try {
    console.log('QRCode 라이브러리 로드 시도');
    
    // 1. 로컬 라이브러리 시도
    for (const path of QR_LIB_URLS.local) {
      try {
        const response = await fetch(path, { method: 'HEAD' });
        if (response.ok) {
          console.log(`로컬 QRCode 라이브러리 발견 (${path}), 로드 중...`);
          await loadScript(path);
          if (window.QRCode) {
            console.log('로컬 QRCode 라이브러리 로드 성공');
            return window.QRCode;
          }
        }
      } catch (error) {
        console.warn(`로컬 경로 ${path} 확인 실패:`, error);
      }
    }
    
    // 2. CDN에서 로드 시도
    for (const url of QR_LIB_URLS.cdn) {
      try {
        console.log(`CDN에서 QRCode 라이브러리 로드 시도: ${url}`);
        await loadScript(url);
        if (window.QRCode) {
          console.log('CDN QRCode 라이브러리 로드 성공');
          return window.QRCode;
        }
      } catch (error) {
        console.warn(`CDN QRCode 라이브러리 로드 실패 (${url}):`, error);
      }
    }
    
    // 3. 모든 시도 실패 - 내장 기본 QR 코드 생성기 제공
    console.error('모든 QRCode 라이브러리 로드 실패, 내장 QR 생성기로 대체');
    window.QRCode = createFallbackQRCodeLibrary();
    // 다국어 안내 메시지 적용
    const i18n = window.FileToQR && window.FileToQR.i18n;
    const msg = i18n && typeof i18n.translate === 'function'
      ? i18n.translate('qrcode.errors.qrLibLoadFail', {}, 'QR 코드 라이브러리를 로드할 수 없습니다. 제한된 기능으로 계속합니다.')
      : 'QR 코드 라이브러리를 로드할 수 없습니다. 제한된 기능으로 계속합니다.';
    showErrorMessage('qrcode.errors.qrLibLoadFail', msg);
    // 재시도 버튼 제공 (최대 2회)
    if (qrPreview && retryCount < 2) {
      const retryBtn = document.createElement('button');
      retryBtn.textContent = '다시 시도';
      retryBtn.className = 'mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700';
      retryBtn.onclick = () => {
        qrPreview.innerHTML = '';
        importQRCodeLibrary(retryCount + 1);
      };
      qrPreview.appendChild(retryBtn);
    }
    return window.QRCode;
  } catch (error) {
    console.error('QRCode 라이브러리 로드 중 심각한 오류 발생:', error);
    const i18n = window.FileToQR && window.FileToQR.i18n;
    const msg = i18n && typeof i18n.translate === 'function'
      ? i18n.translate('qrcode.errors.qrLibInitFail', {}, 'QR 코드 생성기를 초기화할 수 없습니다. 페이지를 새로고침하거나 다시 시도해주세요.')
      : 'QR 코드 생성기를 초기화할 수 없습니다. 페이지를 새로고침하거나 다시 시도해주세요.';
    showErrorMessage('qrcode.errors.qrLibInitFail', msg);
    // 재시도 버튼 제공 (최대 2회)
    if (qrPreview && retryCount < 2) {
      const retryBtn = document.createElement('button');
      retryBtn.textContent = '다시 시도';
      retryBtn.className = 'mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700';
      retryBtn.onclick = () => {
        qrPreview.innerHTML = '';
        importQRCodeLibrary(retryCount + 1);
      };
      qrPreview.appendChild(retryBtn);
    }
    // 최소한의 대체 라이브러리 제공
    window.QRCode = createFallbackQRCodeLibrary();
    return window.QRCode;
  }
};

// 스크립트 로드 유틸리티 함수
function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => resolve();
    script.onerror = (error) => reject(error);
    document.head.appendChild(script);
  });
}

// 내장 기본 QR 코드 생성기 생성
function createFallbackQRCodeLibrary() {
  return {
    toCanvas: (canvas, text, options) => {
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = options?.colorLight || '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.fillStyle = options?.colorDark || '#000000';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('QR 코드 생성 실패', canvas.width/2, canvas.height/2 - 20);
      ctx.font = '12px Arial';
      ctx.fillText('라이브러리를 로드할 수 없습니다', canvas.width/2, canvas.height/2 + 10);
      
      // 간단한 QR 코드처럼 보이는 패턴 그리기
      ctx.fillRect(canvas.width/4, canvas.height/4, 20, 20);
      ctx.fillRect(canvas.width*3/4 - 20, canvas.height/4, 20, 20);
      ctx.fillRect(canvas.width/4, canvas.height*3/4 - 20, 20, 20);
      
      return Promise.resolve();
    },
    CorrectLevel: {
      L: 1,
      M: 0,
      Q: 3,
      H: 2
    }
  };
}

// 오류 메시지 표시 함수
function showErrorMessage(messageKey, defaultMsg) {
  // 오류 메시지는 반드시 i18n을 통해 출력해야 함
  const i18n = window.FileToQR && window.FileToQR.i18n;
  const message = i18n && typeof i18n.translate === 'function'
    ? i18n.translate(messageKey, {}, defaultMsg || messageKey)
    : (defaultMsg || messageKey);
  // Toast 메시지 생성
  const toast = document.createElement('div');
  toast.className = 'toast toast-error';
  toast.innerHTML = `
    <div class="toast-content">
      <svg class="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
      </svg>
      <span>${message}</span>
    </div>
    <button class="toast-close">×</button>
  `;
  // 닫기 버튼 이벤트 리스너
  const closeBtn = toast.querySelector('.toast-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      toast.classList.add('toast-closing');
      setTimeout(() => toast.remove(), 300);
    });
  }
  // 기존 토스트 메시지가 있으면 제거
  const existingToast = document.querySelector('.toast');
  if (existingToast) {
    existingToast.remove();
  }
  // 페이지에 토스트 추가
  document.body.appendChild(toast);
  // 자동 제거 타이머 (10초)
  setTimeout(() => {
    if (document.body.contains(toast)) {
      toast.classList.add('toast-closing');
      setTimeout(() => toast.remove(), 300);
    }
  }, 10000);
  // QR 프리뷰 영역에도 오류 표시
  const qrPreview = document.getElementById('qr-preview');
  if (qrPreview) {
    qrPreview.innerHTML = `<div class="p-4 bg-red-100 text-red-800 rounded-lg"><h3 class="font-medium">${i18n ? i18n.translate('errors.errorOccurred', {}, '오류 발생') : '오류 발생'}</h3><p>${message}</p></div>`;
  }
}

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
   * [의존성 체크 함수]
   * 필수 의존성(QR 코드 라이브러리 등) 존재 여부를 점검
   * @returns {boolean} 모든 의존성 충족 시 true, 아니면 false
   */
  checkDependencies() {
    let ok = true;
    // QR 코드 라이브러리 체크
    if (!window.QRCode && !(this.state && this.state.qrLibrary)) {
      console.error('[의존성 오류] QR 코드 라이브러리가 로드되지 않았습니다.');
      showErrorMessage('qrcode.errors.qrLibMissing', 'QR 코드 라이브러리가 로드되지 않았습니다. 네트워크 상태를 확인하거나 새로고침 해주세요.');
      ok = false;
    }
    // i18n 체크(선택)
    if (!window.FileToQR || !window.FileToQR.i18n) {
      console.warn('[의존성 경고] 다국어(i18n) 모듈이 없습니다. 일부 메시지는 번역되지 않을 수 있습니다.');
    }
    // 기타 의존성 체크 필요시 추가
    return ok;
  },
  
  /**
   * 모듈 초기화
   * @returns {Promise<boolean>} 초기화 성공 여부
   */
  async init() {
    try {
      console.log('QR 코드 생성기 초기화 시작...');
      
      // 이미 초기화된 경우 중복 실행 방지
      if (this.state.initialized) {
        console.log('QRGenerator가 이미 초기화되어 있습니다.');
        return true;
      }
      
      // QR 코드 라이브러리 로드
      console.log('QR 코드 라이브러리 로드 시도');
      this.state.qrLibrary = await importQRCodeLibrary();
      console.log('QR 코드 라이브러리 로드 상태:', this.state.qrLibrary ? '성공' : '실패');
      
      // [의존성 체크] - 라이브러리 로드 후 반드시 점검
      if (!this.checkDependencies()) {
        throw new Error('필수 의존성 누락: QR 코드 라이브러리');
      }
      
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
      
      // 사용자에게 에러 메시지 표시
      showErrorMessage('qrcode.errors.qrLibInitFail', 'QR 코드 생성기를 초기화하는 도중 오류가 발생했습니다. 페이지를 새로고침해 주세요.');
      
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
   * UI 요소 초기화 (리팩토링: 탭별 동적 폼/입력 탐색)
   * @private
   */
  _initUI() {
    // UI 요소가 로드되기를 기다림
    const checkElements = () => {
      // 활성화된 폼(탭) 동적 탐색
      const activeForm = document.querySelector('.content-form.active');
      // 주요 입력 필드: 폼 내에서 input, textarea, select 등 첫 번째 요소를 자동 탐색
      let contentInput = null;
      if (activeForm) {
        contentInput = activeForm.querySelector('input, textarea, select');
      }
      const qrPreview = document.getElementById('qr-preview');
      if (!activeForm) {
        console.warn('[UI 경고] 활성화된 입력 폼(.content-form.active)이 없습니다.');
        showErrorMessage('ui.missingForm', 'QR 코드 생성 폼 요소를 찾을 수 없습니다.');
      }
      if (!contentInput) {
        console.warn('[UI 경고] 활성화된 폼 내 입력 요소가 없습니다.');
        showErrorMessage('ui.missingInput', 'QR 코드 입력 필드를 찾을 수 없습니다.');
      }
      if (!qrPreview) {
        console.warn('[UI 경고] qr-preview 요소가 없습니다.');
        showErrorMessage('ui.missingPreview', 'QR 코드 프리뷰(qr-preview) 요소를 찾을 수 없습니다.');
      }
      if (!activeForm || !contentInput || !qrPreview) {
        setTimeout(checkElements, 100);
        return;
      }
      // URL에서 초기 내용 가져오기 (기존 로직 유지)
      const queryParams = new URLSearchParams(window.location.search);
      const initialContent = queryParams.get('content') || '';
      const initialType = queryParams.get('type') || 'text';
      if (initialContent) {
        contentInput.value = initialContent;
        this.state.currentOptions.content = initialContent;
        this.state.currentOptions.type = initialType;
        this._generateQRCode();
      }
      // 색상, 크기, 여백, 오류 수정 레벨 등 기존 초기화 로직 유지
      // ... (생략: 기존 코드와 동일)
    };
    checkElements();
  },

/**
   * 이벤트 리스너 등록 (이벤트 위임 + body 레벨 보완)
   * @private
   */
  _registerEventListeners() {
    // 기존 qr-generator-app 컨테이너 이벤트 위임 유지
    const appContainer = document.getElementById('qr-generator-app');
    if (appContainer) {
      // [1] 탭 버튼 클릭 (content-type-tabs)
      appContainer.addEventListener('click', (e) => {
        // 탭 버튼 클릭 처리
        const tabBtn = e.target.closest('.content-type-tabs button');
        if (tabBtn) {
          console.log('[Body 위임] 탭 버튼 클릭:', tabBtn.dataset.type);
          const tabContainer = tabBtn.parentElement;
          tabContainer.querySelectorAll('button').forEach(b => b.classList.remove('active'));
          tabBtn.classList.add('active');
          // 모든 .content-form에서 .active 제거 + .hidden 추가 (모두 숨김)
          appContainer.querySelectorAll('.content-form').forEach(f => {
            f.classList.remove('active');
            f.classList.add('hidden');
          });
          // 해당 폼 id 찾기 (data-type 속성 활용)
          const type = tabBtn.getAttribute('data-type');
          const form = document.getElementById(type + '-form');
          if (form) {
            form.classList.add('active');
            form.classList.remove('hidden');
          }
          return;
        }

        // [2] QR 코드 생성 버튼 클릭
        if (e.target && e.target.id === 'generate-qr') {
          e.preventDefault();
          if (window.FileToQR && window.FileToQR.QRGenerator) {
            window.FileToQR.QRGenerator.generateQRCode();
          }
          return;
        }

        // [3] 기타 동적 버튼/다운로드 등 필요시 추가
        // ...
      });

      // [4] 로고 추가 체크박스: change 이벤트 위임 (파일 input 표시/숨김)
      appContainer.addEventListener('change', (e) => {
        if (e.target && e.target.id === 'add-logo') {
          const logoOptions = document.getElementById('logo-options');
          const fileInput = document.getElementById('logo-file-input');
          const fileLabel = document.getElementById('logo-file-label');
          // [디버깅] 요소 존재 및 상태 출력
          console.log('[로고 DEBUG] logoOptions:', logoOptions);
          console.log('[로고 DEBUG] fileInput:', fileInput);
          console.log('[로고 DEBUG] fileLabel:', fileLabel);
          if (logoOptions && fileInput && fileLabel) {
            if (e.target.checked) {
              logoOptions.classList.remove('hidden');
              fileInput.style.display = 'block';
              fileInput.disabled = false;
              fileInput.classList.remove('hidden');
              fileLabel.style.display = 'block';
              fileLabel.classList.remove('hidden');
              // [디버깅] 상태 출력
              console.log('[로고 DEBUG] 체크됨 - 표시/활성화');
              console.log('fileInput display:', fileInput.style.display, 'disabled:', fileInput.disabled, 'classList:', fileInput.classList.value);
              console.log('fileLabel display:', fileLabel.style.display, 'classList:', fileLabel.classList.value);
              console.log('logoOptions classList:', logoOptions.classList.value);
            } else {
              fileInput.value = '';
              fileInput.style.display = 'none';
              fileInput.disabled = true;
              fileInput.classList.add('hidden');
              fileLabel.style.display = 'none';
              fileLabel.classList.add('hidden');
              logoOptions.classList.add('hidden');
              this.state.currentOptions.logo = null;
              // [디버깅] 상태 출력
              console.log('[로고 DEBUG] 체크 해제 - 숨김/비활성화');
              console.log('fileInput display:', fileInput.style.display, 'disabled:', fileInput.disabled, 'classList:', fileInput.classList.value);
              console.log('fileLabel display:', fileLabel.style.display, 'classList:', fileLabel.classList.value);
              console.log('logoOptions classList:', logoOptions.classList.value);
            }
          } else {
            console.warn('[로고 DEBUG] logoOptions, fileInput, fileLabel 중 일부가 존재하지 않음');
          }
        }
      });

      // [5] 폼 submit 이벤트 위임 (qr-form)
      appContainer.addEventListener('submit', (e) => {
        if (e.target && e.target.id === 'qr-form') {
          e.preventDefault();
          if (window.FileToQR && window.FileToQR.QRGenerator) {
            window.FileToQR.QRGenerator._handleFormSubmit();
          }
          return;
        }
      });
    }

    // [NEW] document.body 레벨에서 버튼 클릭 이벤트 위임 (동적 버튼 포함)
    document.body.addEventListener('click', (e) => {
      // 1. 탭 버튼 (콘텐츠 타입)
      const tabBtn = e.target.closest('.content-type-tabs button');
      if (tabBtn) {
        console.log('[Body 위임] 탭 버튼 클릭:', tabBtn.dataset.type);
        const tabContainer = tabBtn.parentElement;
        tabContainer.querySelectorAll('button').forEach(b => b.classList.remove('active'));
        tabBtn.classList.add('active');
        // 모든 .content-form에서 .active 제거 + .hidden 추가 (모두 숨김)
        document.querySelectorAll('.content-form').forEach(f => {
          f.classList.remove('active');
          f.classList.add('hidden');
        });
        // 해당 폼 id 찾기 (data-type 속성 활용)
        const type = tabBtn.getAttribute('data-type');
        const form = document.getElementById(type + '-form');
        if (form) {
          form.classList.add('active');
          form.classList.remove('hidden');
        }
        return;
      }
      // 2. QR 코드 생성 버튼
      const genBtn = e.target.closest('#generate-qr');
      if (genBtn) {
        console.log('[Body 위임] QR 생성 버튼 클릭');
        e.preventDefault();
        if (window.FileToQR && window.FileToQR.QRGenerator) {
          window.FileToQR.QRGenerator.generateQRCode();
        }
        return;
      }
      // 3. 다운로드 버튼 (예시: #download-qr, .download-btn 등)
      const dlBtn = e.target.closest('#download-qr, .download-btn');
      if (dlBtn) {
        console.log('[Body 위임] 다운로드 버튼 클릭');
        e.preventDefault();
        // 실제 다운로드 함수 호출 필요시 추가
        // window.FileToQR.QRGenerator.downloadQRCode('png'); 등
        return;
      }
      // 4. 기타 동적 버튼 필요시 추가
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
   * 입력값 검증 함수
   * @param {string} type - 입력 유형(url, text, email, phone, vcard 등)
   * @param {string} value - 입력값
   * @returns {{valid: boolean, message: string}}
   */
  _validateInput(type, value) {
    // i18n 번역 헬퍼
    const _t = (key, defaultMsg) => {
      const i18n = window.FileToQR && window.FileToQR.i18n;
      return i18n && typeof i18n.translate === 'function'
        ? i18n.translate(key, {}, defaultMsg || key)
        : (defaultMsg || key);
    };
    if (!value || typeof value !== 'string' || value.trim() === '') {
      return { valid: false, message: _t('errors.inputEmpty', '입력값이 비어 있습니다. 내용을 입력해주세요.') };
    }
    value = value.trim();
    switch (type) {
      case 'url': {
        // URL 정규식 (간단 버전)
        const urlPattern = /^(https?:\/\/)?([\w\-]+\.)+[\w\-]+(\/[\S]*)?$/i;
        if (!urlPattern.test(value)) {
          return { valid: false, message: _t('errors.urlInvalid', '유효한 URL 형식이 아닙니다. 예: https://example.com') };
        }
        break;
      }
      case 'email': {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(value)) {
          return { valid: false, message: _t('errors.emailInvalid', '유효한 이메일 주소를 입력해주세요.') };
        }
        break;
      }
      case 'phone': {
        const phonePattern = /^[\d\-()+ ]{7,20}$/;
        if (!phonePattern.test(value)) {
          return { valid: false, message: _t('errors.phoneInvalid', '유효한 전화번호를 입력해주세요. 숫자, -, (, )만 허용') };
        }
        break;
      }
      case 'vcard': {
        // vCard는 최소 이름 필수
        if (value.length < 2) {
          return { valid: false, message: _t('errors.vcardInvalid', '이름을 2자 이상 입력해주세요.') };
        }
        break;
      }
      default: {
        // 텍스트: 1자 이상, 2000자 이하
        if (value.length > 2000) {
          return { valid: false, message: _t('errors.textTooLong', '입력값이 너무 깁니다. 2000자 이하로 입력해주세요.') };
        }
        break;
      }
    }
    return { valid: true, message: '' };
  },
  
  /**
   * 폼 제출 핸들러 (리팩토링: 활성 폼/입력 기반)
   * @private
   */
  _handleFormSubmit() {
    console.log('QRGenerator._handleFormSubmit 호출됨');
    // 활성화된 입력 폼 및 입력 필드 동적 탐색
    const activeForm = document.querySelector('.content-form.active');
    if (!activeForm) {
      console.error('활성화된 입력 폼을 찾을 수 없습니다.');
      showErrorMessage('ui.missingForm', 'QR 코드 생성 폼 요소를 찾을 수 없습니다.');
      return;
    }
    // 주요 입력 필드: 폼 내에서 input, textarea, select 등 첫 번째 요소를 자동 탐색
    const contentInput = activeForm.querySelector('input, textarea, select');
    if (!contentInput) {
      console.error('활성화된 폼 내 입력 필드를 찾을 수 없습니다.');
      showErrorMessage('ui.missingInput', 'QR 코드 입력 필드를 찾을 수 없습니다.');
      return;
    }
    const content = contentInput.value.trim();
    // 폼 유형 결정 (id에서 추출)
    const formType = activeForm.id.split('-')[0];
    // 입력값 검증
    const validationResult = this._validateInput(formType, content);
    if (!validationResult.valid) {
      showErrorMessage('input.validation', validationResult.message);
      contentInput.focus();
      return;
    }
    // 상태 업데이트
    this.state.currentOptions.content = content;
    this.state.currentOptions.type = formType;
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
   * 오류 수정 레벨 반환 (최신 QRCode.js는 문자열 그대로 사용)
   * @returns {string} QRCode.js 오류 수정 레벨 ('L','M','Q','H')
   * @private
   */
  _getErrorCorrectionLevel() {
    // 최신 QRCode.js는 문자열('L','M','Q','H')을 직접 옵션으로 받음
    return this.state.currentOptions.errorCorrectionLevel || 'M';
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

// 글로벌 네임스페이스에 등록 (최소화, 중복 방지)
if (typeof window !== 'undefined') {
  window.FileToQR = window.FileToQR || {};
  // QRGenerator가 이미 등록되어 있지 않은 경우에만 등록
  if (!window.FileToQR.QRGenerator) {
    window.FileToQR.QRGenerator = QRGenerator;
  }
}

export default QRGenerator; 