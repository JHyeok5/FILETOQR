/**
 * progress-tracker.js - FileToQR 진행 상태 추적 및 피드백 모듈
 * 버전: 1.0.0
 * 최종 업데이트: 2025-04-28
 * 참조: ../.ai-guides/architecture/module-registry.md
 * 
 * 이 모듈은 파일 변환 및 작업 진행 상태를 시각적으로 표시하고,
 * 사용자 경험 데이터를 수집하는 기능을 제공합니다:
 * - 진행 상태 표시 및 업데이트
 * - 작업 시간 추적 및 예상 완료 시간 계산
 * - 상세 단계별 상태 메시지 표시
 * - 작업 완료 후 피드백 수집
 */

// 클래스 기반으로 모듈 구현
class ProgressTracker {
  constructor(options = {}) {
    // 기본 설정 값
    this.options = {
      progressBarId: 'progress-bar',
      progressTextId: 'progress-text',
      progressContainerId: 'conversion-progress',
      resultContainerId: 'conversion-result',
      feedbackFormId: null,
      detailedStepsEnabled: true,
      animationEnabled: true,
      collectMetrics: true,
      ...options
    };

    // 상태 추적 변수
    this.currentProgress = 0;
    this.startTime = null;
    this.steps = [];
    this.currentStep = 0;
    this.userMetrics = {
      startTime: null,
      endTime: null,
      duration: null,
      fileType: null,
      fileSize: null,
      outputFormat: null,
      success: null,
      errorType: null
    };

    // DOM 요소 참조
    this.progressBar = document.getElementById(this.options.progressBarId);
    this.progressText = document.getElementById(this.options.progressTextId);
    this.progressContainer = document.getElementById(this.options.progressContainerId);
    this.resultContainer = document.getElementById(this.options.resultContainerId);
    
    // 상세 단계 표시를 위한 DOM 요소 생성 (옵션이 활성화된 경우)
    if (this.options.detailedStepsEnabled && this.progressContainer) {
      this.stepsContainer = document.createElement('div');
      this.stepsContainer.className = 'mt-4 space-y-2 text-sm';
      this.progressContainer.appendChild(this.stepsContainer);
    }
  }

  /**
   * 진행 상태 추적 시작
   * @param {Object} fileInfo - 파일 정보 (유형, 크기 등)
   * @param {Array} steps - 작업 단계 배열 (선택사항)
   */
  start(fileInfo = {}, steps = []) {
    // 시작 시간 기록
    this.startTime = Date.now();
    this.currentProgress = 0;
    this.currentStep = 0;
    
    // 사용자 메트릭 초기화
    if (this.options.collectMetrics) {
      this.userMetrics = {
        startTime: new Date().toISOString(),
        fileType: fileInfo.type || null,
        fileSize: fileInfo.size || null,
        outputFormat: fileInfo.outputFormat || null,
        success: null,
        errorType: null
      };
    }
    
    // 진행 단계 설정
    if (steps.length > 0) {
      this.steps = steps;
    } else {
      // 기본 단계 설정
      this.steps = [
        { percent: 0, message: '변환 준비 중...' },
        { percent: 10, message: '파일 분석 중...' },
        { percent: 30, message: '변환 옵션 적용 중...' },
        { percent: 60, message: '파일 변환 중...' },
        { percent: 90, message: '최종 처리 중...' },
        { percent: 100, message: '완료!' }
      ];
    }
    
    // UI 요소 표시
    if (this.progressContainer) {
      this.progressContainer.classList.remove('hidden');
    }
    
    // 초기 상태 업데이트
    this.updateProgress(0, this.steps[0].message);
    
    // 상세 단계 UI 초기화
    if (this.options.detailedStepsEnabled && this.stepsContainer) {
      this.stepsContainer.innerHTML = '';
      
      this.steps.forEach((step, index) => {
        const stepElement = document.createElement('div');
        stepElement.className = 'flex items-center';
        stepElement.innerHTML = `
          <div id="step-indicator-${index}" class="w-5 h-5 rounded-full border border-gray-300 mr-3 flex items-center justify-center">
            <span id="step-icon-${index}" class="hidden text-xs">✓</span>
          </div>
          <span id="step-text-${index}" class="text-gray-500">${step.message}</span>
        `;
        this.stepsContainer.appendChild(stepElement);
      });
      
      // 첫 번째 단계 활성화
      this.updateStepUI(0, 'active');
    }
    
    return this;
  }
  
  /**
   * 진행 상태 업데이트
   * @param {Number} percent - 진행률 (0-100)
   * @param {String} message - 상태 메시지 (선택사항)
   */
  updateProgress(percent, message = null) {
    // 범위 제한
    percent = Math.min(Math.max(percent, 0), 100);
    this.currentProgress = percent;
    
    // 진행바 업데이트
    if (this.progressBar) {
      // 애니메이션 효과 (옵션이 활성화된 경우)
      if (this.options.animationEnabled) {
        let currentWidth = parseFloat(this.progressBar.style.width) || 0;
        const targetWidth = percent;
        const animateStep = () => {
          if (currentWidth < targetWidth) {
            currentWidth = Math.min(currentWidth + 1, targetWidth);
            this.progressBar.style.width = `${currentWidth}%`;
            
            if (currentWidth < targetWidth) {
              requestAnimationFrame(animateStep);
            }
          }
        };
        
        requestAnimationFrame(animateStep);
      } else {
        this.progressBar.style.width = `${percent}%`;
      }
    }
    
    // 상태 메시지 업데이트
    if (this.progressText && message) {
      this.progressText.textContent = message;
    } else if (this.progressText) {
      this.progressText.textContent = `${percent}% 완료`;
    }
    
    // 단계 진행 체크 및 업데이트
    if (this.options.detailedStepsEnabled && this.steps.length > 0) {
      for (let i = 0; i < this.steps.length; i++) {
        if (percent >= this.steps[i].percent && i > this.currentStep) {
          this.currentStep = i;
          
          // 이전 단계들을 완료 상태로 표시
          for (let j = 0; j < i; j++) {
            this.updateStepUI(j, 'completed');
          }
          
          // 현재 단계를 활성 상태로 표시
          this.updateStepUI(i, 'active');
          
          // 상태 메시지 업데이트 (지정된 메시지가 없는 경우)
          if (!message && this.progressText) {
            this.progressText.textContent = this.steps[i].message;
          }
          
          break;
        }
      }
    }
    
    return this;
  }
  
  /**
   * 단계 UI 업데이트
   * @param {Number} stepIndex - 단계 인덱스
   * @param {String} state - 상태 ('waiting', 'active', 'completed', 'error')
   */
  updateStepUI(stepIndex, state) {
    if (!this.options.detailedStepsEnabled || !this.stepsContainer) return;
    
    const indicator = document.getElementById(`step-indicator-${stepIndex}`);
    const icon = document.getElementById(`step-icon-${stepIndex}`);
    const text = document.getElementById(`step-text-${stepIndex}`);
    
    if (!indicator || !icon || !text) return;
    
    // 상태별 스타일 적용
    switch (state) {
      case 'waiting':
        indicator.className = 'w-5 h-5 rounded-full border border-gray-300 mr-3 flex items-center justify-center';
        icon.className = 'hidden text-xs';
        text.className = 'text-gray-500';
        break;
        
      case 'active':
        indicator.className = 'w-5 h-5 rounded-full border border-blue-500 bg-blue-100 mr-3 flex items-center justify-center';
        icon.className = 'hidden text-xs';
        text.className = 'text-blue-700 font-medium';
        break;
        
      case 'completed':
        indicator.className = 'w-5 h-5 rounded-full border border-green-500 bg-green-500 mr-3 flex items-center justify-center';
        icon.className = 'block text-xs text-white';
        text.className = 'text-gray-600';
        break;
        
      case 'error':
        indicator.className = 'w-5 h-5 rounded-full border border-red-500 bg-red-100 mr-3 flex items-center justify-center';
        icon.innerHTML = '!';
        icon.className = 'block text-xs text-red-500 font-bold';
        text.className = 'text-red-600';
        break;
    }
  }
  
  /**
   * 작업 완료 처리
   * @param {Boolean} success - 성공 여부
   * @param {Object} result - 결과 데이터
   */
  complete(success = true, result = {}) {
    // 완료 시간 기록
    const endTime = Date.now();
    const duration = endTime - this.startTime;
    
    // 메트릭 업데이트
    if (this.options.collectMetrics) {
      this.userMetrics.endTime = new Date().toISOString();
      this.userMetrics.duration = duration;
      this.userMetrics.success = success;
      
      if (!success && result.error) {
        this.userMetrics.errorType = result.error.type || 'unknown';
      }
      
      // 메트릭 저장
      this.saveMetrics();
    }
    
    // 진행 상태를 100%로 설정 (성공한 경우)
    if (success) {
      this.updateProgress(100, '변환 완료!');
      
      // 모든 단계를 완료 상태로 표시
      if (this.options.detailedStepsEnabled) {
        for (let i = 0; i < this.steps.length; i++) {
          this.updateStepUI(i, 'completed');
        }
      }
      
      // 피드백 UI 표시
      setTimeout(() => {
        // 진행 상태 UI 숨김 (약간의 지연 후)
        if (this.progressContainer) {
          this.progressContainer.classList.add('hidden');
        }
        
        // 결과 UI 표시
        if (this.resultContainer) {
          this.resultContainer.classList.remove('hidden');
          
          // 피드백 UI 추가
          this.addFeedbackUI();
        }
      }, 1000);
    } else {
      // 오류 처리
      this.handleError(result.error || { message: '알 수 없는 오류가 발생했습니다.' });
    }
    
    return this;
  }
  
  /**
   * 오류 처리
   * @param {Object} error - 오류 정보
   */
  handleError(error) {
    const i18n = window.FileToQR && window.FileToQR.i18n;
    const unknownErrorMsg = i18n && typeof i18n.translate === 'function'
      ? i18n.translate('errors.unknownError', {}, '알 수 없는 오류가 발생했습니다.')
      : '알 수 없는 오류가 발생했습니다.';
    const retryText = i18n && typeof i18n.translate === 'function'
      ? i18n.translate('common.retry', {}, '다시 시도')
      : '다시 시도';
    const errorMessage = error.message || unknownErrorMsg;
    // 진행 상태 업데이트
    if (this.progressText) {
      this.progressText.textContent = `${i18n ? i18n.translate('errors.error', {}, '오류') : '오류'}: ${errorMessage}`;
      this.progressText.className = 'text-center text-red-600';
    }
    // 진행 바 색상 변경
    if (this.progressBar) {
      this.progressBar.className = 'bg-red-500 h-4 rounded-full';
    }
    // 현재 단계를 오류 상태로 표시
    if (this.options.detailedStepsEnabled) {
      this.updateStepUI(this.currentStep, 'error');
    }
    // 재시도 버튼 추가
    const retryButton = document.createElement('button');
    retryButton.className = 'mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md';
    retryButton.textContent = retryText;
    retryButton.onclick = () => window.location.reload();
    if (this.progressContainer) {
      this.progressContainer.appendChild(retryButton);
    }
  }
  
  /**
   * 사용자 피드백 UI 추가
   */
  addFeedbackUI() {
    // 이미 피드백 UI가 있으면 종료
    if (document.getElementById('feedback-form')) return;
    
    // 피드백 컨테이너 생성
    const feedbackContainer = document.createElement('div');
    feedbackContainer.className = 'mt-6 border-t pt-4';
    feedbackContainer.innerHTML = `
      <h3 class="text-lg font-medium mb-2">사용 경험 개선에 도움을 주세요</h3>
      <p class="text-sm text-gray-600 mb-4">이 서비스를 어떻게 평가하시나요?</p>
      
      <div id="feedback-form" class="space-y-4">
        <div class="flex justify-center space-x-4">
          <button class="feedback-rating" data-rating="1" title="매우 불만족">😞</button>
          <button class="feedback-rating" data-rating="2" title="불만족">😕</button>
          <button class="feedback-rating" data-rating="3" title="보통">😐</button>
          <button class="feedback-rating" data-rating="4" title="만족">🙂</button>
          <button class="feedback-rating" data-rating="5" title="매우 만족">😄</button>
        </div>
        
        <div id="feedback-comment-container" class="hidden">
          <textarea id="feedback-comment" class="w-full border rounded-md p-2 text-sm" 
            placeholder="추가 의견이 있으시면 남겨주세요 (선택사항)"></textarea>
          
          <div class="mt-2 flex justify-end">
            <button id="submit-feedback" class="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-md text-sm">의견 보내기</button>
          </div>
        </div>
      </div>
    `;
    
    // 피드백 UI를 결과 컨테이너에 추가
    if (this.resultContainer) {
      this.resultContainer.appendChild(feedbackContainer);
      
      // 평점 버튼에 이벤트 리스너 추가
      const ratingButtons = document.querySelectorAll('.feedback-rating');
      ratingButtons.forEach(button => {
        button.style.fontSize = '2rem';
        button.style.cursor = 'pointer';
        button.style.opacity = '0.7';
        button.style.transition = 'transform 0.2s, opacity 0.2s';
        
        button.addEventListener('mouseover', () => {
          button.style.opacity = '1';
          button.style.transform = 'scale(1.2)';
        });
        
        button.addEventListener('mouseout', () => {
          if (!button.classList.contains('selected')) {
            button.style.opacity = '0.7';
            button.style.transform = 'scale(1)';
          }
        });
        
        button.addEventListener('click', () => {
          // 이전에 선택한 버튼의 선택 상태 제거
          ratingButtons.forEach(btn => {
            btn.classList.remove('selected');
            btn.style.opacity = '0.7';
            btn.style.transform = 'scale(1)';
          });
          
          // 현재 버튼 선택 상태로 표시
          button.classList.add('selected');
          button.style.opacity = '1';
          button.style.transform = 'scale(1.2)';
          
          // 선택한 평점 저장
          const rating = button.getAttribute('data-rating');
          this.userMetrics.rating = parseInt(rating);
          
          // 평점에 따라 코멘트 입력창 표시
          document.getElementById('feedback-comment-container').classList.remove('hidden');
          
          // 메트릭 저장
          this.saveMetrics();
        });
      });
      
      // 피드백 제출 버튼에 이벤트 리스너 추가
      const submitButton = document.getElementById('submit-feedback');
      if (submitButton) {
        submitButton.addEventListener('click', () => {
          const commentText = document.getElementById('feedback-comment').value.trim();
          
          // 코멘트 저장
          if (commentText) {
            this.userMetrics.comment = commentText;
            this.saveMetrics();
          }
          
          // 피드백 UI 업데이트
          feedbackContainer.innerHTML = `
            <div class="text-center py-4">
              <svg class="w-12 h-12 text-green-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <p class="text-lg font-medium">소중한 의견 감사합니다!</p>
              <p class="text-sm text-gray-600 mt-1">더 나은 서비스를 제공하기 위해 노력하겠습니다.</p>
            </div>
          `;
        });
      }
    }
  }
  
  /**
   * 사용자 메트릭 저장
   */
  saveMetrics() {
    if (!this.options.collectMetrics) return;
    
    try {
      // 로컬 스토리지에 사용자 메트릭 저장 (임시 구현)
      const metrics = JSON.parse(localStorage.getItem('filetoqr_metrics') || '[]');
      metrics.push(this.userMetrics);
      localStorage.setItem('filetoqr_metrics', JSON.stringify(metrics));
      
      // TODO: 실제 구현에서는 서버로 메트릭 전송하는 로직 추가
      console.log('메트릭 저장됨:', this.userMetrics);
    } catch (error) {
      console.error('메트릭 저장 실패:', error);
    }
  }
  
  /**
   * 예상 완료 시간 계산
   * @param {Number} currentProgress - 현재 진행률 (0-100)
   * @returns {Number} 남은 시간 (초)
   */
  calculateEstimatedTime(currentProgress) {
    if (!this.startTime || currentProgress <= 0) return null;
    
    const elapsedTime = (Date.now() - this.startTime) / 1000; // 초 단위
    const remainingProgress = 100 - currentProgress;
    
    if (currentProgress > 0 && elapsedTime > 0) {
      const progressPerSecond = currentProgress / elapsedTime;
      return remainingProgress / progressPerSecond;
    }
    
    return null;
  }
}

// 모듈 내보내기
export default ProgressTracker; 