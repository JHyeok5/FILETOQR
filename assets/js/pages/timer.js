// 타이머 관련 모듈 불러오기
import { Timer } from '../core/Timer.js';
import { Stopwatch } from '../core/Stopwatch.js';
import { Pomodoro } from '../core/Pomodoro.js';
import { PlantSystem } from '../core/PlantSystem.js';
import { NotificationManager } from '../utils/NotificationManager.js';

// DOM 요소
document.addEventListener('DOMContentLoaded', () => {
    // 탭 전환 기능
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    // 각 모듈 인스턴스 생성
    const timer = new Timer();
    const stopwatch = new Stopwatch();
    const pomodoro = new Pomodoro();
    const plantSystem = new PlantSystem();
    const notificationManager = new NotificationManager();
    
    // 탭 전환 이벤트 설정
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.dataset.tab;
            
            // 모든 탭 버튼에서 active 클래스 제거
            tabButtons.forEach(btn => btn.classList.remove('active'));
            // 클릭한 탭 버튼에 active 클래스 추가
            button.classList.add('active');
            
            // 모든 탭 콘텐츠 숨기기
            tabContents.forEach(content => content.classList.remove('active'));
            // 선택한 탭 콘텐츠만 표시
            document.getElementById(`${tabName}-tab`).classList.add('active');
        });
    });
    
    // 타이머 초기화 및 이벤트 설정
    initializeTimer(timer, notificationManager, plantSystem);
    
    // 스톱워치 초기화 및 이벤트 설정
    initializeStopwatch(stopwatch);
    
    // 포모도로 초기화 및 이벤트 설정
    initializePomodoro(pomodoro, notificationManager, plantSystem);
    
    // 설정 관련 초기화
    initializeSettings(notificationManager, plantSystem);
    
    // 식물 시스템 초기화
    plantSystem.initialize();
});

// 타이머 초기화 및 이벤트 설정 함수
function initializeTimer(timer, notificationManager, plantSystem) {
    const hoursInput = document.getElementById('hours-input');
    const minutesInput = document.getElementById('minutes-input');
    const secondsInput = document.getElementById('seconds-input');
    const startBtn = document.getElementById('timer-start');
    const pauseBtn = document.getElementById('timer-pause');
    const resetBtn = document.getElementById('timer-reset');
    const presetBtns = document.querySelectorAll('.preset-btn');
    
    const timerHours = document.getElementById('timer-hours');
    const timerMinutes = document.getElementById('timer-minutes');
    const timerSeconds = document.getElementById('timer-seconds');
    
    // 타이머 업데이트 함수
    timer.onUpdate = (hours, minutes, seconds) => {
        timerHours.textContent = hours.toString().padStart(2, '0');
        timerMinutes.textContent = minutes.toString().padStart(2, '0');
        timerSeconds.textContent = seconds.toString().padStart(2, '0');
    };
    
    // 타이머 완료 시 실행 함수
    timer.onComplete = () => {
        notificationManager.playNotification('타이머 완료!', '설정한 시간이 완료되었습니다.');
        resetTimerControls();
        
        // 타이머 완료 시 경험치 제공
        plantSystem.addExperience(5);
    };
    
    // 시작 버튼 클릭 이벤트
    startBtn.addEventListener('click', () => {
        const hours = parseInt(hoursInput.value) || 0;
        const minutes = parseInt(minutesInput.value) || 0;
        const seconds = parseInt(secondsInput.value) || 0;
        
        // 시간이 설정되어 있는지 확인
        if (hours === 0 && minutes === 0 && seconds === 0) {
            alert('타이머 시간을 설정해주세요.');
            return;
        }
        
        // 타이머 시작
        timer.start(hours, minutes, seconds);
        
        // 버튼 상태 업데이트
        startBtn.disabled = true;
        pauseBtn.disabled = false;
        
        // 입력 필드 비활성화
        hoursInput.disabled = true;
        minutesInput.disabled = true;
        secondsInput.disabled = true;
        presetBtns.forEach(btn => btn.disabled = true);
    });
    
    // 일시 정지 버튼 클릭 이벤트
    pauseBtn.addEventListener('click', () => {
        if (timer.isPaused) {
            timer.resume();
            pauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
        } else {
            timer.pause();
            pauseBtn.innerHTML = '<i class="fas fa-play"></i>';
        }
    });
    
    // 리셋 버튼 클릭 이벤트
    resetBtn.addEventListener('click', () => {
        timer.reset();
        resetTimerControls();
    });
    
    // 프리셋 버튼 클릭 이벤트
    presetBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const minutes = parseInt(btn.dataset.minutes);
            hoursInput.value = 0;
            minutesInput.value = minutes;
            secondsInput.value = 0;
            
            // 타이머 디스플레이 업데이트
            timerHours.textContent = '00';
            timerMinutes.textContent = minutes.toString().padStart(2, '0');
            timerSeconds.textContent = '00';
        });
    });
    
    // 타이머 컨트롤 리셋 함수
    function resetTimerControls() {
        startBtn.disabled = false;
        pauseBtn.disabled = true;
        pauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
        
        hoursInput.disabled = false;
        minutesInput.disabled = false;
        secondsInput.disabled = false;
        presetBtns.forEach(btn => btn.disabled = false);
    }
}

// 스톱워치 초기화 및 이벤트 설정 함수
function initializeStopwatch(stopwatch) {
    const startBtn = document.getElementById('stopwatch-start');
    const pauseBtn = document.getElementById('stopwatch-pause');
    const resetBtn = document.getElementById('stopwatch-reset');
    const lapBtn = document.getElementById('stopwatch-lap');
    const lapsList = document.getElementById('laps-list');
    
    const stopwatchHours = document.getElementById('stopwatch-hours');
    const stopwatchMinutes = document.getElementById('stopwatch-minutes');
    const stopwatchSeconds = document.getElementById('stopwatch-seconds');
    const stopwatchMilliseconds = document.getElementById('stopwatch-milliseconds');
    
    // 스톱워치 업데이트 함수
    stopwatch.onUpdate = (hours, minutes, seconds, milliseconds) => {
        stopwatchHours.textContent = hours.toString().padStart(2, '0');
        stopwatchMinutes.textContent = minutes.toString().padStart(2, '0');
        stopwatchSeconds.textContent = seconds.toString().padStart(2, '0');
        stopwatchMilliseconds.textContent = milliseconds.toString().padStart(2, '0');
    };
    
    // 시작 버튼 클릭 이벤트
    startBtn.addEventListener('click', () => {
        stopwatch.start();
        
        // 버튼 상태 업데이트
        startBtn.disabled = true;
        pauseBtn.disabled = false;
        lapBtn.disabled = false;
    });
    
    // 일시 정지 버튼 클릭 이벤트
    pauseBtn.addEventListener('click', () => {
        if (stopwatch.isPaused) {
            stopwatch.resume();
            pauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
        } else {
            stopwatch.pause();
            pauseBtn.innerHTML = '<i class="fas fa-play"></i>';
        }
    });
    
    // 리셋 버튼 클릭 이벤트
    resetBtn.addEventListener('click', () => {
        stopwatch.reset();
        resetStopwatchControls();
        lapsList.innerHTML = '';
    });
    
    // 랩 버튼 클릭 이벤트
    lapBtn.addEventListener('click', () => {
        const lapTime = stopwatch.getLapTime();
        const lapIndex = stopwatch.laps.length;
        
        // 랩 시간 표시
        const lapItem = document.createElement('li');
        lapItem.innerHTML = `
            <span>랩 ${lapIndex}</span>
            <span>${formatTime(lapTime)}</span>
        `;
        lapsList.appendChild(lapItem);
    });
    
    // 스톱워치 컨트롤 리셋 함수
    function resetStopwatchControls() {
        startBtn.disabled = false;
        pauseBtn.disabled = true;
        lapBtn.disabled = true;
        pauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
    }
    
    // 시간 포맷팅 함수
    function formatTime(timeObj) {
        const { hours, minutes, seconds, milliseconds } = timeObj;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
    }
}

// 포모도로 초기화 및 이벤트 설정 함수
function initializePomodoro(pomodoro, notificationManager, plantSystem) {
    const startBtn = document.getElementById('pomodoro-start');
    const pauseBtn = document.getElementById('pomodoro-pause');
    const resetBtn = document.getElementById('pomodoro-reset');
    
    const pomodoroMinutes = document.getElementById('pomodoro-minutes');
    const pomodoroSeconds = document.getElementById('pomodoro-seconds');
    const statusText = document.getElementById('status-text');
    const cycleCount = document.getElementById('cycle-count');
    
    const workMinutesInput = document.getElementById('work-minutes');
    const shortBreakMinutesInput = document.getElementById('short-break-minutes');
    const longBreakMinutesInput = document.getElementById('long-break-minutes');
    
    // 포모도로 설정 변경 시 이벤트
    workMinutesInput.addEventListener('change', updatePomodoroSettings);
    shortBreakMinutesInput.addEventListener('change', updatePomodoroSettings);
    longBreakMinutesInput.addEventListener('change', updatePomodoroSettings);
    
    // 포모도로 설정 업데이트 함수
    function updatePomodoroSettings() {
        const workMinutes = parseInt(workMinutesInput.value) || 25;
        const shortBreakMinutes = parseInt(shortBreakMinutesInput.value) || 5;
        const longBreakMinutes = parseInt(longBreakMinutesInput.value) || 15;
        
        pomodoro.updateSettings({
            workTime: workMinutes * 60,
            shortBreakTime: shortBreakMinutes * 60,
            longBreakTime: longBreakMinutes * 60
        });
        
        // 포모도로 타이머 디스플레이 업데이트
        if (!pomodoro.isActive) {
            pomodoroMinutes.textContent = workMinutes.toString().padStart(2, '0');
            pomodoroSeconds.textContent = '00';
        }
    }
    
    // 초기 설정 적용
    updatePomodoroSettings();
    
    // 포모도로 업데이트 함수
    pomodoro.onUpdate = (minutes, seconds, phase, completedSessions) => {
        pomodoroMinutes.textContent = minutes.toString().padStart(2, '0');
        pomodoroSeconds.textContent = seconds.toString().padStart(2, '0');
        
        // 상태 텍스트 업데이트
        switch (phase) {
            case 'work':
                statusText.textContent = '작업 시간';
                break;
            case 'shortBreak':
                statusText.textContent = '짧은 휴식';
                break;
            case 'longBreak':
                statusText.textContent = '긴 휴식';
                break;
        }
        
        // 세션 카운트 업데이트
        cycleCount.textContent = `세션: ${completedSessions}/4`;
    };
    
    // 포모도로 단계 전환 시 실행 함수
    pomodoro.onPhaseComplete = (completedPhase, nextPhase) => {
        let title, message;
        
        if (completedPhase === 'work') {
            title = '작업 시간 완료!';
            message = nextPhase === 'shortBreak' 
                ? '짧은 휴식 시간입니다.' 
                : '긴 휴식 시간입니다.';
                
            // 작업 세션 완료 시 경험치 제공
            plantSystem.addExperience(20);
        } else {
            title = '휴식 시간 완료!';
            message = '다시 작업할 시간입니다.';
        }
        
        notificationManager.playNotification(title, message);
    };
    
    // 포모도로 사이클 완료 시 실행 함수
    pomodoro.onComplete = () => {
        notificationManager.playNotification('포모도로 사이클 완료!', '모든 세션이 완료되었습니다.');
        resetPomodoroControls();
        
        // 포모도로 전체 사이클 완료 시 추가 경험치 제공
        plantSystem.addExperience(50);
    };
    
    // 시작 버튼 클릭 이벤트
    startBtn.addEventListener('click', () => {
        pomodoro.start();
        
        // 버튼 상태 업데이트
        startBtn.disabled = true;
        pauseBtn.disabled = false;
        
        // 입력 필드 비활성화
        workMinutesInput.disabled = true;
        shortBreakMinutesInput.disabled = true;
        longBreakMinutesInput.disabled = true;
    });
    
    // 일시 정지 버튼 클릭 이벤트
    pauseBtn.addEventListener('click', () => {
        if (pomodoro.isPaused) {
            pomodoro.resume();
            pauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
        } else {
            pomodoro.pause();
            pauseBtn.innerHTML = '<i class="fas fa-play"></i>';
        }
    });
    
    // 리셋 버튼 클릭 이벤트
    resetBtn.addEventListener('click', () => {
        pomodoro.reset();
        resetPomodoroControls();
    });
    
    // 포모도로 컨트롤 리셋 함수
    function resetPomodoroControls() {
        startBtn.disabled = false;
        pauseBtn.disabled = true;
        pauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
        
        workMinutesInput.disabled = false;
        shortBreakMinutesInput.disabled = false;
        longBreakMinutesInput.disabled = false;
        
        // 기본 표시로 초기화
        updatePomodoroSettings();
        statusText.textContent = '작업 시간';
        cycleCount.textContent = '세션: 0/4';
    }
}

// 설정 초기화 함수
function initializeSettings(notificationManager, plantSystem) {
    const notificationSound = document.getElementById('notification-sound');
    const notificationVolume = document.getElementById('notification-volume');
    const backgroundNotification = document.getElementById('background-notification');
    const plantTheme = document.getElementById('plant-theme');
    
    // 소리 선택 변경 이벤트
    notificationSound.addEventListener('change', () => {
        notificationManager.setSound(notificationSound.value);
    });
    
    // 볼륨 변경 이벤트
    notificationVolume.addEventListener('input', () => {
        notificationManager.setVolume(notificationVolume.value / 100);
    });
    
    // 백그라운드 알림 설정 변경 이벤트
    backgroundNotification.addEventListener('change', () => {
        notificationManager.setBackgroundNotification(backgroundNotification.checked);
    });
    
    // 식물 테마 변경 이벤트
    plantTheme.addEventListener('change', () => {
        plantSystem.setTheme(plantTheme.value);
    });
    
    // 초기 설정 적용
    notificationManager.setSound(notificationSound.value);
    notificationManager.setVolume(notificationVolume.value / 100);
    notificationManager.setBackgroundNotification(backgroundNotification.checked);
    plantSystem.setTheme(plantTheme.value);
    
    // 설정값 로컬 스토리지에서 로드
    loadSettings();
    
    // 설정 저장 함수
    function saveSettings() {
        const settings = {
            notificationSound: notificationSound.value,
            notificationVolume: notificationVolume.value,
            backgroundNotification: backgroundNotification.checked,
            plantTheme: plantTheme.value
        };
        
        localStorage.setItem('timerSettings', JSON.stringify(settings));
    }
    
    // 설정 로드 함수
    function loadSettings() {
        const savedSettings = localStorage.getItem('timerSettings');
        
        if (savedSettings) {
            const settings = JSON.parse(savedSettings);
            
            notificationSound.value = settings.notificationSound || 'bell';
            notificationVolume.value = settings.notificationVolume || 80;
            backgroundNotification.checked = settings.backgroundNotification !== false;
            plantTheme.value = settings.plantTheme || 'indoor';
            
            // 설정 적용
            notificationManager.setSound(notificationSound.value);
            notificationManager.setVolume(notificationVolume.value / 100);
            notificationManager.setBackgroundNotification(backgroundNotification.checked);
            plantSystem.setTheme(plantTheme.value);
        }
    }
    
    // 설정 변경 시 저장
    notificationSound.addEventListener('change', saveSettings);
    notificationVolume.addEventListener('change', saveSettings);
    backgroundNotification.addEventListener('change', saveSettings);
    plantTheme.addEventListener('change', saveSettings);
} 