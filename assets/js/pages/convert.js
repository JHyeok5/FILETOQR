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
          if (e.target.id === 'convert-new-btn') {
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
            dropArea.classList.add('bg-blue-100');
          });
          dropArea.addEventListener('dragleave', () => {
            dropArea.classList.remove('bg-blue-100');
          });
          dropArea.addEventListener('drop', (e) => {
            e.preventDefault();
            dropArea.classList.remove('bg-blue-100');
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
    
    // 이전 선택 초기화
    const conversionTypeBtns = document.querySelectorAll('.converter-type-btn');
    conversionTypeBtns.forEach(btn => {
      btn.classList.remove('ring-2', 'ring-blue-500');
    });
    
    // 현재 선택 표시
    const selectedBtn = document.querySelector(`.converter-type-btn[data-type="${type}"]`);
    if (selectedBtn) {
      selectedBtn.classList.add('ring-2', 'ring-blue-500');
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
    if (!optionsContainer) return;
    
    let optionsHTML = '';
    
    switch (type) {
      case 'image':
        optionsHTML = `
          <h2 class="text-xl font-semibold mb-4">이미지 변환 옵션</h2>
          <div class="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">출력 형식</label>
              <select id="output-format" class="w-full p-2 border border-gray-300 rounded-md">
                <option value="">출력 형식 선택</option>
                <option value="png">PNG</option>
                <option value="jpg">JPG</option>
                <option value="webp">WebP</option>
                <option value="gif">GIF</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">품질</label>
              <select id="image-quality" class="w-full p-2 border border-gray-300 rounded-md">
                <option value="high">고품질</option>
                <option value="medium" selected>중간</option>
                <option value="low">저품질</option>
              </select>
            </div>
          </div>
        `;
        break;
        
      case 'document':
        optionsHTML = `
          <h2 class="text-xl font-semibold mb-4">문서 변환 옵션</h2>
          <div class="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">출력 형식</label>
              <select id="output-format" class="w-full p-2 border border-gray-300 rounded-md">
                <option value="">출력 형식 선택</option>
                <option value="pdf">PDF</option>
                <option value="txt">TXT</option>
                <option value="html">HTML</option>
              </select>
            </div>
          </div>
        `;
        break;
        
      case 'audio':
        optionsHTML = `
          <h2 class="text-xl font-semibold mb-4">오디오 변환 옵션</h2>
          <div class="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">출력 형식</label>
              <select id="output-format" class="w-full p-2 border border-gray-300 rounded-md">
                <option value="">출력 형식 선택</option>
                <option value="mp3">MP3</option>
                <option value="wav">WAV</option>
                <option value="ogg">OGG</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">비트레이트</label>
              <select id="audio-bitrate" class="w-full p-2 border border-gray-300 rounded-md">
                <option value="320">320 kbps</option>
                <option value="256">256 kbps</option>
                <option value="192" selected>192 kbps</option>
                <option value="128">128 kbps</option>
                <option value="96">96 kbps</option>
              </select>
            </div>
          </div>
        `;
        break;
        
      case 'data':
        optionsHTML = `
          <h2 class="text-xl font-semibold mb-4">데이터 변환 옵션</h2>
          <div class="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">출력 형식</label>
              <select id="output-format" class="w-full p-2 border border-gray-300 rounded-md">
                <option value="">출력 형식 선택</option>
                <option value="json">JSON</option>
                <option value="csv">CSV</option>
                <option value="xml">XML</option>
              </select>
            </div>
          </div>
        `;
        break;
    }
    
    // 공통 변환 버튼
    optionsHTML += `
      <div class="mt-4">
        <button id="start-conversion-btn" class="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md disabled:opacity-50 disabled:cursor-not-allowed" disabled>
          변환 시작
        </button>
      </div>
    `;
    
    optionsContainer.innerHTML = optionsHTML;
    
    // 변환 시작 버튼 활성화 조건 설정
    const startConversionBtn = document.getElementById('start-conversion-btn');
    const outputFormatSelect = document.getElementById('output-format');
    
    if (startConversionBtn && outputFormatSelect) {
      outputFormatSelect.addEventListener('change', () => {
        startConversionBtn.disabled = !outputFormatSelect.value || !this.state.uploadedFile;
      });
      
      // 파일이 이미 업로드되어 있으면 버튼 활성화 여부 체크
      if (this.state.uploadedFile && outputFormatSelect.value) {
        startConversionBtn.disabled = false;
      }
      
      // 변환 시작 버튼 클릭 이벤트
      startConversionBtn.addEventListener('click', () => {
        this._startConversion();
      });
    }
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
      const result = await ConverterCore.convert(file, outputFormat, options, (progressData) => {
        // 진행 상태 업데이트
        this._updateConversionUI('processing', { progress: progressData.progress });
      });
      
      // 변환 성공 시 UI 업데이트
      this._updateConversionUI('success', {
        result,
        outputFormat
      });
      
      return result;
    } catch (error) {
      console.error('파일 변환 오류:', error);
      this._updateConversionUI('error', { message: error.message });
      throw error;
    }
  },

  /**
   * 변환 UI 업데이트
   * @param {string} status - 상태 ('loading', 'processing', 'success', 'error')
   * @param {Object} data - 상태에 따른 데이터
   * @private
   */
  _updateConversionUI(status, data = {}) {
    // 결과 영역 표시
    const outputElement = document.getElementById('conversion-output');
    if (outputElement) {
      outputElement.classList.remove('hidden');
    }
    
    // 진행 표시줄 요소
    const progressBar = document.getElementById('conversion-progress-bar');
    const progressText = document.getElementById('conversion-progress-text');
    const resultElement = document.getElementById('conversion-result');
    
    // 진행 상태에 따른 UI 업데이트
    switch (status) {
      case 'loading':
        if (progressBar) progressBar.style.width = '5%';
        if (progressText) progressText.textContent = '준비 중...';
        if (resultElement) {
          resultElement.innerHTML = `
            <div class="flex justify-center items-center py-12">
              <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          `;
        }
        break;
        
      case 'processing':
        const progress = data.progress || 0;
        if (progressBar) progressBar.style.width = `${progress}%`;
        if (progressText) progressText.textContent = `${progress}% 완료`;
        if (resultElement && progress < 100) {
          resultElement.innerHTML = `
            <div class="text-center py-12">
              <p class="text-gray-600 mb-2">파일 변환 중입니다. 잠시만 기다려주세요.</p>
              <p class="text-sm text-gray-500">파일 크기에 따라 시간이 더 걸릴 수 있습니다.</p>
            </div>
          `;
        }
        break;
        
      case 'success':
        if (progressBar) progressBar.style.width = '100%';
        if (progressText) progressText.textContent = '변환 완료!';
        
        if (resultElement && data.result) {
          const { url, filename, size, mimeType } = data.result;
          const isImage = mimeType.startsWith('image/');
          
          // 결과 표시 HTML
          let resultHTML = `
            <div class="flex flex-col items-center py-6">
              <div class="text-center mb-6">
                <div class="inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-full mb-4">
                  <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span>변환 완료</span>
                </div>
                <h3 class="text-lg font-medium text-gray-900">${filename}</h3>
                <p class="text-sm text-gray-600">${this._formatFileSize(size)} - ${mimeType}</p>
              </div>
          `;
          
          // 결과가 이미지인 경우 미리보기 표시
          if (isImage) {
            resultHTML += `
              <div class="mb-6 p-4 border rounded-lg w-full max-w-md">
                <img src="${url}" alt="변환된 이미지" class="max-w-full h-auto max-h-64 mx-auto">
              </div>
            `;
          }
          
          // 다운로드 버튼
          resultHTML += `
              <div class="flex space-x-4">
                <a href="${url}" download="${filename}" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md">
                  다운로드
                </a>
                <button id="convert-new-btn" class="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-md">
                  새 파일 변환
                </button>
              </div>
            </div>
          `;
          
          resultElement.innerHTML = resultHTML;
          
          // 새 파일 변환 버튼 이벤트 리스너
          const convertNewBtn = document.getElementById('convert-new-btn');
          if (convertNewBtn) {
            convertNewBtn.addEventListener('click', () => {
              // 파일 업로드 인풋 초기화
              const fileInput = document.getElementById('file-upload');
              if (fileInput) fileInput.value = '';
              
              // 출력 영역 숨기기
              if (outputElement) outputElement.classList.add('hidden');
              
              // 상태 초기화
              this.state.uploadedFile = null;
              this.state.conversionInProgress = false;
            });
          }
        }
        break;
        
      case 'error':
        if (progressBar) progressBar.style.width = '0%';
        if (progressText) progressText.textContent = '변환 실패';
        
        if (resultElement) {
          resultElement.innerHTML = `
            <div class="text-center py-8 px-4 bg-red-50 rounded-lg">
              <svg class="w-12 h-12 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <h3 class="text-lg font-medium text-red-800 mb-2">변환 실패</h3>
              <p class="text-sm text-red-600">${data.message || '파일 변환 중 오류가 발생했습니다.'}</p>
              <button id="try-again-btn" class="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md">
                다시 시도
              </button>
            </div>
          `;
          
          // 다시 시도 버튼 이벤트 리스너
          const tryAgainBtn = document.getElementById('try-again-btn');
          if (tryAgainBtn) {
            tryAgainBtn.addEventListener('click', () => {
              // 파일 업로드 인풋 초기화
              const fileInput = document.getElementById('file-upload');
              if (fileInput) fileInput.value = '';
              
              // 출력 영역 숨기기
              if (outputElement) outputElement.classList.add('hidden');
              
              // 상태 초기화
              this.state.uploadedFile = null;
              this.state.conversionInProgress = false;
            });
          }
        }
        break;
    }
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
window.FileToQR.ConvertPageController = ConvertPageController;

export default ConvertPageController; 