/**
 * convert.js - FileToQR 파일 변환 페이지 컨트롤러
 * 버전: 1.1.0
 * 최종 업데이트: 2025-08-01
 * 
 * 이 모듈은 파일 변환 페이지의 UI 및 사용자 상호작용을 관리합니다:
 * - 변환 유형 선택 UI
 * - 파일 업로드 처리
 * - 변환 옵션 표시
 * - 변환 진행 상태 표시
 */

// 디버깅 로그
console.log('convert.js 스크립트 로딩 시작 - 스크립트 태그가 실행됨');

// 문서가 완전히 로드되었는지 확인
console.log('현재 문서 상태:', document.readyState);

// HTML 요소 존재 여부 확인
setTimeout(() => {
  console.log('주요 HTML 요소 확인:');
  console.log('- 변환 유형 버튼:', document.querySelectorAll('.converter-type-btn').length);
  console.log('- 파일 업로드 입력:', document.getElementById('file-upload') ? '존재' : '없음');
  console.log('- 결과 컨테이너:', document.getElementById('conversion-output') ? '존재' : '없음');
}, 1000);

// 필요한 모듈 임포트
import ConverterCore from '../core/converter-core.js';
import CommonUtils from '../utils/common-utils.js';
import QROptionsManager from '../qr-generator/qr-options-manager.js';
import QRPreviewUpdater from '../qr-generator/qr-preview-updater.js';

// 전역 객체에 컨트롤러 등록
window.FileToQR = window.FileToQR || {};

// 페이지 컨트롤러 모듈
const ConvertPageController = {
  // 상태 관리
  state: {
    initialized: false,
    selectedConversionType: null,
    uploadedFile: null,
    conversionOptions: null,
    conversionInProgress: false
  },

  /**
   * 초기화 함수 (SPA 구조 대응, 이벤트 위임 방식)
   * @param {boolean} force - true면 무조건 재초기화(이벤트 바인딩 포함)
   */
  async init(force = false) {
    if (this.state && this.state.initialized && !force) return;
    if (!this.state) this.state = {};
    this.state.initialized = true;
    try {
      console.log('파일 변환 페이지 초기화 중... (force:', force, ")");
      // UI 요소 초기화
      this._initUI();

      // QR 옵션 매니저 및 프리뷰어 초기화
      const qrOptionsContainer = document.getElementById('converter-options');
      if (qrOptionsContainer) {
        QROptionsManager.init(qrOptionsContainer); // 컨테이너 전달
        
        // QR 코드 표시 및 이미지 ID 확인
        const qrCodeDisplay = document.getElementById('qr-code-display');
        const qrCodeImage = document.getElementById('qr-code-image');

        if (qrCodeDisplay && qrCodeImage) {
          QRPreviewUpdater.init({
            qrCodeContainer: qrCodeDisplay, // 실제 컨테이너 DOM 요소 전달
            qrImageElement: qrCodeImage,     // 실제 이미지 DOM 요소 전달
            optionsManager: QROptionsManager, // QROptionsManager 인스턴스 전달
            noContentMsg: 'QR code preview will appear here once a file is uploaded and options are set.',
            initialPreviewText: 'FileToQR' // 초기 미리보기에 사용할 텍스트
          });
          
          // 옵션 변경 감지하여 프리뷰 업데이트
          // QROptionsManager가 자체적으로 이벤트를 발생시키거나, 여기서 직접 옵션 요소들의 이벤트를 리스닝
          // 예시: QROptionsManager가 'optionsChanged' 커스텀 이벤트를 발생시킨다고 가정
          qrOptionsContainer.addEventListener('qrOptionsChanged', () => {
            if (this.state.uploadedFile || QRPreviewUpdater.hasPreviewableContent()) { // 파일이 있거나, 미리보기 가능한 기본 텍스트가 있다면
              const currentQrData = this.state.uploadedFile ? this.state.uploadedFile.name : QRPreviewUpdater.getInitialPreviewText(); // 단순 예시 데이터
              QRPreviewUpdater.generateAndUpdatePreview(currentQrData, QROptionsManager.getOptions());
            }
          });
          // 초기 로드 시에도 기본 미리보기를 한 번 생성할 수 있습니다.
          // QRPreviewUpdater.generateAndUpdatePreview(QRPreviewUpdater.getInitialPreviewText(), QROptionsManager.getOptions());

        } else {
          console.error('QR code display or image element not found for QRPreviewUpdater.');
        }
      } else {
        console.warn('QR Options container (converter-options) not found. QR Options will not be available.');
      }

      // 이벤트 위임 방식으로 한 번만 바인딩
      const mainContainer = document.getElementById('main-container');
      if (mainContainer && !mainContainer._convertDelegationBound) {
        mainContainer.addEventListener('click', (e) => {
          // 변환 유형 버튼
          const typeBtn = e.target.closest('.converter-type-btn');
          if (typeBtn) {
            this._handleConversionTypeSelect(typeBtn.dataset.type);
            return;
          }
          // 변환 시작 버튼
          if (e.target.id === 'start-conversion-btn') {
            this._startConversion();
            return;
          }
          // 다운로드 버튼 (a 태그는 기본 동작)
          // 새 파일 변환 버튼
          if (e.target.id === 'convert-new-file-btn') {
            const fileInput = document.getElementById('file-upload');
            if (fileInput) fileInput.value = '';
            const outputElement = document.getElementById('conversion-output');
            if (outputElement) outputElement.classList.add('hidden');
            this.state.uploadedFile = null;
            this.state.conversionInProgress = false;
            return;
          }
          // 다시 시도 버튼
          if (e.target.id === 'try-again-btn') {
            const fileInput = document.getElementById('file-upload');
            if (fileInput) fileInput.value = '';
            const outputElement = document.getElementById('conversion-output');
            if (outputElement) outputElement.classList.add('hidden');
            this.state.uploadedFile = null;
            this.state.conversionInProgress = false;
            return;
          }
        });
        mainContainer.addEventListener('change', (e) => {
          // 파일 업로드 input
          if (e.target.id === 'file-upload') {
            this._handleFileUpload(e.target.files[0]);
            return;
          }
          // 변환 옵션 select
          if (e.target.id === 'output-format') {
            const startConversionBtn = document.getElementById('start-conversion-btn');
            startConversionBtn.disabled = !e.target.value || !this.state.uploadedFile;
            return;
          }
        });
        // 드래그 앤 드롭(드롭 영역은 label[for="file-upload"])
        const dropArea = mainContainer.querySelector('label[for="file-upload"]');
        if (dropArea && !dropArea._convertDropBound) {
          dropArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropArea.classList.add('bg-purple-100');
            dropArea.classList.add('border-purple-500');
          });
          dropArea.addEventListener('dragleave', () => {
            dropArea.classList.remove('bg-purple-100');
            dropArea.classList.remove('border-purple-500');
          });
          dropArea.addEventListener('drop', (e) => {
            e.preventDefault();
            dropArea.classList.remove('bg-purple-100');
            dropArea.classList.remove('border-purple-500');
            if (e.dataTransfer.files.length) {
              const fileInput = document.getElementById('file-upload');
              fileInput.files = e.dataTransfer.files;
              this._handleFileUpload(e.dataTransfer.files[0]);
            }
          });
          dropArea._convertDropBound = true;
        }
        mainContainer._convertDelegationBound = true;
      }
      console.log('파일 변환 페이지 초기화 완료 (force:', force, ")");
    } catch (error) {
      console.error('파일 변환 페이지 초기화 실패:', error);
    }
  },

  /**
   * UI 요소 초기화
   * @private
   */
  _initUI() {
    // 변환 유형 버튼 활성화
    const conversionTypeBtns = document.querySelectorAll('.converter-type-btn');
    conversionTypeBtns.forEach(btn => {
      btn.classList.remove('opacity-50', 'cursor-not-allowed');
    });

    // 변환 결과 영역 초기 숨김
    const conversionOutput = document.getElementById('conversion-output');
    if (conversionOutput) {
      conversionOutput.classList.add('hidden');
    }
  },

  /**
   * 변환 유형 선택 처리
   * @param {string} type - 선택된 변환 유형 (image, document, audio, data)
   * @private
   */
  _handleConversionTypeSelect(type) {
    console.log(`변환 유형 선택: ${type}`);
    
    // 이전 선택 초기화 및 활성 탭 스타일 제거
    const conversionTypeBtns = document.querySelectorAll('.converter-type-btn');
    conversionTypeBtns.forEach(btn => {
      btn.classList.remove('active-tab', 'bg-purple-600', 'text-white');
      btn.classList.add('text-slate-600', 'hover:bg-slate-100'); // 기본 스타일로 복원
    });
    
    // 현재 선택 표시 및 활성 탭 스타일 적용
    const selectedBtn = document.querySelector(`.converter-type-btn[data-type="${type}"]`);
    if (selectedBtn) {
      selectedBtn.classList.add('active-tab', 'bg-purple-600', 'text-white');
      selectedBtn.classList.remove('text-slate-600', 'hover:bg-slate-100');
    }
    
    // 상태 업데이트
    this.state.selectedConversionType = type;
    
    // 변환 옵션 영역 표시
    this._showConversionOptions(type);
  },

  /**
   * 변환 유형에 따른 옵션 표시
   * @param {string} type - 변환 유형
   * @private
   */
  _showConversionOptions(type) {
    const optionsContainer = document.getElementById('converter-options');
    if (!optionsContainer) {
      console.warn('Converter options container (converter-options) not found in _showConversionOptions.');
      return;
    }
    
    // 기존의 동적 HTML 생성 로직을 제거합니다.
    // convert.html에 이미 QR 코드 옵션 필드들이 하드코딩되어 있으므로,
    // 이 컨테이너를 보여주기만 하면 됩니다.
    optionsContainer.classList.remove('hidden');
    console.log('QR Code options section has been made visible.');

    // selectedConversionType 상태는 여전히 필요할 수 있으므로 유지합니다.
    // 이 type은 QR 코드 생성 자체보다는 다른 로직에 사용될 수 있습니다. (예: 파일 유형에 따른 데이터 처리)
    // 만약 QR 코드 생성 전용 페이지라면, selectedConversionType은 필요 없을 수도 있습니다.
    // 현재 구조에서는 _handleConversionTypeSelect에서 selectedConversionType을 설정하고,
    // 여기서 그 type에 따라 UI를 변경했었으므로, type 파라미터는 일단 유지합니다.
    console.log(`Conversion type for which options are shown: ${type}`);

    // 파일 업로드 시 convert-btn 활성화 로직은 _handleFileUpload에서 처리하는 것이 더 적절해 보입니다.
    // 여기서는 단순히 옵션 영역을 보여주는 역할에 집중합니다.
  },

  /**
   * 파일 업로드 처리
   * @param {File} file - 업로드된 파일
   * @private
   */
  _handleFileUpload(file) {
    if (!file) return;
    
    console.log(`파일 업로드됨: ${file.name} (${this._formatFileSize(file.size)}, ${file.type})`);
    
    // 상태 업데이트
    this.state.uploadedFile = file;
    
    // 파일 정보 표시
    const fileInfoEl = document.getElementById('file-info');
    if (fileInfoEl) {
      fileInfoEl.innerHTML = `
        <div class="flex items-center">
          <svg class="w-8 h-8 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
          </svg>
          <div>
            <p class="font-medium">${file.name}</p>
            <p class="text-sm text-gray-500">${this._formatFileSize(file.size)} - ${file.type || '알 수 없는 유형'}</p>
          </div>
        </div>
      `;
      fileInfoEl.classList.remove('hidden');
    }
    
    // 파일 유형에 따른 변환 유형 자동 선택
    if (!this.state.selectedConversionType) {
      const autoType = this._autoSelectConversionType(file);
      if (autoType) {
        this._handleConversionTypeSelect(autoType);
      }
    }
    
    // 변환 시작 버튼 활성화 여부 업데이트
    const startConversionBtn = document.getElementById('start-conversion-btn');
    const outputFormatSelect = document.getElementById('output-format');
    if (startConversionBtn && outputFormatSelect && outputFormatSelect.value) {
      startConversionBtn.disabled = false;
    }
  },

  /**
   * 파일 MIME 타입에 따른 변환 유형 자동 선택
   * @param {File} file - 업로드된 파일
   * @returns {string|null} - 선택된 변환 유형 또는 null
   * @private
   */
  _autoSelectConversionType(file) {
    if (!file || !file.type) return null;
    
    const mimeType = file.type.toLowerCase();
    
    if (mimeType.startsWith('image/')) {
      return 'image';
    } else if (mimeType.startsWith('video/')) {
      return 'video';
    } else if (mimeType.startsWith('audio/')) {
      return 'audio';
    } else if (
      mimeType.includes('pdf') || 
      mimeType.includes('text/') || 
      mimeType.includes('document') ||
      mimeType.includes('spreadsheet') ||
      mimeType.includes('presentation')
    ) {
      return 'document';
    } else if (
      mimeType.includes('json') || 
      mimeType.includes('xml') || 
      mimeType.includes('csv')
    ) {
      return 'data';
    }
    
    // 파일 확장자로 판단 시도
    const extension = file.name.split('.').pop().toLowerCase();
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'];
    const docExtensions = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'rtf', 'odt'];
    const audioExtensions = ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a'];
    const dataExtensions = ['json', 'xml', 'csv', 'yaml', 'yml', 'toml'];
    
    if (imageExtensions.includes(extension)) {
      return 'image';
    } else if (docExtensions.includes(extension)) {
      return 'document';
    } else if (audioExtensions.includes(extension)) {
      return 'audio';
    } else if (dataExtensions.includes(extension)) {
      return 'data';
    }
    
    return null;
  },

  /**
   * 파일 크기 포맷팅
   * @param {number} bytes - 바이트 단위 파일 크기
   * @returns {string} - 포맷팅된 파일 크기
   * @private
   */
  _formatFileSize(bytes) {
    return CommonUtils.formatters.formatFileSize(bytes);
  },

  /**
   * 변환 시작
   * @private
   */
  _startConversion() {
    if (this.state.conversionInProgress || !this.state.uploadedFile) {
      return;
    }
    
    // 변환 옵션 수집
    const options = this._collectConversionOptions();
    if (!options || !options.outputFormat) {
      alert('변환 형식을 선택해주세요.');
      return;
    }
    
    console.log('변환 시작:', options);
    
    // 변환 상태 업데이트
    this.state.conversionInProgress = true;
    this._updateConversionUI('loading', { progress: 0 });
    
    // 변환 시작 버튼 비활성화
    const startConversionBtn = document.getElementById('start-conversion-btn');
    if (startConversionBtn) {
      startConversionBtn.disabled = true;
      startConversionBtn.textContent = '변환 중...';
    }
    
    // 파일 변환 처리
    this._processConversion(this.state.uploadedFile, options.outputFormat, options)
      .then(result => {
        console.log('변환 완료:', result);
        this._updateConversionUI('success', result);
      })
      .catch(error => {
        console.error('변환 실패:', error);
        this._updateConversionUI('error', { error: error.message || '변환 중 오류가 발생했습니다.' });
      })
      .finally(() => {
        this.state.conversionInProgress = false;
        
        // 변환 시작 버튼 복원
        if (startConversionBtn) {
          startConversionBtn.disabled = false;
          startConversionBtn.textContent = '변환 시작';
        }
      });
  },

  /**
   * 변환 옵션 수집
   * @returns {Object} - 수집된 변환 옵션
   * @private
   */
  _collectConversionOptions() {
    const options = {
      conversionType: this.state.selectedConversionType,
      outputFormat: document.getElementById('output-format')?.value
    };
    
    // 변환 유형별 추가 옵션
    switch (this.state.selectedConversionType) {
      case 'image':
        options.quality = document.getElementById('image-quality')?.value || 'medium';
        break;
        
      case 'audio':
        options.bitrate = document.getElementById('audio-bitrate')?.value || '192';
        break;
    }
    
    return options;
  },

  /**
   * 파일 변환 처리
   * @param {File} file - 원본 파일
   * @param {string} outputFormat - 출력 형식
   * @param {Object} options - 변환 옵션
   * @private
   */
  async _processConversion(file, outputFormat, options) {
    try {
      // 변환 시작 상태 업데이트
      this._updateConversionUI('processing', { progress: 0 });
      
      // ConverterCore를 사용하여 파일 변환
      const result = await ConverterCore.convert(file, outputFormat, options);
      
      // 변환 성공 시 UI 업데이트
      this._updateConversionUI('success', { ...result, originalFileName: file.name });
      
      return result;
    } catch (error) {
      console.error('Conversion failed in _processConversion:', error);
      this._updateConversionUI('error', { message: error.message || 'Unknown conversion error' });
      throw error;
    }
  },

  /**
   * 변환 관련 UI 업데이트
   * @param {string} status - 'progress', 'success', 'error', 'reset'
   * @param {object} data - 상태에 따른 데이터
   * @private
   */
  _updateConversionUI(status, data = {}) {
    const progressContainer = document.getElementById('conversion-progress-section');
    const progressBar = document.getElementById('conversion-progress-bar');
    const progressText = document.getElementById('progress-text');
    const outputSection = document.getElementById('conversion-output-section');
    const outputContainer = document.getElementById('conversion-output'); // The inner container for result details
    const qrCodeImage = document.getElementById('qr-code-image');
    const downloadBtn = document.getElementById('download-qr-btn'); // Assuming single download button for now
    const convertNewBtn = document.getElementById('convert-new-file-btn');
    const startConversionBtn = document.getElementById('start-conversion-btn');
    const statusMessageEl = document.getElementById('status-message'); // New status message element
    const conversionOutputTitle = outputContainer ? outputContainer.querySelector('h2') : null;


    // Helper to show/hide sections
    const showSection = (el, show) => el && (show ? el.classList.remove('hidden') : el.classList.add('hidden'));

    // Reset UI elements related to previous conversion before new status update
    if (status !== 'progress') {
      showSection(progressContainer, false);
    }
    if (statusMessageEl) statusMessageEl.textContent = ''; // Clear previous messages
    if (statusMessageEl) statusMessageEl.className = 'mb-4'; // Reset classes

    switch (status) {
      case 'progress':
        showSection(progressContainer, true);
        showSection(outputSection, false);
        if (progressBar) progressBar.style.width = `${data.percentage}%`;
        if (progressText) progressText.textContent = data.message || 'Processing...';
        if (startConversionBtn) startConversionBtn.disabled = true;
        break;

      case 'success':
        showSection(outputSection, true);
        outputSection.classList.remove('animate-fadeIn'); // Remove then add for re-trigger
        void outputSection.offsetWidth; // Trigger reflow
        outputSection.classList.add('animate-fadeIn');

        if (conversionOutputTitle) conversionOutputTitle.textContent = 'Conversion Complete!';
        if (qrCodeImage && data.qrCodeUrl) {
          qrCodeImage.src = data.qrCodeUrl;
          qrCodeImage.alt = `QR Code for ${data.originalFileName}`;
        } else if (qrCodeImage) {
            qrCodeImage.src = "#"; // Placeholder or clear
            qrCodeImage.alt = "QR Code not available";
        }
        
        if (statusMessageEl) {
            statusMessageEl.textContent = data.message || `Successfully generated QR Code for ${data.originalFileName}.`;
            statusMessageEl.classList.add('text-green-600');
        }

        if (downloadBtn) {
            downloadBtn.disabled = false;
            // downloadBtn.onclick = () => { /* Call download function with data.downloadUrl or similar */ };
        }
        if (convertNewBtn) convertNewBtn.disabled = false;
        if (startConversionBtn) startConversionBtn.disabled = true; // Keep disabled until new file
        break;

      case 'error':
        showSection(outputSection, true);
        outputSection.classList.remove('animate-fadeIn');
        void outputSection.offsetWidth;
        outputSection.classList.add('animate-fadeIn');

        if (conversionOutputTitle) conversionOutputTitle.textContent = 'Conversion Failed';
        if (qrCodeImage) {
            qrCodeImage.src = '/assets/images/error-placeholder.svg'; // Optional: show an error image
            qrCodeImage.alt = 'Error generating QR Code';
        }
        if (statusMessageEl) {
            statusMessageEl.textContent = data.message || 'Could not process your file. Please try again.';
            statusMessageEl.classList.add('text-red-600');
        }
        
        if (downloadBtn) downloadBtn.disabled = true;
        if (convertNewBtn) convertNewBtn.disabled = false;
        if (startConversionBtn) startConversionBtn.disabled = false; // Allow re-try with same file
        break;

      case 'reset': // For clearing UI when a new file is selected or 'convert new' is clicked
        showSection(progressContainer, false);
        showSection(outputSection, false);
        if (progressBar) progressBar.style.width = '0%';
        if (progressText) progressText.textContent = 'Initializing...';
        if (qrCodeImage) {
            qrCodeImage.src = '#';
            qrCodeImage.alt = 'Generated QR Code';
        }
        if (statusMessageEl) {
            statusMessageEl.textContent = '';
            statusMessageEl.className = 'mb-4';
        }
        if (startConversionBtn) startConversionBtn.disabled = true; // Disabled until a file is chosen
        if (downloadBtn) downloadBtn.disabled = true;
        if (convertNewBtn) convertNewBtn.disabled = true; // Or hide, depending on flow
        break;
    }
    this.state.conversionInProgress = (status === 'progress');
  },

  /**
   * SPA 전환 시 기존 이벤트/상태 해제 (destroy)
   * (이벤트 위임 방식에서는 실질적으로 불필요, 최소화)
   */
  destroy() {
    this.state = { initialized: false };
    console.log('ConvertPageController.destroy() 호출: 상태만 초기화');
  }
};

// 전역 객체에 컨트롤러 추가
// window.FileToQR.ConvertPageController = ConvertPageController; // 이 줄 주석 처리 또는 삭제

export default ConvertPageController; 