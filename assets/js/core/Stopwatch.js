/**
 * 스톱워치 클래스
 * 시간 측정 기능을 제공합니다.
 */
export class Stopwatch {
    constructor() {
        this.startTime = 0;
        this.elapsedTime = 0;
        this.timer = null;
        this.isPaused = false;
        this.isActive = false;
        this.laps = [];
        this.lastLapTime = 0;
        
        // 콜백 함수
        this.onUpdate = null;
    }
    
    /**
     * 스톱워치 시작
     */
    start() {
        if (this.isActive && !this.isPaused) return;
        
        if (!this.isActive) {
            // 새로 시작하는 경우
            this.startTime = Date.now();
            this.elapsedTime = 0;
            this.laps = [];
            this.lastLapTime = 0;
        } else if (this.isPaused) {
            // 일시 정지 후 재개하는 경우
            this.startTime = Date.now() - this.elapsedTime;
        }
        
        this.isActive = true;
        this.isPaused = false;
        
        // 스톱워치 업데이트 시작
        this._startTimer();
    }
    
    /**
     * 스톱워치 일시 정지
     */
    pause() {
        if (!this.isActive || this.isPaused || !this.timer) return;
        
        clearInterval(this.timer);
        this.timer = null;
        this.isPaused = true;
        
        // 일시 정지 시점까지의 경과 시간 저장
        this.elapsedTime = Date.now() - this.startTime;
    }
    
    /**
     * 일시 정지된 스톱워치 재개
     */
    resume() {
        if (!this.isActive || !this.isPaused) return;
        
        this.start();
    }
    
    /**
     * 스톱워치 초기화
     */
    reset() {
        clearInterval(this.timer);
        this.timer = null;
        this.startTime = 0;
        this.elapsedTime = 0;
        this.isActive = false;
        this.isPaused = false;
        this.laps = [];
        this.lastLapTime = 0;
        
        // 스톱워치 표시 업데이트
        if (typeof this.onUpdate === 'function') {
            this.onUpdate(0, 0, 0, 0);
        }
    }
    
    /**
     * 랩 타임 기록
     * @returns {Object} 랩 타임 정보
     */
    getLapTime() {
        if (!this.isActive) return null;
        
        const currentTime = this.isPaused ? this.elapsedTime : Date.now() - this.startTime;
        const lapTime = currentTime - this.lastLapTime;
        this.lastLapTime = currentTime;
        
        // 랩 시간을 시, 분, 초, 밀리초로 변환
        const { hours, minutes, seconds, milliseconds } = this._convertTime(lapTime);
        
        // 랩 정보 저장 및 반환
        const lap = { time: lapTime, hours, minutes, seconds, milliseconds };
        this.laps.push(lap);
        
        return lap;
    }
    
    /**
     * 스톱워치 업데이트 시작
     * @private
     */
    _startTimer() {
        if (this.timer !== null) {
            clearInterval(this.timer);
        }
        
        this.timer = setInterval(() => {
            // 경과 시간 계산
            const elapsedTime = Date.now() - this.startTime;
            
            // 시간 변환 및 표시 업데이트
            const { hours, minutes, seconds, milliseconds } = this._convertTime(elapsedTime);
            
            // 업데이트 콜백 호출
            if (typeof this.onUpdate === 'function') {
                this.onUpdate(hours, minutes, seconds, milliseconds);
            }
        }, 10); // 더 정확한 밀리초 표시를 위해 10ms 간격으로 설정
    }
    
    /**
     * 밀리초 단위 시간을 시, 분, 초, 밀리초로 변환
     * @param {number} timeMs - 밀리초 단위 시간
     * @returns {Object} 변환된 시간 정보
     * @private
     */
    _convertTime(timeMs) {
        // 시간 단위 변환
        const totalSeconds = Math.floor(timeMs / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        const milliseconds = Math.floor((timeMs % 1000) / 10); // 2자리 밀리초
        
        return { hours, minutes, seconds, milliseconds };
    }
} 