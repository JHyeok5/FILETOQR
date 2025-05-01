/**
 * main.js - FileToQR 메인 초기화 모듈
 * 버전: 1.0.0
 * 최종 업데이트: 2025-06-15
 * 
 * 이 모듈은 FileToQR 애플리케이션의 초기화를 담당합니다:
 * - 헤더, 푸터 등 공통 UI 요소 로드
 * - 페이지별 모듈 초기화
 * - 전역 이벤트 설정
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

const importFileConverter = async () => {
  try {
    const module = await import('../converters/file-converter.js');
    return module.default;
  } catch (error) {
    console.error('FileConverter 모듈 로드 실패:', error);
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
      fileConverter: null,
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
          // 파일 변환 모듈 초기화
          this.state.modules.fileConverter = await importFileConverter();
          if (this.state.modules.fileConverter) {
            await this.state.modules.fileConverter.init();
          }
          break;
          
        case 'qrcode':
          // QR 코드 생성 모듈 초기화
          this.state.modules.qrGenerator = await importQRGenerator();
          if (this.state.modules.qrGenerator) {
            await this.state.modules.qrGenerator.init();
          }
          break;
          
        case 'help':
          // 도움말 페이지 초기화
          break;
          
        default:
          // 기타 페이지
          break;
      }
      
      return true;
    } catch (error) {
      console.error('페이지 모듈 초기화 실패:', error);
      return false;
    }
  }
};

// 애플리케이션 초기화
document.addEventListener('DOMContentLoaded', () => {
  Main.init();
});

// 글로벌 네임스페이스에 등록
if (typeof window !== 'undefined') {
  window.FileToQR = window.FileToQR || {};
  window.FileToQR.Main = Main;
}

export default Main; 