/**
 * blog.js - FileToQR 블로그 페이지 관리 모듈
 * 버전: 1.0.0
 * 최종 업데이트: 2025-06-15
 * 
 * 이 모듈은 블로그 페이지의 기능을 관리합니다:
 * - 블로그 포스트 표시 및 관리
 * - 카테고리 및 태그 필터링
 * - 검색 기능
 * - 페이지네이션
 */

// 템플릿 유틸리티 불러오기 (코드 재사용)
import TemplateUtils from '../utils/template-utils.js';

// 블로그 모듈 API
const BlogPage = {
  init,
  loadPosts,
  filterPostsByCategory,
  filterPostsByTag,
  searchPosts
};

// 내부 상태 관리
let isInitialized = false;
let currentCategory = null;
let currentTag = null;
let currentPage = 1;
let searchQuery = '';

/**
 * 블로그 페이지 초기화
 * @async
 */
async function init() {
  if (isInitialized) {
    console.log('블로그 페이지가 이미 초기화되었습니다.');
    return;
  }

  console.log('블로그 페이지 초기화 중...');
  
  try {
    // 컴포넌트 템플릿 확인
    await ensureComponentsLoaded();
    
    // 이벤트 리스너 등록
    registerEventListeners();
    
    // 초기 포스트 로드
    await loadPosts();
    
    isInitialized = true;
    console.log('블로그 페이지 초기화 완료');
  } catch (error) {
    console.error('블로그 페이지 초기화 중 오류 발생:', error);
  }
}

/**
 * 컴포넌트 로드 확인
 * @private
 * @async
 */
async function ensureComponentsLoaded() {
  // 헤더 및 푸터 확인
  const headerContainer = document.getElementById('header-container');
  const footerContainer = document.getElementById('footer-container');
  
  // 헤더가 비어 있는 경우 로드 시도
  if (headerContainer && headerContainer.innerHTML === '') {
    console.log('헤더 로드 시도...');
    try {
      await TemplateUtils.loadComponent('header', headerContainer, './');
    } catch (error) {
      console.error('헤더 로드 중 오류 발생:', error);
    }
  }
  
  // 푸터가 비어 있는 경우 로드 시도
  if (footerContainer && footerContainer.innerHTML === '') {
    console.log('푸터 로드 시도...');
    try {
      await TemplateUtils.loadComponent('footer', footerContainer, './');
    } catch (error) {
      console.error('푸터 로드 중 오류 발생:', error);
    }
  }
}

/**
 * 이벤트 리스너 등록
 * @private
 */
function registerEventListeners() {
  console.log('블로그 페이지 이벤트 리스너 등록 중...');
  
  // 카테고리 링크 이벤트 리스너
  document.querySelectorAll('a[href^="#"][class*="text-blue-600"]').forEach(link => {
    link.addEventListener('click', function(event) {
      event.preventDefault();
      const category = this.textContent.split(' ')[0]; // "파일 변환 팁 (8)" -> "파일"
      filterPostsByCategory(category);
    });
  });
  
  // 태그 링크 이벤트 리스너
  document.querySelectorAll('a[href^="#"][class*="px-3 py-1 bg-gray-100"]').forEach(link => {
    link.addEventListener('click', function(event) {
      event.preventDefault();
      const tag = this.textContent.substring(1); // "#QR코드" -> "QR코드"
      filterPostsByTag(tag);
    });
  });
  
  // 검색 이벤트 리스너
  const searchInput = document.querySelector('input[placeholder="블로그 검색..."]');
  const searchButton = document.querySelector('button.absolute.right-3');
  
  if (searchInput && searchButton) {
    // 검색 버튼 클릭
    searchButton.addEventListener('click', function() {
      searchPosts(searchInput.value);
    });
    
    // 엔터 키 입력
    searchInput.addEventListener('keyup', function(event) {
      if (event.key === 'Enter') {
        searchPosts(this.value);
      }
    });
  }
  
  // 페이지네이션 이벤트 리스너
  document.querySelectorAll('nav.flex.items-center.space-x-2 a').forEach(link => {
    link.addEventListener('click', function(event) {
      event.preventDefault();
      
      // 페이지 번호 또는 이전/다음 결정
      let targetPage = this.textContent;
      if (targetPage === '이전') {
        targetPage = Math.max(currentPage - 1, 1);
      } else if (targetPage === '다음') {
        targetPage = currentPage + 1;
      } else {
        targetPage = parseInt(targetPage, 10);
      }
      
      // 유효한 숫자인 경우에만 페이지 변경
      if (!isNaN(targetPage)) {
        currentPage = targetPage;
        loadPosts();
      }
    });
  });
}

/**
 * 블로그 포스트 로드
 * @async
 */
async function loadPosts() {
  console.log('블로그 포스트 로드 중...');
  console.log(`현재 필터: 카테고리=${currentCategory || '없음'}, 태그=${currentTag || '없음'}, 검색어=${searchQuery || '없음'}, 페이지=${currentPage}`);
  
  // 포스트 로드 로직 구현
  // (실제 구현에서는 서버에서 데이터를 가져오거나 로컬 데이터를 사용)
  
  // 현재는 UI 업데이트만 시뮬레이션
  updateUIForFilters();
}

/**
 * 카테고리별 포스트 필터링
 * @param {string} category - 필터링할 카테고리
 */
function filterPostsByCategory(category) {
  console.log(`카테고리 필터 적용: ${category}`);
  
  // 현재 선택된 카테고리 업데이트
  currentCategory = category;
  currentTag = null; // 카테고리 선택 시 태그 필터 초기화
  currentPage = 1; // 페이지 초기화
  
  // 포스트 다시 로드
  loadPosts();
}

/**
 * 태그별 포스트 필터링
 * @param {string} tag - 필터링할 태그
 */
function filterPostsByTag(tag) {
  console.log(`태그 필터 적용: ${tag}`);
  
  // 현재 선택된 태그 업데이트
  currentTag = tag;
  currentCategory = null; // 태그 선택 시 카테고리 필터 초기화
  currentPage = 1; // 페이지 초기화
  
  // 포스트 다시 로드
  loadPosts();
}

/**
 * 검색어로 포스트 검색
 * @param {string} query - 검색어
 */
function searchPosts(query) {
  console.log(`검색어 적용: ${query}`);
  
  // 검색어 업데이트
  searchQuery = query;
  currentPage = 1; // 페이지 초기화
  
  // 포스트 다시 로드
  loadPosts();
}

/**
 * 필터에 따른 UI 업데이트
 * @private
 */
function updateUIForFilters() {
  // 카테고리 링크 스타일 업데이트
  document.querySelectorAll('a[href^="#"][class*="text-blue-600"]').forEach(link => {
    const category = link.textContent.split(' ')[0];
    if (category === currentCategory) {
      link.classList.add('font-bold');
    } else {
      link.classList.remove('font-bold');
    }
  });
  
  // 태그 링크 스타일 업데이트
  document.querySelectorAll('a[href^="#"][class*="px-3 py-1 bg-gray-100"]').forEach(link => {
    const tag = link.textContent.substring(1);
    if (tag === currentTag) {
      link.classList.remove('bg-gray-100');
      link.classList.add('bg-blue-100', 'text-blue-800');
    } else {
      link.classList.remove('bg-blue-100', 'text-blue-800');
      link.classList.add('bg-gray-100');
    }
  });
  
  // 페이지네이션 업데이트
  document.querySelectorAll('nav.flex.items-center.space-x-2 a').forEach(link => {
    if (link.textContent !== '이전' && link.textContent !== '다음' && parseInt(link.textContent, 10) === currentPage) {
      link.classList.remove('text-gray-600', 'hover:bg-gray-100');
      link.classList.add('bg-blue-600', 'text-white');
    } else if (link.textContent !== '이전' && link.textContent !== '다음') {
      link.classList.remove('bg-blue-600', 'text-white');
      link.classList.add('text-gray-600', 'hover:bg-gray-100');
    }
  });
  
  // 검색 입력란 업데이트
  const searchInput = document.querySelector('input[placeholder="블로그 검색..."]');
  if (searchInput) {
    searchInput.value = searchQuery;
  }
}

// 페이지 로드 시 초기화 (DOM 로드 대기)
document.addEventListener('DOMContentLoaded', init);

// 모듈 내보내기
export default BlogPage; 