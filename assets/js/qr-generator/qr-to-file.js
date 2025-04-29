/**
 * qr-to-file.js - QR 코드에서 파일을 복원하는 기능을 제공하는 모듈
 * 버전: 1.0.0
 * 최종 업데이트: 2025-04-28
 */

// 즉시 실행 함수로 네임스페이스 보호
(function() {
  'use strict';

  // 전역 네임스페이스
  const FileToQR = window.FileToQR = window.FileToQR || {};
  
  // 모듈 레지스트리 참조
  const registry = FileToQR.registry;
  
  // QR 코드에서 파일을 복원하는 모듈
  const qrToFile = FileToQR.qrToFile = {};
  
  // 현재 복원 상태
  let recoveryState = {
    metadata: null,
    chunks: {},
    totalChunks: 0,
    recoveredChunks: 0,
    isComplete: false
  };
  
  // 진행 상황 콜백
  let progressCallback = null;
  
  /**
   * 모듈 초기화
   */
  function init() {
    console.log('QR-파일 복원기 초기화 중...');
    
    // 모듈 등록
    if (registry) {
      try {
        registry.register('qr-generator', 'qr-to-file', {
          processQRData,
          resetRecovery,
          getRecoveryState,
          reconstructFile
        });
      } catch (e) {
        console.warn('모듈 등록 실패:', e);
      }
    }
    
    console.log('QR-파일 복원기 초기화 완료');
  }
  
  /**
   * QR 코드 데이터 처리
   * @param {string} data - QR 코드에서 스캔한 데이터
   * @param {Function} onProgress - 진행 상황 콜백 함수
   * @returns {Object} - 현재 복원 상태
   */
  function processQRData(data, onProgress = null) {
    // 진행 상황 콜백 설정
    progressCallback = onProgress;
    
    try {
      // 메타데이터 QR 코드 처리
      if (data.startsWith('META:')) {
        return processMetadataQR(data.substring(5)); // 'META:' 접두사 제거
      }
      
      // 청크 QR 코드 처리
      if (data.startsWith('CHUNK:')) {
        return processChunkQR(data.substring(6)); // 'CHUNK:' 접두사 제거
      }
      
      // 알 수 없는 형식의 QR 코드
      throw new Error('지원되지 않는 QR 코드 형식입니다.');
    } catch (err) {
      console.error('QR 코드 처리 오류:', err);
      throw err;
    }
  }
  
  /**
   * 메타데이터 QR 코드 처리
   * @param {string} metadataJson - 메타데이터 JSON 문자열
   * @returns {Object} - 업데이트된 복원 상태
   */
  function processMetadataQR(metadataJson) {
    try {
      // JSON 파싱
      const metadata = JSON.parse(metadataJson);
      
      // 메타데이터 유효성 검사
      if (!metadata.name || !metadata.size || !metadata.chunks) {
        throw new Error('메타데이터가 유효하지 않습니다.');
      }
      
      // 현재 복원 작업 초기화
      resetRecovery();
      
      // 메타데이터 설정
      recoveryState.metadata = metadata;
      recoveryState.totalChunks = metadata.chunks;
      
      // 진행 상황 업데이트
      updateProgress();
      
      return { ...recoveryState };
    } catch (err) {
      console.error('메타데이터 처리 오류:', err);
      throw new Error('메타데이터 QR 코드 처리 실패: ' + err.message);
    }
  }
  
  /**
   * 청크 QR 코드 처리
   * @param {string} chunkData - 청크 데이터 문자열 (인덱스:데이터)
   * @returns {Object} - 업데이트된 복원 상태
   */
  function processChunkQR(chunkData) {
    try {
      // 메타데이터가 설정되었는지 확인
      if (!recoveryState.metadata) {
        throw new Error('먼저 메타데이터 QR 코드를 스캔해야 합니다.');
      }
      
      // 청크 인덱스와 데이터 분리
      const separatorIndex = chunkData.indexOf(':');
      if (separatorIndex === -1) {
        throw new Error('잘못된 청크 데이터 형식입니다.');
      }
      
      const chunkIndex = parseInt(chunkData.substring(0, separatorIndex));
      const base64Data = chunkData.substring(separatorIndex + 1);
      
      // 청크 인덱스 유효성 검사
      if (isNaN(chunkIndex) || chunkIndex < 0 || chunkIndex >= recoveryState.totalChunks) {
        throw new Error(`유효하지 않은 청크 인덱스입니다: ${chunkIndex}`);
      }
      
      // 청크가 이미 처리되었는지 확인
      if (recoveryState.chunks[chunkIndex]) {
        console.warn(`청크 ${chunkIndex}는 이미 처리되었습니다.`);
        return { ...recoveryState };
      }
      
      // 청크 데이터 저장
      recoveryState.chunks[chunkIndex] = base64Data;
      recoveryState.recoveredChunks++;
      
      // 모든 청크가 복원되었는지 확인
      recoveryState.isComplete = recoveryState.recoveredChunks === recoveryState.totalChunks;
      
      // 진행 상황 업데이트
      updateProgress();
      
      return { ...recoveryState };
    } catch (err) {
      console.error('청크 처리 오류:', err);
      throw new Error('청크 QR 코드 처리 실패: ' + err.message);
    }
  }
  
  /**
   * 복원 상태 초기화
   */
  function resetRecovery() {
    recoveryState = {
      metadata: null,
      chunks: {},
      totalChunks: 0,
      recoveredChunks: 0,
      isComplete: false
    };
    
    console.log('복원 상태가 초기화되었습니다.');
  }
  
  /**
   * 현재 복원 상태 가져오기
   * @returns {Object} - 현재 복원 상태
   */
  function getRecoveryState() {
    return { ...recoveryState };
  }
  
  /**
   * 수집된 청크에서 파일 재구성
   * @returns {Promise<Blob>} - 재구성된 파일 Blob을 반환하는 Promise
   */
  function reconstructFile() {
    return new Promise((resolve, reject) => {
      try {
        // 복원이 완료되었는지 확인
        if (!recoveryState.isComplete) {
          throw new Error(`모든 청크가 복원되지 않았습니다. (${recoveryState.recoveredChunks}/${recoveryState.totalChunks})`);
        }
        
        // 모든 청크를 올바른 순서로 병합
        const orderedChunks = [];
        for (let i = 0; i < recoveryState.totalChunks; i++) {
          if (!recoveryState.chunks[i]) {
            throw new Error(`청크 ${i}가 누락되었습니다.`);
          }
          orderedChunks.push(recoveryState.chunks[i]);
        }
        
        // Base64로 인코딩된 청크를 Uint8Array로 변환
        const fileData = new Uint8Array(recoveryState.metadata.size);
        let offset = 0;
        
        for (let i = 0; i < orderedChunks.length; i++) {
          // Base64 디코딩
          const binaryData = atob(orderedChunks[i]);
          const chunkData = new Uint8Array(binaryData.length);
          
          for (let j = 0; j < binaryData.length; j++) {
            // 바이너리 데이터를 Uint8Array에 복사
            chunkData[j] = binaryData.charCodeAt(j);
            
            // 파일 크기를 초과하지 않도록 확인
            if (offset + j < fileData.length) {
              fileData[offset + j] = chunkData[j];
            }
          }
          
          offset += chunkData.length;
        }
        
        // 파일 타입 확인
        const fileType = recoveryState.metadata.type || 'application/octet-stream';
        
        // 재구성된 파일을 Blob으로 생성
        const fileBlob = new Blob([fileData], { type: fileType });
        
        // 성공적으로 파일 재구성 완료
        resolve({
          blob: fileBlob,
          metadata: recoveryState.metadata
        });
      } catch (err) {
        console.error('파일 재구성 오류:', err);
        reject(new Error('파일 재구성 실패: ' + err.message));
      }
    });
  }
  
  /**
   * 진행 상황 업데이트
   */
  function updateProgress() {
    if (progressCallback) {
      const percent = recoveryState.totalChunks > 0
        ? Math.round((recoveryState.recoveredChunks / recoveryState.totalChunks) * 100)
        : 0;
      
      const metadata = recoveryState.metadata || {};
      
      progressCallback({
        percent,
        current: recoveryState.recoveredChunks,
        total: recoveryState.totalChunks,
        stage: '파일 복원 중',
        detail: `청크 ${recoveryState.recoveredChunks}/${recoveryState.totalChunks} 처리됨`,
        metadata: {
          filename: metadata.name || '알 수 없음',
          filesize: metadata.size ? formatFileSize(metadata.size) : '알 수 없음',
          filetype: metadata.type || '알 수 없음'
        },
        isComplete: recoveryState.isComplete
      });
    }
  }
  
  /**
   * 파일 크기를 읽기 쉬운 형식으로 포맷팅
   * @param {number} bytes - 바이트 단위의 파일 크기
   * @returns {string} - 포맷팅된 파일 크기 문자열
   */
  function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
  
  /**
   * 복원된 파일 다운로드
   * @param {Blob} fileBlob - 파일 Blob
   * @param {string} filename - 다운로드할 파일 이름
   */
  qrToFile.downloadReconstructedFile = function(fileBlob, filename) {
    // 다운로드 링크 생성
    const downloadLink = document.createElement('a');
    downloadLink.href = URL.createObjectURL(fileBlob);
    downloadLink.download = filename;
    
    // 링크를 DOM에 추가하고 클릭 이벤트 트리거
    document.body.appendChild(downloadLink);
    downloadLink.click();
    
    // 링크 제거
    document.body.removeChild(downloadLink);
    
    // Blob URL 해제
    setTimeout(() => {
      URL.revokeObjectURL(downloadLink.href);
    }, 100);
  };
  
  // 모듈 초기화
  init();
})(); 