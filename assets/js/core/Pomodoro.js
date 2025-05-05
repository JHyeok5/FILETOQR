/**
 * 포모도로 클래스
 * 포모도로 기법 타이머 기능을 제공합니다.
 */
export class Pomodoro {
    constructor() {
        // 기본 포모도로 설정
        this.settings = {
            workMinutes: 25,
            shortBreakMinutes: 5,
            longBreakMinutes: 15,
            totalCycles: 4
        };
        
        this.totalSeconds = this.settings.workMinutes * 60;
        this.timer = null;
        this.isPaused = false;
        this.isActive = false;
        this.currentMode = 'work'; // 'work', 'shortBreak', 'longBreak'
        this.currentCycle = 0;
        
        // 콜백 함수
        this.onUpdate = null;
        this.onModeChange = null;
        this.onComplete = null;
        this.onWorkSessionComplete = null;
    }
    
    /**
     * 포모도로 설정 업데이트
     * @param {Object} newSettings - 새 설정
     */
    setSettings(newSettings) {
        // 기존 설정에 새 설정 병합
        this.settings = {
            ...this.settings,
            ...newSettings
        };
        
        // 활성 상태가 아닐 때 최초 타이머 시간 설정
        if (!this.isActive) {
            this.totalSeconds = this.settings.workMinutes * 60;
        }
    }
    
    /**
     * 포모도로 타이머 시작
     */
    start() {
        if (this.isActive && !this.isPaused) return;
        
        if (!this.isActive) {
            // 새로 시작하는 경우 작업 단계로 시작
            this.currentMode = 'work';
            this.totalSeconds = this.settings.workMinutes * 60;
            this.currentCycle = 0;
        }
        
        this.isActive = true;
        this.isPaused = false;
        
        // 타이머 시작
        this._startCountdown();
    }
    
    /**
     * 포모도로 타이머 일시 정지
     */
    pause() {
        if (!this.isActive || this.isPaused || !this.timer) return;
        
        clearInterval(this.timer);
        this.timer = null;
        this.isPaused = true;
    }
    
    /**
     * 일시 정지된 포모도로 타이머 재개
     */
    resume() {
        if (!this.isActive || !this.isPaused) return;
        
        this.isPaused = false;
        this._startCountdown();
    }
    
    /**
     * 포모도로 타이머 초기화
     */
    reset() {
        clearInterval(this.timer);
        this.timer = null;
        this.isActive = false;
        this.isPaused = false;
        this.currentMode = 'work';
        this.currentCycle = 0;
        this.totalSeconds = this.settings.workMinutes * 60;
        
        // 포모도로 표시 업데이트
        this._updateTimerDisplay();
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
                // 현재 단계 완료
                clearInterval(this.timer);
                this.timer = null;
                this._handleModeComplete();
                return;
            }
            
            this._updateTimerDisplay();
        }, 100); // 더 부드러운 업데이트를 위해 100ms 간격으로 설정
    }
    
    /**
     * 모드 완료 처리
     * @private
     */
    _handleModeComplete() {
        let nextMode;
        
        if (this.currentMode === 'work') {
            // 작업 세션 완료 콜백 호출
            if (typeof this.onWorkSessionComplete === 'function') {
                this.onWorkSessionComplete();
            }
            
            // 한 사이클은 (작업 + 휴식)을 의미
            // 작업을 완료하면 휴식으로 전환하기 전에 사이클 카운트를 증가시키지 않음
            
            // 다음 세션이 짧은 휴식인지 긴 휴식인지 결정
            if ((this.currentCycle + 1) % this.settings.totalCycles === 0 && this.currentCycle > 0) {
                // 긴 휴식 시간
                nextMode = 'longBreak';
                this.totalSeconds = this.settings.longBreakMinutes * 60;
            } else {
                // 짧은 휴식 시간
                nextMode = 'shortBreak';
                this.totalSeconds = this.settings.shortBreakMinutes * 60;
            }
        } else {
            // 휴식 단계 완료 시
            // 휴식 완료 후 사이클 카운트 증가 (한 사이클 완료)
            this.currentCycle++;
            
            // 모든 사이클 완료 확인
            if (this.currentCycle >= this.settings.totalCycles) {
                // 모든 사이클 완료
                this.isActive = false;
                this.currentMode = 'work';
                this.totalSeconds = this.settings.workMinutes * 60;
                
                // 완료 콜백 호출
                if (typeof this.onComplete === 'function') {
                    this.onComplete(this.currentCycle);
                }
                
                // 표시 업데이트 및 종료
                this._updateTimerDisplay();
                return;
            }
            
            // 다음 작업 단계로
            nextMode = 'work';
            this.totalSeconds = this.settings.workMinutes * 60;
        }
        
        // 모드 전환 콜백 호출
        if (typeof this.onModeChange === 'function') {
            this.onModeChange(nextMode);
        }
        
        // 다음 모드로 전환
        this.currentMode = nextMode;
        
        // 타이머 표시 업데이트
        this._updateTimerDisplay();
        
        // 다음 단계 자동 시작
        this._startCountdown();
    }
    
    /**
     * 타이머 표시 업데이트
     * @private
     */
    _updateTimerDisplay() {
        // 분, 초 계산
        const minutes = Math.floor(this.totalSeconds / 60);
        const seconds = this.totalSeconds % 60;
        
        // 업데이트 콜백 호출
        if (typeof this.onUpdate === 'function') {
            this.onUpdate(minutes, seconds, this.currentCycle, this.settings.totalCycles, this.currentMode);
        }
    }
} 