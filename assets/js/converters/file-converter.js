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
 * - QR 코드용 파일 인코딩
 */

import registry from '../registry.js';
import ProgressTracker from '../ui/progress-tracker.js';
import analytics from '../utils/usage-analytics.js';
import helpTooltip from '../ui/help-tooltip.js';

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
    
    // 진행 상태 추적기 초기화
    progressTracker = new ProgressTracker();
    
    // 이벤트 리스너 등록
    if (dropzone) {
      // 드래그 앤 드롭 이벤트
      dropzone.addEventListener('dragover', handleDragOver);
      dropzone.addEventListener('dragleave', handleDragLeave);
      dropzone.addEventListener('drop', handleFileDrop);
      dropzone.addEventListener('click', () => fileInput.click());
    }
    
    if (fileInput) {
      fileInput.addEventListener('change', handleFileSelect);
    }
    
    if (selectFileBtn) {
      selectFileBtn.addEventListener('click', () => fileInput.click());
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
    
    // 사용자 경험 이벤트 추적
    analytics.trackPageView();
    analytics.trackAction('page', 'load', 'file_converter');
  }

  // 드래그 오버 이벤트 핸들러
  function handleDragOver(event) {
    event.preventDefault();
    event.stopPropagation();
    
    const dropzone = document.getElementById('dropzone');
    dropzone.classList.add('dragover');
    
    // 사용자 행동 추적
    analytics.trackAction('upload', 'drag_over');
  }

  // 드래그 리브 이벤트 핸들러
  function handleDragLeave(event) {
    event.preventDefault();
    event.stopPropagation();
    
    const dropzone = document.getElementById('dropzone');
    dropzone.classList.remove('dragover');
  }

  // 파일 드롭 이벤트 핸들러
  function handleFileDrop(event) {
    event.preventDefault();
    event.stopPropagation();
    
    const dropzone = document.getElementById('dropzone');
    dropzone.classList.remove('dragover');
    
    const dt = event.dataTransfer;
    if (dt.files && dt.files.length > 0) {
      handleFile(dt.files[0]);
      
      // 사용자 행동 추적
      analytics.trackAction('upload', 'drop_file', dt.files[0].type, {
        fileSize: dt.files[0].size,
        fileName: dt.files[0].name
      });
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
    document.getElementById('file-name').textContent = file.name;
    document.getElementById('file-type').textContent = getFileExtension(file.name);
    document.getElementById('file-size').textContent = formatFileSize(file.size);
    
    // 지원되는 출력 형식 로드
    loadSupportedOutputFormats(getFileExtension(file.name));
    
    // UI 업데이트
    document.getElementById('conversion-options').classList.remove('hidden');
    document.getElementById('conversion-actions').classList.remove('hidden');
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
    outputFormatSelect.innerHTML = '<option value="">형식 선택</option>';
    
    // TODO: 레지스트리에서 지원되는 형식 로드 (현재는 하드코딩)
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
          <div class="flex items-center">
            <input type="checkbox" id="resize-checkbox" class="mr-2">
            <label for="resize-checkbox" class="text-sm font-medium text-gray-700">크기 조정</label>
          </div>
          
          <div id="resize-options" class="pl-6 mt-2 hidden">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label for="width" class="block text-sm text-gray-700 mb-1">너비 (px)</label>
                <input type="number" id="width" min="1" max="10000" placeholder="자동" class="w-full border-gray-300 rounded-md shadow-sm">
              </div>
              <div>
                <label for="height" class="block text-sm text-gray-700 mb-1">높이 (px)</label>
                <input type="number" id="height" min="1" max="10000" placeholder="자동" class="w-full border-gray-300 rounded-md shadow-sm">
              </div>
            </div>
            <div class="mt-2">
              <input type="checkbox" id="maintain-ratio" checked class="mr-2">
              <label for="maintain-ratio" class="text-sm text-gray-700">비율 유지</label>
            </div>
          </div>
        </div>
      `;
      
      optionsContainer.innerHTML = qualityOption + resizeOption;
      
      // 이벤트 리스너 추가
      const qualityInput = document.getElementById('quality');
      const qualityValue = document.getElementById('quality-value');
      const resizeCheckbox = document.getElementById('resize-checkbox');
      const resizeOptions = document.getElementById('resize-options');
      
      qualityInput.addEventListener('input', () => {
        qualityValue.textContent = `${qualityInput.value}%`;
      });
      
      resizeCheckbox.addEventListener('change', () => {
        resizeOptions.classList.toggle('hidden', !resizeCheckbox.checked);
      });
    }
    
    // PDF 형식 옵션
    else if (format === 'pdf') {
      const pdfOptions = `
        <div class="mt-3">
          <label for="pdf-page-size" class="block text-sm font-medium text-gray-700 mb-1">페이지 크기</label>
          <select id="pdf-page-size" class="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
            <option value="a4">A4</option>
            <option value="letter">Letter</option>
            <option value="legal">Legal</option>
          </select>
        </div>
      `;
      
      optionsContainer.innerHTML = pdfOptions;
    }
    
    // 도움말 툴팁 새로고침
    helpTooltip.refreshTooltips();
  }

  // 변환 버튼 클릭 핸들러
  function handleConvertClick() {
    if (!currentFile || !selectedOutputFormat) return;
    
    // 변환 옵션 수집
    const options = collectOptions();
    
    // 사용자 행동 추적 - 변환 시작
    analytics.trackAction('converter', 'start_conversion', `${getFileExtension(currentFile.name)}_to_${selectedOutputFormat}`, {
      inputFormat: getFileExtension(currentFile.name),
      outputFormat: selectedOutputFormat,
      fileSize: currentFile.size,
      options
    });
    
    // 진행 상태 표시 및 추적 시작
    const fileInfo = {
      name: currentFile.name,
      type: getFileExtension(currentFile.name),
      size: currentFile.size,
      outputFormat: selectedOutputFormat
    };
    
    const conversionSteps = [
      { percent: 0, message: '변환 준비 중...' },
      { percent: 10, message: '파일 분석 중...' },
      { percent: 25, message: '파일 처리 중...' },
      { percent: 50, message: `${selectedOutputFormat.toUpperCase()} 형식으로 변환 중...` },
      { percent: 75, message: '최종 처리 중...' },
      { percent: 100, message: '변환 완료!' }
    ];
    
    // 진행 상태 추적 시작
    progressTracker.start(fileInfo, conversionSteps);
    
    // 변환 UI 표시
    showConversionProgress();
    
    // 변환 작업 시작 (시뮬레이션)
    const startTime = Date.now();
    
    simulateConversion(currentFile, selectedOutputFormat, options, (percent, message) => {
      progressTracker.updateProgress(percent, message);
    })
    .then(result => {
      // 변환 완료 처리
      convertedFile = result;
      
      // 변환 시간 계산
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // 진행 상태 완료 처리
      progressTracker.complete(true, { file: result });
      
      // 결과 표시
      showConversionResult(result);
      
      // 사용자 행동 추적 - 변환 완료
      analytics.trackConversion({
        inputFormat: getFileExtension(currentFile.name),
        outputFormat: selectedOutputFormat,
        fileSize: currentFile.size,
        outputSize: result.size,
        duration,
        success: true,
        options
      });
    })
    .catch(error => {
      console.error('변환 실패:', error);
      
      // 오류 처리
      progressTracker.complete(false, { error: { message: error.message, type: 'conversion_error' } });
      
      // 사용자 행동 추적 - 변환 실패
      analytics.trackConversion({
        inputFormat: getFileExtension(currentFile.name),
        outputFormat: selectedOutputFormat,
        fileSize: currentFile.size,
        duration: Date.now() - startTime,
        success: false,
        error: {
          message: error.message,
          type: 'conversion_error'
        },
        options
      });
    });
  }

  // 옵션 수집
  function collectOptions() {
    const options = {
      outputFormat: selectedOutputFormat
    };
    
    // 이미지 옵션
    if (['png', 'jpg', 'jpeg', 'webp'].includes(selectedOutputFormat)) {
      const qualityInput = document.getElementById('quality');
      if (qualityInput) {
        options.quality = parseInt(qualityInput.value);
      }
      
      const resizeCheckbox = document.getElementById('resize-checkbox');
      if (resizeCheckbox && resizeCheckbox.checked) {
        options.resize = {
          width: parseInt(document.getElementById('width').value) || null,
          height: parseInt(document.getElementById('height').value) || null,
          maintainRatio: document.getElementById('maintain-ratio').checked
        };
      }
    }
    
    // PDF 옵션
    else if (selectedOutputFormat === 'pdf') {
      const pageSizeSelect = document.getElementById('pdf-page-size');
      if (pageSizeSelect) {
        options.pageSize = pageSizeSelect.value;
      }
    }
    
    return options;
  }

  // 변환 진행 상태 표시
  function showConversionProgress() {
    // UI 요소 표시/숨김
    document.getElementById('conversion-options').classList.add('hidden');
    document.getElementById('conversion-actions').classList.add('hidden');
    document.getElementById('conversion-progress').classList.remove('hidden');
    document.getElementById('conversion-result').classList.add('hidden');
  }

  // 변환 결과 표시
  function showConversionResult(result) {
    const resultContainer = document.getElementById('conversion-result');
    const downloadBtn = document.getElementById('download-btn');
    const convertToQrBtn = document.getElementById('convert-to-qr-btn');
    
    // Hide progress UI
    document.getElementById('conversion-progress').style.display = 'none';
    
    // Show result UI
    resultContainer.style.display = 'block';
    
    // Set result file info
    document.getElementById('result-filename').textContent = result.filename;
    document.getElementById('result-filesize').textContent = formatFileSize(result.size);
    document.getElementById('result-filetype').textContent = result.type;
    
    // Setup download button
    downloadBtn.addEventListener('click', () => handleDownloadClick(result));
    
    // Setup convert to QR code button
    if (convertToQrBtn) {
        convertToQrBtn.addEventListener('click', () => handleConvertToQRClick(result));
    }
  }

  // 변환 시뮬레이션 (실제 구현에서는 제거하고 실제 변환기로 대체)
  function simulateConversion(file, outputFormat, options, progressCallback) {
    return new Promise((resolve, reject) => {
      // 진행 상태 시뮬레이션
      let progress = 0;
      const interval = setInterval(() => {
        progress += 5;
        progressCallback(progress, `${file.name} 변환 중...`);
        
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
    
    // 사용자 행동 추적
    analytics.trackAction('converter', 'download_result', selectedOutputFormat, {
      fileSize: convertedFile.size,
      fileName: convertedFile.name
    });
  }

  // 변환기 초기화 (다른 파일 변환)
  function resetConverter() {
    // 상태 변수 초기화
    currentFile = null;
    selectedOutputFormat = '';
    convertedFile = null;
    
    // UI 요소 초기화
    document.getElementById('conversion-options').classList.add('hidden');
    document.getElementById('conversion-actions').classList.add('hidden');
    document.getElementById('conversion-progress').classList.add('hidden');
    document.getElementById('conversion-result').classList.add('hidden');
    
    // 사용자 행동 추적
    analytics.trackAction('converter', 'reset_converter');
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
    
    // 툴팁 적용
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

  // 파일을 데이터 URI로 인코딩 (QR 코드 생성용)
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

  /**
   * Handles the click event for the "Convert to QR Code" button.
   * Redirects to the QR code page with the converted file data.
   * @param {Object} result - The conversion result containing file data
   */
  function handleConvertToQRClick(result) {
    // Store the file data in sessionStorage
    try {
        // Only store essential information to avoid exceeding storage limits
        const fileData = {
            name: result.filename,
            type: result.type,
            size: result.size,
            dataUri: result.dataUri || null
        };
        
        sessionStorage.setItem('fileToQR', JSON.stringify(fileData));
        
        // Redirect to QR code page
        window.location.href = 'qrcode.html?contentType=file';
    } catch (error) {
        console.error('Error preparing file for QR code:', error);
        alert('파일을 QR 코드로 변환하는 중 오류가 발생했습니다. 파일 크기가 너무 클 수 있습니다.');
    }
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