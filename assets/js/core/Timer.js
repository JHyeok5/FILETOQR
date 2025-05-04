/**
 * 타이머 클래스
 * 카운트다운 타이머 기능을 제공합니다.
 */
export class Timer {
    constructor() {
        this.hours = 0;
        this.minutes = 0;
        this.seconds = 0;
        this.totalSeconds = 0;
        this.timer = null;
        this.isPaused = false;
        this.isActive = false;
        
        // 콜백 함수
        this.onUpdate = null;
        this.onComplete = null;
    }
    
    /**
     * 타이머 시작
     * @param {number} hours - 시간
     * @param {number} minutes - 분
     * @param {number} seconds - 초
     */
    start(hours, minutes, seconds) {
        // 시간 설정
        this.hours = hours || 0;
        this.minutes = minutes || 0;
        this.seconds = seconds || 0;
        
        // 총 초 계산
        this.totalSeconds = this.hours * 3600 + this.minutes * 60 + this.seconds;
        
        if (this.totalSeconds <= 0) {
            console.error('타이머 시간은 0보다 커야 합니다.');
            return;
        }
        
        this.isActive = true;
        this.isPaused = false;
        
        // 타이머 업데이트 및 시작
        this._updateTimerDisplay();
        this._startCountdown();
    }
    
    /**
     * 타이머 일시 정지
     */
    pause() {
        if (!this.isActive || !this.timer) return;
        
        clearInterval(this.timer);
        this.timer = null;
        this.isPaused = true;
    }
    
    /**
     * 일시 정지된 타이머 재개
     */
    resume() {
        if (!this.isActive || !this.isPaused) return;
        
        this.isPaused = false;
        this._startCountdown();
    }
    
    /**
     * 타이머 초기화
     */
    reset() {
        clearInterval(this.timer);
        this.timer = null;
        this.hours = 0;
        this.minutes = 0;
        this.seconds = 0;
        this.totalSeconds = 0;
        this.isActive = false;
        this.isPaused = false;
        
        // 타이머 표시 업데이트
        if (typeof this.onUpdate === 'function') {
            this.onUpdate(0, 0, 0);
        }
    }
    
    /**
     * 카운트다운 시작
     * @private
     */
    _startCountdown() {
        if (this.timer !== null) {
            clearInterval(this.timer);
        }
        
        const startTime = Date.now();
        const initialTotalSeconds = this.totalSeconds;
        
        this.timer = setInterval(() => {
            // 경과 시간 계산
            const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
            this.totalSeconds = initialTotalSeconds - elapsedSeconds;
            
            if (this.totalSeconds <= 0) {
                // 타이머 완료
                clearInterval(this.timer);
                this.timer = null;
                this.totalSeconds = 0;
                this.isActive = false;
                this._updateTimerDisplay();
                
                // 완료 콜백 호출
                if (typeof this.onComplete === 'function') {
                    this.onComplete();
                }
                return;
            }
            
            this._updateTimerDisplay();
        }, 100); // 더 부드러운 업데이트를 위해 100ms 간격으로 설정
    }
    
    /**
     * 타이머 표시 업데이트
     * @private
     */
    _updateTimerDisplay() {
        // 시간, 분, 초 계산
        this.hours = Math.floor(this.totalSeconds / 3600);
        this.minutes = Math.floor((this.totalSeconds % 3600) / 60);
        this.seconds = this.totalSeconds % 60;
        
        // 업데이트 콜백 호출
        if (typeof this.onUpdate === 'function') {
            this.onUpdate(this.hours, this.minutes, this.seconds);
        }
    }
} 