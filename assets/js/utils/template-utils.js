/**
 * template-utils.js - FileToQR 템플릿 유틸리티
 * 버전: 1.0.0
 * 최종 업데이트: 2025-06-15
 * 
 * 이 모듈은 FileToQR의 HTML 템플릿 처리 유틸리티를 제공합니다:
 * - 템플릿 문자열 처리
 * - 탬플릿 캐싱
 * - 변수 삽입 및 조건부 렌더링
 */

// 템플릿 유틸리티 네임스페이스
const TemplateUtils = {
  // 템플릿 캐시
  cache: new Map(),
  
  /**
   * 템플릿 문자열에 값 삽입
   * @param {string} template - 템플릿 문자열
   * @param {Object} data - 삽입할 데이터
   * @returns {string} 처리된 템플릿
   */
  render(template, data = {}) {
    if (!template) return '';
    
    // ${변수} 패턴을 데이터로 치환
    let result = template.replace(/\${([^{}]*)}/g, (match, key) => {
      const value = this._getValue(data, key.trim());
      return value !== undefined ? value : '';
    });
    
    // 조건부 블록 처리: <!-- if 조건 -->내용<!-- endif -->
    result = this._processConditionals(result, data);
    
    // 반복 블록 처리: <!-- for 항목 in 배열 -->내용<!-- endfor -->
    result = this._processLoops(result, data);
    
    return result;
  },
  
  /**
   * 캐시에서 템플릿 가져오기 또는 캐싱
   * @param {string} name - 템플릿 이름
   * @param {string} template - 캐싱할 템플릿 (없으면 조회만)
   * @returns {string|undefined} 캐시된 템플릿 또는 undefined
   */
  cache(name, template) {
    if (template) {
      this.cache.set(name, template);
    }
    
    return this.cache.get(name);
  },
  
  /**
   * HTML 이스케이프 처리
   * @param {string} str - 이스케이프할 문자열
   * @returns {string} 이스케이프된 문자열
   */
  escapeHTML(str) {
    if (!str || typeof str !== 'string') return '';
    
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  },
  
  /**
   * 객체에서 중첩 속성 값 가져오기
   * @private
   * @param {Object} obj - 데이터 객체
   * @param {string} path - 속성 경로 (예: "user.name")
   * @returns {*} 속성 값
   */
  _getValue(obj, path) {
    if (!obj || !path) return undefined;
    
    const keys = path.split('.');
    let value = obj;
    
    for (const key of keys) {
      if (value === undefined || value === null) return undefined;
      value = value[key];
    }
    
    return value;
  },
  
  /**
   * 조건부 블록 처리
   * @private
   * @param {string} template - 템플릿 문자열
   * @param {Object} data - 데이터 객체
   * @returns {string} 처리된 템플릿
   */
  _processConditionals(template, data) {
    const ifRegex = /<!--\s*if\s+([^>]*?)\s*-->([\s\S]*?)<!--\s*endif\s*-->/g;
    
    return template.replace(ifRegex, (match, condition, content) => {
      // 조건 평가
      let result = false;
      
      try {
        // 단순 변수 존재 여부 체크 또는 비교
        if (condition.includes('==')) {
          const [left, right] = condition.split('==').map(s => s.trim());
          const leftValue = this._getValue(data, left);
          // 오른쪽이 문자열인지 확인
          const rightValue = right.startsWith('"') || right.startsWith("'") 
            ? right.slice(1, -1) // 따옴표 제거
            : this._getValue(data, right);
          
          result = leftValue == rightValue;
        } 
        else if (condition.includes('!=')) {
          const [left, right] = condition.split('!=').map(s => s.trim());
          const leftValue = this._getValue(data, left);
          const rightValue = right.startsWith('"') || right.startsWith("'") 
            ? right.slice(1, -1)
            : this._getValue(data, right);
          
          result = leftValue != rightValue;
        }
        else {
          // 단순 존재 확인
          result = !!this._getValue(data, condition);
        }
      } catch (e) {
        console.error('조건부 렌더링 오류:', e);
        result = false;
      }
      
      return result ? content : '';
    });
  },
  
  /**
   * 반복 블록 처리
   * @private
   * @param {string} template - 템플릿 문자열
   * @param {Object} data - 데이터 객체
   * @returns {string} 처리된 템플릿
   */
  _processLoops(template, data) {
    const loopRegex = /<!--\s*for\s+([a-zA-Z0-9_]+)\s+in\s+([a-zA-Z0-9_.]+)\s*-->([\s\S]*?)<!--\s*endfor\s*-->/g;
    
    return template.replace(loopRegex, (match, itemName, arrayPath, content) => {
      // 배열 가져오기
      const array = this._getValue(data, arrayPath);
      
      if (!array || !Array.isArray(array) || array.length === 0) {
        return '';
      }
      
      // 각 항목에 대해 콘텐츠 렌더링
      return array.map((item, index) => {
        // 항목별 컨텍스트 생성
        const itemData = {
          ...data,
          [itemName]: item,
          index: index
        };
        
        // 현재 항목 컨텍스트로 내용 렌더링
        return this.render(content, itemData);
      }).join('');
    });
  },
  
  /**
   * 템플릿 ID로 요소에서 템플릿 로드
   * @param {string} templateId - 템플릿 요소 ID
   * @returns {string} 템플릿 문자열
   */
  loadFromElement(templateId) {
    const element = document.getElementById(templateId);
    if (!element) {
      console.warn(`템플릿 요소 ID "${templateId}"를 찾을 수 없습니다.`);
      return '';
    }
    
    const template = element.innerHTML;
    this.cache.set(templateId, template);
    return template;
  }
};

// 레지스트리에 등록
if (typeof window.FileToQR === 'undefined') {
  window.FileToQR = {};
}

window.FileToQR.TemplateUtils = TemplateUtils;

// 모듈 내보내기
export default TemplateUtils; 