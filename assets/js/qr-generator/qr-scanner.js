/**
 * qr-scanner.js - FileToQR QR 코드 스캔 모듈
 * 버전: 1.0.0
 * 최종 업데이트: 2025-04-28
 * 
 * 이 모듈은 QR 코드 스캔 기능을 처리합니다:
 * - 카메라를 사용한 실시간 QR 코드 스캔
 * - 이미지 파일에서 QR 코드 인식
 * - 스캔 결과 처리 및 표시
 */

import registry from '../registry.js';

// 즉시 실행 함수로 네임스페이스 보호
(function() {
  'use strict';

  // 페이지 로드 후 초기화
  document.addEventListener('DOMContentLoaded', initQRScanner);

  // 전역 변수
  let video = null;
  let canvasElement = null;
  let canvas = null;
  let scanning = false;
  let cameraStream = null;

  // QR 코드 스캐너 초기화
  function initQRScanner() {
    console.log('QR 코드 스캐너 초기화 중...');
    
    // 탭 전환 기능 초기화
    initTabs();
    
    // 비디오 요소
    video = document.getElementById('scanner-video');
    
    // 캔버스 요소 생성 (화면에 보이지 않음)
    canvasElement = document.createElement('canvas');
    canvas = canvasElement.getContext('2d');
    
    // 카메라 시작 버튼
    const startScannerBtn = document.getElementById('start-scanner');
    if (startScannerBtn) {
      startScannerBtn.addEventListener('click', startScanner);
    }
    
    // 카메라 중지 버튼
    const stopScannerBtn = document.getElementById('stop-scanner');
    if (stopScannerBtn) {
      stopScannerBtn.addEventListener('click', stopScanner);
    }
    
    // 이미지 선택 버튼
    const selectImageBtn = document.getElementById('select-image-btn');
    const qrImageInput = document.getElementById('qr-image-input');
    
    if (selectImageBtn && qrImageInput) {
      selectImageBtn.addEventListener('click', () => {
        qrImageInput.click();
      });
      
      qrImageInput.addEventListener('change', handleImageSelect);
    }
    
    // 이미지 스캔 버튼
    const scanImageBtn = document.getElementById('scan-image');
    if (scanImageBtn) {
      scanImageBtn.addEventListener('click', scanImage);
    }
    
    // 결과 복사 버튼
    const copyResultBtn = document.getElementById('copy-result');
    if (copyResultBtn) {
      copyResultBtn.addEventListener('click', copyResultToClipboard);
    }
    
    console.log('QR 코드 스캐너 초기화 완료');
  }
  
  // 탭 전환 기능 초기화
  function initTabs() {
    const createTab = document.getElementById('tab-create');
    const scanTab = document.getElementById('tab-scan');
    const createContent = document.getElementById('create-content');
    const scanContent = document.getElementById('scan-content');
    
    if (createTab && scanTab && createContent && scanContent) {
      createTab.addEventListener('click', () => {
        // 스캐너가 활성화되어 있으면 중지
        if (scanning) {
          stopScanner();
        }
        
        // 탭 활성화 스타일 변경
        createTab.className = 'px-4 py-2 font-medium text-blue-600 bg-white rounded-t-lg border-b-2 border-blue-600';
        scanTab.className = 'px-4 py-2 font-medium text-gray-500 hover:text-blue-600 bg-white rounded-t-lg hover:border-b-2 hover:border-blue-300';
        
        // 콘텐츠 표시/숨김
        createContent.classList.add('active');
        scanContent.classList.remove('active');
      });
      
      scanTab.addEventListener('click', () => {
        // 탭 활성화 스타일 변경
        scanTab.className = 'px-4 py-2 font-medium text-blue-600 bg-white rounded-t-lg border-b-2 border-blue-600';
        createTab.className = 'px-4 py-2 font-medium text-gray-500 hover:text-blue-600 bg-white rounded-t-lg hover:border-b-2 hover:border-blue-300';
        
        // 콘텐츠 표시/숨김
        scanContent.classList.add('active');
        createContent.classList.remove('active');
      });
    }
  }

  // 카메라 스캐너 시작
  function startScanner() {
    // 플레이스홀더 숨기기
    const placeholder = document.getElementById('scanner-placeholder');
    const startButton = document.getElementById('start-scanner');
    const stopButton = document.getElementById('stop-scanner');
    const scanRegion = document.querySelector('.scan-region-highlight');
    
    if (placeholder) placeholder.classList.add('hidden');
    if (startButton) startButton.classList.add('hidden');
    if (stopButton) stopButton.classList.remove('hidden');
    if (video) video.classList.remove('hidden');
    if (scanRegion) scanRegion.classList.remove('hidden');
    
    // 브라우저 지원 확인
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      // 비디오 크기 설정
      const constraints = {
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };
      
      // 카메라 액세스 요청
      navigator.mediaDevices.getUserMedia(constraints)
        .then(function(stream) {
          cameraStream = stream;
          video.srcObject = stream;
          video.setAttribute('playsinline', true); // iOS 사파리에서 필요
          video.play();
          
          // 스캔 시작
          scanning = true;
          requestAnimationFrame(tick);
        })
        .catch(function(error) {
          console.error('카메라 액세스 오류:', error);
          alert('카메라에 액세스할 수 없습니다. 권한을 확인하세요.');
          resetScanner();
        });
    } else {
      console.error('브라우저가 getUserMedia를 지원하지 않습니다.');
      alert('이 브라우저는 카메라 액세스를 지원하지 않습니다.');
      resetScanner();
    }
  }

  // 스캔 프레임 처리
  function tick() {
    if (!scanning) return;
    
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      // 비디오 프레임 크기 설정
      canvasElement.height = video.videoHeight;
      canvasElement.width = video.videoWidth;
      
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
          
          // 처리 중 오버레이 표시
          const overlay = document.getElementById('scanner-overlay');
          if (overlay) overlay.classList.remove('hidden');
          
          // 스캐닝 일시 중지
          scanning = false;
          
          // 결과 처리
          setTimeout(() => {
            processQRResult(code.data);
            
            // 오버레이 숨기기
            if (overlay) overlay.classList.add('hidden');
            
            // 스캐닝 재개 (결과 처리 후)
            scanning = true;
            requestAnimationFrame(tick);
          }, 1000);
          
          return;
        }
      } catch (error) {
        console.error('QR 코드 처리 오류:', error);
      }
    }
    
    // 다음 프레임 요청
    requestAnimationFrame(tick);
  }

  // 카메라 스캐너 중지
  function stopScanner() {
    scanning = false;
    
    // 카메라 스트림 중지
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => {
        track.stop();
      });
      cameraStream = null;
    }
    
    // UI 초기화
    resetScanner();
  }

  // 스캐너 UI 초기화
  function resetScanner() {
    const placeholder = document.getElementById('scanner-placeholder');
    const startButton = document.getElementById('start-scanner');
    const stopButton = document.getElementById('stop-scanner');
    const scanRegion = document.querySelector('.scan-region-highlight');
    const overlay = document.getElementById('scanner-overlay');
    
    if (placeholder) placeholder.classList.remove('hidden');
    if (startButton) startButton.classList.remove('hidden');
    if (stopButton) stopButton.classList.add('hidden');
    if (video) video.classList.add('hidden');
    if (scanRegion) scanRegion.classList.add('hidden');
    if (overlay) overlay.classList.add('hidden');
    
    // 비디오 소스 제거
    if (video) video.srcObject = null;
  }

  // 이미지 선택 처리
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

  // 이미지에서 QR 코드 스캔
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

  // QR 코드 결과 처리
  function processQRResult(data) {
    console.log('QR 코드 결과 처리:', data);
    
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
    
    // 타입 표시
    if (resultType) resultType.textContent = contentType;
    
    // 액션 버튼 표시/숨김
    if (resultAction && !actionEnabled) {
      resultAction.classList.add('hidden');
    }
  }

  // 결과 클립보드에 복사
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

  // 모듈 등록
  if (registry) {
    try {
      registry.register('qr-generator', 'qr-scanner', {
        startScanner,
        stopScanner,
        processQRResult
      });
    } catch (e) {
      console.warn('레지스트리 등록 실패:', e);
    }
  }
})(); 