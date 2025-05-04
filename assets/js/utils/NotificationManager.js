/**
 * 알림 관리 클래스
 * 타이머 알림 및 소리 재생 기능을 제공합니다.
 */
export class NotificationManager {
    constructor() {
        this.sound = 'bell'; // 기본 소리
        this.volume = 0.8; // 기본 볼륨 (0.0 ~ 1.0)
        this.backgroundNotification = true; // 백그라운드 알림 활성화 여부
        
        // 웹 알림 권한 요청
        this._requestNotificationPermission();
    }
    
    /**
     * 알림 소리 설정
     * @param {string} soundName - 소리 이름 ('bell', 'digital', 'nature', 'none')
     */
    setSound(soundName) {
        if (['bell', 'digital', 'nature', 'none'].includes(soundName)) {
            this.sound = soundName;
        }
    }
    
    /**
     * 알림 볼륨 설정
     * @param {number} volume - 볼륨 (0.0 ~ 1.0)
     */
    setVolume(volume) {
        if (volume >= 0 && volume <= 1) {
            this.volume = volume;
        }
    }
    
    /**
     * 백그라운드 알림 설정
     * @param {boolean} enable - 활성화 여부
     */
    setBackgroundNotification(enable) {
        this.backgroundNotification = enable;
    }
    
    /**
     * 알림 재생
     * @param {string} title - 알림 제목
     * @param {string} message - 알림 메시지
     */
    playNotification(title, message) {
        // 소리 재생
        this._playSound();
        
        // 웹 알림 표시 (백그라운드 알림이 활성화되어 있고 권한이 있는 경우)
        if (this.backgroundNotification) {
            this._showNotification(title, message);
        }
    }
    
    /**
     * 소리 재생
     * @private
     */
    _playSound() {
        if (this.sound === 'none') return;
        
        const audioElement = document.getElementById(`${this.sound}-sound`);
        if (audioElement) {
            audioElement.volume = this.volume;
            
            // 재생 중인 경우 다시 시작
            audioElement.pause();
            audioElement.currentTime = 0;
            
            // 소리 재생 (자동 재생 정책으로 인한 오류 처리)
            const playPromise = audioElement.play();
            
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.warn('자동 재생이 차단되었습니다:', error);
                });
            }
        }
    }
    
    /**
     * 웹 알림 표시
     * @param {string} title - 알림 제목
     * @param {string} message - 알림 메시지
     * @private
     */
    _showNotification(title, message) {
        if (!('Notification' in window)) {
            console.warn('이 브라우저는 알림을 지원하지 않습니다.');
            return;
        }
        
        if (Notification.permission === 'granted') {
            const notification = new Notification(title, {
                body: message,
                icon: '/assets/images/timer-icon.png'
            });
            
            // 알림 클릭 시 포커스
            notification.onclick = () => {
                window.focus();
                notification.close();
            };
            
            // 5초 후 자동으로 닫힘
            setTimeout(() => notification.close(), 5000);
        } else if (Notification.permission !== 'denied') {
            this._requestNotificationPermission();
        }
    }
    
    /**
     * 웹 알림 권한 요청
     * @private
     */
    _requestNotificationPermission() {
        if (!('Notification' in window)) return;
        
        if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
            Notification.requestPermission()
                .then(permission => {
                    if (permission === 'granted') {
                        console.log('알림 권한이 허용되었습니다.');
                    }
                })
                .catch(error => {
                    console.error('알림 권한 요청 중 오류 발생:', error);
                });
        }
    }
} 