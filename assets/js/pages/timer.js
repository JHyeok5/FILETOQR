/**
 * timer.js - FileToQR 타이머, 스톱워치, 포모도로 페이지 컨트롤러
 * 버전: 1.0.0
 * 최종 업데이트: 2025-08-02
 */

// 디버깅 로그
console.log('timer.js 스크립트 로딩 시작');

// 필요한 경우 공통 유틸리티 또는 i18n 모듈 임포트
// import CommonUtils from '../utils/common-utils.js';
// import i18n from '../core/i18n.js';

const TimerPageController = {
  state: {
    initialized: false,
    activeTab: 'timer', // 'timer', 'stopwatch', 'pomodoro'
    timers: [], // 사용자 정의 타이머 목록
    nextTimerId: 0,
    stopwatch: {
      isRunning: false,
      startTime: 0,
      elapsedTime: 0,
      intervalId: null,
      laps: []
    },
    pomodoro: {
      isRunning: false,
      currentMode: 'work', // 'work', 'shortBreak', 'longBreak'
      settings: {
        workMinutes: 25,
        shortBreakMinutes: 5,
        longBreakMinutes: 15,
        cycles: 4, // 긴 휴식 전 반복 횟수
        autoStartNext: false,
        notificationSound: 'bell',
        notificationVolume: 80,
        backgroundNotification: true
      },
      remainingTime: 25 * 60, // 초 단위
      currentCycle: 0,
      intervalId: null
    }
  },

  elements: { // 자주 사용되는 DOM 요소 캐싱
    tabs: null,
    tabContents: null,
    // Timer tab elements
    addTimerBtn: null,
    timersList: null,
    timerTemplate: null,
    requestNotificationPermissionBtn: null,
    // Stopwatch tab elements
    stopwatchDisplay: null,
    stopwatchHours: null,
    stopwatchMinutes: null,
    stopwatchSeconds: null,
    stopwatchMilliseconds: null,
    stopwatchStartBtn: null,
    stopwatchPauseBtn: null,
    stopwatchResetBtn: null,
    stopwatchLapBtn: null,
    lapsList: null,
    // Pomodoro tab elements
    pomodoroStatusText: null,
    pomodoroTimeDisplay: null,
    pomodoroCycleCount: null,
    pomodoroStartBtn: null,
    pomodoroPauseBtn: null,
    pomodoroResetBtn: null,
    pomodoroSkipBtn: null,
    pomodoroWorkMinutesInput: null,
    pomodoroShortBreakInput: null,
    pomodoroLongBreakInput: null,
    pomodoroCyclesInput: null,
    currentWorkSettingDisplay: null,
    currentShortBreakSettingDisplay: null,
    currentLongBreakSettingDisplay: null,
    pomodoroNotificationSoundSelect: null,
    pomodoroNotificationVolumeRange: null,
    pomodoroVolumeValueDisplay: null,
    pomodoroAutoStartCheckbox: null,
    pomodoroBackgroundNotificationCheckbox: null
  },

  init(force = false) {
    if (this.state.initialized && !force) return;
    console.log('TimerPageController 초기화 시작');
    this._cacheDOMElements();
    this._bindEventListeners();
    this._loadSettings(); // 저장된 설정 로드 (예: 포모도로)
    this._setDefaultTab();
    this.state.initialized = true;
    console.log('TimerPageController 초기화 완료');
  },

  _cacheDOMElements() {
    this.elements.tabs = document.querySelectorAll('.timer-tab-btn');
    this.elements.tabContents = document.querySelectorAll('.tab-content');

    // Timer tab
    this.elements.addTimerBtn = document.getElementById('add-timer');
    this.elements.timersList = document.getElementById('timers-list');
    this.elements.timerTemplate = document.getElementById('timer-item-template');
    this.elements.requestNotificationPermissionBtn = document.getElementById('request-notification-permission');

    // Stopwatch tab
    this.elements.stopwatchDisplay = document.querySelector('.stopwatch-display'); // 개선된 HTML 구조에 맞게
    this.elements.stopwatchHours = document.getElementById('stopwatch-hours');
    this.elements.stopwatchMinutes = document.getElementById('stopwatch-minutes');
    this.elements.stopwatchSeconds = document.getElementById('stopwatch-seconds');
    this.elements.stopwatchMilliseconds = document.getElementById('stopwatch-milliseconds');
    this.elements.stopwatchStartBtn = document.getElementById('stopwatch-start');
    this.elements.stopwatchPauseBtn = document.getElementById('stopwatch-pause');
    this.elements.stopwatchResetBtn = document.getElementById('stopwatch-reset');
    this.elements.stopwatchLapBtn = document.getElementById('stopwatch-lap');
    this.elements.lapsList = document.getElementById('laps-list');

    // Pomodoro tab
    this.elements.pomodoroStatusText = document.getElementById('pomodoro-status-text');
    this.elements.pomodoroTimeDisplay = document.getElementById('pomodoro-current-mode-time');
    this.elements.pomodoroCycleCount = document.getElementById('pomodoro-cycle-count');
    this.elements.pomodoroStartBtn = document.getElementById('pomodoro-start');
    this.elements.pomodoroPauseBtn = document.getElementById('pomodoro-pause');
    this.elements.pomodoroResetBtn = document.getElementById('pomodoro-reset');
    this.elements.pomodoroSkipBtn = document.getElementById('pomodoro-skip');
    this.elements.pomodoroWorkMinutesInput = document.getElementById('pomodoro-work-minutes');
    this.elements.pomodoroShortBreakInput = document.getElementById('pomodoro-short-break-minutes');
    this.elements.pomodoroLongBreakInput = document.getElementById('pomodoro-long-break-minutes');
    this.elements.pomodoroCyclesInput = document.getElementById('pomodoro-cycles');
    this.elements.currentWorkSettingDisplay = document.getElementById('current-work-setting');
    this.elements.currentShortBreakSettingDisplay = document.getElementById('current-short-break-setting');
    this.elements.currentLongBreakSettingDisplay = document.getElementById('current-long-break-setting');
    this.elements.pomodoroNotificationSoundSelect = document.getElementById('pomodoro-notification-sound');
    this.elements.pomodoroNotificationVolumeRange = document.getElementById('pomodoro-notification-volume');
    this.elements.pomodoroVolumeValueDisplay = document.getElementById('pomodoro-volume-value');
    this.elements.pomodoroAutoStartCheckbox = document.getElementById('pomodoro-auto-start');
    this.elements.pomodoroBackgroundNotificationCheckbox = document.getElementById('pomodoro-background-notification');
  },

  _bindEventListeners() {
    // 탭 버튼 이벤트
    this.elements.tabs.forEach(tab => {
      tab.addEventListener('click', () => this._handleTabSwitch(tab.dataset.type));
    });

    // 타이머 탭 이벤트
    if (this.elements.addTimerBtn) {
        this.elements.addTimerBtn.addEventListener('click', () => this._addTimer());
    }
    if (this.elements.timersList) {
        // 이벤트 위임으로 타이머 아이템 내 버튼들 처리
        this.elements.timersList.addEventListener('click', (event) => this._handleTimerItemActions(event));
        this.elements.timersList.addEventListener('input', (event) => this._handleTimerItemInputs(event));
    }
    if (this.elements.requestNotificationPermissionBtn) {
        const buttonInside = this.elements.requestNotificationPermissionBtn.querySelector('button');
        if (buttonInside) {
            buttonInside.addEventListener('click', () => this._requestNotificationPermission());
        }
    }
    
    // 스톱워치 탭 이벤트
    if (this.elements.stopwatchStartBtn) this.elements.stopwatchStartBtn.addEventListener('click', () => this._startStopwatch());
    if (this.elements.stopwatchPauseBtn) this.elements.stopwatchPauseBtn.addEventListener('click', () => this._pauseStopwatch());
    if (this.elements.stopwatchResetBtn) this.elements.stopwatchResetBtn.addEventListener('click', () => this._resetStopwatch());
    if (this.elements.stopwatchLapBtn) this.elements.stopwatchLapBtn.addEventListener('click', () => this._lapStopwatch());

    // 포모도로 탭 이벤트
    if (this.elements.pomodoroStartBtn) this.elements.pomodoroStartBtn.addEventListener('click', () => this._startPomodoro());
    if (this.elements.pomodoroPauseBtn) this.elements.pomodoroPauseBtn.addEventListener('click', () => this._pausePomodoro());
    if (this.elements.pomodoroResetBtn) this.elements.pomodoroResetBtn.addEventListener('click', () => this._resetPomodoro(true)); // true: 사용자 직접 리셋
    if (this.elements.pomodoroSkipBtn) this.elements.pomodoroSkipBtn.addEventListener('click', () => this._skipPomodoroSession());
    
    // 포모도로 설정 변경 이벤트
    const pomodoroSettingInputs = [
        this.elements.pomodoroWorkMinutesInput, 
        this.elements.pomodoroShortBreakInput, 
        this.elements.pomodoroLongBreakInput, 
        this.elements.pomodoroCyclesInput,
        this.elements.pomodoroNotificationSoundSelect,
        this.elements.pomodoroNotificationVolumeRange,
        this.elements.pomodoroAutoStartCheckbox,
        this.elements.pomodoroBackgroundNotificationCheckbox
    ];
    pomodoroSettingInputs.forEach(input => {
        if (input) {
            const eventType = (input.type === 'checkbox' || input.type === 'select-one') ? 'change' : 'input';
            input.addEventListener(eventType, () => this._handlePomodoroSettingsChange());
        }
    });
  },

  _handleTabSwitch(tabType) {
    if (!tabType || this.state.activeTab === tabType) return;
    console.log(`탭 전환: ${tabType}`);
    this.state.activeTab = tabType;

    this.elements.tabs.forEach(tab => {
      tab.classList.toggle('active-tab', tab.dataset.type === tabType); // 'active-tab' 클래스로 활성 탭 스타일링 (CSS 필요)
      tab.classList.toggle('text-blue-600', tab.dataset.type === tabType);
      tab.classList.toggle('border-blue-600', tab.dataset.type === tabType);
      tab.classList.toggle('bg-blue-50', tab.dataset.type === tabType);
      tab.classList.toggle('text-slate-600', tab.dataset.type !== tabType);
      tab.classList.toggle('hover:text-blue-500', tab.dataset.type !== tabType);
    });

    this.elements.tabContents.forEach(content => {
      content.classList.toggle('hidden', content.id !== `${tabType}-tab-content`);
    });

    // 각 탭 활성화 시 필요한 초기화/업데이트 로직
    switch (tabType) {
      case 'timer':
        this._updateTimersDisplay();
        this._checkNotificationPermission();
        break;
      case 'stopwatch':
        this._updateStopwatchDisplay();
        this._updateLapsDisplay();
        break;
      case 'pomodoro':
        this._updatePomodoroDisplay();
        this._updatePomodoroSettingsDisplay();
        break;
    }
  },

  _setDefaultTab() {
    // URL 파라미터나 저장된 값으로 초기 탭 결정 가능
    const params = new URLSearchParams(window.location.search);
    const initialTab = params.get('tab') || 'timer';
    this._handleTabSwitch(initialTab);
    if (initialTab === 'timer') { // 타이머 탭이 기본이면, 초기 타이머 하나 추가 또는 기존 타이머 로드
        this._loadTimers(); // 저장된 타이머 로드 시도
        if (this.state.timers.length === 0) {
            this._addTimer(true); // 기본 타이머 하나 추가 (true는 초기화용)
        }
    }
  },

  // --- Timer Tab Logic ---
  _addTimer(isInitial = false) {
    if (!this.elements.timerTemplate) {
        console.error('타이머 템플릿을 찾을 수 없습니다.');
        return;
    }
    console.log('타이머 추가 요청');
    const newTimerId = `timer-${this.state.nextTimerId++}`;
    const timerData = {
      id: newTimerId,
      label: '',
      initialSeconds: 0, // 사용자가 설정한 총 시간(초)
      remainingSeconds: 0, // 남은 시간(초)
      isRunning: false,
      isPaused: false,
      intervalId: null,
      startTime: 0 // 타이머 시작 시점 (Date.now())
    };
    this.state.timers.push(timerData);

    const templateContent = this.elements.timerTemplate.content.cloneNode(true);
    const timerElement = templateContent.querySelector('.timer-item');
    timerElement.dataset.timerId = newTimerId;

    // 초기 UI 설정 (시간은 00:00:00)
    this._updateSpecificTimerDisplay(timerElement, 0);
    // 버튼 상태 초기화
    const startBtn = timerElement.querySelector('.timer-start');
    const pauseBtn = timerElement.querySelector('.timer-pause');
    if(startBtn) startBtn.disabled = false;
    if(pauseBtn) pauseBtn.disabled = true;

    this.elements.timersList.appendChild(timerElement);
    console.log(`타이머 ${newTimerId} 추가됨.`);

    if (!isInitial) {
        this._saveTimers(); // 초기 설정 시에는 저장 안 함
    }
    this._updateTimersDisplay(); // 전체 타이머 목록 UI (예: 비어있음 메시지 처리)
    return timerData; // 생성된 타이머 데이터 반환
  },

  _removeTimer(timerId) {
    const timerIndex = this.state.timers.findIndex(t => t.id === timerId);
    if (timerIndex > -1) {
      const timer = this.state.timers[timerIndex];
      if (timer.intervalId) clearInterval(timer.intervalId);
      this.state.timers.splice(timerIndex, 1);
      
      const timerElement = this.elements.timersList.querySelector(`.timer-item[data-timer-id="${timerId}"]`);
      if (timerElement) {
        timerElement.remove();
      }
      console.log(`타이머 ${timerId} 삭제됨.`);
      this._saveTimers();
      this._updateTimersDisplay();
    } else {
        console.warn(`삭제할 타이머 ${timerId}를 찾지 못했습니다.`);
    }
  },

  _getTimerById(timerId) {
    return this.state.timers.find(t => t.id === timerId);
  },

  _updateSpecificTimerDisplay(timerElement, totalSeconds) {
    if (!timerElement) return;
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const hoursEl = timerElement.querySelector('.timer-hours');
    const minutesEl = timerElement.querySelector('.timer-minutes');
    const secondsEl = timerElement.querySelector('.timer-seconds');

    if (hoursEl) hoursEl.textContent = String(hours).padStart(2, '0');
    if (minutesEl) minutesEl.textContent = String(minutes).padStart(2, '0');
    if (secondsEl) secondsEl.textContent = String(seconds).padStart(2, '0');
  },

  _handleTimerItemActions(event) {
    const target = event.target.closest('button');
    if (!target) return;

    const timerItemElement = target.closest('.timer-item');
    if (!timerItemElement) return;

    const timerId = timerItemElement.dataset.timerId;
    const timer = this._getTimerById(timerId);
    if (!timer) return;

    if (target.classList.contains('timer-start')) {
      this._startIndividualTimer(timer, timerItemElement);
    } else if (target.classList.contains('timer-pause')) {
      this._pauseIndividualTimer(timer, timerItemElement);
    } else if (target.classList.contains('timer-reset')) {
      this._resetIndividualTimer(timer, timerItemElement);
    } else if (target.classList.contains('close-timer')) {
      this._removeTimer(timerId);
    } else if (target.classList.contains('preset-btn')) {
      const minutes = parseInt(target.dataset.minutes, 10) || 0;
      const hours = parseInt(target.dataset.hours, 10) || 0;
      const presetSeconds = (hours * 3600) + (minutes * 60);
      this._setIndividualTimerTime(timer, timerItemElement, presetSeconds, true);
    }
    this._saveTimers();
  },
  
  _handleTimerItemInputs(event) {
    const target = event.target;
    if (!target || (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA')) return;

    const timerItemElement = target.closest('.timer-item');
    if (!timerItemElement) return;
    const timerId = timerItemElement.dataset.timerId;
    const timer = this._getTimerById(timerId);
    if (!timer) return;

    if (target.classList.contains('timer-label')) {
        timer.label = target.value;
        console.log(`타이머 ${timerId} 레이블 변경: ${target.value}`);
    } else if (target.classList.contains('hours-input') || target.classList.contains('minutes-input') || target.classList.contains('seconds-input')) {
        if (timer.isRunning || timer.isPaused) { // 실행 중이거나 일시정지 중일 때는 시간 변경 방지 (또는 리셋 후 변경)
            console.log('실행 중인 타이머의 시간은 변경할 수 없습니다. 먼저 초기화하세요.');
            // 원래 값으로 되돌리거나, 사용자에게 알림
            const hoursInput = timerItemElement.querySelector('.hours-input');
            const minutesInput = timerItemElement.querySelector('.minutes-input');
            const secondsInput = timerItemElement.querySelector('.seconds-input');
            const currentTotalSeconds = timer.initialSeconds;
            if(hoursInput) hoursInput.value = Math.floor(currentTotalSeconds / 3600);
            if(minutesInput) minutesInput.value = Math.floor((currentTotalSeconds % 3600) / 60);
            if(secondsInput) secondsInput.value = currentTotalSeconds % 60;
            return;
        }
        const hoursInput = timerItemElement.querySelector('.hours-input');
        const minutesInput = timerItemElement.querySelector('.minutes-input');
        const secondsInput = timerItemElement.querySelector('.seconds-input');
        
        const h = parseInt(hoursInput.value, 10) || 0;
        const m = parseInt(minutesInput.value, 10) || 0;
        const s = parseInt(secondsInput.value, 10) || 0;

        const totalSeconds = Math.max(0, (h * 3600) + (m * 60) + s);
        this._setIndividualTimerTime(timer, timerItemElement, totalSeconds, false);
    }
    this._saveTimers();
  },

  _setIndividualTimerTime(timer, timerElement, totalSeconds, isPreset) {
    if (timer.isRunning || timer.isPaused) { // 실행/일시정지 중 프리셋 적용 시 리셋 후 적용
        this._resetIndividualTimer(timer, timerElement, false); // UI 업데이트 없이 내부 상태만 초기화
    }
    timer.initialSeconds = totalSeconds;
    timer.remainingSeconds = totalSeconds;
    this._updateSpecificTimerDisplay(timerElement, totalSeconds);

    if (!isPreset) { // 프리셋이 아닌 직접 입력일 경우, 입력 필드도 업데이트 (값 범위 교정 등)
        const hoursInput = timerElement.querySelector('.hours-input');
        const minutesInput = timerElement.querySelector('.minutes-input');
        const secondsInput = timerElement.querySelector('.seconds-input');
        if(hoursInput) hoursInput.value = Math.floor(totalSeconds / 3600);
        if(minutesInput) minutesInput.value = Math.floor((totalSeconds % 3600) / 60);
        if(secondsInput) secondsInput.value = totalSeconds % 60;
    }
    // 시작 버튼 활성화 조건: 시간이 0보다 클 때
    const startBtn = timerElement.querySelector('.timer-start');
    if(startBtn) startBtn.disabled = totalSeconds <= 0;
  },

  _updateTimersDisplay() {
    console.log('타이머 목록 UI 업데이트');
    const hasTimers = this.state.timers.length > 0;
    // 여기에 "타이머 없음" 메시지 표시/숨김 로직 추가 가능
    // 예: const noTimersMessage = document.getElementById('no-timers-message');
    // if (noTimersMessage) noTimersMessage.classList.toggle('hidden', hasTimers);
    
    // 알림 권한 요청 버튼 표시 여부 업데이트
    this._checkNotificationPermission();
  },

  _saveTimers() {
    try {
      const timersToSave = this.state.timers.map(t => ({
        id: t.id,
        label: t.label,
        initialSeconds: t.initialSeconds
        // 실행 상태 등은 저장하지 않음. 페이지 로드 시 항상 초기 상태
      }));
      localStorage.setItem('fileToQrUserTimers', JSON.stringify(timersToSave));
      console.log('사용자 타이머 저장됨', timersToSave);
    } catch (e) {
      console.error('사용자 타이머 저장 실패:', e);
    }
  },

  _loadTimers() {
    try {
      const savedTimers = localStorage.getItem('fileToQrUserTimers');
      if (savedTimers) {
        const parsedTimers = JSON.parse(savedTimers);
        if (Array.isArray(parsedTimers)) {
          parsedTimers.forEach(savedTimerData => {
            const newTimer = this._addTimer(true); // isInitial=true로 저장 안함
            if (newTimer) {
                newTimer.label = savedTimerData.label || '';
                const timerElement = this.elements.timersList.querySelector(`.timer-item[data-timer-id="${newTimer.id}"]`);
                if (timerElement) {
                    const labelInput = timerElement.querySelector('.timer-label');
                    if(labelInput) labelInput.value = newTimer.label;
                    this._setIndividualTimerTime(newTimer, timerElement, savedTimerData.initialSeconds || 0, false);
                }
            }
          });
          console.log(`${parsedTimers.length}개 타이머 로드됨.`);
        }
      }
    } catch (e) {
      console.error('사용자 타이머 로드 실패:', e);
    }
    this._updateTimersDisplay();
  },

  // --- Stopwatch Tab Logic ---
  _startStopwatch() {
    if (this.state.stopwatch.isRunning) return;
    this.state.stopwatch.isRunning = true;

    // elapsedTime은 pause 시점에 누적되므로, startTime은 항상 현재 시간 기준으로 새롭게 설정
    this.state.stopwatch.startTime = Date.now(); 

    this.elements.stopwatchStartBtn.disabled = true;
    this.elements.stopwatchPauseBtn.disabled = false;
    this.elements.stopwatchLapBtn.disabled = false;
    this.elements.stopwatchResetBtn.disabled = false; // 실행 중에도 리셋 가능

    this.state.stopwatch.intervalId = setInterval(() => {
      this._updateStopwatchDisplay();
    }, 10); // 10ms 간격으로 업데이트 (밀리초 표시용)
    console.log('스톱워치 시작');
  },

  _pauseStopwatch() {
    if (!this.state.stopwatch.isRunning) return;
    this.state.stopwatch.isRunning = false;
    clearInterval(this.state.stopwatch.intervalId);
    this.state.stopwatch.intervalId = null;

    // 현재까지의 경과 시간 누적 (새로운 elapsedTime = 이전 elapsedTime + 이번 startTime부터 지금까지의 시간)
    const currentTime = Date.now();
    this.state.stopwatch.elapsedTime += (currentTime - this.state.stopwatch.startTime);

    this.elements.stopwatchStartBtn.disabled = false;
    this.elements.stopwatchStartBtn.innerHTML = '<i class="fas fa-play mr-2"></i>계속';
    this.elements.stopwatchPauseBtn.disabled = true;
    this.elements.stopwatchLapBtn.disabled = true; // 일시정지 중에는 랩 기록 불가
    console.log('스톱워치 일시정지');
  },

  _resetStopwatch() {
    if (this.state.stopwatch.intervalId) {
      clearInterval(this.state.stopwatch.intervalId);
      this.state.stopwatch.intervalId = null;
    }
    this.state.stopwatch.isRunning = false;
    this.state.stopwatch.elapsedTime = 0;
    this.state.stopwatch.startTime = 0;
    this.state.stopwatch.laps = [];

    this._updateStopwatchDisplay(); // 시간을 00:00:00.00으로 리셋
    this._updateLapsDisplay();    // 랩 목록 비우기

    this.elements.stopwatchStartBtn.disabled = false;
    this.elements.stopwatchStartBtn.innerHTML = '<i class="fas fa-play mr-2"></i>시작';
    this.elements.stopwatchPauseBtn.disabled = true;
    this.elements.stopwatchLapBtn.disabled = true;
    this.elements.stopwatchResetBtn.disabled = false; // 리셋 버튼은 항상 활성화 (또는 초기 상태에서는 비활성화)
    console.log('스톱워치 초기화');
  },

  _lapStopwatch() {
    if (!this.state.stopwatch.isRunning) return;
    
    const currentOverallTime = this.state.stopwatch.elapsedTime + (Date.now() - this.state.stopwatch.startTime);
    
    // 마지막 랩 이후의 시간 또는 전체 시간 (첫 랩인 경우)
    // const lastLapTotalTime = this.state.stopwatch.laps.length > 0 ? 
    //     this.state.stopwatch.laps.reduce((sum, lap) => sum + lap.rawTime, 0) : 0;
    // const lapTime = currentOverallTime - lastLapTotalTime;
    // 위 방식은 각 랩의 시간을 더하는 것. 여기서는 그냥 현재 스톱워치 시간을 기록.

    this.state.stopwatch.laps.push({
      lapNumber: this.state.stopwatch.laps.length + 1,
      displayTime: this._formatStopwatchTime(currentOverallTime),
      rawTime: currentOverallTime // 밀리초 단위 전체 시간 저장 (개별 랩 시간 아님)
    });
    this._updateLapsDisplay();
    console.log('스톱워치 랩 기록');
  },

  _formatStopwatchTime(totalMilliseconds) {
    const totalSeconds = Math.floor(totalMilliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const milliseconds = Math.floor((totalMilliseconds % 1000) / 10); // 백분의 일초

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(milliseconds).padStart(2, '0')}`;
  },

  _updateStopwatchDisplay() {
    let displayTimeMs = 0;
    if (this.state.stopwatch.isRunning) {
        displayTimeMs = this.state.stopwatch.elapsedTime + (Date.now() - this.state.stopwatch.startTime);
    } else {
        displayTimeMs = this.state.stopwatch.elapsedTime; // 멈췄을 때는 누적된 시간만 표시
    }

    const formattedTime = this._formatStopwatchTime(displayTimeMs);
    const parts = formattedTime.split(':');
    const secondsAndMs = parts[2].split('.');

    this.elements.stopwatchHours.textContent = parts[0];
    this.elements.stopwatchMinutes.textContent = parts[1];
    this.elements.stopwatchSeconds.textContent = secondsAndMs[0];
    this.elements.stopwatchMilliseconds.textContent = secondsAndMs[1];
  },

  _updateLapsDisplay() {
    this.elements.lapsList.innerHTML = ''; // 기존 목록 초기화
    if (this.state.stopwatch.laps.length === 0) {
      this.elements.lapsList.innerHTML = '<p class="text-slate-400 text-sm text-center py-4">랩 기록이 없습니다.</p>';
      return;
    }
    this.state.stopwatch.laps.forEach((lap, index) => {
      const li = document.createElement('li');
      li.className = 'lap-item flex justify-between items-center text-sm text-slate-700 p-2 bg-white rounded shadow-xs even:bg-slate-50';
      li.innerHTML = `
        <span>랩 ${lap.lapNumber}</span>
        <span class="font-mono">${lap.displayTime}</span>
      `;
      this.elements.lapsList.appendChild(li);
    });
    console.log('랩 기록 업데이트 완료');
  },

  // --- Pomodoro Tab Logic ---
  _startPomodoro() {
    if (this.state.pomodoro.isRunning) return;
    this.state.pomodoro.isRunning = true;

    // 만약 remainingTime이 0이거나 초기 상태라면, 현재 모드의 시간으로 설정
    if (this.state.pomodoro.remainingTime <= 0) {
        this._setPomodoroTimeToCurrentMode();
    }

    this.elements.pomodoroStartBtn.disabled = true;
    this.elements.pomodoroPauseBtn.disabled = false;
    this.elements.pomodoroSkipBtn.disabled = false; // 실행 중 건너뛰기 가능
    this._togglePomodoroSettingsInputs(true); // 설정 비활성화

    this.state.pomodoro.intervalId = setInterval(() => {
      this._updatePomodoroTimer();
    }, 1000);
    console.log(`포모도로 ${this.state.pomodoro.currentMode} 시작`);
  },

  _pausePomodoro() {
    if (!this.state.pomodoro.isRunning) return;
    this.state.pomodoro.isRunning = false;
    clearInterval(this.state.pomodoro.intervalId);
    this.state.pomodoro.intervalId = null;

    this.elements.pomodoroStartBtn.disabled = false;
    this.elements.pomodoroStartBtn.innerHTML = '<i class="fas fa-play mr-2"></i>계속';
    this.elements.pomodoroPauseBtn.disabled = true;
    // Skip 버튼은 계속 활성화 상태로 둘 수 있음 (일시정지 중에도 다음 세션으로)
    console.log('포모도로 일시정지');
  },

  _resetPomodoro(isManualReset = false) {
    if (this.state.pomodoro.intervalId) {
      clearInterval(this.state.pomodoro.intervalId);
      this.state.pomodoro.intervalId = null;
    }
    this.state.pomodoro.isRunning = false;
    this.state.pomodoro.currentMode = 'work';
    this.state.pomodoro.currentCycle = 0;
    this.state.pomodoro.remainingTime = this.state.pomodoro.settings.workMinutes * 60;
    
    this._updatePomodoroDisplay();
    if (isManualReset) { // 사용자가 직접 리셋한 경우, 설정 UI도 업데이트
        this._updatePomodoroSettingsDisplay(); 
    }

    this.elements.pomodoroStartBtn.disabled = false;
    this.elements.pomodoroStartBtn.innerHTML = '<i class="fas fa-play mr-2"></i>시작';
    this.elements.pomodoroPauseBtn.disabled = true;
    this.elements.pomodoroSkipBtn.disabled = true; // 초기 상태에서는 건너뛰기 비활성화
    this._togglePomodoroSettingsInputs(false); // 설정 활성화
    console.log(`포모도로 초기화 (수동: ${isManualReset})`);
  },

  _skipPomodoroSession() {
    if (this.state.pomodoro.intervalId) {
      clearInterval(this.state.pomodoro.intervalId);
      this.state.pomodoro.intervalId = null;
    }
    this.state.pomodoro.isRunning = false; // 일단 중지 상태로
    this._moveToNextPomodoroSession(true); // true: 사용자에 의한 건너뛰기
    console.log('포모도로 세션 건너뛰기');
  },
  
  _updatePomodoroTimer() {
    if (!this.state.pomodoro.isRunning) return;
    this.state.pomodoro.remainingTime--;
    this._updatePomodoroDisplay();

    if (this.state.pomodoro.remainingTime < 0) { // 0초가 될 때 처리
      this._moveToNextPomodoroSession(false); // false: 자동 전환
    }
  },

  _moveToNextPomodoroSession(isSkipped = false) {
    if (this.state.pomodoro.intervalId) {
        clearInterval(this.state.pomodoro.intervalId);
        this.state.pomodoro.intervalId = null;
    }
    this.state.pomodoro.isRunning = false;

    let notificationMessage = '';

    if (this.state.pomodoro.currentMode === 'work') {
      this.state.pomodoro.currentCycle++;
      notificationMessage = '작업 시간 종료! 휴식을 시작하세요.';
      if (this.state.pomodoro.currentCycle >= this.state.pomodoro.settings.cycles) {
        this.state.pomodoro.currentMode = 'longBreak';
        this.state.pomodoro.remainingTime = this.state.pomodoro.settings.longBreakMinutes * 60;
        this.state.pomodoro.currentCycle = 0; // 긴 휴식 후 사이클 초기화
      } else {
        this.state.pomodoro.currentMode = 'shortBreak';
        this.state.pomodoro.remainingTime = this.state.pomodoro.settings.shortBreakMinutes * 60;
      }
    } else { // shortBreak or longBreak
      notificationMessage = '휴식 시간 종료! 다음 작업을 시작하세요.';
      this.state.pomodoro.currentMode = 'work';
      this.state.pomodoro.remainingTime = this.state.pomodoro.settings.workMinutes * 60;
    }

    this._updatePomodoroDisplay();
    this._playNotificationSound(); // 소리 알림
    this._notifyUser(notificationMessage); // 브라우저 알림

    this.elements.pomodoroStartBtn.innerHTML = '<i class="fas fa-play mr-2"></i>시작';
    this.elements.pomodoroStartBtn.disabled = false;
    this.elements.pomodoroPauseBtn.disabled = true;
    this.elements.pomodoroSkipBtn.disabled = false; // 다음 세션으로 넘어왔으므로 건너뛰기 가능

    if (this.state.pomodoro.settings.autoStartNext && !isSkipped) {
      this._startPomodoro();
    } else {
      // 자동 시작이 아니거나, 사용자가 직접 스킵한 경우엔 시작하지 않음.
      // UI는 다음 세션을 준비한 상태로 둠.
    }
  },
  
  _setPomodoroTimeToCurrentMode() {
    switch (this.state.pomodoro.currentMode) {
        case 'work':
            this.state.pomodoro.remainingTime = this.state.pomodoro.settings.workMinutes * 60;
            break;
        case 'shortBreak':
            this.state.pomodoro.remainingTime = this.state.pomodoro.settings.shortBreakMinutes * 60;
            break;
        case 'longBreak':
            this.state.pomodoro.remainingTime = this.state.pomodoro.settings.longBreakMinutes * 60;
            break;
    }
  },

  _togglePomodoroSettingsInputs(disable) {
    const inputs = [
        this.elements.pomodoroWorkMinutesInput,
        this.elements.pomodoroShortBreakInput,
        this.elements.pomodoroLongBreakInput,
        this.elements.pomodoroCyclesInput,
        // 알림 설정은 타이머 실행 중에도 변경 가능하도록 둘 수 있음 (선택적)
        // this.elements.pomodoroNotificationSoundSelect,
        // this.elements.pomodoroNotificationVolumeRange,
        // this.elements.pomodoroAutoStartCheckbox,
        // this.elements.pomodoroBackgroundNotificationCheckbox
    ];
    inputs.forEach(input => {
        if(input) input.disabled = disable;
    });
  },

  _handlePomodoroSettingsChange() {
    console.log('포모도로 설정 변경됨');
    // 값 읽기 및 state 업데이트
    this.state.pomodoro.settings.workMinutes = parseInt(this.elements.pomodoroWorkMinutesInput.value, 10) || 25;
    this.state.pomodoro.settings.shortBreakMinutes = parseInt(this.elements.pomodoroShortBreakInput.value, 10) || 5;
    this.state.pomodoro.settings.longBreakMinutes = parseInt(this.elements.pomodoroLongBreakInput.value, 10) || 15;
    this.state.pomodoro.settings.cycles = parseInt(this.elements.pomodoroCyclesInput.value, 10) || 4;
    this.state.pomodoro.settings.notificationSound = this.elements.pomodoroNotificationSoundSelect.value;
    this.state.pomodoro.settings.notificationVolume = parseInt(this.elements.pomodoroNotificationVolumeRange.value, 10);
    this.state.pomodoro.settings.autoStartNext = this.elements.pomodoroAutoStartCheckbox.checked;
    this.state.pomodoro.settings.backgroundNotification = this.elements.pomodoroBackgroundNotificationCheckbox.checked;

    if (this.elements.pomodoroNotificationVolumeRange && this.elements.pomodoroVolumeValueDisplay) {
        this.elements.pomodoroVolumeValueDisplay.textContent = this.state.pomodoro.settings.notificationVolume;
    }
    this._updatePomodoroSettingsDisplay(); // 입력 필드 값 재조정 (min/max 등)
    this._saveSettings(); 

    if (!this.state.pomodoro.isRunning) {
        // 현재 모드에 따라 remainingTime 업데이트 (단, 리셋을 명시적으로 호출하는 것이 더 안전할 수 있음)
        this._setPomodoroTimeToCurrentMode(); 
        this._updatePomodoroDisplay(); // UI 즉시 반영
    }
  },

  _updatePomodoroDisplay() {
    if (!this.elements.pomodoroTimeDisplay) return; // 요소 로드 전 호출 방지
    const timeString = this._formatTime(this.state.pomodoro.remainingTime < 0 ? 0 : this.state.pomodoro.remainingTime);
    this.elements.pomodoroTimeDisplay.textContent = timeString.substring(3); // HH 제거, MM:SS만 표시

    let modeText = '';
    switch (this.state.pomodoro.currentMode) {
      case 'work':
        modeText = '작업 시간';
        this.elements.pomodoroTimeDisplay.classList.remove('text-green-600', 'text-yellow-600');
        this.elements.pomodoroTimeDisplay.classList.add('text-blue-600');
        break;
      case 'shortBreak':
        modeText = '짧은 휴식';
        this.elements.pomodoroTimeDisplay.classList.remove('text-blue-600', 'text-yellow-600');
        this.elements.pomodoroTimeDisplay.classList.add('text-green-600');
        break;
      case 'longBreak':
        modeText = '긴 휴식';
        this.elements.pomodoroTimeDisplay.classList.remove('text-blue-600', 'text-green-600');
        this.elements.pomodoroTimeDisplay.classList.add('text-yellow-600'); // 긴 휴식은 다른 색으로
        break;
    }
    this.elements.pomodoroStatusText.textContent = modeText;
    this.elements.pomodoroCycleCount.textContent = `${this.state.pomodoro.currentCycle}/${this.state.pomodoro.settings.cycles} 세션`;
  },
  
  _playNotificationSound() {
    const sound = this.state.pomodoro.settings.notificationSound;
    const volume = this.state.pomodoro.settings.notificationVolume / 100;
    if (sound === 'none') return;

    // 실제 오디오 파일 경로를 Config 또는 다른 곳에서 관리하는 것이 좋음
    const soundFiles = {
        bell: '/assets/sounds/bell.mp3',
        ding: '/assets/sounds/ding.mp3',
        alarm: '/assets/sounds/alarm.mp3' 
    };

    if (soundFiles[sound]) {
        try {
            const audio = new Audio(soundFiles[sound]);
            audio.volume = volume;
            audio.play().catch(e => console.warn('알림 소리 재생 실패:', e)); // 자동 재생 정책 관련 오류 캐치
        } catch (e) {
            console.error('오디오 객체 생성 오류:', e);
        }
    } else {
        console.warn(`알림 소리 파일을 찾을 수 없음: ${sound}`);
    }
  },

  _updatePomodoroSettingsDisplay() {
    console.log('포모도로 설정 UI 업데이트');
    if (!this.state.initialized || !this.elements.pomodoroWorkMinutesInput) return; // DOM 요소 캐싱 전 호출 방지
    
    this.elements.pomodoroWorkMinutesInput.value = this.state.pomodoro.settings.workMinutes;
    this.elements.pomodoroShortBreakInput.value = this.state.pomodoro.settings.shortBreakMinutes;
    this.elements.pomodoroLongBreakInput.value = this.state.pomodoro.settings.longBreakMinutes;
    this.elements.pomodoroCyclesInput.value = this.state.pomodoro.settings.cycles;
    
    if(this.elements.currentWorkSettingDisplay) this.elements.currentWorkSettingDisplay.textContent = this.state.pomodoro.settings.workMinutes;
    if(this.elements.currentShortBreakSettingDisplay) this.elements.currentShortBreakSettingDisplay.textContent = this.state.pomodoro.settings.shortBreakMinutes;
    if(this.elements.currentLongBreakSettingDisplay) this.elements.currentLongBreakSettingDisplay.textContent = this.state.pomodoro.settings.longBreakMinutes;

    this.elements.pomodoroNotificationSoundSelect.value = this.state.pomodoro.settings.notificationSound;
    this.elements.pomodoroNotificationVolumeRange.value = this.state.pomodoro.settings.notificationVolume;
    if(this.elements.pomodoroVolumeValueDisplay) this.elements.pomodoroVolumeValueDisplay.textContent = this.state.pomodoro.settings.notificationVolume;
    this.elements.pomodoroAutoStartCheckbox.checked = this.state.pomodoro.settings.autoStartNext;
    this.elements.pomodoroBackgroundNotificationCheckbox.checked = this.state.pomodoro.settings.backgroundNotification;
  },
  
  // --- Settings Persistence (localStorage) ---
  _saveSettings() {
    try {
      const settingsToSave = {
        pomodoro: this.state.pomodoro.settings
      };
      localStorage.setItem('fileToQrTimerSettings', JSON.stringify(settingsToSave));
      console.log('설정 저장됨:', settingsToSave);
    } catch (e) {
      console.error('설정 저장 실패:', e);
    }
  },

  _loadSettings() {
    try {
      const savedSettings = localStorage.getItem('fileToQrTimerSettings');
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);
        if (parsedSettings.pomodoro) {
          // 저장된 값과 기본값을 병합하여 누락된 필드 처리
          this.state.pomodoro.settings = { ...this.state.pomodoro.settings, ...parsedSettings.pomodoro };
        }
        console.log('설정 로드됨:', this.state.pomodoro.settings);
      }
    } catch (e) {
      console.error('설정 로드 실패:', e);
    }
    // 로드 후 UI에 반영
    if (this.state.initialized) { // DOM 요소 캐싱 후 실행 보장
        this._updatePomodoroSettingsDisplay();
        this._resetPomodoro(false); // 로드된 설정으로 포모도로 상태 초기화
    }
  },

  // --- Utility functions ---
  _formatTime(totalSeconds) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  },

  _formatMilliseconds(ms) {
    return String(Math.floor(ms / 10)).padStart(2, '0'); // Display hundredths of a second
  },
  
  destroy() {
    // 이벤트 리스너 제거 등 필요한 정리 작업
    // 이 예제에서는 간단히 상태 초기화
    this.state.initialized = false;
    this.state.timers.forEach(timer => clearInterval(timer.intervalId));
    if(this.state.stopwatch.intervalId) clearInterval(this.state.stopwatch.intervalId);
    if(this.state.pomodoro.intervalId) clearInterval(this.state.pomodoro.intervalId);
    console.log('TimerPageController 해제');
  },

  _startIndividualTimer(timer, timerElement) {
    if (timer.isRunning || timer.remainingSeconds <= 0) return;

    timer.isRunning = true;
    timer.isPaused = false;
    timer.startTime = Date.now() - ((timer.initialSeconds - timer.remainingSeconds) * 1000); // 일시정지 후 시작 고려

    const startBtn = timerElement.querySelector('.timer-start');
    const pauseBtn = timerElement.querySelector('.timer-pause');
    const resetBtn = timerElement.querySelector('.timer-reset');
    const timeInputs = timerElement.querySelectorAll('.time-inputs input');

    if(startBtn) startBtn.disabled = true;
    if(pauseBtn) pauseBtn.disabled = false;
    if(resetBtn) resetBtn.disabled = false; // 실행 중에도 초기화 가능
    timeInputs.forEach(input => input.disabled = true);

    timer.intervalId = setInterval(() => {
      const elapsed = Math.floor((Date.now() - timer.startTime) / 1000);
      timer.remainingSeconds = Math.max(0, timer.initialSeconds - elapsed);
      this._updateSpecificTimerDisplay(timerElement, timer.remainingSeconds);

      if (timer.remainingSeconds <= 0) {
        this._stopIndividualTimer(timer, timerElement, true); // true: 타이머 완료
      }
    }, 1000);
    console.log(`타이머 ${timer.id} 시작됨.`);
  },

  _pauseIndividualTimer(timer, timerElement) {
    if (!timer.isRunning) return;

    timer.isRunning = false;
    timer.isPaused = true;
    clearInterval(timer.intervalId);
    timer.intervalId = null;
    // remainingSeconds는 이미 setInterval에서 업데이트된 상태로 유지됨

    const startBtn = timerElement.querySelector('.timer-start');
    const pauseBtn = timerElement.querySelector('.timer-pause');

    if(startBtn) {
        startBtn.disabled = false;
        startBtn.innerHTML = '<i class="fas fa-play mr-1 sm:mr-2"></i> 계속'; // 버튼 텍스트 변경
    }
    if(pauseBtn) pauseBtn.disabled = true;
    console.log(`타이머 ${timer.id} 일시정지됨.`);
  },

  _resetIndividualTimer(timer, timerElement, updateDisplay = true) {
    this._stopIndividualTimer(timer, timerElement, false); // false: 완료 아님 (단순 중지/초기화)
    timer.remainingSeconds = timer.initialSeconds;
    timer.isPaused = false;
    
    if (updateDisplay) {
        this._updateSpecificTimerDisplay(timerElement, timer.remainingSeconds);
    }

    const startBtn = timerElement.querySelector('.timer-start');
    const pauseBtn = timerElement.querySelector('.timer-pause');
    const timeInputs = timerElement.querySelectorAll('.time-inputs input');

    if(startBtn) {
        startBtn.disabled = timer.initialSeconds <= 0; // 시간이 0이면 시작 불가
        startBtn.innerHTML = '<i class="fas fa-play mr-1 sm:mr-2"></i> 시작'; // 버튼 텍스트 복원
    }
    if(pauseBtn) pauseBtn.disabled = true;
    timeInputs.forEach(input => input.disabled = false);
    
    // 입력 필드 값도 초기 시간으로 복원
    const hoursInput = timerElement.querySelector('.hours-input');
    const minutesInput = timerElement.querySelector('.minutes-input');
    const secondsInput = timerElement.querySelector('.seconds-input');
    if(hoursInput) hoursInput.value = Math.floor(timer.initialSeconds / 3600);
    if(minutesInput) minutesInput.value = Math.floor((timer.initialSeconds % 3600) / 60);
    if(secondsInput) secondsInput.value = timer.initialSeconds % 60;

    console.log(`타이머 ${timer.id} 초기화됨.`);
  },

  _stopIndividualTimer(timer, timerElement,  isCompleted) {
    timer.isRunning = false;
    if (timer.intervalId) {
      clearInterval(timer.intervalId);
      timer.intervalId = null;
    }

    const startBtn = timerElement.querySelector('.timer-start');
    const pauseBtn = timerElement.querySelector('.timer-pause');
    const timeInputs = timerElement.querySelectorAll('.time-inputs input');

    if(startBtn) {
        startBtn.disabled = timer.initialSeconds <= 0;
        startBtn.innerHTML = '<i class="fas fa-play mr-1 sm:mr-2"></i> 시작'; 
    }
    if(pauseBtn) pauseBtn.disabled = true;
    timeInputs.forEach(input => input.disabled = false);

    if (isCompleted) {
      console.log(`타이머 ${timer.id} 완료됨.`);
      timerElement.classList.add('timer-finished'); // 완료 시각적 피드백 (CSS 필요)
      // 알림 (타이머 이름이 있다면 함께 전달)
      const timerLabel = timerElement.querySelector('.timer-label')?.value || '타이머';
      this._notifyUser(`${timerLabel} 완료!`);
      // (선택) 완료된 타이머는 자동 초기화 또는 특정 상태로 변경
      // this._resetIndividualTimer(timer, timerElement);
    } else {
      console.log(`타이머 ${timer.id} 중지됨.`);
    }
  },

  _notifyUser(message) {
    if (!('Notification' in window)) return; // 브라우저가 알림 미지원

    if (Notification.permission === 'granted') {
      try {
        const notification = new Notification('FileToQR 타이머', {
          body: message,
          icon: '/assets/images/logo/filetoqr_logo_192.png' // 알림 아이콘 경로
        });
        // notification.onclick = () => { window.focus(); }; // 알림 클릭 시 창 포커스 (선택적)
      } catch (e) {
        console.error('알림 생성 오류:', e);
      }
    } else if (Notification.permission !== 'denied') {
      // 알림 권한 요청은 _checkNotificationPermission 및 _requestNotificationPermission 에서 처리
      console.log('알림 권한이 아직 부여되지 않았습니다.');
    }
  },

  _checkNotificationPermission() {
    // ... existing code ...
  }
};

// 페이지 로드 시 또는 FileToQR.js 등 메인 앱 컨트롤러에서 호출
// window.FileToQR = window.FileToQR || {};
// window.FileToQR.TimerPageController = TimerPageController;

// DOMContentLoaded 보장 후 초기화
// app-core.js 에서 window.FileToQR.TimerPageController.init() 호출하도록 구조 변경
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    // 자동 초기화 대신 app-core.js 에서 페이지별 컨트롤러 초기화하도록 변경
    // TimerPageController.init();
  });
} else {
  // TimerPageController.init(); // 위와 동일
}

export default TimerPageController; 