/**
 * file-to-qr.js - FileToQR 파일-QR 변환 모듈
 * 버전: 1.0.0
 * 최종 업데이트: 2023-09-28
 * 
 * 이 모듈은 파일을 QR 코드로 변환하는 기능을 제공합니다:
 * - 파일 데이터를 여러 QR 코드로 분할
 * - 메타데이터 QR 코드 생성 (파일 이름, 크기, 청크 수 등)
 * - QR 코드 스캔을 통한 파일 복원
 */

import FileUtils from '../utils/file-utils.js';

// 상수 정의
const CHUNK_SIZE = 1500; // QR 코드 청크당 최대 바이트 수
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 최대 파일 크기 (5MB)

// FileToQR 모듈
const FileToQR = {
  // 내부 상태
  state: {
    initialized: false,
    currentFile: null,
    chunks: [],
    currentChunkIndex: 0,
    totalChunks: 0,
    metadataQR: null
  },

  /**
   * 모듈 초기화
   * @returns {Promise<boolean>} 초기화 성공 여부
   */
  async init() {
    if (this.state.initialized) {
      console.log('FileToQR 모듈이 이미 초기화되었습니다.');
      return true;
    }

    console.log('FileToQR 모듈 초기화 중...');
    
    try {
      // QR 코드 생성 모듈이 초기화되었는지 확인
      if (!window.FileToQR || !window.FileToQR.QRGenerator) {
        console.warn('QR Generator 모듈이 발견되지 않았습니다. 먼저 초기화해야 합니다.');
        
        // 모듈이 있으면 초기화 시도
        if (typeof QRGenerator !== 'undefined' && typeof QRGenerator.init === 'function') {
          await QRGenerator.init();
        } else {
          throw new Error('QR Generator 모듈을 찾을 수 없습니다.');
        }
      }
      
      // UI 이벤트 리스너 등록
      this._registerEventListeners();
      
      this.state.initialized = true;
      console.log('FileToQR 모듈 초기화 완료');
      return true;
    } catch (error) {
      console.error('FileToQR 모듈 초기화 중 오류 발생:', error);
      return false;
    }
  },

  /**
   * 파일을 QR 코드로 변환
   * @param {File} file - 변환할 파일
   * @returns {Promise<Object>} 변환 결과 (메타데이터 및 청크 QR 코드)
   */
  async convertFileToQR(file) {
    if (!file) {
      throw new Error('파일이 제공되지 않았습니다.');
    }

    console.log(`파일 변환 시작: ${file.name} (${FileUtils.formatFileSize(file.size)})`);
    
    // 파일 크기 검증
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`파일 크기가 너무 큽니다. 최대 ${FileUtils.formatFileSize(MAX_FILE_SIZE)}까지 허용됩니다.`);
    }

    try {
      // 상태 초기화
      this.state.currentFile = file;
      this.state.chunks = [];
      this.state.currentChunkIndex = 0;
      
      // 파일을 바이너리 데이터로 변환
      const arrayBuffer = await this._readFileAsArrayBuffer(file);
      
      // 데이터를 청크로 분할
      const chunks = this._splitIntoChunks(arrayBuffer, CHUNK_SIZE);
      this.state.chunks = chunks;
      this.state.totalChunks = chunks.length;
      
      console.log(`파일이 ${chunks.length}개의 청크로 분할되었습니다.`);
      
      // 메타데이터 생성
      const metadata = {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type || this._getMimeTypeFromFileName(file.name),
        totalChunks: chunks.length,
        chunkSize: CHUNK_SIZE,
        dateCreated: new Date().toISOString()
      };
      
      // 메타데이터 QR 코드 생성
      const metadataQR = await this._generateMetadataQR(metadata);
      this.state.metadataQR = metadataQR;
      
      return {
        metadata: metadata,
        metadataQR: metadataQR,
        totalChunks: chunks.length
      };
    } catch (error) {
      console.error('파일 변환 중 오류 발생:', error);
      throw error;
    }
  },

  /**
   * 다음 청크 QR 코드 생성
   * @returns {Promise<Object>} 다음 청크 QR 코드 정보
   */
  async generateNextChunkQR() {
    if (!this.state.currentFile || this.state.chunks.length === 0) {
      throw new Error('먼저 파일을 변환해야 합니다.');
    }

    if (this.state.currentChunkIndex >= this.state.totalChunks) {
      return { complete: true };
    }

    try {
      const chunkIndex = this.state.currentChunkIndex;
      const chunk = this.state.chunks[chunkIndex];
      
      // 청크 데이터에 인덱스 정보 추가
      const chunkData = {
        index: chunkIndex,
        total: this.state.totalChunks,
        data: chunk
      };
      
      // 청크 데이터를 JSON 문자열로 변환
      const chunkString = JSON.stringify(chunkData);
      
      // QR 코드 생성
      const qrCodeCanvas = await window.FileToQR.QRGenerator.generateQRCode({
        content: chunkString,
        size: 256,
        errorCorrectionLevel: 'H'
      });
      
      // 인덱스 증가
      this.state.currentChunkIndex++;
      
      return {
        canvas: qrCodeCanvas,
        index: chunkIndex,
        total: this.state.totalChunks,
        progress: (chunkIndex + 1) / this.state.totalChunks,
        complete: this.state.currentChunkIndex >= this.state.totalChunks
      };
    } catch (error) {
      console.error('청크 QR 코드 생성 중 오류 발생:', error);
      throw error;
    }
  },

  /**
   * QR 코드 데이터에서 파일 복원
   * @param {Array<Object>} chunks - QR 코드에서 추출한 데이터 청크 배열
   * @param {Object} metadata - 파일 메타데이터
   * @returns {Promise<Blob>} 복원된 파일 Blob
   */
  async reconstructFileFromQR(chunks, metadata) {
    if (!chunks || chunks.length === 0 || !metadata) {
      throw new Error('복원에 필요한 데이터가 부족합니다.');
    }

    try {
      console.log(`파일 복원 시작: ${metadata.fileName}`);
      
      // 청크를 인덱스 순으로 정렬
      chunks.sort((a, b) => a.index - b.index);
      
      // 모든 청크가 있는지 확인
      if (chunks.length !== metadata.totalChunks) {
        throw new Error(`일부 청크가 누락되었습니다. 예상: ${metadata.totalChunks}, 실제: ${chunks.length}`);
      }
      
      // 청크 데이터를 하나의 배열로 병합
      const mergedArray = this._mergeChunks(chunks.map(chunk => chunk.data));
      
      // Blob 생성
      const blob = new Blob([mergedArray], { type: metadata.fileType });
      
      console.log(`파일 복원 완료: ${metadata.fileName} (${FileUtils.formatFileSize(blob.size)})`);
      
      return blob;
    } catch (error) {
      console.error('파일 복원 중 오류 발생:', error);
      throw error;
    }
  },

  /**
   * 파일을 ArrayBuffer로 읽기
   * @param {File} file - 읽을 파일
   * @returns {Promise<ArrayBuffer>} 파일 데이터
   * @private
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
   * ArrayBuffer를 청크로 분할
   * @param {ArrayBuffer} buffer - 분할할 버퍼
   * @param {number} chunkSize - 청크 크기 (바이트)
   * @returns {Array<string>} Base64 인코딩된 청크 배열
   * @private
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
   * Uint8Array를 Base64 문자열로 변환
   * @param {Uint8Array} buffer - 변환할 버퍼
   * @returns {string} Base64 인코딩된 문자열
   * @private
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
   * Base64 문자열을 ArrayBuffer로 변환
   * @param {string} base64 - 변환할 Base64 문자열
   * @returns {ArrayBuffer} 변환된 ArrayBuffer
   * @private
   */
  _base64ToArrayBuffer(base64) {
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    return bytes.buffer;
  },

  /**
   * 여러 청크를 하나의 ArrayBuffer로 병합
   * @param {Array<string>} chunks - Base64 인코딩된 청크 배열
   * @returns {ArrayBuffer} 병합된 ArrayBuffer
   * @private
   */
  _mergeChunks(chunks) {
    // 모든 청크의 전체 크기 계산
    let totalLength = 0;
    const buffers = chunks.map(chunk => {
      const buffer = this._base64ToArrayBuffer(chunk);
      totalLength += buffer.byteLength;
      return buffer;
    });
    
    // 모든 청크를 하나의 ArrayBuffer로 병합
    const mergedArray = new Uint8Array(totalLength);
    let offset = 0;
    
    buffers.forEach(buffer => {
      mergedArray.set(new Uint8Array(buffer), offset);
      offset += buffer.byteLength;
    });
    
    return mergedArray.buffer;
  },

  /**
   * 메타데이터 QR 코드 생성
   * @param {Object} metadata - 파일 메타데이터
   * @returns {Promise<HTMLCanvasElement>} QR 코드 캔버스
   * @private
   */
  async _generateMetadataQR(metadata) {
    // 메타데이터를 JSON 문자열로 변환
    const metadataString = JSON.stringify({
      type: 'FileToQR_Metadata',
      version: '1.0',
      ...metadata
    });
    
    // QR 코드 생성 (고수준 오류 수정 레벨 사용)
    return await window.FileToQR.QRGenerator.generateQRCode({
      content: metadataString,
      size: 256,
      errorCorrectionLevel: 'H'
    });
  },

  /**
   * 파일명에서 MIME 타입 추론
   * @param {string} fileName - 파일명
   * @returns {string} MIME 타입
   * @private
   */
  _getMimeTypeFromFileName(fileName) {
    const extension = FileUtils.getFileExtension(fileName);
    return FileUtils.getMimeType(extension);
  },

  /**
   * 이벤트 리스너 등록
   * @private
   */
  _registerEventListeners() {
    // 파일 선택 변경 이벤트
    const fileInput = document.getElementById('file-input');
    if (fileInput) {
      fileInput.addEventListener('change', async (event) => {
        try {
          const file = event.target.files[0];
          if (file) {
            // 파일 정보 표시
            this._displayFileInfo(file);
            
            // 자동으로 파일을 QR 코드로 변환
            await this.convertFileToQR(file);
            
            // UI 업데이트
            this._updateFileConversionUI(true);
          }
        } catch (error) {
          console.error('파일 처리 중 오류 발생:', error);
          this._showErrorMessage(error.message);
        }
      });
    }
    
    // 생성 버튼 클릭 이벤트
    const generateBtn = document.getElementById('generate-file-qr');
    if (generateBtn) {
      generateBtn.addEventListener('click', async () => {
        try {
          if (!this.state.currentFile) {
            throw new Error('먼저 파일을 선택해주세요.');
          }
          
          // 메타데이터 QR 코드 표시
          this._displayMetadataQRCode();
          
          // 첫 번째 청크 QR 코드 생성 및 표시
          await this._displayNextChunkQRCode();
        } catch (error) {
          console.error('QR 코드 생성 중 오류 발생:', error);
          this._showErrorMessage(error.message);
        }
      });
    }
    
    // 다음 청크 버튼 클릭 이벤트
    const nextChunkBtn = document.getElementById('next-chunk-btn');
    if (nextChunkBtn) {
      nextChunkBtn.addEventListener('click', async () => {
        try {
          await this._displayNextChunkQRCode();
        } catch (error) {
          console.error('다음 청크 표시 중 오류 발생:', error);
          this._showErrorMessage(error.message);
        }
      });
    }
  },

  /**
   * 파일 정보 표시
   * @param {File} file - 표시할 파일
   * @private
   */
  _displayFileInfo(file) {
    const fileInfoDiv = document.querySelector('.file-info');
    const fileName = document.querySelector('.file-name');
    const fileType = document.querySelector('.file-type');
    const fileSize = document.querySelector('.file-size');
    
    if (fileInfoDiv && fileName && fileType && fileSize) {
      fileName.textContent = file.name;
      fileType.textContent = file.type || '알 수 없음';
      fileSize.textContent = FileUtils.formatFileSize(file.size);
      
      fileInfoDiv.classList.remove('hidden');
    }
  },

  /**
   * 메타데이터 QR 코드 표시
   * @private
   */
  _displayMetadataQRCode() {
    const qrPreview = document.getElementById('qr-preview');
    
    if (qrPreview && this.state.metadataQR) {
      // 기존 콘텐츠 초기화
      qrPreview.innerHTML = '';
      
      // 메타데이터 QR 코드 추가
      qrPreview.appendChild(this.state.metadataQR);
      
      // 설명 텍스트 추가
      const infoDiv = document.createElement('div');
      infoDiv.className = 'text-center mt-4 text-gray-700';
      infoDiv.innerHTML = `
        <h3 class="font-medium">메타데이터 QR 코드</h3>
        <p class="text-sm">이 QR 코드를 먼저 스캔하세요. 총 ${this.state.totalChunks}개의 QR 코드가 필요합니다.</p>
      `;
      qrPreview.appendChild(infoDiv);
      
      // 탐색 버튼 표시
      this._displayNavigationButtons(0, this.state.totalChunks);
    }
  },

  /**
   * 다음 청크 QR 코드 표시
   * @private
   */
  async _displayNextChunkQRCode() {
    const qrPreview = document.getElementById('qr-preview');
    
    if (!qrPreview) return;
    
    try {
      // 다음 청크 QR 코드 생성
      const result = await this.generateNextChunkQR();
      
      if (result.complete) {
        // 모든 청크 표시 완료
        qrPreview.innerHTML = `
          <div class="p-4 bg-green-100 text-green-800 rounded-lg text-center">
            <h3 class="font-medium text-lg mb-2">모든 QR 코드 생성 완료!</h3>
            <p>총 ${this.state.totalChunks}개의 QR 코드가 생성되었습니다.</p>
            <button id="restart-conversion" class="mt-4 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
              처음부터 다시 시작
            </button>
          </div>
        `;
        
        // 다시 시작 버튼 이벤트 리스너
        const restartBtn = document.getElementById('restart-conversion');
        if (restartBtn) {
          restartBtn.addEventListener('click', () => {
            // 상태 초기화
            this.state.currentChunkIndex = 0;
            
            // 메타데이터 QR 코드부터 다시 표시
            this._displayMetadataQRCode();
          });
        }
        
        return;
      }
      
      // QR 코드 표시
      qrPreview.innerHTML = '';
      qrPreview.appendChild(result.canvas);
      
      // 정보 텍스트 추가
      const infoDiv = document.createElement('div');
      infoDiv.className = 'text-center mt-4 text-gray-700';
      infoDiv.innerHTML = `
        <h3 class="font-medium">데이터 QR 코드 ${result.index + 1}/${result.total}</h3>
        <p class="text-sm">이 QR 코드를 스캔한 후 다음 버튼을 눌러주세요.</p>
        <div class="w-full bg-gray-200 rounded-full h-2.5 mt-2">
          <div class="bg-blue-600 h-2.5 rounded-full" style="width: ${Math.round(result.progress * 100)}%"></div>
        </div>
      `;
      qrPreview.appendChild(infoDiv);
      
      // 탐색 버튼 표시
      this._displayNavigationButtons(result.index + 1, result.total);
      
    } catch (error) {
      console.error('청크 QR 코드 표시 중 오류 발생:', error);
      qrPreview.innerHTML = `
        <div class="p-4 bg-red-100 text-red-800 rounded-lg">
          <h3 class="font-medium">QR 코드 생성 실패</h3>
          <p>${error.message}</p>
        </div>
      `;
    }
  },

  /**
   * QR 코드 탐색 버튼 표시
   * @param {number} current - 현재 인덱스
   * @param {number} total - 전체 개수
   * @private
   */
  _displayNavigationButtons(current, total) {
    const navDiv = document.getElementById('qr-navigation');
    
    if (!navDiv) return;
    
    navDiv.innerHTML = '';
    navDiv.className = 'flex justify-between items-center mt-4';
    
    // 이전 버튼
    const prevBtn = document.createElement('button');
    prevBtn.className = 'px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300';
    prevBtn.textContent = '이전';
    prevBtn.disabled = current <= 0;
    if (current > 0) {
      prevBtn.addEventListener('click', () => {
        this.state.currentChunkIndex = current - 1;
        if (current === 1) {
          // 메타데이터로 돌아가기
          this._displayMetadataQRCode();
        } else {
          // 이전 청크로 돌아가기
          this._displayNextChunkQRCode();
        }
      });
    }
    navDiv.appendChild(prevBtn);
    
    // 진행 상태 표시
    const progressText = document.createElement('span');
    progressText.className = 'text-gray-600';
    progressText.textContent = `${current}/${total}`;
    navDiv.appendChild(progressText);
    
    // 다음 버튼
    const nextBtn = document.createElement('button');
    nextBtn.textContent = current < total ? '다음' : '완료';
    nextBtn.className = 'px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700';
    nextBtn.disabled = current >= total;
    if (current < total) {
      nextBtn.addEventListener('click', () => {
        this._displayNextChunkQRCode();
      });
    }
    navDiv.appendChild(nextBtn);
    
    navDiv.classList.remove('hidden');
  },

  /**
   * 파일 변환 UI 업데이트
   * @param {boolean} enabled - 활성화 여부
   * @private
   */
  _updateFileConversionUI(enabled) {
    const generateBtn = document.getElementById('generate-file-qr');
    
    if (generateBtn) {
      generateBtn.disabled = !enabled;
      generateBtn.classList.toggle('opacity-50', !enabled);
    }
  },

  /**
   * 오류 메시지 표시
   * @param {string} message - 표시할 메시지
   * @private
   */
  _showErrorMessage(message) {
    const qrPreview = document.getElementById('qr-preview');
    
    if (qrPreview) {
      qrPreview.innerHTML = `
        <div class="p-4 bg-red-100 text-red-800 rounded-lg">
          <h3 class="font-medium">오류 발생</h3>
          <p>${message}</p>
        </div>
      `;
    }
  }
};

// 브라우저 환경에서의 초기화
if (typeof window !== 'undefined') {
  window.FileToQR = window.FileToQR || {};
  window.FileToQR.fileToQR = FileToQR;
  
  // 페이지 로드 완료 시 자동 초기화
  document.addEventListener('DOMContentLoaded', async () => {
    console.log('FileToQR 모듈 자동 초기화 시작');
    await FileToQR.init();
  });
}

export default FileToQR; 