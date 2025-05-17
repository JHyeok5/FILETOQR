// 타이머 관련 모듈 불러오기
import { Timer } from '../core/Timer.js';
import { Stopwatch } from '../core/Stopwatch.js';
import { Pomodoro } from '../core/Pomodoro.js';
import { PlantSystem } from '../core/PlantSystem.js';
import { NotificationManager } from '../utils/NotificationManager.js';

// 전역 변수
let timers = new Map();
let timerIdCounter = 1;
let notificationManager;

// DOM 요소
document.addEventListener('DOMContentLoaded', () => {
    console.log('타이머 페이지 초기화');
    
    try {
        // 모듈 인스턴스 생성
        notificationManager = new NotificationManager();
        const stopwatch = new Stopwatch();
        const pomodoro = new Pomodoro();
        const plantSystem = new PlantSystem();
        
        // 탭 전환 설정
        setupTabs();
        
        // 각 기능 초기화
        setupMultipleTimers();
        initializeStopwatch(stopwatch);
        initializePomodoro(pomodoro, notificationManager, plantSystem);
        initializeSettings(notificationManager, plantSystem);
        
        // 식물 시스템 초기화
        plantSystem.initialize();
        
        // 타이머 추가 버튼 이벤트를 여러 방식으로 설정
        // 1. 버튼에 직접 이벤트 리스너
        const addTimerBtn = document.getElementById('add-timer');
        console.log('[DEBUG] addTimerBtn:', addTimerBtn);
        if (addTimerBtn) {
            addTimerBtn.addEventListener('click', function(e) {
                console.log('[DEBUG] 타이머 추가 버튼 클릭');
                e.preventDefault();
                addNewTimer();
            });
        }
        
        // 2. 커스텀 이벤트 리스너
        document.addEventListener('add-new-timer', function() {
            console.log('커스텀 이벤트로 타이머 추가');
            addNewTimer();
        });
        
        // 3. 글로벌 함수 설정
        window.addNewTimerGlobal = function() {
            console.log('글로벌 함수로 타이머 추가');
            addNewTimer();
        };
        
        // 이벤트 위임 방식도 추가 (동적으로 생성될 경우 대비)
        const globalControls = document.querySelector('.timer-global-controls');
        if (globalControls) {
            globalControls.addEventListener('click', function(e) {
                if (e.target && (e.target.id === 'add-timer' || e.target.closest('#add-timer'))) {
                    console.log('[DEBUG] (위임) 타이머 추가 버튼 클릭');
                    e.preventDefault();
                    addNewTimer();
                }
            });
        }
        
        console.log('타이머 페이지 초기화 완료');
    } catch (error) {
        console.error('타이머 페이지 초기화 오류:', error);
    }
});

// 탭 전환 설정 함수
function setupTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.dataset.tab;
            console.log(`탭 전환: ${tabName}`);
            
            // 버튼 활성화 상태 변경
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // 탭 콘텐츠 전환
            tabContents.forEach(content => content.classList.remove('active'));
            document.getElementById(`${tabName}-tab`).classList.add('active');
            
            // 포모도로 탭일 때만 식물 컨테이너 표시
            const plantContainer = document.querySelector('.plant-container');
            if (plantContainer) {
                plantContainer.style.display = tabName === 'pomodoro' ? 'block' : 'none';
            }
        });
    });
}

// 다중 타이머 설정 함수
function setupMultipleTimers() {
    console.log('다중 타이머 설정');
    
    // 초기 타이머 설정
    const initialTimerItem = document.querySelector('.timer-item');
    if (initialTimerItem) {
        console.log('초기 타이머 설정');
        const timerId = initialTimerItem.dataset.timerId;
        const timerInstance = new Timer();
        timers.set(timerId, timerInstance);
        setupTimerControls(initialTimerItem, timerInstance);
    }
    
    // 저장된 타이머 불러오기
    loadSavedTimers();
    
    // 타이머 상태 주기적 저장
    setInterval(saveActiveTimers, 10000);
}

// 새 타이머 추가 함수
function addNewTimer() {
    console.log('새 타이머 추가 함수 호출됨');
    try {
        const timersListElem = document.getElementById('timers-list');
        if (!timersListElem) {
            console.error('타이머 목록 요소를 찾을 수 없음');
            return;
        }
        
        const timerId = String(timerIdCounter++);
        console.log(`새 타이머 ID: ${timerId} 생성 중`);
        
        // 타이머 인스턴스 생성
        const timerInstance = new Timer();
        timers.set(timerId, timerInstance);
        
        // 타이머 요소 생성
        const newTimerElem = document.createElement('div');
        newTimerElem.className = 'timer-item';
        newTimerElem.dataset.timerId = timerId;
        
        newTimerElem.innerHTML = `
            <div class="timer-header">
                <input type="text" class="timer-label" placeholder="타이머 이름">
                <button class="close-timer"><i class="fas fa-times"></i></button>
            </div>
            <div class="timer-display">
                <span class="timer-hours">00</span>:<span class="timer-minutes">00</span>:<span class="timer-seconds">00</span>
            </div>
            <div class="timer-controls">
                <button class="timer-start control-btn"><i class="fas fa-play"></i> 시작</button>
                <button class="timer-pause control-btn" disabled><i class="fas fa-pause"></i> 일시정지</button>
                <button class="timer-reset control-btn"><i class="fas fa-redo"></i> 리셋</button>
            </div>
            <div class="timer-settings">
                <div class="time-input">
                    <label>시간:</label>
                    <input type="number" class="hours-input" min="0" max="23" value="0">
                </div>
                <div class="time-input">
                    <label>분:</label>
                    <input type="number" class="minutes-input" min="0" max="59" value="0">
                </div>
                <div class="time-input">
                    <label>초:</label>
                    <input type="number" class="seconds-input" min="0" max="59" value="0">
                </div>
            </div>
            <div class="preset-buttons">
                <button class="preset-btn" data-minutes="5">5분</button>
                <button class="preset-btn" data-minutes="10">10분</button>
                <button class="preset-btn" data-minutes="15">15분</button>
                <button class="preset-btn" data-minutes="30">30분</button>
            </div>
        `;
        
        // 타이머 요소 추가
        timersListElem.appendChild(newTimerElem);
        console.log('타이머 요소 DOM에 추가됨');
        
        // 타이머 컨트롤 설정
        setupTimerControls(newTimerElem, timerInstance);
        
        // 닫기 버튼 이벤트
        const closeBtn = newTimerElem.querySelector('.close-timer');
        closeBtn.addEventListener('click', function() {
            console.log('닫기 버튼 클릭');
            removeTimer(newTimerElem, timerId);
        });
        
        // 포커스 설정 및 스크롤
        newTimerElem.querySelector('.timer-label').focus();
        newTimerElem.scrollIntoView({ behavior: 'smooth' });
        
        console.log('새 타이머 추가 완료');
    } catch (error) {
        console.error('타이머 추가 오류:', error);
        alert('타이머 추가 중 오류가 발생했습니다.');
    }
}

// 타이머 제거 함수
function removeTimer(timerElem, timerId) {
    console.log(`타이머 제거: ${timerId}`);
    
    // 타이머 인스턴스 정리
    const timerInstance = timers.get(timerId);
    if (timerInstance) {
        timerInstance.reset();
        timers.delete(timerId);
    }
    
    // 애니메이션 후 요소 제거
    timerElem.style.opacity = '0';
    timerElem.style.transform = 'scale(0.8)';
    timerElem.style.transition = 'all 0.3s ease-out';
    
    setTimeout(() => {
        timerElem.remove();
        console.log('타이머 요소 제거됨');
    }, 300);
    
    // 저장된 데이터에서도 제거
    const savedTimers = JSON.parse(localStorage.getItem('activeTimers') || '{}');
    delete savedTimers[timerId];
    localStorage.setItem('activeTimers', JSON.stringify(savedTimers));
}

// 타이머 컨트롤 설정 함수
function setupTimerControls(timerElem, timerInstance) {
    // DOM 요소
    const hoursInput = timerElem.querySelector('.hours-input');
    const minutesInput = timerElem.querySelector('.minutes-input');
    const secondsInput = timerElem.querySelector('.seconds-input');
    const timerLabel = timerElem.querySelector('.timer-label');
    
    const startBtn = timerElem.querySelector('.timer-start');
    const pauseBtn = timerElem.querySelector('.timer-pause');
    const resetBtn = timerElem.querySelector('.timer-reset');
    const presetBtns = timerElem.querySelectorAll('.preset-btn');
    
    const timerHours = timerElem.querySelector('.timer-hours');
    const timerMinutes = timerElem.querySelector('.timer-minutes');
    const timerSeconds = timerElem.querySelector('.timer-seconds');
    
    // 타이머 업데이트 콜백
    timerInstance.onUpdate = (hours, minutes, seconds) => {
        timerHours.textContent = hours.toString().padStart(2, '0');
        timerMinutes.textContent = minutes.toString().padStart(2, '0');
        timerSeconds.textContent = seconds.toString().padStart(2, '0');
    };
    
    // 타이머 완료 콜백
    timerInstance.onComplete = () => {
        const name = timerLabel.value.trim() || '타이머';
        notificationManager.playNotification(`${name} 완료!`, '설정한 시간이 완료되었습니다.');
        timerElem.classList.add('timer-complete');
        resetTimerControls();
        
        // 알림음 재생
        try {
            const audio = new Audio('assets/sounds/bell.mp3');
            audio.volume = 0.5;
            audio.play();
        } catch (e) {
            console.warn('알림음 재생 실패:', e);
        }
    };
    
    // 시작 버튼 이벤트
    startBtn.addEventListener('click', () => {
        const hours = parseInt(hoursInput.value) || 0;
        const minutes = parseInt(minutesInput.value) || 0;
        const seconds = parseInt(secondsInput.value) || 0;
        
        if (hours === 0 && minutes === 0 && seconds === 0) {
            alert('타이머 시간을 설정해주세요.');
            return;
        }
        
        timerElem.classList.remove('timer-complete');
        timerInstance.start(hours, minutes, seconds);
        
        startBtn.disabled = true;
        pauseBtn.disabled = false;
        
        hoursInput.disabled = true;
        minutesInput.disabled = true;
        secondsInput.disabled = true;
        presetBtns.forEach(btn => btn.disabled = true);
    });
    
    // 일시정지 버튼 이벤트
    pauseBtn.addEventListener('click', () => {
        if (timerInstance.isPaused) {
            timerInstance.resume();
            pauseBtn.innerHTML = '<i class="fas fa-pause"></i> 일시정지';
        } else {
            timerInstance.pause();
            pauseBtn.innerHTML = '<i class="fas fa-play"></i> 재시작';
        }
    });
    
    // 리셋 버튼 이벤트
    resetBtn.addEventListener('click', () => {
        timerInstance.reset();
        resetTimerControls();
        timerElem.classList.remove('timer-complete');
    });
    
    // 프리셋 버튼 이벤트
    presetBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const minutes = parseInt(btn.dataset.minutes);
            hoursInput.value = 0;
            minutesInput.value = minutes;
            secondsInput.value = 0;
            
            timerHours.textContent = '00';
            timerMinutes.textContent = minutes.toString().padStart(2, '0');
            timerSeconds.textContent = '00';
        });
    });
    
    // 컨트롤 리셋 함수
    function resetTimerControls() {
        startBtn.disabled = false;
        pauseBtn.disabled = true;
        pauseBtn.innerHTML = '<i class="fas fa-pause"></i> 일시정지';
        
        hoursInput.disabled = false;
        minutesInput.disabled = false;
        secondsInput.disabled = false;
        presetBtns.forEach(btn => btn.disabled = false);
    }
}

// 활성 타이머 저장 함수
function saveActiveTimers() {
    const activeTimers = {};
    
    timers.forEach((timerInstance, timerId) => {
        if (timerInstance.isActive) {
            const timerElem = document.querySelector(`.timer-item[data-timer-id="${timerId}"]`);
            if (timerElem) {
                const timerLabel = timerElem.querySelector('.timer-label').value;
                const remainingTime = timerInstance.getRemainingTime();
                
                activeTimers[timerId] = {
                    label: timerLabel,
                    hours: remainingTime.hours,
                    minutes: remainingTime.minutes,
                    seconds: remainingTime.seconds,
                    isPaused: timerInstance.isPaused
                };
            }
        }
    });
    
    localStorage.setItem('activeTimers', JSON.stringify(activeTimers));
}

// 저장된 타이머 불러오기 함수
function loadSavedTimers() {
    const savedTimers = JSON.parse(localStorage.getItem('activeTimers') || '{}');
    const timersListElem = document.getElementById('timers-list');
    
    if (Object.keys(savedTimers).length === 0) return;
    
    Object.entries(savedTimers).forEach(([timerId, timerData]) => {
        const timerInstance = new Timer();
        timers.set(timerId, timerInstance);
        
        const timerElem = document.createElement('div');
        timerElem.className = 'timer-item';
        timerElem.dataset.timerId = timerId;
        
        timerElem.innerHTML = `
            <div class="timer-header">
                <input type="text" class="timer-label" placeholder="타이머 이름" value="${timerData.label || ''}">
                <button class="close-timer"><i class="fas fa-times"></i></button>
            </div>
            <div class="timer-display">
                <span class="timer-hours">${timerData.hours.toString().padStart(2, '0')}</span>:
                <span class="timer-minutes">${timerData.minutes.toString().padStart(2, '0')}</span>:
                <span class="timer-seconds">${timerData.seconds.toString().padStart(2, '0')}</span>
            </div>
            <div class="timer-controls">
                <button class="timer-start control-btn" ${timerData.isPaused ? '' : 'disabled'}><i class="fas fa-play"></i> 시작</button>
                <button class="timer-pause control-btn" ${timerData.isPaused ? 'disabled' : ''}><i class="fas fa-pause"></i> 일시정지</button>
                <button class="timer-reset control-btn"><i class="fas fa-redo"></i> 리셋</button>
            </div>
            <div class="timer-settings">
                <div class="time-input">
                    <label>시간:</label>
                    <input type="number" class="hours-input" min="0" max="23" value="${timerData.hours}" ${timerData.isPaused ? '' : 'disabled'}>
                </div>
                <div class="time-input">
                    <label>분:</label>
                    <input type="number" class="minutes-input" min="0" max="59" value="${timerData.minutes}" ${timerData.isPaused ? '' : 'disabled'}>
                </div>
                <div class="time-input">
                    <label>초:</label>
                    <input type="number" class="seconds-input" min="0" max="59" value="${timerData.seconds}" ${timerData.isPaused ? '' : 'disabled'}>
                </div>
            </div>
            <div class="preset-buttons">
                <button class="preset-btn" data-minutes="5" ${timerData.isPaused ? '' : 'disabled'}>5분</button>
                <button class="preset-btn" data-minutes="10" ${timerData.isPaused ? '' : 'disabled'}>10분</button>
                <button class="preset-btn" data-minutes="15" ${timerData.isPaused ? '' : 'disabled'}>15분</button>
                <button class="preset-btn" data-minutes="30" ${timerData.isPaused ? '' : 'disabled'}>30분</button>
            </div>
        `;
        
        timersListElem.appendChild(timerElem);
        setupTimerControls(timerElem, timerInstance);
        
        const closeBtn = timerElem.querySelector('.close-timer');
        closeBtn.addEventListener('click', () => removeTimer(timerElem, timerId));
        
        if (!timerData.isPaused) {
            timerInstance.start(timerData.hours, timerData.minutes, timerData.seconds);
        }
    });
    
    const maxId = Math.max(0, ...Object.keys(savedTimers).map(id => parseInt(id)));
    timerIdCounter = maxId + 1;
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
            pauseBtn.innerHTML = '<i class="fas fa-pause"></i> 일시정지';
        } else {
            stopwatch.pause();
            pauseBtn.innerHTML = '<i class="fas fa-play"></i> 재시작';
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
        pauseBtn.innerHTML = '<i class="fas fa-pause"></i> 일시정지';
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
    const workTime = document.getElementById('work-time');
    const breakTime = document.getElementById('break-time');
    
    const workMinutesInput = document.getElementById('work-minutes');
    const shortBreakMinutesInput = document.getElementById('short-break-minutes');
    const longBreakMinutesInput = document.getElementById('long-break-minutes');
    const pomodoroCyclesInput = document.getElementById('cycles');

    // 필수 input 요소가 모두 존재하는지 확인
    if (!workMinutesInput || !shortBreakMinutesInput || !longBreakMinutesInput || !pomodoroCyclesInput) {
        console.warn('[포모도로] 필수 input 요소가 누락됨:', {
            workMinutesInput, shortBreakMinutesInput, longBreakMinutesInput, pomodoroCyclesInput
        });
        return;
    }

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
        if (pomodoroMinutes) {
            pomodoroMinutes.textContent = workMinutesInput.value.toString().padStart(2, '0');
        }
        if (pomodoroSeconds) {
            pomodoroSeconds.textContent = '00';
        }
        
        // 현재 모드 시간 표시 업데이트
        updateCurrentModeTime('work');
        
        // 작업/휴식 시간 표시 업데이트
        updateTimeDisplays();
        
        // 사이클 카운트 업데이트
        if (cycleCount) {
            cycleCount.textContent = `0/${pomodoroCyclesInput.value}`;
        }
    }
    
    // 시간 표시 업데이트 함수
    function updateTimeDisplays() {
        const workMin = parseInt(workMinutesInput.value) || 25;
        const shortBreakMin = parseInt(shortBreakMinutesInput.value) || 5;
        
        workTime.textContent = `${workMin.toString().padStart(2, '0')}:00`;
        breakTime.textContent = `${shortBreakMin.toString().padStart(2, '0')}:00`;
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
            pauseBtn.innerHTML = '<i class="fas fa-pause"></i> 일시정지';
        } else {
            pomodoro.pause();
            pauseBtn.innerHTML = '<i class="fas fa-play"></i> 재시작';
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
        cycleCount.textContent = `${currentCycle}/${totalCycles}`;
        
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
        pauseBtn.innerHTML = '<i class="fas fa-pause"></i> 일시정지';
        
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