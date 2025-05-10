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
   * 초기화 함수
   */
  async init() {
    if (this.state.initialized) return;

    try {
      console.log('파일 변환 페이지 초기화 중...');
      
      // UI 요소 초기화
      this._initUI();
      
      // 이벤트 리스너 등록
      this._registerEventListeners();
      
      this.state.initialized = true;
      console.log('파일 변환 페이지 초기화 완료');
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
   * 이벤트 리스너 등록
   * @private
   */
  _registerEventListeners() {
    // 변환 유형 버튼 클릭 이벤트
    const conversionTypeBtns = document.querySelectorAll('.converter-type-btn');
    conversionTypeBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        this._handleConversionTypeSelect(e.currentTarget.dataset.type);
      });
    });

    // 파일 업로드 이벤트
    const fileUpload = document.getElementById('file-upload');
    if (fileUpload) {
      fileUpload.addEventListener('change', (e) => {
        this._handleFileUpload(e.target.files[0]);
      });
    }

    // 파일 드래그 앤 드롭 영역
    const dropArea = document.querySelector('label[for="file-upload"]');
    if (dropArea) {
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
    }

    // 다운로드 버튼 클릭 이벤트
    const downloadBtn = document.getElementById('download-btn');
    if (downloadBtn) {
      downloadBtn.addEventListener('click', () => {
        // 이미 버튼이 활성화된 상태라면 다운로드 처리는 버튼의 href에 의해 처리됨
        console.log('다운로드 버튼 클릭됨');
      });
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
    this._updateConversionUI('progress', { progress: 0 });
    
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
   * @param {File} file - 변환할 파일
   * @param {string} outputFormat - 출력 형식
   * @param {Object} options - 추가 옵션
   * @returns {Promise<Object>} - 변환 결과
   * @private
   */
  async _processConversion(file, outputFormat, options) {
    return new Promise((resolve, reject) => {
      // 진행 상태 콜백
      const progressCallback = (progressData) => {
        this._updateConversionUI('progress', { progress: progressData.progress });
      };
      
      try {
        // ConverterCore 사용 (리팩토링된 코어 컨버터 사용)
        ConverterCore.convert(file, outputFormat, options, progressCallback)
          .then(result => {
            resolve({
              url: result.url,
              filename: result.filename,
              size: result.size,
              mimeType: result.mimeType
            });
          })
          .catch(error => {
            reject(error);
          });
      } catch (error) {
        // 변환 중 발생한 모든 예외 처리
        reject(error);
      }
    });
  },

  /**
   * 변환 UI 업데이트
   * @param {string} status - 상태 (progress, success, error)
   * @param {Object} data - 상태에 따른 추가 데이터
   * @private
   */
  _updateConversionUI(status, data = {}) {
    const conversionOutput = document.getElementById('conversion-output');
    const progressBar = document.getElementById('conversion-progress-bar');
    const progressText = document.getElementById('conversion-progress-text');
    const resultContainer = document.getElementById('conversion-result');
    
    if (!conversionOutput) return;
    
    conversionOutput.classList.remove('hidden');
    
    switch (status) {
      case 'progress':
        // 진행 상태 업데이트
        if (progressBar) {
          progressBar.style.width = `${data.progress}%`;
          progressBar.setAttribute('aria-valuenow', data.progress);
        }
        
        if (progressText) {
          progressText.textContent = `${Math.round(data.progress)}% 완료`;
        }
        
        // 결과 영역 숨김
        if (resultContainer) {
          resultContainer.classList.add('hidden');
        }
        break;
        
      case 'success':
        // 진행 상태 100%
        if (progressBar) {
          progressBar.style.width = '100%';
          progressBar.setAttribute('aria-valuenow', 100);
        }
        
        if (progressText) {
          progressText.textContent = '변환 완료';
        }
        
        // 결과 영역 표시
        if (resultContainer) {
          resultContainer.classList.remove('hidden');
          resultContainer.innerHTML = `
            <div class="bg-green-50 border border-green-200 rounded-md p-4 mb-4">
              <div class="flex">
                <div class="flex-shrink-0">
                  <svg class="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                  </svg>
                </div>
                <div class="ml-3">
                  <h3 class="text-sm font-medium text-green-800">변환 성공</h3>
                  <div class="mt-2 text-sm text-green-700">
                    <p>파일이 성공적으로 변환되었습니다.</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="border border-gray-200 rounded-md p-4">
              <h3 class="font-medium mb-2">다운로드</h3>
              <p class="text-sm text-gray-600 mb-4">${data.filename} (${this._formatFileSize(data.size)})</p>
              <a 
                id="download-btn" 
                href="${data.url}" 
                download="${data.filename}" 
                class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg class="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                </svg>
                다운로드
              </a>
            </div>
          `;
        }
        break;
        
      case 'error':
        // 진행 상태 초기화
        if (progressBar) {
          progressBar.style.width = '0%';
          progressBar.setAttribute('aria-valuenow', 0);
        }
        
        if (progressText) {
          progressText.textContent = '변환 실패';
        }
        
        // 오류 메시지 표시
        if (resultContainer) {
          resultContainer.classList.remove('hidden');
          resultContainer.innerHTML = `
            <div class="bg-red-50 border border-red-200 rounded-md p-4">
              <div class="flex">
                <div class="flex-shrink-0">
                  <svg class="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
                  </svg>
                </div>
                <div class="ml-3">
                  <h3 class="text-sm font-medium text-red-800">변환 실패</h3>
                  <div class="mt-2 text-sm text-red-700">
                    <p>${data.error || '알 수 없는 오류가 발생했습니다.'}</p>
                  </div>
                </div>
              </div>
            </div>
          `;
        }
        break;
    }
  }
};

// DOM 로드 완료 후 컨트롤러 초기화
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM 로드 완료, 변환 페이지 컨트롤러 초기화 시작');
  ConvertPageController.init();
});

// 전역 객체에 컨트롤러 추가
window.FileToQR.ConvertPageController = ConvertPageController;

export default ConvertPageController; 