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
            
            // 포모도로 탭인 경우에만 식물 시스템 표시
            const plantContainer = document.querySelector('.plant-container');
            if (tabName === 'pomodoro') {
                if (plantContainer) plantContainer.style.display = 'block';
            } else {
                if (plantContainer) plantContainer.style.display = 'none';
            }
        });
    });
    
    // 타이머 초기화 및 이벤트 설정
    initializeTimer(timer, notificationManager);
    
    // 스톱워치 초기화 및 이벤트 설정
    initializeStopwatch(stopwatch);
    
    // 포모도로 초기화 및 이벤트 설정
    initializePomodoro(pomodoro, notificationManager, plantSystem);
    
    // 설정 관련 초기화
    initializeSettings(notificationManager, plantSystem);
    
    // 식물 시스템 초기화
    plantSystem.initialize();
    
    // 초기에 포모도로 탭이 아닌 경우 식물 컨테이너 숨기기
    const activeTab = document.querySelector('.tab-btn.active');
    if (activeTab && activeTab.dataset.tab !== 'pomodoro') {
        const plantContainer = document.querySelector('.plant-container');
        if (plantContainer) plantContainer.style.display = 'none';
    }
});

// 타이머 초기화 및 이벤트 설정 함수
function initializeTimer(timer, notificationManager) {
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
    const currentModeTime = document.getElementById('current-mode-time');
    
    const workMinutesInput = document.getElementById('work-minutes');
    const shortBreakMinutesInput = document.getElementById('short-break-minutes');
    const longBreakMinutesInput = document.getElementById('long-break-minutes');
    const pomodoroCyclesInput = document.getElementById('pomodoro-cycles');
    
    // 포모도로 설정 변경 시 이벤트
    workMinutesInput.addEventListener('change', updatePomodoroSettings);
    shortBreakMinutesInput.addEventListener('change', updatePomodoroSettings);
    longBreakMinutesInput.addEventListener('change', updatePomodoroSettings);
    pomodoroCyclesInput.addEventListener('change', updatePomodoroSettings);
    
    // 설정 업데이트 함수
    function updatePomodoroSettings() {
        const workMinutes = parseInt(workMinutesInput.value) || 25;
        const shortBreakMinutes = parseInt(shortBreakMinutesInput.value) || 5;
        const longBreakMinutes = parseInt(longBreakMinutesInput.value) || 15;
        const totalCycles = parseInt(pomodoroCyclesInput.value) || 4;
        
        // 유효성 검사 및 범위 조정
        workMinutesInput.value = Math.max(1, Math.min(60, workMinutes));
        shortBreakMinutesInput.value = Math.max(1, Math.min(30, shortBreakMinutes));
        longBreakMinutesInput.value = Math.max(1, Math.min(60, longBreakMinutes));
        pomodoroCyclesInput.value = Math.max(1, Math.min(10, totalCycles));
        
        // 포모도로 설정 업데이트
        pomodoro.setSettings({
            workMinutes: workMinutesInput.value,
            shortBreakMinutes: shortBreakMinutesInput.value,
            longBreakMinutes: longBreakMinutesInput.value,
            totalCycles: pomodoroCyclesInput.value
        });
        
        // 초기 상태 업데이트 (작업 시간 표시)
        pomodoroMinutes.textContent = workMinutesInput.value.toString().padStart(2, '0');
        pomodoroSeconds.textContent = '00';
        
        // 현재 모드 시간 표시 업데이트
        updateCurrentModeTime('work');
        
        // 사이클 카운트 업데이트
        cycleCount.textContent = `세션: 0/${pomodoroCyclesInput.value}`;
    }
    
    // 현재 모드 시간 표시 업데이트 함수
    function updateCurrentModeTime(mode) {
        let minutes = 0;
        switch(mode) {
            case 'work':
                minutes = parseInt(workMinutesInput.value) || 25;
                break;
            case 'shortBreak':
                minutes = parseInt(shortBreakMinutesInput.value) || 5;
                break;
            case 'longBreak':
                minutes = parseInt(longBreakMinutesInput.value) || 15;
                break;
        }
        
        currentModeTime.textContent = `${minutes.toString().padStart(2, '0')}:00`;
    }
    
    // 시작 버튼 클릭 이벤트
    startBtn.addEventListener('click', () => {
        // 포모도로 시작
        pomodoro.start();
        
        // 버튼 상태 업데이트
        startBtn.disabled = true;
        pauseBtn.disabled = false;
        
        // 입력 필드 비활성화
        workMinutesInput.disabled = true;
        shortBreakMinutesInput.disabled = true;
        longBreakMinutesInput.disabled = true;
        pomodoroCyclesInput.disabled = true;
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
    
    // 포모도로 업데이트 함수
    pomodoro.onUpdate = (minutes, seconds, currentCycle, totalCycles, mode) => {
        pomodoroMinutes.textContent = minutes.toString().padStart(2, '0');
        pomodoroSeconds.textContent = seconds.toString().padStart(2, '0');
        
        // 사이클 정보 업데이트
        cycleCount.textContent = `세션: ${currentCycle}/${totalCycles}`;
        
        // 모드에 따른 상태 텍스트 업데이트
        if (mode === 'work') {
            statusText.textContent = '작업 시간';
        } else if (mode === 'shortBreak') {
            statusText.textContent = '짧은 휴식';
        } else if (mode === 'longBreak') {
            statusText.textContent = '긴 휴식';
        }
    };
    
    // 포모도로 모드 변경 시 실행 함수
    pomodoro.onModeChange = (mode) => {
        // 모드에 따른 알림
        let title = '';
        let message = '';
        
        if (mode === 'work') {
            title = '작업 시간!';
            message = '지금부터 집중해서 작업하세요.';
            updateCurrentModeTime('work');
        } else if (mode === 'shortBreak') {
            title = '짧은 휴식 시간!';
            message = '잠시 휴식을 취하세요.';
            updateCurrentModeTime('shortBreak');
        } else if (mode === 'longBreak') {
            title = '긴 휴식 시간!';
            message = '충분히 휴식을 취하세요.';
            updateCurrentModeTime('longBreak');
        }
        
        notificationManager.playNotification(title, message);
    };
    
    // 포모도로 완료 시 실행 함수
    pomodoro.onComplete = (completedCycles) => {
        notificationManager.playNotification('포모도로 완료!', `${completedCycles}번의 포모도로 세션을 완료했습니다.`);
        resetPomodoroControls();
        
        // 포모도로 완료 시 경험치 제공
        // 완료한 사이클 수에 따라 경험치 차등 지급
        const exp = completedCycles * 15;
        plantSystem.addExperience(exp);
    };
    
    // 작업 세션 완료 시 실행 함수
    pomodoro.onWorkSessionComplete = () => {
        // 작업 세션 완료 시 경험치 제공
        plantSystem.addExperience(10);
    };
    
    // 포모도로 컨트롤 리셋 함수
    function resetPomodoroControls() {
        startBtn.disabled = false;
        pauseBtn.disabled = true;
        pauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
        
        workMinutesInput.disabled = false;
        shortBreakMinutesInput.disabled = false;
        longBreakMinutesInput.disabled = false;
        pomodoroCyclesInput.disabled = false;
        
        updatePomodoroSettings();
    }
    
    // 초기 설정 적용
    updatePomodoroSettings();
}

// 설정 초기화 및 이벤트 설정 함수
function initializeSettings(notificationManager, plantSystem) {
    const notificationSoundSelect = document.getElementById('notification-sound');
    const notificationVolumeInput = document.getElementById('notification-volume');
    const backgroundNotificationCheckbox = document.getElementById('background-notification');
    const plantThemeSelect = document.getElementById('plant-theme');
    
    // 설정 변경 시 이벤트
    notificationSoundSelect.addEventListener('change', saveSettings);
    notificationVolumeInput.addEventListener('input', saveSettings);
    backgroundNotificationCheckbox.addEventListener('change', saveSettings);
    plantThemeSelect.addEventListener('change', () => {
        saveSettings();
        plantSystem.changeTheme(plantThemeSelect.value);
    });
    
    // 설정 저장 함수
    function saveSettings() {
        const settings = {
            notificationSound: notificationSoundSelect.value,
            notificationVolume: notificationVolumeInput.value,
            backgroundNotification: backgroundNotificationCheckbox.checked,
            plantTheme: plantThemeSelect.value
        };
        
        localStorage.setItem('timerSettings', JSON.stringify(settings));
        
        // 알림 설정 업데이트
        notificationManager.setSound(settings.notificationSound);
        notificationManager.setVolume(settings.notificationVolume / 100);
        notificationManager.setBackgroundNotification(settings.backgroundNotification);
    }
    
    // 설정 불러오기 함수
    function loadSettings() {
        const savedSettings = localStorage.getItem('timerSettings');
        
        if (savedSettings) {
            const settings = JSON.parse(savedSettings);
            
            notificationSoundSelect.value = settings.notificationSound || 'bell';
            notificationVolumeInput.value = settings.notificationVolume || 80;
            backgroundNotificationCheckbox.checked = settings.backgroundNotification !== undefined ? settings.backgroundNotification : true;
            plantThemeSelect.value = settings.plantTheme || 'indoor';
            
            // 알림 설정 업데이트
            notificationManager.setSound(settings.notificationSound);
            notificationManager.setVolume(settings.notificationVolume / 100);
            notificationManager.setBackgroundNotification(settings.backgroundNotification);
            
            // 식물 테마 업데이트
            plantSystem.changeTheme(settings.plantTheme);
        }
    }
    
    // 초기 설정 불러오기
    loadSettings();
} 