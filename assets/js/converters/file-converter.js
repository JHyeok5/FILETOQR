/**
 * file-converter.js - FileToQR 파일 변환 모듈
 * 버전: 1.0.0
 * 최종 업데이트: 2025-06-15
 * 
 * 이 모듈은 다양한 파일 형식 변환 기능을 제공합니다:
 * - 이미지 형식 변환 (PNG, JPG, WebP, GIF)
 * - 문서 형식 변환 (PDF, TXT)
 * - 데이터 형식 변환 (JSON, CSV, YAML, XML)
 */

// 헬퍼 모듈 임포트를 위한 준비
const importHelpers = async () => {
  try {
    // 필요한 라이브러리 동적 로드
    let imageConv = null;
    let docConv = null;
    let dataConv = null;
    
    // 각 모듈 개별적으로 로드 시도 (오류가 발생해도 계속 진행)
    try {
      console.log('이미지 변환기 모듈 로드 시도...');
      imageConv = await import('./image-converter.js').catch(error => {
        console.warn('이미지 변환기 모듈을 로드할 수 없습니다:', error.message);
        return { default: createFallbackConverter('image') };
      });
      imageConv = imageConv?.default || createFallbackConverter('image');
    } catch (error) {
      console.warn('이미지 변환기 모듈 로드 실패:', error);
      imageConv = createFallbackConverter('image');
    }
    
    try {
      console.log('문서 변환기 모듈 로드 시도...');
      docConv = await import('./document-converter.js').catch(error => {
        console.warn('문서 변환기 모듈을 로드할 수 없습니다:', error.message);
        return { default: createFallbackConverter('document') };
      });
      docConv = docConv?.default || createFallbackConverter('document');
    } catch (error) {
      console.warn('문서 변환기 모듈 로드 실패:', error);
      docConv = createFallbackConverter('document');
    }
    
    try {
      console.log('데이터 변환기 모듈 로드 시도...');
      dataConv = await import('./data-converter.js').catch(error => {
        console.warn('데이터 변환기 모듈을 로드할 수 없습니다:', error.message);
        return { default: createFallbackConverter('data') };
      });
      dataConv = dataConv?.default || createFallbackConverter('data');
    } catch (error) {
      console.warn('데이터 변환기 모듈 로드 실패:', error);
      dataConv = createFallbackConverter('data');
    }
    
    return {
      imageConverter: imageConv,
      documentConverter: docConv,
      dataConverter: dataConv
    };
  } catch (error) {
    console.error('변환 헬퍼 모듈 로드 실패:', error);
    
    // 모든 모듈 로드 실패 시 기본 대체 변환기 제공
    return {
      imageConverter: createFallbackConverter('image'),
      documentConverter: createFallbackConverter('document'),
      dataConverter: createFallbackConverter('data')
    };
  }
};

// 대체 변환기 생성 함수
const createFallbackConverter = (type) => {
  console.log(`${type} 변환기에 대한 대체 모듈 생성 중...`);
  
  return {
    name: `${type}-fallback-converter`,
    version: '1.0.0',
    supportedFormats: {
      'image': { 'png': ['jpg', 'webp'], 'jpg': ['png', 'webp'], 'webp': ['png', 'jpg'] },
      'document': { 'pdf': ['txt'], 'txt': ['pdf'] },
      'data': { 'json': ['csv', 'xml'], 'csv': ['json', 'xml'], 'xml': ['json', 'csv'] }
    }[type] || {},
    
    convert: async (file, format) => {
      console.warn(`${type} 파일 변환 실패: 실제 변환기 모듈이 로드되지 않았습니다.`);
      
      // 변환 실패 오류 반환
      return {
        success: false,
        error: `변환 실패: ${type} 변환기 모듈을 로드할 수 없습니다. 추후 다시 시도해주세요.`,
        file: null
      };
    },
    
    // 형식 변환 지원 여부 확인
    canConvert: (sourceFormat, targetFormat) => {
      const formats = {
        'image': { 'png': ['jpg', 'webp'], 'jpg': ['png', 'webp'], 'webp': ['png', 'jpg'] },
        'document': { 'pdf': ['txt'], 'txt': ['pdf'] },
        'data': { 'json': ['csv', 'xml'], 'csv': ['json', 'xml'], 'xml': ['json', 'csv'] }
      }[type] || {};
      
      return formats[sourceFormat]?.includes(targetFormat) || false;
    }
  };
};

// 파일 유형별 처리기 정의
const FileConverter = {
  // 컨버터 내부 상태
  state: {
    initialized: false,
    supportedFormats: null,
    activeConversion: null,
    helpers: null
  },
  
  /**
   * 지원되는 파일 형식 초기화
   * @private
   */
  async _initSupportedFormats() {
    this.state.supportedFormats = {
      image: {
        // 입력 포맷: 출력 포맷 배열
        png: ['jpg', 'webp', 'gif'],
        jpg: ['png', 'webp', 'gif'],
        jpeg: ['png', 'webp', 'gif'],
        webp: ['png', 'jpg', 'gif'],
        gif: ['png', 'jpg', 'webp']
      },
      document: {
        pdf: ['txt'],
        txt: ['pdf']
      },
      data: {
        json: ['csv', 'yaml', 'xml'],
        csv: ['json', 'yaml', 'xml'],
        yaml: ['json', 'csv', 'xml'],
        xml: ['json', 'csv', 'yaml']
      }
    };
  },
  
  /**
   * 모듈 초기화
   * @returns {Promise<boolean>} 초기화 성공 여부
   */
  async init() {
    if (this.state.initialized) {
      return true;
    }
    
    try {
      console.log('파일 변환기 초기화 중...');
      
      // 지원 포맷 초기화
      await this._initSupportedFormats();
      
      // 헬퍼 모듈 로드
      this.state.helpers = await importHelpers();
      
      // UI 요소 초기화
      this._initUI();
      
      // 이벤트 리스너 등록
      this._registerEventListeners();
      
      this.state.initialized = true;
      console.log('파일 변환기 초기화 완료');
      return true;
    } catch (error) {
      console.error('파일 변환기 초기화 실패:', error);
      return false;
    }
  },
  
  /**
   * 파일 변환 시작 (공개 메서드)
   * UI에서 선택된 파일과 포맷으로 변환 작업 시작
   */
  convertFile() {
    console.log('FileConverter.convertFile 호출됨');
    this._handleFileConversion();
  },
  
  /**
   * 지원 포맷 확인 (공개 메서드)
   * @param {string} fileExtension - 확인할 파일 확장자
   * @returns {Array|null} 지원되는 출력 포맷 배열 또는 null
   */
  getSupportedFormats(fileExtension) {
    if (!this.state.supportedFormats) return null;
    
    const ext = fileExtension.toLowerCase().replace('.', '');
    
    // 각 카테고리별 확인
    for (const category of ['image', 'document', 'data']) {
      if (this.state.supportedFormats[category][ext]) {
        return this.state.supportedFormats[category][ext];
      }
    }
    
    return null;
  },
  
  /**
   * UI 요소 초기화
   * @private
   */
  _initUI() {
    // UI 요소가 로드되기를 기다림
    const checkElements = () => {
      const uploadForm = document.getElementById('file-upload-form');
      const formatSelector = document.getElementById('output-format');
      const resultContainer = document.getElementById('conversion-result');
      
      if (!uploadForm || !formatSelector || !resultContainer) {
        // DOM 요소가 아직 없으면 100ms 후 다시 시도
        setTimeout(checkElements, 100);
        return;
      }
      
      // UI 초기 상태 설정
      this._populateFormatSelector();
      this._updateConversionUI(null);
    };
    
    checkElements();
  },
  
  /**
   * 출력 형식 선택기 채우기
   * @private
   */
  _populateFormatSelector() {
    const formatSelector = document.getElementById('output-format');
    if (!formatSelector) return;
    
    // 선택기 초기화
    formatSelector.innerHTML = '<option value="">출력 형식 선택</option>';
    
    // 기본 형식 추가 (아직 파일이 선택되지 않음)
    const defaultFormats = ['png', 'jpg', 'webp', 'pdf', 'json', 'csv'];
    
    defaultFormats.forEach(format => {
    const option = document.createElement('option');
    option.value = format;
    option.textContent = format.toUpperCase();
      formatSelector.appendChild(option);
    });
    
    // 처음에는 비활성화
    formatSelector.disabled = true;
  },
  
  /**
   * 파일 유형에 따른 출력 형식 업데이트
   * @param {File} file - 선택된 파일
   * @private
   */
  _updateOutputFormats(file) {
    const formatSelector = document.getElementById('output-format');
    if (!formatSelector) return;
    
    // 선택기 초기화
    formatSelector.innerHTML = '<option value="">출력 형식 선택</option>';
    
    if (!file) {
      formatSelector.disabled = true;
      return;
    }
    
    // 파일 확장자 가져오기
    const extension = file.name.split('.').pop().toLowerCase();
    
    // 지원되는 출력 형식 찾기
    let outputFormats = [];
    
    // 이미지 형식 확인
    if (this.state.supportedFormats.image[extension]) {
      outputFormats = this.state.supportedFormats.image[extension];
    }
    // 문서 형식 확인
    else if (this.state.supportedFormats.document[extension]) {
      outputFormats = this.state.supportedFormats.document[extension];
    }
    // 데이터 형식 확인
    else if (this.state.supportedFormats.data[extension]) {
      outputFormats = this.state.supportedFormats.data[extension];
    }
    
    // 출력 형식이 있으면 선택기 활성화
    if (outputFormats.length > 0) {
      outputFormats.forEach(format => {
        const option = document.createElement('option');
        option.value = format;
        option.textContent = format.toUpperCase();
        formatSelector.appendChild(option);
      });
      
      formatSelector.disabled = false;
    } else {
      // 지원되지 않는 형식이면 메시지 표시
      const option = document.createElement('option');
      option.value = "";
      option.textContent = "지원되지 않는 파일 형식";
      formatSelector.appendChild(option);
      formatSelector.disabled = true;
    }
  },
  
  /**
   * 이벤트 리스너 등록
   * @private
   */
  _registerEventListeners() {
    document.addEventListener('DOMContentLoaded', () => {
      // 파일 업로드 폼
      const uploadForm = document.getElementById('file-upload-form');
      if (uploadForm) {
        uploadForm.addEventListener('submit', (e) => {
          e.preventDefault();
          this._handleFileConversion();
        });
      }
      
      // 파일 입력 변경
      const fileInput = document.getElementById('file-input');
      if (fileInput) {
        fileInput.addEventListener('change', (e) => {
          const file = e.target.files[0];
          if (file) {
            this._updateOutputFormats(file);
            this._showFileInfo(file);
          }
        });
      }
      
      // 드래그 앤 드롭 영역
      const dropZone = document.getElementById('drop-zone');
      if (dropZone) {
        dropZone.addEventListener('dragover', (e) => {
          e.preventDefault();
          dropZone.classList.add('drag-over');
        });
        
        dropZone.addEventListener('dragleave', () => {
          dropZone.classList.remove('drag-over');
        });
        
        dropZone.addEventListener('drop', (e) => {
          e.preventDefault();
          dropZone.classList.remove('drag-over');
          
          const file = e.dataTransfer.files[0];
          if (file) {
            // 파일 입력에 파일 설정
            const fileInput = document.getElementById('file-input');
            if (fileInput) {
              // DataTransfer 객체를 사용하여 FileList에 파일 추가
              const dataTransfer = new DataTransfer();
              dataTransfer.items.add(file);
              fileInput.files = dataTransfer.files;
              
              this._updateOutputFormats(file);
              this._showFileInfo(file);
            }
          }
        });
      }
    });
  },
  
  /**
   * 파일 정보 표시
   * @param {File} file - 선택된 파일
   * @private
   */
  _showFileInfo(file) {
    const fileInfo = document.getElementById('file-info');
    if (!fileInfo) return;
    
    // 파일 크기 포맷팅
    const formatFileSize = (bytes) => {
      if (bytes < 1024) return bytes + ' B';
      else if (bytes < 1048576) return (bytes / 1024).toFixed(2) + ' KB';
      else return (bytes / 1048576).toFixed(2) + ' MB';
    };
    
    // 파일 타입 가져오기
    const fileType = file.type || '알 수 없는 형식';
    
    // 정보 표시
    fileInfo.innerHTML = `
      <div class="mt-4 p-4 bg-gray-100 rounded-lg">
        <h3 class="font-medium">파일 정보</h3>
        <p>이름: ${file.name}</p>
        <p>크기: ${formatFileSize(file.size)}</p>
        <p>형식: ${fileType}</p>
      </div>
    `;
  },
  
  /**
   * 변환 처리 UI 업데이트
   * @param {Object} state - 변환 상태
   * @private
   */
  _updateConversionUI(state) {
    const resultContainer = document.getElementById('conversion-result');
    if (!resultContainer) return;
    
    if (!state) {
      // 초기 상태 - 결과 컨테이너 숨김
      resultContainer.style.display = 'none';
      return;
    }
    
    // 결과 컨테이너 표시
    resultContainer.style.display = 'block';
    
    switch(state.status) {
      case 'processing':
        resultContainer.innerHTML = `
          <div class="my-4 p-4 bg-blue-100 rounded-lg text-center">
            <div class="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600 mr-2"></div>
            <span class="text-blue-800 font-medium">파일 변환 중...</span>
          </div>
        `;
      break;
      
      case 'success':
        resultContainer.innerHTML = `
          <div class="my-4 p-4 bg-green-100 rounded-lg">
            <h3 class="text-green-800 font-medium mb-2">변환 완료!</h3>
            <p>파일이 성공적으로 변환되었습니다.</p>
            <div class="mt-4">
              <a href="${state.downloadUrl}" download="${state.fileName}" 
                class="inline-block px-4 py-2 bg-green-600 text-white font-medium rounded hover:bg-green-700">
                변환된 파일 다운로드
              </a>
        </div>
        </div>
      `;
      break;
      
      case 'error':
        resultContainer.innerHTML = `
          <div class="my-4 p-4 bg-red-100 rounded-lg">
            <h3 class="text-red-800 font-medium mb-2">변환 실패</h3>
            <p>${state.error || '파일 변환 중 오류가 발생했습니다.'}</p>
          </div>
        `;
      break;
  }
  },
  
  /**
   * 파일 변환 처리
   * @private
   */
  async _handleFileConversion() {
    const fileInput = document.getElementById('file-input');
    const formatSelector = document.getElementById('output-format');
    
    if (!fileInput || !formatSelector) return;
    
    const file = fileInput.files[0];
    const outputFormat = formatSelector.value;
    
    if (!file) {
      alert('변환할 파일을 선택해주세요.');
    return;
  }
  
    if (!outputFormat) {
      alert('출력 형식을 선택해주세요.');
      return;
    }
    
    // 변환 상태 업데이트
    this.state.activeConversion = {
      file,
      outputFormat,
      status: 'processing'
    };
    
    this._updateConversionUI(this.state.activeConversion);
    
    try {
      // 파일 확장자 가져오기
      const extension = file.name.split('.').pop().toLowerCase();
      
      // 파일 유형 결정
      let fileType = null;
      let converterModule = null;
      
      if (this.state.supportedFormats.image[extension]) {
        fileType = 'image';
        converterModule = this.state.helpers?.imageConverter;
      } else if (this.state.supportedFormats.document[extension]) {
        fileType = 'document';
        converterModule = this.state.helpers?.documentConverter;
      } else if (this.state.supportedFormats.data[extension]) {
        fileType = 'data';
        converterModule = this.state.helpers?.dataConverter;
      }
      
      // 해당 유형의 변환기 모듈 없으면 내장 변환기 사용
      if (!converterModule) {
        console.log(`${fileType} 변환기 모듈 없음, 내장 변환기 사용`);
        
        // 내장 변환 기능 구현 - 이 예제에서는 이미지만 구현
        if (fileType === 'image') {
          const result = await this._convertImage(file, outputFormat);
          
          this.state.activeConversion.status = 'success';
          this.state.activeConversion.downloadUrl = result.url;
          this.state.activeConversion.fileName = result.fileName;
        } else {
          throw new Error('이 파일 유형에 대한 내장 변환기가 구현되지 않았습니다.');
        }
      } else {
        // 외부 변환기 모듈 사용
        const result = await converterModule.convert(file, outputFormat);
        
        this.state.activeConversion.status = 'success';
        this.state.activeConversion.downloadUrl = result.url;
        this.state.activeConversion.fileName = result.fileName;
      }
    } catch (error) {
      console.error('파일 변환 중 오류 발생:', error);
      
      this.state.activeConversion.status = 'error';
      this.state.activeConversion.error = error.message;
    }
    
    // UI 업데이트
    this._updateConversionUI(this.state.activeConversion);
  },
  
  /**
   * 이미지 변환 (내장 변환기)
   * @param {File} file - 이미지 파일
   * @param {string} outputFormat - 출력 형식
   * @returns {Promise<Object>} 변환 결과
   * @private
   */
  async _convertImage(file, outputFormat) {
    return new Promise((resolve, reject) => {
      try {
        // 캔버스를 사용하여 이미지 변환
        const img = new Image();
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        img.onload = () => {
          // 캔버스 크기 설정
          canvas.width = img.width;
          canvas.height = img.height;
          
          // 캔버스에 이미지 그리기
          ctx.drawImage(img, 0, 0);
          
          // MIME 타입 설정
          let mimeType = 'image/png';
          switch(outputFormat) {
            case 'jpg':
            case 'jpeg':
              mimeType = 'image/jpeg';
              break;
            case 'webp':
              mimeType = 'image/webp';
              break;
            case 'gif':
              mimeType = 'image/gif';
              break;
          }
          
          // 캔버스에서 이미지 데이터 URL 생성
          const dataUrl = canvas.toDataURL(mimeType, 0.92);
          
          // 원본 파일명에서 확장자만 변경
          const fileName = file.name.replace(/\.[^/.]+$/, `.${outputFormat}`);
          
          resolve({
            url: dataUrl,
            fileName,
            mimeType
          });
        };
        
        img.onerror = () => {
          reject(new Error('이미지를 로드하는 중 오류가 발생했습니다.'));
        };
        
        // 파일 읽기 및 이미지 로드
        const reader = new FileReader();
        
        reader.onload = (e) => {
          img.src = e.target.result;
        };
        
        reader.onerror = () => {
          reject(new Error('파일을 읽는 중 오류가 발생했습니다.'));
        };
        
        reader.readAsDataURL(file);
      } catch (error) {
        reject(error);
      }
    });
  }
};

// 글로벌 네임스페이스에 등록
if (typeof window !== 'undefined') {
  window.FileToQR = window.FileToQR || {};
  window.FileToQR.FileConverter = FileConverter;
  
  // 브라우저 환경에서 직접 로드된 경우에 대한 처리
  if (typeof document !== 'undefined' && document.readyState !== 'loading') {
    console.log('FileConverter 모듈이 직접 로드되었습니다. 자동 초기화를 시도합니다.');
    setTimeout(() => {
      // 이미 DOM이 로드되었다면 초기화 시도
      if (!FileConverter.state.initialized) {
        FileConverter.init().then(success => {
          console.log('FileConverter 자동 초기화 결과:', success ? '성공' : '실패');
        });
      }
    }, 100);
  } else if (typeof document !== 'undefined') {
    // DOM이 아직 로드되지 않았다면 이벤트 리스너 등록
    document.addEventListener('DOMContentLoaded', () => {
      console.log('DOM 로드 완료 후 FileConverter 자동 초기화 시도');
      if (!FileConverter.state.initialized) {
        FileConverter.init().then(success => {
          console.log('FileConverter 자동 초기화 결과:', success ? '성공' : '실패');
        });
      }
    });
  }
}

export default FileConverter; 