/**
 * converter-core.js - FileToQR 파일 변환 핵심 모듈
 * 버전: 1.1.0
 * 최종 업데이트: 2025-06-25
 * 
 * 이 모듈은 파일 변환 기능의 핵심 로직을 제공합니다:
 * - 다양한 파일 형식 간 변환 구현
 * - 변환 프로세스 관리
 * - 파일 형식 지원 및 호환성 정보
 */

// 공통 유틸리티 모듈 임포트
import FileUtils from '../utils/file-utils.js';

// 컨버터 코어 모듈 정의
const ConverterCore = {
  // 지원하는 파일 형식 및 변환 경로 정의
  supportedFormats: {
    // 이미지 형식
    'image': {
      'inputs': ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg'],
      'outputs': ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg'],
      'convertibleTo': {
        'png': ['jpg', 'jpeg', 'gif', 'webp', 'bmp'],
        'jpg': ['png', 'gif', 'webp', 'bmp'],
        'jpeg': ['png', 'gif', 'webp', 'bmp'],
        'gif': ['png', 'jpg', 'jpeg', 'webp', 'bmp'],
        'webp': ['png', 'jpg', 'jpeg', 'gif', 'bmp'],
        'bmp': ['png', 'jpg', 'jpeg', 'gif', 'webp'],
        'svg': ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp']
      }
    },
    
    // 문서 형식 - 제한된 변환 기능 (브라우저 기반)
    'document': {
      'inputs': ['txt', 'md', 'csv', 'json', 'xml', 'html'],
      'outputs': ['txt', 'md', 'csv', 'json', 'xml', 'html'],
      'convertibleTo': {
        'txt': ['md', 'html'],
        'md': ['txt', 'html'],
        'csv': ['json', 'txt', 'html'],
        'json': ['csv', 'txt', 'xml', 'html'],
        'xml': ['json', 'txt', 'html'],
        'html': ['txt', 'md']
      }
    },
    
    // 오디오 형식 - 제한된 변환 기능 (웹 오디오 API 기반)
    'audio': {
      'inputs': ['mp3', 'wav', 'ogg'],
      'outputs': ['mp3', 'wav', 'ogg'],
      'convertibleTo': {
        'mp3': ['wav', 'ogg'],
        'wav': ['mp3', 'ogg'],
        'ogg': ['mp3', 'wav']
      }
    }
  },

  /**
   * 파일 변환 시작
   * @param {File} file - 원본 파일 객체
   * @param {string} outputFormat - 변환할 형식 (확장자)
   * @param {Object} options - 변환 옵션
   * @param {Function} progressCallback - 진행 상황 콜백 함수
   * @returns {Promise<Object>} 변환 결과 객체 (Blob, 메타데이터 등)
   */
  async convertFile(file, outputFormat, options = {}, progressCallback = () => {}) {
    // 변환 시작 알림
    if (progressCallback) {
      progressCallback({
        stage: 'start',
        progress: 0,
        message: '변환 준비 중...'
      });
    }
    
    try {
      // 파일 유형 검증
      const inputFormat = FileUtils.getFileExtension(file.name);
      
      if (!this.canConvert(inputFormat, outputFormat)) {
        throw new Error(`지원하지 않는 변환 경로: ${inputFormat} → ${outputFormat}`);
      }
      
      // 파일 메타데이터 추출
      const metadata = {
        name: file.name,
        type: file.type,
        size: file.size,
        lastModified: file.lastModified,
        inputFormat,
        outputFormat
      };
      
      // 변환 처리
      progressCallback({
        stage: 'processing',
        progress: 30,
        message: '파일 처리 중...'
      });
      
      // 파일 데이터 읽기
      const dataUri = await FileUtils.fileToDataUri(file);
      
      // 변환 유형에 따른 적절한 변환 방법 호출
      let result;
      
      if (this.isImageConversion(inputFormat, outputFormat)) {
        result = await this.convertImage(dataUri, outputFormat, options, progressCallback);
      } else if (this.isDocumentConversion(inputFormat, outputFormat)) {
        result = await this.convertDocument(dataUri, inputFormat, outputFormat, options, progressCallback);
      } else if (this.isAudioConversion(inputFormat, outputFormat)) {
        result = await this.convertAudio(dataUri, outputFormat, options, progressCallback);
      } else {
        throw new Error('지원하지 않는 변환 유형');
      }
      
      // 결과 정보 반환
      const outputFileName = FileUtils.getOutputFileName(file.name, outputFormat);
      
      progressCallback({
        stage: 'complete',
        progress: 100,
        message: '변환 완료!'
      });
      
      return {
        blob: result,
        metadata: {
          ...metadata,
          outputFileName
        }
      };
      
    } catch (error) {
      console.error('파일 변환 실패:', error);
      
      progressCallback({
        stage: 'error',
        progress: 0,
        message: `변환 실패: ${error.message}`
      });
      
      throw error;
    }
  },

  /**
   * 변환 가능 여부 확인
   * @param {string} inputFormat - 입력 파일 형식
   * @param {string} outputFormat - 출력 파일 형식
   * @returns {boolean} 변환 가능 여부
   */
  canConvert(inputFormat, outputFormat) {
    // 동일 형식은 항상 가능
    if (inputFormat === outputFormat) return true;
    
    // 지원하는 형식 확인
    const categories = Object.keys(this.supportedFormats);
    
    for (const category of categories) {
      const formatInfo = this.supportedFormats[category];
      
      // 입력 형식이 지원되는지 확인
      if (formatInfo.inputs.includes(inputFormat)) {
        // 이 입력 형식에서 출력 형식으로 변환 가능한지 확인
        if (formatInfo.convertibleTo[inputFormat] && 
            formatInfo.convertibleTo[inputFormat].includes(outputFormat)) {
          return true;
        }
      }
    }
    
    return false;
  },

  /**
   * 주어진 형식이 이미지 변환인지 확인
   */
  isImageConversion(inputFormat, outputFormat) {
    const { image } = this.supportedFormats;
    return image.inputs.includes(inputFormat) && image.outputs.includes(outputFormat);
  },

  /**
   * 주어진 형식이 문서 변환인지 확인
   */
  isDocumentConversion(inputFormat, outputFormat) {
    const { document } = this.supportedFormats;
    return document.inputs.includes(inputFormat) && document.outputs.includes(outputFormat);
  },

  /**
   * 주어진 형식이 오디오 변환인지 확인
   */
  isAudioConversion(inputFormat, outputFormat) {
    const { audio } = this.supportedFormats;
    return audio.inputs.includes(inputFormat) && audio.outputs.includes(outputFormat);
  },

  /**
   * 이미지 변환 구현
   * @param {string} dataUri - 원본 이미지 데이터 URI
   * @param {string} outputFormat - 출력 이미지 형식
   * @param {Object} options - 변환 옵션 (품질, 크기 등)
   * @param {Function} progressCallback - 진행 상황 콜백
   * @returns {Promise<Blob>} 변환된 이미지 Blob
   */
  convertImage(dataUri, outputFormat, options = {}, progressCallback = () => {}) {
    return new Promise((resolve, reject) => {
      try {
        const img = new Image();
        
        img.onload = () => {
          progressCallback({
            stage: 'processing',
            progress: 50,
            message: '이미지 변환 중...'
          });
          
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // 이미지 크기 조정 (옵션에 따라)
          let width = img.width;
          let height = img.height;
          
          if (options.width && options.height) {
            width = options.width;
            height = options.height;
          } else if (options.width) {
            const ratio = options.width / img.width;
            width = options.width;
            height = img.height * ratio;
          } else if (options.height) {
            const ratio = options.height / img.height;
            height = options.height;
            width = img.width * ratio;
          } else if (options.maxWidth && img.width > options.maxWidth) {
            const ratio = options.maxWidth / img.width;
            width = options.maxWidth;
            height = img.height * ratio;
          } else if (options.maxHeight && img.height > options.maxHeight) {
            const ratio = options.maxHeight / img.height;
            height = options.maxHeight;
            width = img.width * ratio;
          }
          
          canvas.width = width;
          canvas.height = height;
          
          // 배경색 설정 (필요한 경우)
          if (options.backgroundColor) {
            ctx.fillStyle = options.backgroundColor;
            ctx.fillRect(0, 0, width, height);
          }
          
          // 이미지 그리기
          ctx.drawImage(img, 0, 0, width, height);
          
          progressCallback({
            stage: 'processing',
            progress: 80,
            message: '이미지 인코딩 중...'
          });
          
          // 출력 형식에 따라 적절한 MIME 타입 설정
          const mimeType = FileUtils.getMimeType(outputFormat);
          
          // 품질 설정 (JPEG, WEBP 등에 적용)
          const quality = options.quality ? options.quality / 100 : 0.92;
          
          // 캔버스를 Blob으로 변환
          canvas.toBlob((blob) => {
            if (blob) {
              progressCallback({
                stage: 'finalizing',
                progress: 90,
                message: '변환 완료 중...'
              });
              resolve(blob);
            } else {
              reject(new Error('이미지 변환 실패'));
            }
          }, mimeType, quality);
        };
        
        img.onerror = () => {
          reject(new Error('이미지 로드 실패'));
        };
        
        img.src = dataUri;
        
      } catch (error) {
        reject(error);
      }
    });
  },

  /**
   * 문서 변환 구현
   * @param {string} dataUri - 원본 문서 데이터 URI
   * @param {string} inputFormat - 입력 문서 형식
   * @param {string} outputFormat - 출력 문서 형식
   * @param {Object} options - 변환 옵션
   * @param {Function} progressCallback - 진행 상황 콜백
   * @returns {Promise<Blob>} 변환된 문서 Blob
   */
  convertDocument(dataUri, inputFormat, outputFormat, options = {}, progressCallback = () => {}) {
    return new Promise((resolve, reject) => {
      try {
        progressCallback({
          stage: 'processing',
          progress: 40,
          message: '문서 변환 중...'
        });
        
        // 데이터 URI에서 실제 콘텐츠 추출
        const base64Content = dataUri.split(',')[1];
        const textContent = atob(base64Content);
        
        let result = '';
        
        // 형식별 변환 로직
        if (inputFormat === 'csv' && outputFormat === 'json') {
          // CSV → JSON 변환
          result = this.csvToJson(textContent, options);
        } else if (inputFormat === 'json' && outputFormat === 'csv') {
          // JSON → CSV 변환
          result = this.jsonToCsv(textContent, options);
        } else if (inputFormat === 'md' && outputFormat === 'html') {
          // Markdown → HTML 변환 (간단한 규칙만 적용)
          result = this.markdownToHtml(textContent);
        } else if (inputFormat === 'json' && outputFormat === 'xml') {
          // JSON → XML 변환
          result = this.jsonToXml(textContent);
        } else if (inputFormat === 'xml' && outputFormat === 'json') {
          // XML → JSON 변환 (간단한 구현)
          result = this.xmlToJson(textContent);
        } else {
          // 기타 텍스트 변환 (단순 포맷 변경)
          result = textContent;
        }
        
        progressCallback({
          stage: 'finalizing',
          progress: 90,
          message: '문서 변환 완료 중...'
        });
        
        // 결과 Blob 생성
        const outputMimeType = FileUtils.getMimeType(outputFormat);
        const resultBlob = new Blob([result], { type: outputMimeType });
        
        resolve(resultBlob);
        
      } catch (error) {
        reject(error);
      }
    });
  },

  /**
   * 오디오 변환 구현 (간단한 예시)
   * 참고: 완전한 오디오 변환은 웹 오디오 API의 제한으로 인해 제약이 있습니다.
   */
  convertAudio(dataUri, outputFormat, options = {}, progressCallback = () => {}) {
    // 실제 환경에서는 웹 오디오 API를 사용하여 구현해야 합니다.
    return new Promise((resolve, reject) => {
      progressCallback({
        stage: 'processing',
        progress: 50,
        message: '오디오 변환 중... (데모)'
      });
      
      // 데모 목적으로 간단히 구현
      // 실제 구현은 Audio API와 AudioContext를 사용해야 함
      setTimeout(() => {
        progressCallback({
          stage: 'finalizing',
          progress: 90,
          message: '오디오 인코딩 중...'
        });
        
        // 원본 데이터를 그대로 반환 (실제로는 변환 로직 필요)
        fetch(dataUri)
          .then(response => response.blob())
          .then(blob => {
            const outputMimeType = FileUtils.getMimeType(outputFormat);
            const resultBlob = new Blob([blob], { type: outputMimeType });
            resolve(resultBlob);
          })
          .catch(reject);
          
      }, 1000);
    });
  },

  // 문서 변환 유틸리티 함수들

  /**
   * CSV를 JSON으로 변환
   */
  csvToJson(csvText, options = {}) {
    const lines = csvText.split(/\r?\n/);
    if (lines.length === 0) return '[]';
    
    const headers = lines[0].split(',').map(header => header.trim());
    const result = [];
    
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      
      const values = lines[i].split(',');
      const obj = {};
      
      headers.forEach((header, index) => {
        obj[header] = values[index] ? values[index].trim() : '';
      });
      
      result.push(obj);
    }
    
    return JSON.stringify(result, null, 2);
  },

  /**
   * JSON을 CSV로 변환
   */
  jsonToCsv(jsonText, options = {}) {
    try {
      const data = JSON.parse(jsonText);
      if (!Array.isArray(data) || data.length === 0) {
        return '';
      }
      
      const headers = Object.keys(data[0]);
      const headerRow = headers.join(',');
      
      const rows = data.map(obj => {
        return headers.map(header => {
          const value = obj[header];
          
          // 쉼표, 따옴표 등이 포함된 경우 따옴표로 감싸기
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          
          return value !== undefined ? value : '';
        }).join(',');
      });
      
      return [headerRow, ...rows].join('\n');
    } catch (e) {
      throw new Error('유효하지 않은 JSON 형식');
    }
  },

  /**
   * 마크다운을 HTML로 변환 (간단한 규칙만 적용)
   */
  markdownToHtml(markdown) {
    let html = markdown
      // 헤더 변환
      .replace(/^# (.*?)$/gm, '<h1>$1</h1>')
      .replace(/^## (.*?)$/gm, '<h2>$1</h2>')
      .replace(/^### (.*?)$/gm, '<h3>$1</h3>')
      // 굵은 텍스트
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // 이탤릭체
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      // 링크
      .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>')
      // 순서 없는 목록
      .replace(/^\- (.*?)$/gm, '<li>$1</li>')
      // 코드 블록
      .replace(/`(.*?)`/g, '<code>$1</code>')
      // 문단
      .replace(/(.+?)(\n\n|$)/g, '<p>$1</p>');
    
    // 순서 없는 목록 항목을 ul로 감싸기
    html = html.replace(/<li>.*?<\/li>(\n<li>.*?<\/li>)*/g, function(match) {
      return '<ul>' + match + '</ul>';
    });
    
    return html;
  },

  /**
   * JSON을 XML로 변환 (간단한 구현)
   */
  jsonToXml(jsonText) {
    try {
      const data = JSON.parse(jsonText);
      
      const toXml = (obj, rootName = 'root') => {
        let xml = `<${rootName}>`;
        
        for (const key in obj) {
          if (obj.hasOwnProperty(key)) {
            const value = obj[key];
            
            if (Array.isArray(value)) {
              xml += `<${key}>`;
              value.forEach(item => {
                if (typeof item === 'object' && item !== null) {
                  xml += toXml(item, 'item');
                } else {
                  xml += `<item>${item}</item>`;
                }
              });
              xml += `</${key}>`;
            } else if (typeof value === 'object' && value !== null) {
              xml += toXml(value, key);
            } else {
              xml += `<${key}>${value}</${key}>`;
            }
          }
        }
        
        xml += `</${rootName}>`;
        return xml;
      };
      
      return '<?xml version="1.0" encoding="UTF-8"?>\n' + toXml(data);
      
    } catch (e) {
      throw new Error('유효하지 않은 JSON 형식');
    }
  },

  /**
   * XML을 JSON으로 변환 (간단한 구현)
   * 참고: 완전한 XML 파싱은 DOMParser를 사용하는 것이 좋습니다.
   */
  xmlToJson(xmlText) {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
      
      const parseNode = (node) => {
        if (node.nodeType === Node.TEXT_NODE) {
          const text = node.nodeValue.trim();
          return text.length > 0 ? text : null;
        }
        
        if (node.nodeType === Node.ELEMENT_NODE) {
          const result = {};
          const childElements = Array.from(node.children);
          
          if (childElements.length === 0) {
            return node.textContent.trim();
          }
          
          // 동일한 이름의 자식 요소가 여러 개인지 확인
          const childNames = childElements.map(child => child.nodeName);
          const uniqueNames = [...new Set(childNames)];
          
          for (const name of uniqueNames) {
            const elements = childElements.filter(child => child.nodeName === name);
            
            if (elements.length === 1) {
              // 단일 요소
              result[name] = parseNode(elements[0]);
            } else {
              // 배열로 처리
              result[name] = elements.map(element => parseNode(element));
            }
          }
          
          return result;
        }
        
        return null;
      };
      
      const rootElement = xmlDoc.documentElement;
      const result = {};
      result[rootElement.nodeName] = parseNode(rootElement);
      
      return JSON.stringify(result, null, 2);
      
    } catch (e) {
      throw new Error('유효하지 않은 XML 형식');
    }
  }
};

// 하위 호환성을 위한 전역 참조
if (typeof window !== 'undefined') {
  window.FileToQR = window.FileToQR || {};
  window.FileToQR.core = window.FileToQR.core || {};
  window.FileToQR.core.converter = ConverterCore;
}

// 모듈 내보내기
export default ConverterCore; 