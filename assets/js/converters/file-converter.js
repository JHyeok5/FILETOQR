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

// 파일 변환기 모듈 (외부로 노출되는 API)
const fileConverter = {};

// 즉시 실행 함수로 내부 로직 캡슐화
(function() {
  'use strict';

  // 페이지 로드 후 초기화
  document.addEventListener('DOMContentLoaded', initFileConverter);

  // 전역 상태 변수
  let currentFile = null;
  let selectedOutputFormat = '';
  let convertedFile = null;
  let progressTracker = null;

  // 파일 변환기 초기화
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

  // 드래그 오버 이벤트 핸들러
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

  // 드래그 리브 이벤트 핸들러
  function handleDragLeave(event) {
    event.preventDefault();
    event.stopPropagation();
    
    const dropzone = document.getElementById('dropzone');
    if (dropzone) {
      dropzone.classList.remove('dragover');
    }
  }

  // 파일 드롭 이벤트 핸들러
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

  // 파일 선택 이벤트 핸들러
  function handleFileSelect(event) {
    if (event.target.files && event.target.files.length > 0) {
      handleFile(event.target.files[0]);
      
      // 사용자 행동 추적
      analytics.trackAction('upload', 'select_file', event.target.files[0].type, {
        fileSize: event.target.files[0].size,
        fileName: event.target.files[0].name
      });
    }
  }

  // 파일 처리 함수
  function handleFile(file) {
    console.log('파일 처리 중:', file.name);
    
    // 상태 업데이트
    currentFile = file;
    
    // 파일 정보 표시
    const fileNameEl = document.getElementById('file-name');
    const fileTypeEl = document.getElementById('file-type');
    const fileSizeEl = document.getElementById('file-size');
    
    if (fileNameEl) fileNameEl.textContent = file.name;
    if (fileTypeEl) fileTypeEl.textContent = getFileExtension(file.name);
    if (fileSizeEl) fileSizeEl.textContent = formatFileSize(file.size);
    
    // 지원되는 출력 형식 로드
    loadSupportedOutputFormats(getFileExtension(file.name));
    
    // UI 업데이트
    const optionsEl = document.getElementById('conversion-options');
    const actionsEl = document.getElementById('conversion-actions');
    
    if (optionsEl) optionsEl.classList.remove('hidden');
    if (actionsEl) actionsEl.classList.remove('hidden');
  }

  // 파일 확장자 추출
  function getFileExtension(filename) {
    return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2).toLowerCase();
  }

  // 파일 크기 포맷팅
  function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // 지원되는 출력 형식 로드
  function loadSupportedOutputFormats(inputFormat) {
    // 선택 박스 초기화
    const outputFormatSelect = document.getElementById('output-format');
    if (!outputFormatSelect) return;
    
    outputFormatSelect.innerHTML = '<option value="">형식 선택</option>';
    
    // 지원되는 형식 가져오기
    const outputFormats = getSupportedFormats(inputFormat);
    
    // 선택 박스에 옵션 추가
    outputFormats.forEach(format => {
      const option = document.createElement('option');
      option.value = format;
      option.textContent = format.toUpperCase();
      outputFormatSelect.appendChild(option);
    });
  }

  // 현입력 형식에 대한 지원 출력 형식 조회
  function getSupportedFormats(inputFormat) {
    // 형식 그룹
    const imageFormats = ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'];
    const documentFormats = ['pdf', 'docx', 'txt'];
    const dataFormats = ['json', 'csv', 'xml', 'yaml'];
    
    // 입력 형식에 따른 지원 출력 형식 반환
    if (imageFormats.includes(inputFormat)) {
      return imageFormats.filter(format => format !== inputFormat);
    } else if (documentFormats.includes(inputFormat)) {
      return documentFormats.filter(format => format !== inputFormat);
    } else if (dataFormats.includes(inputFormat)) {
      return dataFormats.filter(format => format !== inputFormat);
    }
    
    // 기본값
    return ['png', 'jpg', 'pdf'];
  }

  // 형식 선택 핸들러
  function handleFormatSelect(event) {
    selectedOutputFormat = event.target.value;
    
    // 형식별 옵션 UI 업데이트
    updateFormatOptions(selectedOutputFormat);
    
    // 사용자 행동 추적
    analytics.trackAction('converter', 'select_format', selectedOutputFormat);
  }

  // 형식별 옵션 UI 업데이트
  function updateFormatOptions(format) {
    const optionsContainer = document.getElementById('format-specific-options');
    if (!optionsContainer) return;
    
    optionsContainer.innerHTML = '';
    
    // 이미지 형식 옵션
    if (['png', 'jpg', 'jpeg', 'webp'].includes(format)) {
      const qualityOption = `
        <div class="mt-3">
          <label for="quality" class="block text-sm font-medium text-gray-700 mb-1">품질 (${format === 'png' ? '압축 수준' : '이미지 품질'})</label>
          <div class="flex items-center">
            <input type="range" id="quality" name="quality" min="1" max="100" value="${format === 'png' ? '80' : '90'}" 
              class="w-full mr-2" data-help-tooltip="높을수록 품질이 좋지만 파일 크기가 커집니다.">
            <span id="quality-value" class="text-sm w-8 text-right">90%</span>
          </div>
        </div>
      `;
      
      const resizeOption = `
        <div class="mt-3">
          <label for="resize" class="block text-sm font-medium text-gray-700 mb-1">크기 조정</label>
          <div class="flex items-center space-x-2">
            <input type="checkbox" id="resize-toggle" class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded">
            <div class="flex-grow grid grid-cols-2 gap-2" id="resize-options" style="display: none;">
              <div>
                <label for="width" class="block text-xs text-gray-600">너비 (px)</label>
                <input type="number" id="width" min="1" max="10000" class="w-full px-2 py-1 text-sm border rounded">
              </div>
              <div>
                <label for="height" class="block text-xs text-gray-600">높이 (px)</label>
                <input type="number" id="height" min="1" max="10000" class="w-full px-2 py-1 text-sm border rounded">
              </div>
            </div>
          </div>
        </div>
      `;
      
      optionsContainer.innerHTML = qualityOption + resizeOption;
      
      // 이벤트 리스너 추가
      const qualityRange = document.getElementById('quality');
      const qualityValue = document.getElementById('quality-value');
      const resizeToggle = document.getElementById('resize-toggle');
      const resizeOptions = document.getElementById('resize-options');
      
      if (qualityRange && qualityValue) {
        qualityRange.addEventListener('input', function() {
          qualityValue.textContent = this.value + '%';
        });
      }
      
      if (resizeToggle && resizeOptions) {
        resizeToggle.addEventListener('change', function() {
          resizeOptions.style.display = this.checked ? 'grid' : 'none';
        });
      }
    }
    
    // PDF 옵션
    else if (format === 'pdf') {
      const pdfOptions = `
        <div class="mt-3">
          <label class="block text-sm font-medium text-gray-700 mb-1">PDF 옵션</label>
          <div class="flex flex-col space-y-2">
            <div class="flex items-center">
              <input type="checkbox" id="compress-pdf" class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded">
              <label for="compress-pdf" class="ml-2 block text-sm text-gray-700">PDF 압축</label>
            </div>
            <div>
              <label for="pdf-dpi" class="block text-xs text-gray-600">이미지 해상도 (DPI)</label>
              <select id="pdf-dpi" class="w-full px-2 py-1 text-sm border rounded">
                <option value="72">72 DPI (화면용)</option>
                <option value="150">150 DPI (일반 인쇄)</option>
                <option value="300" selected>300 DPI (고품질 인쇄)</option>
              </select>
            </div>
          </div>
        </div>
      `;
      
      optionsContainer.innerHTML = pdfOptions;
    }
    
    // 도움말 툴팁 새로고침
    helpTooltip.refreshTooltips();
  }

  // 변환 버튼 클릭 핸들러
  function handleConvertClick() {
    if (!currentFile || !selectedOutputFormat) {
      alert('파일과 출력 형식을 선택해주세요.');
      return;
    }
    
    // 옵션 수집
    const options = collectOptions();
    
    // 변환 진행 상태 표시
    showConversionProgress();
    
    // 변환 시작 (여기서는 시뮬레이션)
    simulateConversion(currentFile, selectedOutputFormat, options, function(progress, message) {
      // 진행 상태 업데이트
      const progressBar = document.getElementById('progress-bar');
      const progressText = document.getElementById('progress-text');
      
      if (progressBar) {
        progressBar.style.width = progress + '%';
      }
      
      if (progressText) {
        progressText.textContent = message || `${progress}% 완료`;
      }
    })
    .then(result => {
      // 변환 결과 표시
      convertedFile = result;
      showConversionResult(result);
    })
    .catch(error => {
      console.error('변환 오류:', error);
      alert('파일 변환 중 오류가 발생했습니다: ' + error.message);
      
      // 초기 상태로 복귀
      resetConverter();
    });
  }

  // 변환 옵션 수집
  function collectOptions() {
    const options = {
      format: selectedOutputFormat
    };
    
    // 이미지 옵션
    if (['png', 'jpg', 'jpeg', 'webp'].includes(selectedOutputFormat)) {
      const qualityEl = document.getElementById('quality');
      const resizeToggle = document.getElementById('resize-toggle');
      const widthEl = document.getElementById('width');
      const heightEl = document.getElementById('height');
      
      if (qualityEl) options.quality = parseInt(qualityEl.value) / 100;
      
      if (resizeToggle && resizeToggle.checked && widthEl && heightEl) {
        options.resize = {
          width: parseInt(widthEl.value) || null,
          height: parseInt(heightEl.value) || null
        };
      }
    }
    
    // PDF 옵션
    else if (selectedOutputFormat === 'pdf') {
      const compressEl = document.getElementById('compress-pdf');
      const dpiEl = document.getElementById('pdf-dpi');
      
      if (compressEl) options.compress = compressEl.checked;
      if (dpiEl) options.dpi = parseInt(dpiEl.value);
    }
    
    return options;
  }

  // 변환 진행 상태 UI 표시
  function showConversionProgress() {
    const progressEl = document.getElementById('conversion-progress');
    if (progressEl) {
      progressEl.classList.remove('hidden');
    }
  }

  // 변환 결과 UI 표시
  function showConversionResult(result) {
    // 진행 상태 UI 숨기기
    const progressEl = document.getElementById('conversion-progress');
    if (progressEl) {
      progressEl.classList.add('hidden');
    }
    
    // 결과 UI 표시
    const resultEl = document.getElementById('conversion-result');
    const fileNameEl = document.getElementById('result-file-name');
    const fileInfoEl = document.getElementById('result-file-info');
    
    if (resultEl) resultEl.classList.remove('hidden');
    if (fileNameEl) fileNameEl.textContent = result.name;
    if (fileInfoEl) fileInfoEl.textContent = `${getFileExtension(result.name).toUpperCase()} 파일, ${formatFileSize(result.size)}`;
  }

  // 변환 시뮬레이션 (실제 구현에서는 제거하고 실제 변환기로 대체)
  function simulateConversion(file, outputFormat, options, progressCallback) {
    return new Promise((resolve, reject) => {
      // 진행 상태 시뮬레이션
      let progress = 0;
      const interval = setInterval(() => {
        progress += 5;
        if (progressCallback) {
          progressCallback(progress, `${file.name} 변환 중...`);
        }
        
        if (progress >= 100) {
          clearInterval(interval);
          
          // 파일 읽기 시작
          const reader = new FileReader();
          reader.onload = function(e) {
            // 원본 파일의 내용 (실제로는 변환된 내용으로 대체)
            const result = new Blob([e.target.result], { type: getMimeType(outputFormat) });
            
            // 결과 파일 생성
            const convertedFile = new File([result], getOutputFileName(file.name, outputFormat), {
              type: getMimeType(outputFormat)
            });
            
            // 약간의 지연 후 완료 (UI 효과)
            setTimeout(() => {
              resolve(convertedFile);
            }, 500);
          };
          
          reader.onerror = function(error) {
            reject(new Error('파일 읽기 실패'));
          };
          
          reader.readAsArrayBuffer(file);
        }
      }, 100);
    });
  }

  // MIME 타입 조회
  function getMimeType(format) {
    const mimeTypes = {
      'png': 'image/png',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'webp': 'image/webp',
      'gif': 'image/gif',
      'svg': 'image/svg+xml',
      'pdf': 'application/pdf',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'txt': 'text/plain',
      'json': 'application/json',
      'csv': 'text/csv',
      'xml': 'application/xml'
    };
    
    return mimeTypes[format] || 'application/octet-stream';
  }

  // 출력 파일 이름 생성
  function getOutputFileName(inputFileName, outputFormat) {
    const baseName = inputFileName.substring(0, inputFileName.lastIndexOf('.'));
    return `${baseName}.${outputFormat}`;
  }

  // 다운로드 버튼 클릭 핸들러
  function handleDownloadClick() {
    if (!convertedFile) return;
    
    try {
      // 다운로드 URL 생성
      const url = URL.createObjectURL(convertedFile);
      
      // 다운로드 링크 생성 및 클릭
      const a = document.createElement('a');
      a.href = url;
      a.download = convertedFile.name;
      document.body.appendChild(a);
      a.click();
      
      // 정리
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 0);
    } catch (error) {
      console.error('파일 다운로드 중 오류가 발생했습니다:', error);
      alert('파일 다운로드 중 오류가 발생했습니다. 다시 시도해주세요.');
    }
  }

  // 변환기 초기화 (다른 파일 변환)
  function resetConverter() {
    // 상태 변수 초기화
    currentFile = null;
    selectedOutputFormat = '';
    convertedFile = null;
    
    // UI 요소 초기화
    const optionsEl = document.getElementById('conversion-options');
    const actionsEl = document.getElementById('conversion-actions');
    const progressEl = document.getElementById('conversion-progress');
    const resultEl = document.getElementById('conversion-result');
    
    if (optionsEl) optionsEl.classList.add('hidden');
    if (actionsEl) actionsEl.classList.add('hidden');
    if (progressEl) progressEl.classList.add('hidden');
    if (resultEl) resultEl.classList.add('hidden');
  }
  
  // 도움말 툴팁 추가
  function addHelpTooltips() {
    // 도움말 툴팁 내용 정의
    const tooltips = [
      {
        selector: '#dropzone',
        content: '파일을 이 영역에 드래그하거나 클릭하여 선택할 수 있습니다. 모든 처리는 브라우저 내에서 이루어지므로 파일이 서버로 전송되지 않습니다.',
        placement: 'bottom'
      },
      {
        selector: '#output-format',
        content: '변환할 출력 파일 형식을 선택하세요. 입력 파일 형식에 따라 사용 가능한 옵션이 달라집니다.',
        placement: 'right'
      },
      {
        selector: '#convert-btn',
        content: '파일 변환을 시작합니다. 파일 크기에 따라 변환 시간이 달라질 수 있습니다.',
        placement: 'top'
      }
    ];
    
    // 툴팁 적용 (helpTooltip 유틸리티 있는 경우)
    if (typeof helpTooltip !== 'undefined') {
      tooltips.forEach(tooltip => {
        const element = document.querySelector(tooltip.selector);
        if (element) {
          helpTooltip.addTooltip(element, tooltip.content, {
            placement: tooltip.placement,
            title: tooltip.title || tooltip.selector.replace('#', '')
          });
        }
      });
    }
  }

  // 파일을 데이터 URI로 인코딩
  function fileToDataUri(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = function(event) {
        resolve(event.target.result);
      };
      
      reader.onerror = function(error) {
        reject(error);
      };
      
      reader.readAsDataURL(file);
    });
  }

  // 모듈 API 설정
  fileConverter.initFileConverter = initFileConverter;
  fileConverter.getFileExtension = getFileExtension;
  fileConverter.formatFileSize = formatFileSize;
  fileConverter.fileToDataUri = fileToDataUri;

  // 글로벌 네임스페이스에 등록
  window.fileConverter = fileConverter;
})();

// 모듈 익스포트
export default fileConverter; 