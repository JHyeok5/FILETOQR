/**
 * file-to-qr-converter.js - FileToQR 텍스트 파일을 QR 코드로 변환하는 모듈
 * 버전: 1.0.0
 * 최종 업데이트: 2023-06-15
 */

import QRGenerator from '../qr-generator/qr-generator.js';

// 텍스트 파일을 QR 코드로 변환하는 모듈
const FileToQRConverter = {
  // 내부 상태
  state: {
    initialized: false,
    file: null,
    fileContent: null,
    maxFileSize: 1024 * 5, // 5KB (QR 코드는 용량 제한이 있음)
    qrCanvas: null,
    errorCorrectionLevel: 'M', // L: 7%, M: 15%, Q: 25%, H: 30% 오류 복구
    qrSettings: {
      margin: 4,
      scale: 4,
      width: 256,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    }
  },
  
  /**
   * 모듈 초기화
   * @returns {Promise<boolean>} 초기화 성공 여부
   */
  async init() {
    if (this.state.initialized) {
      console.log('FileToQRConverter가 이미 초기화되어 있습니다.');
      return true;
    }
    
    try {
      console.log('FileToQRConverter 초기화 시작...');
      
      // QR 코드 생성기 초기화
      await QRGenerator.init();
      
      // UI 요소 초기화
      this._initUI();
      
      // 이벤트 리스너 등록
      this._registerEventListeners();
      
      this.state.initialized = true;
      console.log('FileToQRConverter 초기화 완료');
      return true;
    } catch (error) {
      console.error('FileToQRConverter 초기화 중 에러 발생:', error);
      return false;
    }
  },
  
  /**
   * UI 요소 초기화
   * @private
   */
  _initUI() {
    // 파일 업로드 영역 생성
    const fileUploadSection = document.getElementById('file-upload-section');
    if (fileUploadSection) {
      // 파일 업로드 영역이 이미 있는 경우, 필요한 요소만 추가
      
      // QR 코드 출력 영역 생성
      const outputContainer = document.getElementById('conversion-output');
      if (outputContainer) {
        outputContainer.innerHTML = `
          <h2 class="text-xl font-semibold mb-4">QR 코드 변환 결과</h2>
          <div class="bg-gray-50 p-4 rounded-lg border border-gray-200 min-h-32 flex flex-col items-center">
            <div id="qr-preview-container" class="qr-preview-container mb-4">
              <div class="text-center text-gray-500">
                텍스트 파일을 업로드하면 QR 코드가 여기에 표시됩니다.
              </div>
            </div>
            <div id="file-info" class="w-full text-sm text-gray-600 mb-4 hidden">
              <div class="p-3 bg-blue-50 rounded-md">
                <p class="font-medium">파일 정보:</p>
                <p id="file-name">파일명: </p>
                <p id="file-size">파일 크기: </p>
                <p id="character-count">문자 수: </p>
              </div>
            </div>

            <div id="qr-settings" class="w-full mb-4 hidden">
              <div class="p-3 bg-gray-50 rounded-md">
                <h3 class="font-medium mb-2">QR 코드 설정</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">오류 수정 레벨</label>
                    <select id="error-correction" class="w-full px-3 py-2 border rounded-md">
                      <option value="L">낮음 (7%)</option>
                      <option value="M" selected>중간 (15%)</option>
                      <option value="Q">높음 (25%)</option>
                      <option value="H">최고 (30%)</option>
                    </select>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">QR 코드 크기</label>
                    <select id="qr-size" class="w-full px-3 py-2 border rounded-md">
                      <option value="200">작게 (200x200)</option>
                      <option value="256" selected>보통 (256x256)</option>
                      <option value="320">크게 (320x320)</option>
                      <option value="400">아주 크게 (400x400)</option>
                    </select>
                  </div>
                </div>
                <button id="regenerate-qr" class="mt-3 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium text-sm">설정 적용 및 재생성</button>
              </div>
            </div>
          </div>
          <div class="flex justify-center gap-4 mt-4">
            <button id="download-qr-btn" class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed" disabled>
              QR 코드 다운로드
            </button>
            <button id="convert-another-btn" class="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-medium">
              다른 파일 변환
            </button>
          </div>
        `;
      }
    }
  },
  
  /**
   * 이벤트 리스너 등록
   * @private
   */
  _registerEventListeners() {
    // 파일 업로드 이벤트 처리
    const fileInput = document.getElementById('file-upload');
    if (fileInput) {
      fileInput.addEventListener('change', this._handleFileUpload.bind(this));
    }
    
    // 다운로드 버튼 이벤트 처리
    const downloadBtn = document.getElementById('download-qr-btn');
    if (downloadBtn) {
      downloadBtn.addEventListener('click', this._handleDownload.bind(this));
    }
    
    // 다른 파일 변환 버튼 이벤트 처리
    const convertAnotherBtn = document.getElementById('convert-another-btn');
    if (convertAnotherBtn) {
      convertAnotherBtn.addEventListener('click', this._resetConverter.bind(this));
    }
    
    // QR 코드 재생성 버튼 이벤트 처리
    const regenerateBtn = document.getElementById('regenerate-qr');
    if (regenerateBtn) {
      regenerateBtn.addEventListener('click', this._regenerateQRCode.bind(this));
    }
    
    // 드래그 앤 드롭 이벤트 처리
    const dropZone = document.querySelector('label[for="file-upload"]');
    if (dropZone) {
      dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('bg-blue-100');
      });
      
      dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('bg-blue-100');
      });
      
      dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('bg-blue-100');
        
        if (e.dataTransfer.files.length) {
          fileInput.files = e.dataTransfer.files;
          this._handleFileUpload({ target: fileInput });
        }
      });
    }
  },
  
  /**
   * QR 코드 설정 업데이트
   * @private
   */
  _updateQRSettings() {
    // 오류 수정 레벨
    const errorCorrectionSelect = document.getElementById('error-correction');
    if (errorCorrectionSelect) {
      this.state.errorCorrectionLevel = errorCorrectionSelect.value;
    }
    
    // QR 코드 크기
    const qrSizeSelect = document.getElementById('qr-size');
    if (qrSizeSelect) {
      this.state.qrSettings.width = parseInt(qrSizeSelect.value, 10);
    }
  },
  
  /**
   * QR 코드 재생성
   * @private
   */
  async _regenerateQRCode() {
    if (!this.state.fileContent) {
      alert('변환할 텍스트 파일을 먼저 업로드해주세요.');
      return;
    }
    
    this._updateQRSettings();
    await this._generateQRCode(this.state.fileContent);
    
    // 성공 메시지 표시
    const qrSettings = document.getElementById('qr-settings');
    if (qrSettings) {
      const successMsg = document.createElement('div');
      successMsg.className = 'text-green-600 text-sm mt-2 text-center';
      successMsg.textContent = 'QR 코드가 새 설정으로 재생성되었습니다.';
      
      // 기존 메시지 제거
      const existingMsg = qrSettings.querySelector('.text-green-600');
      if (existingMsg) existingMsg.remove();
      
      qrSettings.appendChild(successMsg);
      
      // 3초 후 메시지 자동 제거
      setTimeout(() => {
        if (successMsg.parentNode) {
          successMsg.remove();
        }
      }, 3000);
    }
  },
  
  /**
   * 파일 업로드 핸들러
   * @param {Event} event 파일 업로드 이벤트
   * @private
   */
  async _handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // 파일 유형 확인 (텍스트 파일만 허용)
    const isTextFile = file.type.match('text/plain') || file.name.endsWith('.txt');
    if (!isTextFile) {
      alert('텍스트 파일(.txt)만 지원됩니다.');
      return;
    }
    
    // 파일 크기 확인
    if (file.size > this.state.maxFileSize) {
      alert(`파일 크기는 ${this.state.maxFileSize / 1024}KB 이하여야 합니다. (QR 코드 용량 제한)`);
      return;
    }
    
    // 로딩 표시 설정
    this._showLoadingState(true);
    
    try {
      // 파일 저장 및 처리
      this.state.file = file;
      
      // 파일 내용 읽기
      const content = await this._readFileContent(file);
      this.state.fileContent = content;
      
      // 파일 정보 표시
      this._showFileInfo(file, content);
      
      // QR 코드 생성
      await this._generateQRCode(content);
      
      // 출력 영역 표시
      const outputContainer = document.getElementById('conversion-output');
      if (outputContainer) {
        outputContainer.classList.remove('hidden');
      }
      
      // 설정 영역 표시
      const qrSettings = document.getElementById('qr-settings');
      if (qrSettings) {
        qrSettings.classList.remove('hidden');
      }
      
      // 다운로드 버튼 활성화
      const downloadBtn = document.getElementById('download-qr-btn');
      if (downloadBtn) {
        downloadBtn.disabled = false;
      }
      
    } catch (error) {
      console.error('파일 처리 중 오류 발생:', error);
      this._showError('파일을 처리하는 중 오류가 발생했습니다.');
    } finally {
      // 로딩 상태 해제
      this._showLoadingState(false);
    }
  },
  
  /**
   * 로딩 상태 표시
   * @param {boolean} isLoading 로딩 중 여부
   * @private
   */
  _showLoadingState(isLoading) {
    const qrContainer = document.getElementById('qr-preview-container');
    if (!qrContainer) return;
    
    if (isLoading) {
      qrContainer.innerHTML = `
        <div class="text-center text-gray-500">
          <svg class="animate-spin h-10 w-10 text-blue-500 mx-auto mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p>QR 코드 생성 중...</p>
        </div>
      `;
    }
  },
  
  /**
   * 오류 메시지 표시
   * @param {string} message 오류 메시지
   * @private
   */
  _showError(message) {
    const qrContainer = document.getElementById('qr-preview-container');
    if (!qrContainer) return;
    
    qrContainer.innerHTML = `
      <div class="text-center text-red-500">
        <svg class="h-10 w-10 text-red-500 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <p>${message}</p>
      </div>
    `;
  },
  
  /**
   * 파일 내용 읽기
   * @param {File} file 텍스트 파일
   * @returns {Promise<string>} 파일 내용
   * @private
   */
  _readFileContent(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        resolve(event.target.result);
      };
      
      reader.onerror = (error) => {
        console.error('파일 읽기 오류:', error);
        reject(error);
      };
      
      reader.readAsText(file);
    });
  },
  
  /**
   * 파일 정보 표시
   * @param {File} file 파일 객체
   * @param {string} content 파일 내용
   * @private
   */
  _showFileInfo(file, content) {
    const fileInfo = document.getElementById('file-info');
    const fileName = document.getElementById('file-name');
    const fileSize = document.getElementById('file-size');
    const charCount = document.getElementById('character-count');
    
    if (fileInfo && fileName && fileSize && charCount) {
      fileName.textContent = `파일명: ${file.name}`;
      fileSize.textContent = `파일 크기: ${(file.size / 1024).toFixed(2)} KB`;
      charCount.textContent = `문자 수: ${content.length} 자`;
      fileInfo.classList.remove('hidden');
      
      // 경고 표시 - 문자 수가 많을 경우
      if (content.length > 500) {
        const warning = document.createElement('p');
        warning.className = 'text-amber-600 mt-2';
        warning.textContent = '* 문자 수가 많아 QR 코드 인식이 어려울 수 있습니다. 길이를 줄이는 것이 좋습니다.';
        fileInfo.appendChild(warning);
      }
    }
  },
  
  /**
   * QR 코드 생성
   * @param {string} content QR 코드에 인코딩할 내용
   * @private
   */
  async _generateQRCode(content) {
    const qrContainer = document.getElementById('qr-preview-container');
    if (!qrContainer) return;
    
    // 기존 캔버스 삭제
    qrContainer.innerHTML = '';
    
    // 새 캔버스 생성
    const canvas = document.createElement('canvas');
    canvas.width = this.state.qrSettings.width;
    canvas.height = this.state.qrSettings.width;
    qrContainer.appendChild(canvas);
    
    this.state.qrCanvas = canvas;
    
    // QR 코드 생성
    try {
      await QRGenerator.state.qrLibrary.toCanvas(canvas, content, {
        width: this.state.qrSettings.width,
        margin: this.state.qrSettings.margin,
        color: this.state.qrSettings.color,
        errorCorrectionLevel: this.state.errorCorrectionLevel
      });
      
      // 캔버스 스타일 추가
      canvas.style.maxWidth = '100%';
      canvas.style.height = 'auto';
      canvas.classList.add('shadow-md', 'rounded-md');
      
    } catch (error) {
      console.error('QR 코드 생성 중 오류 발생:', error);
      this._showError('QR 코드 생성에 실패했습니다. 텍스트 내용이 너무 길거나 특수 문자가 많습니다.');
      
      // 설정 영역 숨김
      const qrSettings = document.getElementById('qr-settings');
      if (qrSettings) {
        qrSettings.classList.add('hidden');
      }
    }
  },
  
  /**
   * QR 코드 다운로드 처리
   * @private
   */
  _handleDownload() {
    if (!this.state.qrCanvas) {
      alert('QR 코드를 먼저 생성해주세요.');
      return;
    }
    
    try {
      // 파일명 생성 (원본 파일명 + QR)
      const originalFilename = this.state.file.name;
      const filenameWithoutExt = originalFilename.replace(/\.[^/.]+$/, '');
      const filename = `${filenameWithoutExt}-QR.png`;
      
      // 다운로드 링크 생성
      const link = document.createElement('a');
      link.download = filename;
      
      // 고품질 이미지 설정
      const dataUrl = this.state.qrCanvas.toDataURL('image/png', 1.0);
      link.href = dataUrl;
      link.click();
      
      // 다운로드 성공 메시지
      const downloadBtn = document.getElementById('download-qr-btn');
      if (downloadBtn) {
        const originalText = downloadBtn.textContent;
        downloadBtn.textContent = '다운로드 완료!';
        downloadBtn.classList.remove('bg-blue-600', 'hover:bg-blue-700');
        downloadBtn.classList.add('bg-green-600', 'hover:bg-green-700');
        
        // 3초 후 원래 상태로 복원
        setTimeout(() => {
          downloadBtn.textContent = originalText;
          downloadBtn.classList.remove('bg-green-600', 'hover:bg-green-700');
          downloadBtn.classList.add('bg-blue-600', 'hover:bg-blue-700');
        }, 3000);
      }
    } catch (error) {
      console.error('QR 코드 다운로드 중 오류 발생:', error);
      alert('QR 코드 다운로드에 실패했습니다.');
    }
  },
  
  /**
   * 컨버터 초기화
   * @private
   */
  _resetConverter() {
    // 상태 초기화
    this.state.file = null;
    this.state.fileContent = null;
    this.state.qrCanvas = null;
    
    // UI 초기화
    const fileInfo = document.getElementById('file-info');
    if (fileInfo) {
      fileInfo.classList.add('hidden');
      
      // 경고 메시지 제거
      const warning = fileInfo.querySelector('.text-amber-600');
      if (warning) warning.remove();
    }
    
    const qrContainer = document.getElementById('qr-preview-container');
    if (qrContainer) {
      qrContainer.innerHTML = '<div class="text-center text-gray-500">텍스트 파일을 업로드하면 QR 코드가 여기에 표시됩니다.</div>';
    }
    
    const qrSettings = document.getElementById('qr-settings');
    if (qrSettings) {
      qrSettings.classList.add('hidden');
    }
    
    const downloadBtn = document.getElementById('download-qr-btn');
    if (downloadBtn) {
      downloadBtn.disabled = true;
      downloadBtn.classList.remove('bg-green-600', 'hover:bg-green-700');
      downloadBtn.classList.add('bg-blue-600', 'hover:bg-blue-700');
      downloadBtn.textContent = 'QR 코드 다운로드';
    }
    
    const fileInput = document.getElementById('file-upload');
    if (fileInput) {
      fileInput.value = '';
    }
    
    const outputContainer = document.getElementById('conversion-output');
    if (outputContainer) {
      outputContainer.classList.add('hidden');
    }
  }
};

// 글로벌 네임스페이스에 등록
if (typeof window !== 'undefined') {
  window.FileToQR = window.FileToQR || {};
  window.FileToQR.FileToQRConverter = FileToQRConverter;
}

export default FileToQRConverter; 