/**
 * file-to-qr.js - 파일을 QR 코드로 변환하는 기능을 제공하는 모듈
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
  
  // 파일을 QR 코드로 변환하는 모듈
  const fileToQR = FileToQR.fileToQR = {};
  
  // 설정 값
  const config = {
    // QR 코드 버전 (1-40), 높을수록 더 많은 데이터 저장 가능
    qrVersion: 20,
    // 오류 수정 레벨 (L: 7%, M: 15%, Q: 25%, H: 30%)
    errorCorrectionLevel: 'M',
    // 각 QR 코드 당 최대 바이트 수 (버전과 오류 수정 레벨에 따라 조정)
    bytesPerQR: 1000,
    // QR 코드 여백 (셀 단위)
    margin: 2,
    // QR 코드 이미지 크기 (픽셀)
    size: 512,
    // 전경색
    foregroundColor: '#000000',
    // 배경색
    backgroundColor: '#FFFFFF'
  };
  
  // 진행 상황 콜백
  let progressCallback = null;
  
  // 현재 변환 작업 취소 플래그
  let isCancelled = false;
  
  /**
   * 모듈 초기화
   */
  function init() {
    console.log('파일-QR 변환기 초기화 중...');
    
    // 모듈 등록
    if (registry) {
      try {
        registry.register('converters', 'file-to-qr', {
          convertFileToQR,
          cancelConversion
        });
      } catch (e) {
        console.warn('모듈 등록 실패:', e);
      }
    }
    
    console.log('파일-QR 변환기 초기화 완료');
  }
  
  /**
   * 파일을 QR 코드로 변환
   * @param {File} file - 변환할 파일
   * @param {Object} options - 변환 옵션
   * @param {Function} onProgress - 진행 상황 콜백 함수
   * @returns {Promise<Array>} - 생성된 QR 코드 이미지 URL 배열을 반환하는 Promise
   */
  function convertFileToQR(file, options = {}, onProgress = null) {
    return new Promise((resolve, reject) => {
      if (!file) {
        reject(new Error('파일이 제공되지 않았습니다.'));
        return;
      }
      
      // 옵션 설정
      const settings = Object.assign({}, config, options);
      
      // 진행 상황 콜백 설정
      progressCallback = onProgress;
      
      // 취소 플래그 초기화
      isCancelled = false;
      
      // 파일 읽기
      const reader = new FileReader();
      
      reader.onload = async function(e) {
        try {
          const fileData = new Uint8Array(e.target.result);
          
          // 메타데이터 추가 (파일 이름, 크기, 타입)
          const metadata = {
            name: file.name,
            size: file.size,
            type: file.type || 'application/octet-stream',
            chunks: 0, // 청크 수는 나중에 계산
            timestamp: Date.now()
          };
          
          // 메타데이터를 JSON 문자열로 변환
          const metadataStr = JSON.stringify(metadata);
          
          // 파일 데이터를 청크로 분할
          const chunks = splitIntoChunks(fileData, settings.bytesPerQR);
          
          // 메타데이터 업데이트
          metadata.chunks = chunks.length;
          
          // 메타데이터 QR 코드 생성 (첫 번째 QR 코드)
          const updatedMetadataStr = JSON.stringify(metadata);
          const metadataQR = await generateQRCode('META:' + updatedMetadataStr, settings);
          
          // 모든 데이터 청크에 대한 QR 코드 생성
          const qrCodes = [metadataQR]; // 메타데이터 QR 코드를 배열에 추가
          
          for (let i = 0; i < chunks.length; i++) {
            // 취소 확인
            if (isCancelled) {
              reject(new Error('사용자에 의해 변환이 취소되었습니다.'));
              return;
            }
            
            // 청크 인덱스와 데이터를 포함한 페이로드 생성
            const payload = `CHUNK:${i}:${chunks[i]}`;
            
            // QR 코드 생성
            const qrCode = await generateQRCode(payload, settings);
            qrCodes.push(qrCode);
            
            // 진행 상황 업데이트
            updateProgress(i + 1, chunks.length);
          }
          
          resolve(qrCodes);
        } catch (err) {
          reject(err);
        }
      };
      
      reader.onerror = function() {
        reject(new Error('파일 읽기 오류: ' + reader.error));
      };
      
      // 파일을 ArrayBuffer로 읽기
      reader.readAsArrayBuffer(file);
    });
  }
  
  /**
   * 파일 데이터를 청크로 분할
   * @param {Uint8Array} fileData - 파일 데이터
   * @param {number} chunkSize - 청크 크기 (바이트)
   * @returns {Array<string>} - Base64로 인코딩된 데이터 청크 배열
   */
  function splitIntoChunks(fileData, chunkSize) {
    const chunks = [];
    const totalChunks = Math.ceil(fileData.length / chunkSize);
    
    for (let i = 0; i < totalChunks; i++) {
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, fileData.length);
      const chunk = fileData.slice(start, end);
      
      // Uint8Array를 Base64 문자열로 변환
      const binary = Array.from(chunk)
        .map(byte => String.fromCharCode(byte))
        .join('');
      const base64 = btoa(binary);
      
      chunks.push(base64);
    }
    
    return chunks;
  }
  
  /**
   * QR 코드 생성
   * @param {string} data - QR 코드에 인코딩할 데이터
   * @param {Object} settings - QR 코드 설정
   * @returns {Promise<string>} - 생성된 QR 코드 이미지 URL을 반환하는 Promise
   */
  function generateQRCode(data, settings) {
    return new Promise((resolve, reject) => {
      try {
        // QR 코드 생성을 위한 임시 컨테이너
        const container = document.createElement('div');
        container.style.position = 'absolute';
        container.style.top = '-9999px';
        container.style.left = '-9999px';
        document.body.appendChild(container);
        
        // QR 코드 생성
        const qrCode = new QRCode(container, {
          text: data,
          width: settings.size,
          height: settings.size,
          colorDark: settings.foregroundColor,
          colorLight: settings.backgroundColor,
          correctLevel: QRCode.CorrectLevel[settings.errorCorrectionLevel],
          version: settings.qrVersion,
          margin: settings.margin
        });
        
        // QR 코드 이미지 URL 가져오기
        setTimeout(() => {
          const imageURL = container.querySelector('img').src;
          document.body.removeChild(container);
          resolve(imageURL);
        }, 100);
      } catch (err) {
        reject(new Error('QR 코드 생성 실패: ' + err.message));
      }
    });
  }
  
  /**
   * 진행 상황 업데이트
   * @param {number} current - 현재 처리 중인 청크 인덱스
   * @param {number} total - 총 청크 수
   */
  function updateProgress(current, total) {
    if (progressCallback) {
      const percent = Math.round((current / total) * 100);
      progressCallback({
        percent,
        current,
        total,
        stage: '파일을 QR 코드로 변환 중',
        detail: `청크 ${current}/${total} 처리 중...`
      });
    }
  }
  
  /**
   * 현재 변환 작업 취소
   */
  function cancelConversion() {
    isCancelled = true;
  }
  
  /**
   * QR 코드 이미지 팩을 ZIP 파일로 다운로드
   * @param {Array<string>} qrCodes - QR 코드 이미지 URL 배열
   * @param {string} filename - 다운로드할 ZIP 파일 이름
   * @param {Function} onProgress - 진행 상황 콜백 함수
   * @returns {Promise<Blob>} - 생성된 ZIP 파일 Blob을 반환하는 Promise
   */
  fileToQR.downloadQRCodePack = async function(qrCodes, filename, onProgress = null) {
    // JSZip 라이브러리가 로드되었는지 확인
    if (typeof JSZip === 'undefined') {
      throw new Error('JSZip 라이브러리가 로드되지 않았습니다.');
    }
    
    return new Promise(async (resolve, reject) => {
      try {
        const zip = new JSZip();
        
        // QR 코드 이미지를 ZIP 파일에 추가
        for (let i = 0; i < qrCodes.length; i++) {
          const imageURL = qrCodes[i];
          
          // Data URL에서 실제 이미지 데이터 추출
          const base64Data = imageURL.split(',')[1];
          const binaryData = atob(base64Data);
          const dataArray = new Uint8Array(binaryData.length);
          
          for (let j = 0; j < binaryData.length; j++) {
            dataArray[j] = binaryData.charCodeAt(j);
          }
          
          // ZIP 파일에 이미지 추가
          const fileName = i === 0 ? '000_metadata.png' : `${String(i).padStart(3, '0')}_chunk.png`;
          zip.file(fileName, dataArray, { binary: true });
          
          // 진행 상황 업데이트
          if (onProgress) {
            onProgress({
              percent: Math.round((i + 1) / qrCodes.length * 100),
              current: i + 1,
              total: qrCodes.length,
              stage: 'QR 코드 팩 생성 중',
              detail: `이미지 ${i + 1}/${qrCodes.length} 처리 중...`
            });
          }
        }
        
        // README 파일 추가
        const readme = `FileToQR 변환 안내
===================

이 ZIP 파일에는 원본 파일로 변환할 수 있는 QR 코드 이미지가 포함되어 있습니다.
다음 단계에 따라 QR 코드를 스캔하고 파일을 복원하세요:

1. 000_metadata.png 파일을 먼저 스캔하세요. 이 파일은 변환된 파일에 대한 중요한 정보를 포함하고 있습니다.
2. 나머지 QR 코드를 순서대로 스캔하세요 (001_chunk.png부터 시작).
3. 모든 QR 코드가 스캔되면 원본 파일이 자동으로 복원됩니다.

참고: QR 코드를 스캔하려면 FileToQR 웹사이트의 QR 스캐너 도구를 사용하거나 모바일 앱을 사용하세요.

생성 날짜: ${new Date().toLocaleString()}
`;
        
        zip.file('README.txt', readme);
        
        // ZIP 파일 생성
        const zipBlob = await zip.generateAsync({
          type: 'blob',
          compression: 'DEFLATE',
          compressionOptions: { level: 6 }
        }, (metadata) => {
          if (onProgress) {
            onProgress({
              percent: metadata.percent,
              stage: 'ZIP 파일 생성 중',
              detail: `압축 중...`
            });
          }
        });
        
        resolve(zipBlob);
      } catch (err) {
        reject(new Error('QR 코드 팩 생성 실패: ' + err.message));
      }
    });
  };
  
  // 모듈 초기화
  init();
})(); 