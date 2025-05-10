/**
 * convert.js - FileToQR 파일 변환 페이지 컨트롤러
 * 버전: 1.0.0
 * 최종 업데이트: 2025-07-20
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
                <option value="yaml">YAML</option>
              </select>
            </div>
          </div>
        `;
        break;
    }
    
    // 변환 버튼 추가
    optionsHTML += `
      <div class="flex justify-center">
        <button id="convert-btn" class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed">
          변환 시작
        </button>
      </div>
    `;
    
    // 옵션 컨테이너 업데이트 및 표시
    optionsContainer.innerHTML = optionsHTML;
    optionsContainer.classList.remove('hidden');
    
    // 변환 버튼 이벤트 리스너 등록
    const convertBtn = document.getElementById('convert-btn');
    if (convertBtn) {
      convertBtn.addEventListener('click', () => {
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
    
    console.log('파일 업로드됨:', file.name);
    
    // 파일 정보 표시
    const fileNameDisplay = document.createElement('p');
    fileNameDisplay.className = 'mt-2 text-sm text-gray-600 text-center';
    fileNameDisplay.textContent = `선택된 파일: ${file.name} (${this._formatFileSize(file.size)})`;
    
    const uploadLabel = document.querySelector('label[for="file-upload"]');
    const existingInfo = uploadLabel.querySelector('p.mt-2');
    
    if (existingInfo) {
      existingInfo.remove();
    }
    
    uploadLabel.appendChild(fileNameDisplay);
    
    // 상태 업데이트
    this.state.uploadedFile = file;
    
    // 변환 유형을 자동으로 선택 (파일 확장자 기반)
    this._autoSelectConversionType(file);
  },

  /**
   * 파일 확장자에 기반한 변환 유형 자동 선택
   * @param {File} file - 업로드된 파일
   * @private
   */
  _autoSelectConversionType(file) {
    const extension = file.name.split('.').pop().toLowerCase();
    
    // 파일 확장자 기반 타입 매핑
    const typeMap = {
      // 이미지 형식
      'png': 'image',
      'jpg': 'image',
      'jpeg': 'image',
      'gif': 'image',
      'webp': 'image',
      'svg': 'image',
      
      // 문서 형식
      'pdf': 'document',
      'doc': 'document',
      'docx': 'document',
      'txt': 'document',
      'html': 'document',
      
      // 오디오 형식
      'mp3': 'audio',
      'wav': 'audio',
      'ogg': 'audio',
      'flac': 'audio',
      
      // 데이터 형식
      'json': 'data',
      'csv': 'data',
      'xml': 'data',
      'yaml': 'data',
      'yml': 'data'
    };
    
    const type = typeMap[extension] || null;
    
    if (type) {
      this._handleConversionTypeSelect(type);
    }
  },

  /**
   * 파일 크기 포맷팅
   * @param {number} bytes - 바이트 단위 파일 크기
   * @returns {string} 포맷된 파일 크기
   * @private
   */
  _formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + ' MB';
    else return (bytes / 1073741824).toFixed(1) + ' GB';
  },

  /**
   * 변환 시작
   * @private
   */
  _startConversion() {
    if (this.state.conversionInProgress) return;
    
    const file = this.state.uploadedFile;
    const outputFormatSelect = document.getElementById('output-format');
    
    if (!file) {
      alert('변환할 파일을 선택해주세요.');
      return;
    }
    
    if (!outputFormatSelect || !outputFormatSelect.value) {
      alert('출력 형식을 선택해주세요.');
      return;
    }
    
    const outputFormat = outputFormatSelect.value;
    
    // 추가 옵션 수집
    const options = this._collectConversionOptions();
    
    // 변환 상태 업데이트
    this.state.conversionInProgress = true;
    
    // UI 상태 업데이트
    this._updateConversionUI('progress');
    
    // 실제 변환 처리 호출
    this._processConversion(file, outputFormat, options);
  },

  /**
   * 추가 변환 옵션 수집
   * @returns {Object} 수집된 옵션
   * @private
   */
  _collectConversionOptions() {
    const options = {};
    
    // 변환 유형에 따른 옵션 수집
    switch (this.state.selectedConversionType) {
      case 'image':
        const qualitySelect = document.getElementById('image-quality');
        if (qualitySelect) {
          // 품질 값을 숫자로 변환
          const qualityMap = {
            'high': 90,
            'medium': 75,
            'low': 50
          };
          options.quality = qualityMap[qualitySelect.value] || 75;
        }
        break;
        
      case 'audio':
        const bitrateSelect = document.getElementById('audio-bitrate');
        if (bitrateSelect) {
          options.bitrate = parseInt(bitrateSelect.value) || 192;
        }
        break;
    }
    
    return options;
  },

  /**
   * 실제 파일 변환 처리
   * @param {File} file - 변환할 파일
   * @param {string} outputFormat - 출력 형식
   * @param {Object} options - 추가 옵션
   * @private
   */
  async _processConversion(file, outputFormat, options) {
    try {
      // FileConverter 모듈에서 변환 함수 호출
      const result = await FileConverter._convertImage(file, outputFormat);
      
      if (result && result.url) {
        // 변환 성공 처리
        this.state.conversionInProgress = false;
        this._updateConversionUI('success', {
          downloadUrl: result.url,
          fileName: result.fileName
        });
      } else {
        throw new Error('변환 결과가 올바르지 않습니다.');
      }
    } catch (error) {
      console.error('파일 변환 실패:', error);
      
      // 변환 실패 처리
      this.state.conversionInProgress = false;
      this._updateConversionUI('error', {
        error: error.message || '파일 변환 중 오류가 발생했습니다.'
      });
    }
  },

  /**
   * 변환 UI 상태 업데이트
   * @param {string} status - 상태 (progress, success, error)
   * @param {Object} data - 상태 관련 데이터
   * @private
   */
  _updateConversionUI(status, data = {}) {
    const outputContainer = document.getElementById('conversion-output');
    const downloadBtn = document.getElementById('download-btn');
    
    if (!outputContainer || !downloadBtn) return;
    
    // 결과 컨테이너 표시
    outputContainer.classList.remove('hidden');
    
    switch (status) {
      case 'progress':
        outputContainer.innerHTML = `
          <div class="bg-blue-50 p-6 rounded-lg border border-blue-200 flex flex-col items-center">
            <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mb-4"></div>
            <h3 class="text-lg font-medium text-blue-900 mb-2">변환 중...</h3>
            <p class="text-blue-700">파일을 변환하는 중입니다. 잠시만 기다려주세요.</p>
          </div>
        `;
        downloadBtn.disabled = true;
        break;
        
      case 'success':
        outputContainer.innerHTML = `
          <div class="bg-green-50 p-6 rounded-lg border border-green-200">
            <div class="flex items-center mb-4">
              <svg class="w-8 h-8 text-green-600 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
              </svg>
              <h3 class="text-lg font-medium text-green-900">변환 완료!</h3>
            </div>
            <p class="text-green-700 mb-4">파일이 성공적으로 변환되었습니다.</p>
            ${data.downloadUrl ? `
              <div class="mt-2">
                <a href="${data.downloadUrl}" download="${data.fileName}" 
                   class="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md">
                  <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd"></path>
                  </svg>
                  다운로드
                </a>
              </div>
            ` : ''}
          </div>
        `;
        
        if (data.downloadUrl) {
          downloadBtn.disabled = false;
          downloadBtn.href = data.downloadUrl;
          downloadBtn.download = data.fileName;
        } else {
          downloadBtn.disabled = true;
        }
        break;
        
      case 'error':
        outputContainer.innerHTML = `
          <div class="bg-red-50 p-6 rounded-lg border border-red-200">
            <div class="flex items-center mb-4">
              <svg class="w-8 h-8 text-red-600 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
              </svg>
              <h3 class="text-lg font-medium text-red-900">변환 실패</h3>
            </div>
            <p class="text-red-700">${data.error || '파일 변환 중 오류가 발생했습니다.'}</p>
            <p class="mt-2 text-red-600">다른 파일이나 다른 형식으로 다시 시도해보세요.</p>
          </div>
        `;
        downloadBtn.disabled = true;
        break;
    }
  }
};

// 페이지 로드 시 자동 초기화
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM 로드 완료, 변환 페이지 컨트롤러 초기화');
  ConvertPageController.init();
});

// 전역 객체에 컨트롤러 할당
window.FileToQR.ConvertPageController = ConvertPageController; 