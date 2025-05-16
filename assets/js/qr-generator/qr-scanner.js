/**
 * qr-scanner.js - QR 코드 스캔 기능을 제공하는 모듈
 * 버전: 1.0.0
 * 최종 업데이트: 2025-06-15
 * 참조: ../../docs/architecture/qr-system.md
 * 
 * 이 모듈은 QR 코드 스캔 기능을 처리합니다:
 * - 카메라를 사용한 실시간 QR 코드 스캔
 * - 이미지 파일에서 QR 코드 인식
 * - 스캔 결과 처리 및 표시
 */

// 공통 유틸리티 모듈 임포트
import FileUtils from '../utils/file-utils.js';

// 즉시 실행 함수로 네임스페이스 보호
(function() {
  'use strict';

  // 전역 네임스페이스
  const FileToQR = window.FileToQR = window.FileToQR || {};
  
  // 모듈 레지스트리 참조
  const registry = FileToQR.registry;
  
  // 파일 유틸리티 참조
  let fileUtils = null;
  
  // QR 스캐너 객체
  const qrScanner = FileToQR.qrScanner = {};
  
  // DOM 요소 레퍼런스
  let video = null;
  let canvasElement = null;
  let canvas = null;
  let loadingMessage = null;
  let scannerContainer = null;
  
  // 스캐너 상태
  let isScanning = false;
  
  // 파일 복원 모드 플래그
  let isFileRecoveryMode = false;
  
  /**
   * 모듈 초기화
   */
  function initQRScanner() {
    console.log('QR 스캐너 초기화 중...');
    
    // FileToQR.utils가 준비되었는지 확인
    if (FileToQR.utils && FileToQR.utils.file) {
      fileUtils = FileToQR.utils.file;
      console.log('파일 유틸리티 참조 설정 완료');
    } else {
      console.warn('파일 유틸리티를 찾을 수 없습니다. 내부 기능으로 대체합니다.');
      fileUtils = FileUtils; // 새 유틸리티 모듈 사용
    }
    
    // DOM 요소 참조
    canvasElement = document.getElementById('scanner-canvas');
    if (!canvasElement) {
      console.error('스캐너 캔버스를 찾을 수 없습니다.');
      return;
    }
    
    canvas = canvasElement.getContext('2d');
    loadingMessage = document.getElementById('loading-message');
    scannerContainer = document.getElementById('scanner-container');
    
    // 비디오 요소 생성
    video = document.createElement('video');
    
    // 탭 초기화
    initTabs();
    
    // 이벤트 리스너 등록
    registerEventListeners();
    
    // 이미지에서 QR 코드 스캔 처리
    const imageInput = document.getElementById('qr-image-input');
    if (imageInput) {
      imageInput.addEventListener('change', handleImageSelect);
    }
    
    // 파일 복원 모드 체크
    const urlParams = new URLSearchParams(window.location.hash.substring(1));
    if (urlParams.has('mode') && urlParams.get('mode') === 'fileRecovery') {
      isFileRecoveryMode = true;
      
      // 파일 복원 UI 표시
      const fileRecoveryUI = document.getElementById('file-recovery-ui');
      if (fileRecoveryUI) {
        fileRecoveryUI.classList.remove('hidden');
      }
    }
    
    console.log('QR 스캐너 초기화 완료');
  }

  /**
   * 탭 초기화
   */
  function initTabs() {
    const scannerTabs = document.querySelectorAll('.scanner-tab');
    const scannerPanels = document.querySelectorAll('.scanner-panel');
    
    scannerTabs.forEach(tab => {
      tab.addEventListener('click', function() {
        // 모든 탭에서 active 클래스 제거
        scannerTabs.forEach(t => t.classList.remove('active'));
        // 클릭한 탭에 active 클래스 추가
        this.classList.add('active');
        
        // 모든 패널 숨기기
        scannerPanels.forEach(panel => panel.classList.add('hidden'));
        
        // 선택한 패널 표시
        const panelId = this.getAttribute('data-panel');
        const targetPanel = document.getElementById(panelId);
        if (targetPanel) {
          targetPanel.classList.remove('hidden');
        }
        
        // 카메라 스캔 패널이 선택되면 스캐너 시작
        if (panelId === 'camera-scan-panel') {
          startScanner();
        } else {
          stopScanner();
        }
      });
    });
  }

  /**
   * 이벤트 리스너 등록
   */
  function registerEventListeners() {
    // 스캔 결과 복사 버튼
    const copyButton = document.getElementById('copy-result');
    if (copyButton) {
      copyButton.addEventListener('click', copyResultToClipboard);
    }
    
    // 이미지에서 QR 코드 읽기 버튼
    const scanImageButton = document.getElementById('scan-image');
    if (scanImageButton) {
      scanImageButton.addEventListener('click', scanImage);
    }
    
    // 복원 작업 재설정 버튼
    const resetRecoveryButton = document.getElementById('reset-recovery');
    if (resetRecoveryButton) {
      resetRecoveryButton.addEventListener('click', resetFileRecovery);
    }
    
    // 파일 다운로드 버튼
    const downloadFileButton = document.getElementById('download-file');
    if (downloadFileButton) {
      downloadFileButton.addEventListener('click', downloadRecoveredFile);
    }
  }

  /**
   * 카메라 스캐너 시작
   */
  function startScanner() {
    if (isScanning) return;
    
    isScanning = true;
    
    // 로딩 메시지 표시
    if (loadingMessage) loadingMessage.innerText = "⌛ 카메라 액세스 요청 중...";
    
    // 비디오 스트림 설정
    navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment" }
    }).then(function(stream) {
      video.srcObject = stream;
      video.setAttribute("playsinline", true);  // iOS Safari에 필요
      video.play();
      
      // 비디오 재생 시작 시 스캔 루프 시작
      requestAnimationFrame(tick);
      
      // 로딩 메시지 숨김
      if (loadingMessage) loadingMessage.innerText = "";
    }).catch(function(err) {
      isScanning = false;
      console.error(err);
      if (loadingMessage) loadingMessage.innerText = "📵 카메라를 사용할 수 없습니다: " + err.message;
    });
  }

  /**
   * 스캔 루프 함수
   */
  function tick() {
    if (!isScanning) return;
    
    // 비디오가 재생 중인지 확인
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      // 로딩 메시지 숨김
      if (loadingMessage) loadingMessage.hidden = true;
      if (canvasElement) canvasElement.hidden = false;
      
      // 캔버스 크기 설정
      canvasElement.width = video.videoWidth;
      canvasElement.height = video.videoHeight;
      
      // 비디오 프레임을 캔버스에 그리기
      canvas.drawImage(video, 0, 0, canvasElement.width, canvasElement.height);
      
      // 이미지 데이터 가져오기
      const imageData = canvas.getImageData(0, 0, canvasElement.width, canvasElement.height);
      
      try {
        // jsQR 라이브러리로 QR 코드 검색
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "dontInvert",
        });
        
        // QR 코드가 발견되면
        if (code) {
          console.log('QR 코드 발견:', code.data);
          
          // 발견된 위치에 테두리 그리기
          canvas.lineWidth = 4;
          canvas.strokeStyle = "#FF3B58";
          
          // QR 코드 테두리
          canvas.beginPath();
          canvas.moveTo(code.location.topLeftCorner.x, code.location.topLeftCorner.y);
          canvas.lineTo(code.location.topRightCorner.x, code.location.topRightCorner.y);
          canvas.lineTo(code.location.bottomRightCorner.x, code.location.bottomRightCorner.y);
          canvas.lineTo(code.location.bottomLeftCorner.x, code.location.bottomLeftCorner.y);
          canvas.lineTo(code.location.topLeftCorner.x, code.location.topLeftCorner.y);
          canvas.stroke();
          
          // 일시 정지 및 결과 처리
          stopScanner();
          processQRResult(code.data);
        }
      } catch (error) {
        console.error('QR 코드 처리 오류:', error);
      }
    }
    
    // 다음 프레임 처리
    if (isScanning) {
      requestAnimationFrame(tick);
    }
  }

  /**
   * 스캐너 중지
   */
  function stopScanner() {
    if (!isScanning) return;
    
    isScanning = false;
    
    // 비디오 스트림 중지
    if (video && video.srcObject) {
      video.srcObject.getTracks().forEach(track => track.stop());
    }
    
    // 비디오 소스 제거
    if (video) video.srcObject = null;
  }
  
  /**
   * 스캐너 상태 초기화
   */
  function resetScanner() {
    stopScanner();
    
    // 비디오 소스 제거
    if (video) video.srcObject = null;
  }

  /**
   * 이미지 선택 처리
   */
  function handleImageSelect(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // 이미지 파일 확인
    if (!file.type.match('image.*')) {
      alert('이미지 파일만 선택할 수 있습니다.');
      return;
    }
    
    // 미리보기 표시
    const reader = new FileReader();
    reader.onload = function(e) {
      const previewImage = document.getElementById('preview-image');
      const imagePreview = document.getElementById('image-preview');
      
      if (previewImage) previewImage.src = e.target.result;
      if (imagePreview) imagePreview.classList.remove('hidden');
    };
    
    reader.readAsDataURL(file);
  }

  /**
   * 이미지에서 QR 코드 스캔
   */
  function scanImage() {
    const previewImage = document.getElementById('preview-image');
    
    if (!previewImage || !previewImage.src) {
      alert('먼저 이미지를 선택해주세요.');
      return;
    }
    
    // 처리 중 상태 표시
    const scanButton = document.getElementById('scan-image');
    if (scanButton) {
      scanButton.textContent = '처리 중...';
      scanButton.disabled = true;
    }
    
    // 이미지를 캔버스에 그리기
    const tempImage = new Image();
    tempImage.onload = function() {
      // 캔버스 크기 설정
      canvasElement.width = tempImage.width;
      canvasElement.height = tempImage.height;
      
      // 이미지 그리기
      canvas.drawImage(tempImage, 0, 0);
      
      // 이미지 데이터 가져오기
      const imageData = canvas.getImageData(0, 0, canvasElement.width, canvasElement.height);
      
      try {
        // jsQR 라이브러리로 QR 코드 검색
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "dontInvert",
        });
        
        // 스캔 버튼 초기화
        if (scanButton) {
          scanButton.textContent = '이미지에서 QR 코드 읽기';
          scanButton.disabled = false;
        }
        
        // QR 코드가 발견되면
        if (code) {
          console.log('QR 코드 발견:', code.data);
          processQRResult(code.data);
        } else {
          alert('이미지에서 QR 코드를 찾을 수 없습니다.\n다른 이미지를 시도하거나 QR 코드가 선명하게 보이는지 확인하세요.');
        }
      } catch (error) {
        console.error('QR 코드 처리 오류:', error);
        alert('QR 코드 처리 중 오류가 발생했습니다.');
        
        // 스캔 버튼 초기화
        if (scanButton) {
          scanButton.textContent = '이미지에서 QR 코드 읽기';
          scanButton.disabled = false;
        }
      }
    };
    
    tempImage.src = previewImage.src;
  }

  /**
   * QR 코드 결과 처리
   */
  function processQRResult(data) {
    console.log('QR 코드 결과 처리:', data);
    
    // 파일 복원 모드인 경우
    if (isFileRecoveryMode) {
      processFileRecoveryQR(data);
      return;
    }
    
    // 일반 QR 코드 결과 처리
    
    // 결과 영역 표시
    const resultContainer = document.getElementById('scan-result');
    if (resultContainer) resultContainer.classList.remove('hidden');
    
    // 결과 내용 설정
    const resultContent = document.getElementById('result-content');
    if (resultContent) resultContent.textContent = data;
    
    // 결과 타입 설정
    const resultType = document.getElementById('result-type');
    const resultAction = document.getElementById('result-action');
    
    let contentType = 'Text';
    let actionEnabled = false;
    
    // URL 인식
    if (data.match(/^https?:\/\//i)) {
      contentType = 'URL';
      actionEnabled = true;
      
      if (resultAction) {
        resultAction.href = data;
        resultAction.textContent = '링크 열기';
        resultAction.classList.remove('hidden');
      }
    }
    // 이메일 인식
    else if (data.match(/^mailto:/i)) {
      contentType = 'Email';
      actionEnabled = true;
      
      if (resultAction) {
        resultAction.href = data;
        resultAction.textContent = '이메일 작성하기';
        resultAction.classList.remove('hidden');
      }
    }
    // 전화번호 인식
    else if (data.match(/^tel:/i)) {
      contentType = 'Phone';
      actionEnabled = true;
      
      if (resultAction) {
        resultAction.href = data;
        resultAction.textContent = '전화 걸기';
        resultAction.classList.remove('hidden');
      }
    }
    // Wi-Fi 인식
    else if (data.match(/^WIFI:/i)) {
      contentType = 'Wi-Fi';
      
      // Wi-Fi 정보 파싱
      const ssid = data.match(/S:(.*?);/);
      const password = data.match(/P:(.*?);/);
      const securityType = data.match(/T:(.*?);/);
      
      if (resultContent) {
        resultContent.innerHTML = `<div class="font-medium">SSID(네트워크명):</div>
                                   <div class="mb-2">${ssid ? ssid[1] : '정보 없음'}</div>
                                   <div class="font-medium">비밀번호:</div>
                                   <div class="mb-2">${password ? password[1] : '정보 없음'}</div>
                                   <div class="font-medium">보안 유형:</div>
                                   <div>${securityType ? securityType[1] : '정보 없음'}</div>`;
      }
    }
    // vCard 인식
    else if (data.match(/^BEGIN:VCARD/i)) {
      contentType = 'vCard';
      
      // vCard 정보 파싱
      const name = data.match(/FN:(.*?)(?:\r\n|\r|\n)/);
      const email = data.match(/EMAIL:(.*?)(?:\r\n|\r|\n)/);
      const phone = data.match(/TEL:(.*?)(?:\r\n|\r|\n)/);
      const org = data.match(/ORG:(.*?)(?:\r\n|\r|\n)/);
      
      if (resultContent) {
        resultContent.innerHTML = `<div class="font-medium">이름:</div>
                                   <div class="mb-2">${name ? name[1] : '정보 없음'}</div>
                                   <div class="font-medium">이메일:</div>
                                   <div class="mb-2">${email ? email[1] : '정보 없음'}</div>
                                   <div class="font-medium">전화번호:</div>
                                   <div class="mb-2">${phone ? phone[1] : '정보 없음'}</div>
                                   <div class="font-medium">조직:</div>
                                   <div>${org ? org[1] : '정보 없음'}</div>`;
      }
    }
    // SMS 인식
    else if (data.match(/^smsto:/i)) {
      contentType = 'SMS';
      actionEnabled = true;
      
      if (resultAction) {
        resultAction.href = data;
        resultAction.textContent = 'SMS 보내기';
        resultAction.classList.remove('hidden');
      }
    }
    // FileToQR 메타데이터 또는 청크 인식
    else if (data.startsWith('META:') || data.startsWith('CHUNK:')) {
      contentType = 'FileToQR';
      
      // 파일 복원 페이지로 리디렉션 제안
      if (resultContent) {
        resultContent.innerHTML = `<div class="p-4 bg-blue-50 text-blue-800 rounded-md border border-blue-200">
                                    <div class="font-medium mb-2">파일 QR 코드가 감지되었습니다!</div>
                                    <div class="text-sm mb-3">이 QR 코드는 FileToQR 시스템으로 생성된 파일의 일부입니다.</div>
                                    <a href="qrcode.html#scanner?mode=fileRecovery" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md inline-block text-sm">파일 복원 모드로 전환</a>
                                   </div>`;
      }
    }
    
    // 타입 표시
    if (resultType) resultType.textContent = contentType;
    
    // 액션 버튼 표시/숨김
    if (resultAction && !actionEnabled) {
      resultAction.classList.add('hidden');
    }
  }

  /**
   * 결과 클립보드에 복사
   */
  function copyResultToClipboard() {
    const resultContent = document.getElementById('result-content');
    
    if (!resultContent) return;
    
    // 텍스트가 HTML인 경우 텍스트만 추출
    const textToCopy = resultContent.innerText || resultContent.textContent;
    
    // 클립보드에 복사
    navigator.clipboard.writeText(textToCopy)
      .then(() => {
        alert('클립보드에 복사되었습니다.');
      })
      .catch(err => {
        console.error('클립보드 복사 실패:', err);
        alert('클립보드 복사에 실패했습니다. 브라우저 권한을 확인하세요.');
      });
  }
  
  /**
   * 파일 복원 QR 코드 처리
   */
  function processFileRecoveryQR(data) {
    // QR-파일 모듈 확인
    if (!FileToQR.qrToFile) {
      alert('파일 복원 모듈이 로드되지 않았습니다.');
      return;
    }
    
    try {
      // QR 코드 데이터 처리
      const recoveryState = FileToQR.qrToFile.processQRData(data, updateRecoveryProgress);
      
      // 복원 상태 UI 업데이트
      updateRecoveryUI(recoveryState);
    } catch (error) {
      console.error('파일 복원 오류:', error);
      alert('QR 코드 처리 중 오류가 발생했습니다: ' + error.message);
    }
  }
  
  /**
   * 파일 복원 진행 상황 업데이트
   */
  function updateRecoveryProgress(progress) {
    // 진행 상황 막대
    const progressBar = document.getElementById('recovery-progress-bar');
    if (progressBar) {
      progressBar.style.width = progress.percent + '%';
    }
    
    // 진행 상황 텍스트
    const progressText = document.getElementById('recovery-progress-text');
    if (progressText) {
      progressText.textContent = progress.detail;
    }
    
    // 메타데이터 정보 표시
    if (progress.metadata) {
      const filenameElement = document.getElementById('recovery-filename');
      const filesizeElement = document.getElementById('recovery-filesize');
      const filetypeElement = document.getElementById('recovery-filetype');
      
      if (filenameElement) filenameElement.textContent = progress.metadata.filename;
      if (filesizeElement) filesizeElement.textContent = progress.metadata.filesize;
      if (filetypeElement) filetypeElement.textContent = progress.metadata.filetype;
    }
    
    // 복구 완료 시 다운로드 버튼 활성화
    if (progress.isComplete) {
      const downloadButton = document.getElementById('download-file');
      if (downloadButton) {
        downloadButton.disabled = false;
        downloadButton.classList.remove('bg-gray-400');
        downloadButton.classList.add('bg-green-600', 'hover:bg-green-700');
      }
      
      // 완료 메시지 표시
      const completeMessage = document.getElementById('recovery-complete-message');
      if (completeMessage) {
        completeMessage.classList.remove('hidden');
      }
    }
  }
  
  /**
   * 복원 상태 UI 업데이트
   */
  function updateRecoveryUI(state) {
    // 복원 상태 요약
    const summaryElement = document.getElementById('recovery-summary');
    if (summaryElement) {
      if (state.metadata) {
        summaryElement.textContent = `${state.recoveredChunks}/${state.totalChunks} 청크가 처리됨`;
      } else {
        summaryElement.textContent = '메타데이터 QR 코드를 먼저 스캔하세요.';
      }
    }
    
    // 메타데이터 섹션
    const metadataSection = document.getElementById('recovery-metadata-section');
    if (metadataSection) {
      if (state.metadata) {
        metadataSection.classList.remove('hidden');
      } else {
        metadataSection.classList.add('hidden');
      }
    }
  }
  
  /**
   * 파일 복원 작업 재설정
   */
  function resetFileRecovery() {
    if (!FileToQR.qrToFile) return;
    
    // 복원 상태 초기화
    FileToQR.qrToFile.resetRecovery();
    
    // UI 초기화
    const progressBar = document.getElementById('recovery-progress-bar');
    if (progressBar) progressBar.style.width = '0%';
    
    const progressText = document.getElementById('recovery-progress-text');
    if (progressText) progressText.textContent = '복원 준비 중...';
    
    const summaryElement = document.getElementById('recovery-summary');
    if (summaryElement) summaryElement.textContent = '메타데이터 QR 코드를 먼저 스캔하세요.';
    
    const metadataSection = document.getElementById('recovery-metadata-section');
    if (metadataSection) metadataSection.classList.add('hidden');
    
    const completeMessage = document.getElementById('recovery-complete-message');
    if (completeMessage) completeMessage.classList.add('hidden');
    
    const downloadButton = document.getElementById('download-file');
    if (downloadButton) {
      downloadButton.disabled = true;
      downloadButton.classList.remove('bg-green-600', 'hover:bg-green-700');
      downloadButton.classList.add('bg-gray-400');
    }
    
    // 알림
    alert('파일 복원 작업이 재설정되었습니다.');
  }
  
  /**
   * 복원된 파일 다운로드
   */
  function downloadRecoveredFile() {
    if (!FileToQR.qrToFile) return;
    
    // 복원 상태 가져오기
    const state = FileToQR.qrToFile.getRecoveryState();
    
    if (!state.isComplete) {
      alert('모든 QR 코드를 스캔해야 파일을 다운로드할 수 있습니다.');
      return;
    }
    
    // 파일 재구성
    FileToQR.qrToFile.reconstructFile()
      .then(result => {
        // 파일 다운로드
        FileToQR.qrToFile.downloadReconstructedFile(result.blob, result.metadata.name);
      })
      .catch(error => {
        console.error('파일 재구성 오류:', error);
        alert('파일 재구성 중 오류가 발생했습니다: ' + error.message);
      });
  }

  // 모듈 API 설정
  qrScanner.init = initQRScanner;
  qrScanner.startScanner = startScanner;
  qrScanner.stopScanner = stopScanner;
  qrScanner.resetScanner = resetScanner;
  qrScanner.scanImage = scanImage;
  
  // 글로벌 네임스페이스에 등록
  window.qrScanner = qrScanner;
})(); 