/**
 * 포모도로 클래스
 * 포모도로 기법 타이머 기능을 제공합니다.
 */
export class Pomodoro {
    constructor() {
        // 기본 포모도로 설정
        this.settings = {
            workTime: 25 * 60, // 25분 (초 단위)
            shortBreakTime: 5 * 60, // 5분 (초 단위)
            longBreakTime: 15 * 60, // 15분 (초 단위)
            longBreakInterval: 4 // 긴 휴식 간격 (4회 작업 후)
        };
        
        this.totalSeconds = 0;
        this.timer = null;
        this.isPaused = false;
        this.isActive = false;
        this.currentPhase = 'work'; // 'work', 'shortBreak', 'longBreak'
        this.completedSessions = 0;
        this.targetSessions = this.settings.longBreakInterval;
        
        // 콜백 함수
        this.onUpdate = null;
        this.onPhaseComplete = null;
        this.onComplete = null;
    }
    
    /**
     * 포모도로 설정 업데이트
     * @param {Object} newSettings - 새 설정
     */
    updateSettings(newSettings) {
        // 기존 설정에 새 설정 병합
        this.settings = {
            ...this.settings,
            ...newSettings
        };
        
        // 활성 상태가 아닐 때 최초 타이머 시간 설정
        if (!this.isActive) {
            this.totalSeconds = this.settings.workTime;
        }
    }
    
    /**
     * 포모도로 타이머 시작
     */
    start() {
        if (this.isActive && !this.isPaused) return;
        
        if (!this.isActive) {
            // 새로 시작하는 경우 작업 단계로 시작
            this.currentPhase = 'work';
            this.totalSeconds = this.settings.workTime;
            this.completedSessions = 0;
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
        this.currentPhase = 'work';
        this.completedSessions = 0;
        this.totalSeconds = this.settings.workTime;
        
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
                this._handlePhaseComplete();
                return;
            }
            
            this._updateTimerDisplay();
        }, 100); // 더 부드러운 업데이트를 위해 100ms 간격으로 설정
    }
    
    /**
     * 단계 완료 처리
     * @private
     */
    _handlePhaseComplete() {
        let nextPhase;
        
        if (this.currentPhase === 'work') {
            // 작업 단계 완료 시
            this.completedSessions++;
            
            // 세션 완료 여부 확인
            if (this.completedSessions % this.settings.longBreakInterval === 0) {
                // 긴 휴식 시간
                nextPhase = 'longBreak';
                this.totalSeconds = this.settings.longBreakTime;
            } else {
                // 짧은 휴식 시간
                nextPhase = 'shortBreak';
                this.totalSeconds = this.settings.shortBreakTime;
            }
        } else {
            // 휴식 단계 완료 시
            if (this.completedSessions >= this.targetSessions) {
                // 모든 세션 완료
                this.isActive = false;
                this.currentPhase = 'work';
                this.totalSeconds = this.settings.workTime;
                
                // 완료 콜백 호출
                if (typeof this.onComplete === 'function') {
                    this.onComplete();
                }
                
                // 표시 업데이트 및 종료
                this._updateTimerDisplay();
                return;
            }
            
            // 다음 작업 단계로
            nextPhase = 'work';
            this.totalSeconds = this.settings.workTime;
        }
        
        // 단계 전환 콜백 호출
        if (typeof this.onPhaseComplete === 'function') {
            this.onPhaseComplete(this.currentPhase, nextPhase);
        }
        
        // 다음 단계로 전환
        this.currentPhase = nextPhase;
        
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
            this.onUpdate(minutes, seconds, this.currentPhase, this.completedSessions);
        }
    }
} 