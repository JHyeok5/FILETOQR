/**
 * main.js - FileToQR 메인 초기화 모듈
 * 버전: 1.1.0
 * 최종 업데이트: 2025-07-26
 * 
 * 이 모듈은 FileToQR 애플리케이션의 초기화를 담당합니다:
 * - 헤더, 푸터 등 공통 UI 요소 로드
 * - 페이지별 모듈 초기화
 * - 전역 이벤트 설정
 * 
 * 참고: 이 모듈과 app-core.js의 역할 구분
 * - app-core.js: 애플리케이션의 핵심 구성 요소, 공통 유틸리티 및 모듈 정의
 * - main.js: 특정 페이지 로직 및 컴포넌트의 초기화를 처리합니다.
 * 
 * app-core.js가 애플리케이션의 핵심 구성 요소와 유틸리티를 제공하는 반면,
 * main.js는 그러한 구성 요소를 사용하여 특정 페이지와 컴포넌트를 초기화합니다.
 * 이러한 관심사의 분리를 통해 코드의 유지보수성과 확장성이 향상됩니다.
 */

// 필요한 모듈 동적 임포트 준비
const importTemplateUtils = async () => {
  try {
    const module = await import('../utils/template-utils.js');
    return module.default;
  } catch (error) {
    console.error('TemplateUtils 모듈 로드 실패:', error);
    return null;
  }
};

const importComponentSystem = async () => {
  try {
    const module = await import('./component-system.js');
    return module.default;
  } catch (error) {
    console.error('ComponentSystem 모듈 로드 실패:', error);
    return null;
  }
};

const importFileToQRConverter = async () => {
  try {
    // 통합 모듈로 변경 (file-to-qr-core.js)
    const module = await import('../qr-generator/file-to-qr-core.js');
    return module.default;
  } catch (error) {
    console.error('FileToQRConverter 모듈 로드 실패:', error);
    return null;
  }
};

const importQRGenerator = async () => {
  try {
    const module = await import('../qr-generator/qr-generator.js');
    return module.default;
  } catch (error) {
    console.error('QRGenerator 모듈 로드 실패:', error);
    return null;
  }
};

// 메인 애플리케이션 모듈
const Main = {
  // 내부 상태
  state: {
    initialized: false,
    currentPage: '',
    modules: {
      templateUtils: null,
      componentSystem: null,
      fileToQRConverter: null,
      qrGenerator: null
    }
  },
  
  /**
   * 애플리케이션 초기화
   * @returns {Promise<boolean>} 초기화 성공 여부
   */
  async init() {
    if (this.state.initialized) {
      return true;
    }
    
    try {
      console.log('FileToQR 애플리케이션 초기화 중...');
      
      // 현재 페이지 확인
      this._detectCurrentPage();
      
      // 코어 모듈 로드
      this.state.modules.templateUtils = await importTemplateUtils();
      this.state.modules.componentSystem = await importComponentSystem();
      
      // 공통 컴포넌트 로드
      await this._loadCommonComponents();
      
      // 페이지별 모듈 초기화
      await this._initPageModules();
      
      this.state.initialized = true;
      console.log('FileToQR 애플리케이션 초기화 완료');
      return true;
    } catch (error) {
      console.error('FileToQR 애플리케이션 초기화 실패:', error);
      return false;
    }
  },
  
  /**
   * 현재 페이지 감지
   * @private
   */
  _detectCurrentPage() {
    const pathname = window.location.pathname;
    const filename = pathname.split('/').pop();
    
    if (pathname.endsWith('/') || filename === '' || filename === 'index.html') {
      this.state.currentPage = 'index';
    } else {
      this.state.currentPage = filename.replace('.html', '');
    }
    
    console.log(`현재 페이지: ${this.state.currentPage}`);
  },
  
  /**
   * 공통 컴포넌트 로드
   * @private
   * @returns {Promise<boolean>} 로드 성공 여부
   */
  async _loadCommonComponents() {
    try {
      const TemplateUtils = this.state.modules.templateUtils;
      if (!TemplateUtils) {
        console.error('TemplateUtils 모듈이 로드되지 않았습니다.');
        return false;
      }
      
      // 헤더 로드
      const headerContainer = document.getElementById('header-container');
      if (headerContainer) {
        await TemplateUtils.loadComponent('header', headerContainer);
      }
      
      // 푸터 로드
      const footerContainer = document.getElementById('footer-container');
      if (footerContainer) {
        await TemplateUtils.loadComponent('footer', footerContainer);
      }
      
      return true;
    } catch (error) {
      console.error('공통 컴포넌트 로드 실패:', error);
      return false;
    }
  },
  
  /**
   * 페이지별 모듈 초기화
   * @private
   * @returns {Promise<boolean>} 초기화 성공 여부
   */
  async _initPageModules() {
    try {
      switch (this.state.currentPage) {
        case 'index':
          // 홈페이지 모듈 초기화
          break;
          
        case 'convert':
          // 파일-QR 변환 모듈 초기화
          this.state.modules.fileToQRConverter = await importFileToQRConverter();
          if (this.state.modules.fileToQRConverter) {
            await this.state.modules.fileToQRConverter.init();
          }
          break;
          
        case 'qrcode':
          // QR 코드 생성 모듈 초기화
          this.state.modules.qrGenerator = await importQRGenerator();
          if (this.state.modules.qrGenerator) {
            await this.state.modules.qrGenerator.init();
          }
          break;
          
        case 'text-to-qr':
          // 텍스트-QR 변환 모듈 초기화
          this.state.modules.fileToQRConverter = await importFileToQRConverter();
          if (this.state.modules.fileToQRConverter) {
            await this.state.modules.fileToQRConverter.init();
          }
          
          // QR 코드 생성 모듈 초기화 (필요시)
          this.state.modules.qrGenerator = await importQRGenerator();
          if (this.state.modules.qrGenerator) {
            await this.state.modules.qrGenerator.init();
          }
          break;
          
        default:
          console.log(`페이지 ${this.state.currentPage}에 대한 특별한 초기화 없음`);
          break;
      }
      
      return true;
    } catch (error) {
      console.error('페이지별 모듈 초기화 실패:', error);
      return false;
    }
  }
};

// DOMContentLoaded 이벤트 시 초기화 실행
/*
document.addEventListener('DOMContentLoaded', () => {
  Main.init().catch(error => {
    console.error('메인 애플리케이션 초기화 실패:', error);
  });
});
*/

// 전역 객체에 등록
window.FileToQR = window.FileToQR || {};
window.FileToQR.Main = Main;

// Export for ES modules
export default Main; 