/**
 * file-converter.js - FileToQR 파일 변환 모듈
 * 버전: 1.0.0
 * 최종 업데이트: 2025-04-28
 * 참조: ../.ai-guides/architecture/module-registry.md
 * 
 * 이 모듈은 파일 변환 기능의 프론트엔드 인터페이스를 처리합니다:
 * - 파일 업로드 및 드래그앤드롭 처리
 * - 변환 옵션 UI 관리
 * - 변환 프로세스 진행 및 결과 표시
 * - 파일 다운로드 기능
 */

// 공통 유틸리티 모듈 임포트
import FileUtils from '../utils/file-utils.js';
// 핵심 변환 모듈 임포트
import ConverterCore from '../core/converter-core.js';

// 전역 상태 변수
let currentFile = null;
let selectedOutputFormat = '';
let convertedFile = null;
let progressTracker = null;

// 파일 변환기 모듈 API 정의
const fileConverter = {
  init: initFileConverter,
  handleFile,
  handleConvertClick,
  resetConverter,
  getSupportedFormats,
  convertToQR: handleConvertToQRClick,
  
  // 파일 유틸리티 함수 (하위 호환성)
  getFileExtension: (filename) => FileUtils.getFileExtension(filename),
  formatFileSize: (bytes, decimals = 2) => FileUtils.formatFileSize(bytes, decimals),
  fileToDataUri: (file) => FileUtils.fileToDataUri(file)
};

/**
 * 파일 변환기 초기화
 */
function initFileConverter() {
  console.log('파일 변환기 초기화 중...');
  
  // UI 요소 참조
  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('file-input');
  const selectFileBtn = document.getElementById('select-file-btn');
  const convertBtn = document.getElementById('convert-btn');
  const outputFormatSelect = document.getElementById('output-format');
  const downloadBtn = document.getElementById('download-btn');
  const convertAnotherBtn = document.getElementById('convert-another-btn');
  const convertToQrBtn = document.getElementById('convert-to-qr-btn');
  
  // 진행 상태 추적기 초기화 - 오류 방지
  try {
    if (typeof ProgressTracker !== 'undefined') {
      progressTracker = new ProgressTracker();
    } else {
      console.warn('ProgressTracker 클래스를 찾을 수 없습니다.');
      progressTracker = { 
        start: () => {}, 
        updateProgress: () => {},
        complete: () => {} 
      };
    }
  } catch (e) {
    console.warn('ProgressTracker를 초기화할 수 없습니다:', e);
    progressTracker = { 
      start: () => {}, 
      updateProgress: () => {},
      complete: () => {} 
    };
  }
  
  // 이벤트 리스너 등록
  if (dropzone) {
    // 드래그 앤 드롭 이벤트 - 개선된 방식
    ['dragover', 'dragenter'].forEach(eventName => {
      dropzone.addEventListener(eventName, function(event) {
        event.preventDefault();
        event.stopPropagation();
        this.classList.add('dragover');
      });
    });
    
    ['dragleave', 'dragend', 'drop'].forEach(eventName => {
      dropzone.addEventListener(eventName, function(event) {
        event.preventDefault();
        event.stopPropagation();
        this.classList.remove('dragover');
      });
    });
    
    dropzone.addEventListener('drop', handleFileDrop);
    dropzone.addEventListener('click', function() {
      if (fileInput) fileInput.click();
    });
  }
  
  if (fileInput) {
    fileInput.addEventListener('change', handleFileSelect);
  }
  
  if (selectFileBtn) {
    selectFileBtn.addEventListener('click', function() {
      if (fileInput) fileInput.click();
    });
  }
  
  if (convertBtn) {
    convertBtn.addEventListener('click', handleConvertClick);
  }
  
  if (outputFormatSelect) {
    outputFormatSelect.addEventListener('change', handleFormatSelect);
  }
  
  if (downloadBtn) {
    downloadBtn.addEventListener('click', handleDownloadClick);
  }
  
  if (convertToQrBtn) {
    convertToQrBtn.addEventListener('click', handleConvertToQRClick);
  }
  
  if (convertAnotherBtn) {
    convertAnotherBtn.addEventListener('click', resetConverter);
  }
  
  // 도움말 툴팁 추가
  addHelpTooltips();
  
  // 사용자 경험 이벤트 추적 - 오류 방지
  try {
    if (typeof analytics !== 'undefined') {
      analytics.trackPageView();
      analytics.trackAction('page', 'load', 'file_converter');
    }
  } catch (e) {
    console.warn('Analytics를 초기화할 수 없습니다:', e);
  }
}

/**
 * 드래그 오버 이벤트 핸들러
 * @param {Event} event - 드래그 이벤트 객체
 */
function handleDragOver(event) {
  event.preventDefault();
  event.stopPropagation();
  
  const dropzone = document.getElementById('dropzone');
  if (dropzone) {
    dropzone.classList.add('dragover');
  }
  
  // 사용자 행동 추적 - 오류 방지
  try {
    if (typeof analytics !== 'undefined') {
      analytics.trackAction('upload', 'drag_over');
    }
  } catch (e) {
    console.warn('Analytics를 호출할 수 없습니다:', e);
  }
}

/**
 * 드래그 리브 이벤트 핸들러
 * @param {Event} event - 드래그 이벤트 객체
 */
function handleDragLeave(event) {
  event.preventDefault();
  event.stopPropagation();
  
  const dropzone = document.getElementById('dropzone');
  if (dropzone) {
    dropzone.classList.remove('dragover');
  }
}

/**
 * 파일 드롭 이벤트 핸들러
 * @param {Event} event - 드롭 이벤트 객체
 */
function handleFileDrop(event) {
  event.preventDefault();
  event.stopPropagation();
  
  const dropzone = document.getElementById('dropzone');
  if (dropzone) {
    dropzone.classList.remove('dragover');
  }
  
  const dt = event.dataTransfer;
  if (dt && dt.files && dt.files.length > 0) {
    handleFile(dt.files[0]);
    
    // 사용자 행동 추적 - 오류 방지
    try {
      if (typeof analytics !== 'undefined') {
        analytics.trackAction('upload', 'drop_file', dt.files[0].type, {
          fileSize: dt.files[0].size,
          fileName: dt.files[0].name
        });
      }
    } catch (e) {
      console.warn('Analytics를 호출할 수 없습니다:', e);
    }
  }
}

/**
 * 파일 선택 이벤트 핸들러
 * @param {Event} event - 파일 선택 이벤트 객체
 */
function handleFileSelect(event) {
  if (event.target.files && event.target.files.length > 0) {
    handleFile(event.target.files[0]);
    
    // 사용자 행동 추적
    try {
      if (typeof analytics !== 'undefined') {
        analytics.trackAction('upload', 'select_file', event.target.files[0].type, {
          fileSize: event.target.files[0].size,
          fileName: event.target.files[0].name
        });
      }
    } catch (e) {
      console.warn('Analytics를 호출할 수 없습니다:', e);
    }
  }
}

/**
 * 파일 처리 함수
 * @param {File} file - 사용자가 선택한 파일
 */
function handleFile(file) {
  currentFile = file;
  
  // UI 상태 업데이트
  const fileNameElement = document.getElementById('selected-file-name');
  const fileSizeElement = document.getElementById('selected-file-size');
  const fileTypeElement = document.getElementById('selected-file-type');
  
  if (fileNameElement) fileNameElement.textContent = file.name;
  if (fileSizeElement) fileSizeElement.textContent = FileUtils.formatFileSize(file.size);
  if (fileTypeElement) fileTypeElement.textContent = file.type || '알 수 없음';
  
  // 파일 선택 섹션 숨기고 변환 옵션 섹션 보이기
  document.getElementById('file-select-section')?.classList.add('hidden');
  document.getElementById('conversion-options-section')?.classList.remove('hidden');
  
  // 입력 형식에 따른 출력 형식 옵션 로드
  const inputFormat = FileUtils.getFileExtension(file.name);
  loadSupportedOutputFormats(inputFormat);
}

/**
 * 지원되는 출력 형식 로드
 * @param {string} inputFormat - 입력 파일 형식
 */
function loadSupportedOutputFormats(inputFormat) {
  const outputFormatSelect = document.getElementById('output-format');
  if (!outputFormatSelect) return;
  
  // 기존 옵션 제거
  outputFormatSelect.innerHTML = '';
  
  // 지원되는 형식 가져오기
  const formats = getSupportedFormats(inputFormat);
  
  // 옵션 추가
  formats.forEach(format => {
    const option = document.createElement('option');
    option.value = format;
    option.textContent = format.toUpperCase();
    outputFormatSelect.appendChild(option);
  });
  
  // 첫 번째 옵션 선택
  if (formats.length > 0) {
    outputFormatSelect.value = formats[0];
    selectedOutputFormat = formats[0];
    
    // 선택된 형식에 따른 추가 옵션 업데이트
    updateFormatOptions(formats[0]);
  }
}

/**
 * 입력 형식에 따른 지원 출력 형식 가져오기
 * @param {string} inputFormat - 입력 파일 형식
 * @returns {string[]} 지원되는 출력 형식 배열
 */
function getSupportedFormats(inputFormat) {
  // 입력 형식에 따른 출력 형식 매핑
  const formatMap = {
    // 이미지 형식
    'jpg': ['png', 'webp', 'gif', 'bmp', 'tiff'],
    'jpeg': ['png', 'webp', 'gif', 'bmp', 'tiff'],
    'png': ['jpg', 'webp', 'gif', 'bmp', 'tiff'],
    'webp': ['jpg', 'png', 'gif', 'bmp'],
    'gif': ['jpg', 'png', 'webp'],
    'bmp': ['jpg', 'png', 'webp'],
    'tiff': ['jpg', 'png', 'webp'],
    
    // 문서 형식
    'pdf': ['jpg', 'png', 'txt'],
    'doc': ['pdf', 'txt'],
    'docx': ['pdf', 'txt'],
    'txt': ['pdf', 'docx'],
    
    // 기타 형식
    'svg': ['png', 'jpg'],
    'mp3': ['wav', 'ogg', 'flac'],
    'wav': ['mp3', 'ogg'],
    'mp4': ['gif', 'webm']
  };
  
  return formatMap[inputFormat.toLowerCase()] || [];
}

/**
 * 형식 선택 이벤트 핸들러
 * @param {Event} event - 선택 이벤트 객체
 */
function handleFormatSelect(event) {
  selectedOutputFormat = event.target.value;
  
  // 선택된 형식에 따른 추가 옵션 업데이트
  updateFormatOptions(selectedOutputFormat);
  
  // 사용자 행동 추적
  try {
    if (typeof analytics !== 'undefined') {
      analytics.trackAction('convert', 'select_format', selectedOutputFormat);
    }
  } catch (e) {
    console.warn('Analytics를 호출할 수 없습니다:', e);
  }
}

/**
 * 선택된 출력 형식에 따른 추가 옵션 업데이트
 * @param {string} format - 선택된 출력 형식
 */
function updateFormatOptions(format) {
  const additionalOptionsContainer = document.getElementById('format-specific-options');
  if (!additionalOptionsContainer) return;
  
  // 기존 내용 제거
  additionalOptionsContainer.innerHTML = '';
  
  // 형식별 옵션
  switch (format.toLowerCase()) {
    case 'jpg':
    case 'jpeg':
      additionalOptionsContainer.innerHTML = `
        <div class="option-group">
          <label for="quality">품질 (1-100):</label>
          <input type="range" id="quality" name="quality" min="1" max="100" value="90" />
          <span id="quality-value">90</span>
        </div>
      `;
      
      // 품질 표시 업데이트
      const qualitySlider = document.getElementById('quality');
      const qualityValue = document.getElementById('quality-value');
      
      if (qualitySlider && qualityValue) {
        qualitySlider.addEventListener('input', function() {
          qualityValue.textContent = this.value;
        });
      }
      break;
      
    case 'png':
      additionalOptionsContainer.innerHTML = `
        <div class="option-group">
          <label for="compression">압축 수준 (0-9):</label>
          <input type="range" id="compression" name="compression" min="0" max="9" value="6" />
          <span id="compression-value">6</span>
        </div>
      `;
      
      // 압축 수준 표시 업데이트
      const compressionSlider = document.getElementById('compression');
      const compressionValue = document.getElementById('compression-value');
      
      if (compressionSlider && compressionValue) {
        compressionSlider.addEventListener('input', function() {
          compressionValue.textContent = this.value;
        });
      }
      break;
      
    case 'webp':
      additionalOptionsContainer.innerHTML = `
        <div class="option-group">
          <label for="quality">품질 (1-100):</label>
          <input type="range" id="quality" name="quality" min="1" max="100" value="80" />
          <span id="quality-value">80</span>
        </div>
        <div class="option-group">
          <label for="lossless">무손실:</label>
          <input type="checkbox" id="lossless" name="lossless" />
        </div>
      `;
      
      // 품질 표시 업데이트
      const webpQualitySlider = document.getElementById('quality');
      const webpQualityValue = document.getElementById('quality-value');
      
      if (webpQualitySlider && webpQualityValue) {
        webpQualitySlider.addEventListener('input', function() {
          webpQualityValue.textContent = this.value;
        });
      }
      break;
      
    case 'gif':
      additionalOptionsContainer.innerHTML = `
        <div class="option-group">
          <label for="optimize">색상 최적화:</label>
          <input type="checkbox" id="optimize" name="optimize" checked />
        </div>
        <div class="option-group">
          <label for="colors">색상 수 (2-256):</label>
          <input type="number" id="colors" name="colors" min="2" max="256" value="256" />
        </div>
      `;
      break;
      
    // ... 다른 형식별 옵션
      
    default:
      // 특별한 옵션 없음
      break;
  }
}

/**
 * 변환 버튼 클릭 이벤트 핸들러
 */
function handleConvertClick() {
  if (!currentFile || !selectedOutputFormat) {
    alert('파일과 출력 형식을 선택해주세요.');
    return;
  }
  
  // 변환 옵션 섹션 숨기고 진행 상황 섹션 표시
  document.getElementById('conversion-options-section')?.classList.add('hidden');
  document.getElementById('conversion-progress-section')?.classList.remove('hidden');
  
  // 진행 상황 표시
  showConversionProgress();
  
  // 변환 옵션 수집
  const options = collectOptions();
  
  // 사용자 행동 추적
  try {
    if (typeof analytics !== 'undefined') {
      analytics.trackAction('convert', 'start_conversion', `${FileUtils.getFileExtension(currentFile.name)}_to_${selectedOutputFormat}`);
    }
  } catch (e) {
    console.warn('Analytics를 호출할 수 없습니다:', e);
  }
  
  // 파일 변환 요청
  ConverterCore.convertFile(currentFile, selectedOutputFormat, options)
    .then(result => {
      convertedFile = result;
      showConversionResult(result);
      
      // 사용자 행동 추적
      try {
        if (typeof analytics !== 'undefined') {
          analytics.trackAction('convert', 'conversion_success', selectedOutputFormat);
        }
      } catch (e) {
        console.warn('Analytics를 호출할 수 없습니다:', e);
      }
    })
    .catch(error => {
      console.error('파일 변환 중 오류 발생:', error);
      
      // 오류 메시지 표시
      document.getElementById('conversion-progress-section')?.classList.add('hidden');
      document.getElementById('conversion-error-section')?.classList.remove('hidden');
      
      const errorMessage = document.getElementById('error-message');
      if (errorMessage) {
        errorMessage.textContent = error.message || '파일 변환 중 오류가 발생했습니다.';
      }
      
      // 사용자 행동 추적
      try {
        if (typeof analytics !== 'undefined') {
          analytics.trackAction('convert', 'conversion_error', error.message);
        }
      } catch (e) {
        console.warn('Analytics를 호출할 수 없습니다:', e);
      }
    });
}

/**
 * 변환 옵션 수집
 * @returns {Object} 수집된 변환 옵션
 */
function collectOptions() {
  const options = {
    format: selectedOutputFormat,
    outputFileName: currentFile.name.split('.')[0] + '.' + selectedOutputFormat
  };
  
  // 형식별 특정 옵션 수집
  switch (selectedOutputFormat.toLowerCase()) {
    case 'jpg':
    case 'jpeg':
      const jpegQuality = document.getElementById('quality');
      if (jpegQuality) {
        options.quality = parseInt(jpegQuality.value, 10);
      }
      break;
      
    case 'png':
      const pngCompression = document.getElementById('compression');
      if (pngCompression) {
        options.compressionLevel = parseInt(pngCompression.value, 10);
      }
      break;
      
    case 'webp':
      const webpQuality = document.getElementById('quality');
      const lossless = document.getElementById('lossless');
      
      if (webpQuality) {
        options.quality = parseInt(webpQuality.value, 10);
      }
      
      if (lossless) {
        options.lossless = lossless.checked;
      }
      break;
      
    case 'gif':
      const optimize = document.getElementById('optimize');
      const colors = document.getElementById('colors');
      
      if (optimize) {
        options.optimize = optimize.checked;
      }
      
      if (colors) {
        options.colors = parseInt(colors.value, 10);
      }
      break;
      
    // ... 다른 형식별 옵션
  }
  
  return options;
}

/**
 * 변환 진행 상황 업데이트
 * @param {Object} progressInfo - 진행 상황 정보
 */
function updateProgress(progressInfo) {
  const progressBar = document.getElementById('progress-bar');
  const progressText = document.getElementById('progress-text');
  
  if (progressBar) {
    progressBar.value = progressInfo.percent;
  }
  
  if (progressText) {
    progressText.textContent = `${progressInfo.percent}% - ${progressInfo.status || '처리 중...'}`;
  }
}

/**
 * 변환 진행 상황 표시
 */
function showConversionProgress() {
  if (progressTracker) {
    progressTracker.start({
      onProgress: updateProgress,
      onComplete: () => {}
    });
  }
}

/**
 * 변환 결과 표시
 * @param {Object} result - 변환 결과 객체
 */
function showConversionResult(result) {
  // 진행 상황 섹션 숨기고 결과 섹션 표시
  document.getElementById('conversion-progress-section')?.classList.add('hidden');
  document.getElementById('conversion-result-section')?.classList.remove('hidden');
  
  // 결과 정보 표시
  const resultFileName = document.getElementById('result-file-name');
  const resultFileSize = document.getElementById('result-file-size');
  const resultPreview = document.getElementById('result-preview');
  
  if (resultFileName) {
    resultFileName.textContent = result.name || `converted.${selectedOutputFormat}`;
  }
  
  if (resultFileSize) {
    resultFileSize.textContent = FileUtils.formatFileSize(result.size);
  }
  
  // 미리보기 표시 (이미지인 경우)
  if (resultPreview && result.dataUrl && ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(selectedOutputFormat.toLowerCase())) {
    resultPreview.innerHTML = `<img src="${result.dataUrl}" alt="변환된 이미지" />`;
  } else if (resultPreview) {
    resultPreview.innerHTML = `
      <div class="file-icon">
        <i class="icon icon-${selectedOutputFormat.toLowerCase()}"></i>
      </div>
      <p>미리보기를 지원하지 않는 파일 형식입니다.</p>
    `;
  }
}

/**
 * 다운로드 버튼 클릭 이벤트 핸들러
 */
function handleDownloadClick() {
  if (!convertedFile || !convertedFile.dataUrl) {
    alert('다운로드할 파일이 없습니다.');
    return;
  }
  
  // 데이터 URL에서 파일 다운로드
  const link = document.createElement('a');
  link.href = convertedFile.dataUrl;
  link.download = convertedFile.name || `converted.${selectedOutputFormat}`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // 사용자 행동 추적
  try {
    if (typeof analytics !== 'undefined') {
      analytics.trackAction('convert', 'download_file', selectedOutputFormat, {
        fileSize: convertedFile.size,
        fileName: convertedFile.name
      });
    }
  } catch (e) {
    console.warn('Analytics를 호출할 수 없습니다:', e);
  }
}

/**
 * 변환기 초기화 (다른 파일 변환)
 */
function resetConverter() {
  // 상태 초기화
  currentFile = null;
  selectedOutputFormat = '';
  convertedFile = null;
  
  // UI 초기화
  document.getElementById('file-select-section')?.classList.remove('hidden');
  document.getElementById('conversion-options-section')?.classList.add('hidden');
  document.getElementById('conversion-progress-section')?.classList.add('hidden');
  document.getElementById('conversion-result-section')?.classList.add('hidden');
  document.getElementById('conversion-error-section')?.classList.add('hidden');
  
  // 파일 입력 초기화
  const fileInput = document.getElementById('file-input');
  if (fileInput) {
    fileInput.value = '';
  }
  
  // 사용자 행동 추적
  try {
    if (typeof analytics !== 'undefined') {
      analytics.trackAction('convert', 'reset_converter');
    }
  } catch (e) {
    console.warn('Analytics를 호출할 수 없습니다:', e);
  }
}

/**
 * 도움말 툴팁 추가
 */
function addHelpTooltips() {
  const helpLinks = document.querySelectorAll('.help-link');
  
  helpLinks.forEach(link => {
    const tooltipId = link.getAttribute('data-tooltip');
    const tooltipText = getTooltipText(tooltipId);
    
    if (!tooltipText) return;
    
    // 툴팁 요소 생성
    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip';
    tooltip.innerHTML = `
      <div class="tooltip-content">
        <p>${tooltipText}</p>
        <span class="tooltip-close">&times;</span>
      </div>
    `;
    
    // 툴팁 위치 조정
    link.addEventListener('click', function(e) {
      e.preventDefault();
      
      // 이미 표시된 툴팁 제거
      document.querySelectorAll('.tooltip.visible').forEach(t => {
        if (t !== tooltip) {
          t.classList.remove('visible');
        }
      });
      
      // 툴팁 위치 조정 및 표시
      document.body.appendChild(tooltip);
      
      const linkRect = link.getBoundingClientRect();
      tooltip.style.top = (linkRect.bottom + window.scrollY + 10) + 'px';
      tooltip.style.left = (linkRect.left + window.scrollX) + 'px';
      
      tooltip.classList.add('visible');
      
      // 닫기 버튼 이벤트
      tooltip.querySelector('.tooltip-close').addEventListener('click', function() {
        tooltip.classList.remove('visible');
      });
      
      // 외부 클릭 시 툴팁 닫기
      document.addEventListener('click', function closeTooltip(e) {
        if (!tooltip.contains(e.target) && e.target !== link) {
          tooltip.classList.remove('visible');
          document.removeEventListener('click', closeTooltip);
        }
      });
    });
  });
}

/**
 * 툴팁 텍스트 가져오기
 * @param {string} tooltipId - 툴팁 ID
 * @returns {string} 툴팁 텍스트
 */
function getTooltipText(tooltipId) {
  const tooltips = {
    'format-help': '출력 형식은 변환된 파일의 최종 형식을 결정합니다. 각 형식마다 고유한 특성과 장단점이 있습니다.',
    'quality-help': '품질 설정은 이미지의 시각적 품질과 파일 크기 간의 균형을 조절합니다. 값이 높을수록 품질은 좋아지지만 파일 크기가 커집니다.',
    'compression-help': '압축 수준은 파일 크기와 처리 시간에 영향을 줍니다. 값이 높을수록 파일 크기는 작아지지만 처리 시간이 길어집니다.',
    'lossless-help': '무손실 변환은 이미지 품질을 그대로 유지하지만 파일 크기가 커집니다. 고품질 이미지가 필요한 경우 사용하세요.'
  };
  
  return tooltips[tooltipId] || '정보가 없습니다.';
}

/**
 * QR 코드로 변환 버튼 클릭 이벤트 핸들러
 */
function handleConvertToQRClick() {
  if (!convertedFile) {
    alert('QR 코드로 변환할 파일이 없습니다.');
    return;
  }
  
  // QR 코드 생성 페이지로 이동
  const qrCodeUrl = new URL('/qrcode.html', window.location.origin);
  qrCodeUrl.searchParams.append('data', convertedFile.dataUrl);
  qrCodeUrl.searchParams.append('type', 'file');
  qrCodeUrl.searchParams.append('filename', convertedFile.name);
  
  window.location.href = qrCodeUrl.toString();
  
  // 사용자 행동 추적
  try {
    if (typeof analytics !== 'undefined') {
      analytics.trackAction('convert', 'navigate_to_qr', selectedOutputFormat);
    }
  } catch (e) {
    console.warn('Analytics를 호출할 수 없습니다:', e);
  }
}

// 하위 호환성을 위한 전역 참조
if (typeof window !== 'undefined') {
  window.FileToQR = window.FileToQR || {};
  window.FileToQR.fileConverter = fileConverter;
}

// 모듈 레지스트리에 등록 (하위 호환성)
if (typeof window !== 'undefined' && window.FileToQR && window.FileToQR.registry) {
  window.FileToQR.registry.register('converters', 'file-converter', fileConverter);
}

export default fileConverter; 