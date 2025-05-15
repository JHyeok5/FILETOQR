/**
 * file-to-qr-core.js - FileToQR 파일-QR 변환 통합 모듈 (1차 통합 스켈레톤)
 * 기존 file-to-qr-converter.js, file-to-qr.js의 공통 로직을 통합
 * - 파일 업로드/드래그앤드롭/이벤트 처리 (공통)
 * - 파일 타입/용량 판별 → 단일 QR/다중 QR 분기
 * - QR 생성(공통 QRGenerator 활용)
 * - 파일 정보/오류/상태 표시(공통)
 * - 기존 개선 내역(data-i18n, 오류 메시지 등) 반영
 *
 * 실제 기능 구현은 점진적으로 이관/통합할 예정 (1차 스켈레톤)
 */

import QRGenerator from './qr-generator.js';
import FileUtils from '../utils/file-utils.js';

const FileToQRCore = {
  // 내부 상태
  state: {
    initialized: false,
    file: null,
    fileContent: null,
    fileType: null,
    maxTextFileSize: 1024 * 5, // 5KB
    maxFileSize: 5 * 1024 * 1024, // 5MB
    qrCanvas: null,
    qrChunks: [],
    currentChunkIndex: 0,
    totalChunks: 0,
    metadataQR: null
  },

  /**
   * 모듈 초기화 (공통)
   */
  async init() {
    if (this.state.initialized) return true;
    // QRGenerator 등 공통 모듈 초기화
    await QRGenerator.init();
    // UI 요소/이벤트 초기화 (공통)
    this._initUI();
    this._registerEventListeners();
    this.state.initialized = true;
    return true;
  },

  /**
   * UI 요소 초기화 (공통)
   * - 업로드/변환/다운로드/상태 표시 등
   * - data-i18n, 오류 메시지 등 개선 내역 반영
   */
  _initUI() {
    // 주요 UI 요소 캐싱 (공통)
    this.ui = {
      uploadInput: document.getElementById('file-upload-input'),
      generateBtn: document.getElementById('generate-qr'),
      downloadBtn: document.getElementById('download-qr'),
      retryBtn: document.getElementById('retry-btn'),
      fileInfo: document.getElementById('file-info'),
      qrPreview: document.getElementById('qr-preview-container') || document.getElementById('qr-preview'),
      errorMsg: document.getElementById('qr-error-msg')
    };
    // 초기 UI 상태 설정
    this._updateUIState('init');
  },

  /**
   * UI 상태/버튼 활성화 등 일관성 관리 (공통)
   * @param {string} state - 'init' | 'fileSelected' | 'qrGenerated' | 'error'
   */
  _updateUIState(state) {
    // 모든 버튼/상태 초기화
    if (!this.ui) return;
    const { generateBtn, downloadBtn, retryBtn, fileInfo, errorMsg } = this.ui;
    if (generateBtn) generateBtn.disabled = true;
    if (downloadBtn) downloadBtn.disabled = true;
    if (retryBtn) retryBtn.disabled = true;
    if (fileInfo) fileInfo.textContent = '';
    if (errorMsg) errorMsg.textContent = '';
    // 상태별 UI 처리
    switch (state) {
      case 'fileSelected':
        if (generateBtn) generateBtn.disabled = false;
        if (retryBtn) retryBtn.disabled = false;
        break;
      case 'qrGenerated':
        if (downloadBtn) downloadBtn.disabled = false;
        if (retryBtn) retryBtn.disabled = false;
        break;
      case 'error':
        if (retryBtn) retryBtn.disabled = false;
        break;
      case 'init':
      default:
        // 모두 비활성화
        break;
    }
  },

  /**
   * 이벤트 리스너 등록 (공통)
   */
  _registerEventListeners() {
    if (!this.ui) return;
    const { uploadInput, generateBtn, downloadBtn, retryBtn } = this.ui;
    // 파일 업로드 input
    if (uploadInput) {
      uploadInput.addEventListener('change', (e) => {
        const file = e.target.files && e.target.files[0];
        if (file) this.handleFileUpload(file);
      });
    }
    // QR 생성 버튼
    if (generateBtn) {
      generateBtn.addEventListener('click', () => {
        if (this.state.file) this.generateQRCode();
      });
    }
    // 다운로드 버튼
    if (downloadBtn) {
      downloadBtn.addEventListener('click', () => {
        this._handleDownload();
      });
    }
    // 재시도 버튼
    if (retryBtn) {
      retryBtn.addEventListener('click', () => {
        this._reset();
      });
    }
  },

  /**
   * 파일 업로드/드래그앤드롭 처리 (공통)
   * - 파일 타입/용량 판별 → 단일 QR/다중 QR 자동 분기
   */
  async handleFileUpload(file) {
    if (!file) return;
    // 입력값 검증 강화
    const validationResult = this._validateFile(file);
    if (!validationResult.valid) {
      this._showError(validationResult.message);
      return;
    }
    this.state.file = file;
    this.state.fileType = file.type;
    this._updateUIState('fileSelected');
    // 텍스트 파일(5KB 이하): 단일 QR, 그 외(5MB 이하): 다중 QR
    if ((file.type.match('text/plain') || file.name.endsWith('.txt')) && file.size <= this.state.maxTextFileSize) {
      // === 단일 QR 변환 로직 (file-to-qr-converter.js 기반) ===
      try {
        // 파일 내용 읽기
        const content = await this._readTextFileContent(file);
        this.state.fileContent = content;
        // 파일 정보 표시
        this._showFileInfo(file, content);
        // QR 코드 생성
        await this._generateSingleQRCode(content);
        // UI 상태 업데이트 (다운로드 버튼 등)
        // TODO: UI 상태/버튼 활성화 등 통합
      } catch (error) {
        this._showError(this._t('errors.conversionFailed', '변환 중 오류가 발생했습니다'));
      }
    } else if (file.size <= this.state.maxFileSize) {
      // === 다중 QR 변환 로직 (file-to-qr.js 기반) ===
      try {
        // 파일을 ArrayBuffer로 읽기
        const arrayBuffer = await this._readFileAsArrayBuffer(file);
        // 데이터를 청크로 분할
        const chunks = this._splitIntoChunks(arrayBuffer, 1500); // 1500바이트 청크
        this.state.qrChunks = chunks;
        this.state.currentChunkIndex = 0;
        this.state.totalChunks = chunks.length;
        // 메타데이터 생성
        const metadata = {
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type || this._getMimeTypeFromFileName(file.name),
          totalChunks: chunks.length,
          chunkSize: 1500,
          dateCreated: new Date().toISOString()
        };
        // 메타데이터 QR 코드 생성
        this.state.metadataQR = await this._generateMetadataQR(metadata);
        // 메타데이터 QR 표시
        this._displayMetadataQRCode(metadata, this.state.metadataQR);
        // UI 상태 업데이트 (탐색 버튼 등)
        // TODO: UI 상태/버튼 활성화 등 통합
      } catch (error) {
        this._showError(this._t('errors.conversionFailed', '변환 중 오류가 발생했습니다'));
      }
    } else {
      // 오류: 파일 크기 초과
      this._showError(this._t('errors.fileTooLarge', '파일 크기가 너무 큽니다'));
    }
  },

  /**
   * 파일 입력값 검증 함수
   * @param {File} file
   * @returns {{valid: boolean, message: string}}
   */
  _validateFile(file) {
    // 허용 확장자/타입 목록
    const allowedExtensions = ['txt', 'csv', 'json', 'pdf'];
    const allowedTypes = [
      'text/plain', 'text/csv', 'application/json', 'application/pdf'
    ];
    const maxFileNameLength = 100;
    // 확장자 추출
    const ext = file.name.split('.').pop().toLowerCase();
    // 파일명 길이 및 특수문자 체크
    if (file.name.length > maxFileNameLength) {
      return { valid: false, message: this._t('errors.fileNameTooLong', '파일명이 너무 깁니다. 100자 이하로 해주세요.') };
    }
    if (!/^[\w\-. ]+$/.test(file.name)) {
      return { valid: false, message: this._t('errors.fileNameInvalid', '파일명에 허용되지 않는 문자가 포함되어 있습니다.') };
    }
    // 확장자/타입 체크
    if (!allowedExtensions.includes(ext) || (file.type && !allowedTypes.includes(file.type))) {
      return { valid: false, message: this._t('errors.fileTypeNotAllowed', '허용되지 않는 파일 형식입니다. (txt, csv, json, pdf만 지원)') };
    }
    // 크기 체크
    if (file.size > this.state.maxFileSize) {
      return { valid: false, message: this._t('errors.fileTooLarge', '파일 크기가 너무 큽니다. 5MB 이하만 업로드 가능합니다.') };
    }
    if (file.size === 0) {
      return { valid: false, message: this._t('errors.fileEmpty', '빈 파일은 업로드할 수 없습니다.') };
    }
    // 통과
    return { valid: true, message: '' };
  },

  /**
   * 텍스트 파일 내용 읽기 (공통)
   */
  _readTextFileContent(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => resolve(event.target.result);
      reader.onerror = (error) => reject(error);
      reader.readAsText(file);
    });
  },

  /**
   * 파일을 ArrayBuffer로 읽기 (공통)
   */
  _readFileAsArrayBuffer(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('파일 읽기 실패'));
      reader.readAsArrayBuffer(file);
    });
  },

  /**
   * ArrayBuffer를 청크로 분할 (공통)
   */
  _splitIntoChunks(buffer, chunkSize) {
    const uint8Array = new Uint8Array(buffer);
    const chunks = [];
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunkArray = uint8Array.slice(i, i + chunkSize);
      const base64Chunk = this._arrayBufferToBase64(chunkArray);
      chunks.push(base64Chunk);
    }
    return chunks;
  },

  /**
   * Uint8Array를 Base64 문자열로 변환 (공통)
   */
  _arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  },

  /**
   * 파일명에서 MIME 타입 추론 (공통)
   */
  _getMimeTypeFromFileName(fileName) {
    if (!FileUtils || !FileUtils.getFileExtension || !FileUtils.getMimeType) return '';
    const extension = FileUtils.getFileExtension(fileName);
    return FileUtils.getMimeType(extension);
  },

  /**
   * 메타데이터 QR 코드 생성 (공통)
   */
  async _generateMetadataQR(metadata) {
    const metadataString = JSON.stringify({
      type: 'FileToQR_Metadata',
      version: '1.0',
      ...metadata
    });
    return await QRGenerator.generateQRCode({
      content: metadataString,
      size: 256,
      errorCorrectionLevel: 'H'
    });
  },

  /**
   * 메타데이터 QR 코드 표시 (공통)
   */
  _displayMetadataQRCode(metadata, metadataQR) {
    const qrPreview = document.getElementById('qr-preview-container') || document.getElementById('qr-preview');
    if (!qrPreview || !metadataQR) return;
    qrPreview.innerHTML = '';
    qrPreview.appendChild(metadataQR);
    // 설명 텍스트 추가
    const infoDiv = document.createElement('div');
    infoDiv.className = 'text-center mt-4 text-gray-700';
    infoDiv.innerHTML = `<h3 class="font-medium">메타데이터 QR 코드</h3><p class="text-sm">이 QR 코드를 먼저 스캔하세요. 총 ${this.state.totalChunks}개의 QR 코드가 필요합니다.</p>`;
    qrPreview.appendChild(infoDiv);
    // TODO: 탐색 버튼 등 UI 통합
  },

  /**
   * 단일 QR 코드 생성 (텍스트 파일)
   */
  async _generateSingleQRCode(content) {
    // QRGenerator 활용
    const qrContainer = document.getElementById('qr-preview-container') || document.getElementById('qr-preview');
    if (!qrContainer) return;
    qrContainer.innerHTML = '';
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    qrContainer.appendChild(canvas);
    this.state.qrCanvas = canvas;
    try {
      await QRGenerator.state.qrLibrary.toCanvas(canvas, content, {
        width: 256,
        margin: 4,
        color: { dark: '#000000', light: '#ffffff' },
        errorCorrectionLevel: 'M'
      });
      canvas.style.maxWidth = '100%';
      canvas.style.height = 'auto';
      canvas.classList.add('shadow-md', 'rounded-md');
    } catch (error) {
      this._showError(this._t('errors.conversionFailed', 'QR 코드 생성에 실패했습니다.'));
    }
  },

  /**
   * QR 생성/다운로드/복원 등 공통 함수 (스켈레톤)
   */
  async generateQRCode() {
    // 단일/다중 QR 생성 분기 및 UI 상태 업데이트
    if ((this.state.fileType && this.state.fileType.match('text/plain')) || (this.state.file && this.state.file.name.endsWith('.txt'))) {
      // 단일 QR: 이미 생성됨
      this._updateUIState('qrGenerated');
    } else if (this.state.qrChunks && this.state.qrChunks.length > 0) {
      // 다중 QR: 첫 번째 청크 QR 생성/표시
      await this._showChunkQRCode(0);
      this._updateUIState('qrGenerated');
    }
  },

  /**
   * 단일 QR 다운로드 처리
   */
  _downloadSingleQRCode() {
    if (!this.state.qrCanvas) return;
    const link = document.createElement('a');
    link.href = this.state.qrCanvas.toDataURL('image/png');
    link.download = (this.state.file ? this.state.file.name.replace(/\.[^/.]+$/, '') : 'qrcode') + '.png';
    link.click();
  },

  /**
   * 다중 QR 탐색/다운로드 처리 (스켈레톤)
   */
  async _showChunkQRCode(index) {
    if (!this.state.qrChunks || index < 0 || index >= this.state.qrChunks.length) return;
    this.state.currentChunkIndex = index;
    const qrPreview = this.ui && this.ui.qrPreview;
    if (!qrPreview) return;
    qrPreview.innerHTML = '';
    // QR 생성
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    qrPreview.appendChild(canvas);
    try {
      await QRGenerator.state.qrLibrary.toCanvas(canvas, this.state.qrChunks[index], {
        width: 256,
        margin: 4,
        color: { dark: '#000000', light: '#ffffff' },
        errorCorrectionLevel: 'M'
      });
      canvas.style.maxWidth = '100%';
      canvas.style.height = 'auto';
      canvas.classList.add('shadow-md', 'rounded-md');
      // 탐색/다운로드 버튼 UI 추가
      this._renderChunkNavigationUI(qrPreview, index);
    } catch (error) {
      this._showError(this._t('errors.conversionFailed', 'QR 코드 생성에 실패했습니다.'));
    }
  },

  /**
   * 다중 QR 탐색/다운로드 버튼 UI 렌더링 (스켈레톤)
   */
  _renderChunkNavigationUI(container, index) {
    const navDiv = document.createElement('div');
    navDiv.className = 'flex items-center justify-center gap-2 mt-4';
    // 이전 버튼
    const prevBtn = document.createElement('button');
    prevBtn.textContent = '이전';
    prevBtn.className = 'px-3 py-1 rounded bg-gray-200 hover:bg-gray-300';
    prevBtn.disabled = index === 0;
    prevBtn.onclick = () => this._showChunkQRCode(index - 1);
    navDiv.appendChild(prevBtn);
    // 인덱스 표시
    const idxSpan = document.createElement('span');
    idxSpan.textContent = `${index + 1} / ${this.state.totalChunks}`;
    idxSpan.className = 'mx-2 text-sm text-gray-600';
    navDiv.appendChild(idxSpan);
    // 다음 버튼
    const nextBtn = document.createElement('button');
    nextBtn.textContent = '다음';
    nextBtn.className = 'px-3 py-1 rounded bg-gray-200 hover:bg-gray-300';
    nextBtn.disabled = index === this.state.totalChunks - 1;
    nextBtn.onclick = () => this._showChunkQRCode(index + 1);
    navDiv.appendChild(nextBtn);
    // 다운로드 버튼
    const dlBtn = document.createElement('button');
    dlBtn.textContent = '이 QR 다운로드';
    dlBtn.className = 'px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700';
    dlBtn.onclick = () => {
      const canvas = container.querySelector('canvas');
      if (canvas) {
        const link = document.createElement('a');
        link.href = canvas.toDataURL('image/png');
        link.download = `${this.state.file ? this.state.file.name.replace(/\.[^/.]+$/, '') : 'file'}-chunk${index + 1}.png`;
        link.click();
      }
    };
    navDiv.appendChild(dlBtn);
    container.appendChild(navDiv);
  },

  /**
   * QR 다운로드 처리 (단일/다중 분기)
   */
  _handleDownload() {
    if ((this.state.fileType && this.state.fileType.match('text/plain')) || (this.state.file && this.state.file.name.endsWith('.txt'))) {
      this._downloadSingleQRCode();
    } else if (this.state.qrChunks && this.state.qrChunks.length > 0) {
      // 현재 청크 QR 다운로드
      const qrPreview = this.ui && this.ui.qrPreview;
      const canvas = qrPreview && qrPreview.querySelector('canvas');
      if (canvas) {
        const link = document.createElement('a');
        link.href = canvas.toDataURL('image/png');
        link.download = `${this.state.file ? this.state.file.name.replace(/\.[^/.]+$/, '') : 'file'}-chunk${this.state.currentChunkIndex + 1}.png`;
        link.click();
      }
    }
  },

  /**
   * 재시도/초기화 처리 (스켈레톤)
   */
  _reset() {
    // 상태/파일/QR/버튼 등 모두 초기화
    this.state.file = null;
    this.state.fileContent = null;
    this.state.fileType = null;
    this.state.qrCanvas = null;
    this.state.qrChunks = [];
    this.state.currentChunkIndex = 0;
    this.state.totalChunks = 0;
    this.state.metadataQR = null;
    if (this.ui) {
      if (this.ui.uploadInput) this.ui.uploadInput.value = '';
      if (this.ui.fileInfo) this.ui.fileInfo.textContent = '';
      if (this.ui.qrPreview) this.ui.qrPreview.innerHTML = '';
      if (this.ui.errorMsg) this.ui.errorMsg.textContent = '';
    }
    this._updateUIState('init');
  },

  /**
   * 파일 정보/상태/오류 표시 (공통)
   */
  _showFileInfo(file, content) {
    // 파일 정보 표시 (공통)
    if (this.ui && this.ui.fileInfo) {
      const sizeKB = (file.size / 1024).toFixed(2);
      this.ui.fileInfo.innerHTML = `<span>${file.name}</span> <span class="text-gray-500">(${sizeKB} KB)</span>`;
    }
    this._updateUIState('fileSelected');
  },
  _showError(message) {
    // 오류 메시지는 반드시 i18n을 통해 출력해야 함
    const i18n = window.FileToQR && window.FileToQR.i18n;
    const errorTitle = i18n && typeof i18n.translate === 'function'
      ? i18n.translate('errors.errorOccurred', {}, '오류 발생')
      : '오류 발생';
    if (this.ui && this.ui.errorMsg) {
      this.ui.errorMsg.textContent = `${errorTitle}: ${message}`;
      this.ui.errorMsg.className = 'text-red-600 text-sm mt-2';
    } else {
      alert(`${errorTitle}: ${message}`);
    }
    this._updateUIState('error');
  },
  _t(key, defaultMsg) {
    // i18n 번역 헬퍼
    const i18n = window.FileToQR && window.FileToQR.i18n;
    return i18n && typeof i18n.translate === 'function'
      ? i18n.translate(key, {}, defaultMsg || key)
      : (defaultMsg || key);
  }
};

// 글로벌 네임스페이스에 등록
if (typeof window !== 'undefined') {
  window.FileToQR = window.FileToQR || {};
  window.FileToQR.FileToQRCore = FileToQRCore;
}

export default FileToQRCore; 