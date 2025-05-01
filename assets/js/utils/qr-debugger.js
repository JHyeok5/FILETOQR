/**
 * qr-debugger.js - QR 코드 생성 디버깅 유틸리티
 * 
 * 이 스크립트는 QR 코드 생성 과정을 디버깅하기 위한 유틸리티 함수를 제공합니다.
 */

// QR 디버거 객체
const QRDebugger = {
    // 디버그 활성화 상태
    enabled: true,
    
    // 초기화
    init() {
        if (this.enabled) {
            console.log('[QRDebugger] 초기화됨');
            this.patchQRCodeLibrary();
            this.injectDebugUI();
        }
    },
    
    // QR 코드 라이브러리 작동 확인
    checkQRLibrary() {
        const report = {
            globalQRCode: typeof QRCode !== 'undefined',
            qrcodeProperties: typeof QRCode !== 'undefined' ? Object.keys(QRCode) : null,
            toCanvasMethod: typeof QRCode !== 'undefined' && typeof QRCode.toCanvas === 'function',
            correctLevelProperty: typeof QRCode !== 'undefined' && typeof QRCode.CorrectLevel !== 'undefined'
        };
        
        console.log('[QRDebugger] QR 라이브러리 상태:', report);
        return report;
    },

    // QR 라이브러리 패치 - 함수 호출 추적
    patchQRCodeLibrary() {
        if (typeof QRCode !== 'undefined') {
            const originalToCanvas = QRCode.toCanvas;
            
            QRCode.toCanvas = function(...args) {
                console.log('[QRDebugger] QRCode.toCanvas 호출됨', {
                    argsLength: args.length,
                    canvasArg: args[0] instanceof HTMLCanvasElement ? 'HTMLCanvasElement' : typeof args[0],
                    contentArg: typeof args[1] === 'string' ? args[1].substring(0, 30) + '...' : typeof args[1],
                    optionsArg: args[2]
                });
                
                return originalToCanvas.apply(this, args).catch(err => {
                    console.error('[QRDebugger] QRCode.toCanvas 실패:', err);
                    throw err;
                });
            };
            
            console.log('[QRDebugger] QRCode 라이브러리 패치됨');
        } else {
            console.warn('[QRDebugger] QRCode 라이브러리가 없어 패치할 수 없습니다.');
        }
    },
    
    // 디버그 UI 삽입
    injectDebugUI() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this._createDebugUI());
        } else {
            this._createDebugUI();
        }
    },
    
    // 디버그 UI 생성
    _createDebugUI() {
        const debugContainer = document.createElement('div');
        debugContainer.id = 'qr-debugger-ui';
        debugContainer.style.cssText = 'position:fixed; bottom:10px; right:10px; z-index:9999; background:#f8f9fa; border:1px solid #dee2e6; padding:10px; border-radius:5px; font-size:12px; box-shadow:0 2px 5px rgba(0,0,0,0.1); max-width:300px;';
        
        debugContainer.innerHTML = `
            <div style="margin-bottom:8px; font-weight:bold; display:flex; justify-content:space-between; align-items:center;">
                <span>QR 디버거</span>
                <button id="qr-debug-close" style="border:none; background:none; cursor:pointer; font-size:16px;">×</button>
            </div>
            <div id="qr-debug-content" style="margin-bottom:8px;"></div>
            <button id="qr-debug-check" style="background:#4263eb; color:white; border:none; padding:4px 8px; border-radius:4px; cursor:pointer; margin-right:5px;">라이브러리 확인</button>
            <button id="qr-debug-test" style="background:#4263eb; color:white; border:none; padding:4px 8px; border-radius:4px; cursor:pointer;">테스트 생성</button>
        `;
        
        document.body.appendChild(debugContainer);
        
        // 이벤트 리스너 등록
        document.getElementById('qr-debug-close').addEventListener('click', () => {
            debugContainer.style.display = 'none';
        });
        
        document.getElementById('qr-debug-check').addEventListener('click', () => {
            const status = this.checkQRLibrary();
            const statusEl = document.getElementById('qr-debug-content');
            statusEl.innerHTML = `
                <div style="margin-bottom:5px;">QRCode 전역객체: <span style="color:${status.globalQRCode ? 'green' : 'red'}">${status.globalQRCode ? '있음' : '없음'}</span></div>
                <div style="margin-bottom:5px;">toCanvas 메서드: <span style="color:${status.toCanvasMethod ? 'green' : 'red'}">${status.toCanvasMethod ? '있음' : '없음'}</span></div>
                <div>CorrectLevel: <span style="color:${status.correctLevelProperty ? 'green' : 'red'}">${status.correctLevelProperty ? '있음' : '없음'}</span></div>
            `;
        });
        
        document.getElementById('qr-debug-test').addEventListener('click', () => {
            this.generateTestQR();
        });
    },
    
    // 테스트 QR 코드 생성
    generateTestQR() {
        const testDiv = document.createElement('div');
        testDiv.style.cssText = 'position:fixed; top:50%; left:50%; transform:translate(-50%, -50%); background:white; padding:20px; border-radius:8px; box-shadow:0 4px 12px rgba(0,0,0,0.15); z-index:10000;';
        testDiv.innerHTML = `
            <h3 style="margin-top:0; margin-bottom:15px;">QR 코드 테스트</h3>
            <div id="test-qr-container" style="width:200px; height:200px; margin-bottom:15px; display:flex; justify-content:center; align-items:center; background:#f5f5f5;"></div>
            <div id="test-qr-status" style="margin-bottom:15px; font-size:14px;">생성 중...</div>
            <button id="test-qr-close" style="background:#e74c3c; color:white; border:none; padding:8px 16px; border-radius:4px; cursor:pointer;">닫기</button>
        `;
        
        document.body.appendChild(testDiv);
        
        // 닫기 버튼
        document.getElementById('test-qr-close').addEventListener('click', () => {
            document.body.removeChild(testDiv);
        });
        
        // 테스트 QR 코드 생성
        const container = document.getElementById('test-qr-container');
        const statusEl = document.getElementById('test-qr-status');
        
        // 테스트 Canvas 생성
        const canvas = document.createElement('canvas');
        canvas.width = 200;
        canvas.height = 200;
        container.appendChild(canvas);
        
        try {
            // 표준 QRCode 라이브러리 사용 시도
            if (typeof QRCode !== 'undefined' && typeof QRCode.toCanvas === 'function') {
                QRCode.toCanvas(canvas, 'https://example.com', {
                    width: 200,
                    height: 200,
                    margin: 2,
                    color: {
                        dark: '#000000',
                        light: '#FFFFFF'
                    }
                }, function(error) {
                    if (error) {
                        console.error('[QRDebugger] 테스트 QR 코드 생성 실패:', error);
                        statusEl.innerHTML = `<span style="color:red">생성 실패: ${error.message}</span>`;
                        return;
                    }
                    
                    statusEl.innerHTML = '<span style="color:green">QR 코드 생성 성공!</span>';
                });
            } else if (typeof QRCode !== 'undefined') {
                // qrcode.js 라이브러리의 다른 인터페이스 시도
                new QRCode(container, {
                    text: "https://example.com",
                    width: 200,
                    height: 200,
                    colorDark: "#000000",
                    colorLight: "#FFFFFF",
                    correctLevel: QRCode.CorrectLevel.H
                });
                statusEl.innerHTML = '<span style="color:green">QR 코드 생성 성공! (인스턴스 방식)</span>';
            } else {
                throw new Error('QR 코드 라이브러리를 찾을 수 없습니다.');
            }
        } catch (error) {
            console.error('[QRDebugger] 테스트 QR 코드 생성 중 에러:', error);
            statusEl.innerHTML = `<span style="color:red">생성 실패: ${error.message}</span>`;
            
            // 폴백 - 간단한 대체 이미지 표시
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = "#FFFFFF";
            ctx.fillRect(0, 0, 200, 200);
            ctx.fillStyle = "#000000";
            ctx.font = "14px Arial";
            ctx.textAlign = "center";
            ctx.fillText("QR 라이브러리 오류", 100, 90);
            ctx.font = "12px Arial";
            ctx.fillText(error.message, 100, 110);
        }
    }
};

// 자동 초기화
QRDebugger.init();

export default QRDebugger; 