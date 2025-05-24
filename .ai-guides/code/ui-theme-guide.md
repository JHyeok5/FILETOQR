# FileToQR 공통 UI 디자인 테마 가이드 (초안)

## 1. 개요

이 문서는 FileToQR 웹 애플리케이션 전체에 일관된 사용자 경험(UX)과 사용자 인터페이스(UI)를 제공하기 위한 디자인 테마 가이드입니다. 모든 UI 요소는 Tailwind CSS 클래스를 직접 적용하여 스타일링하는 것을 원칙으로 합니다.

## 2. 색상 팔레트 (Color Palette)

FileToQR의 브랜드 이미지를 강화하고 사용자에게 긍정적이고 활기찬 느낌을 전달하는 색상 팔레트를 사용합니다.

### 2.1. 주요 색상 (Primary Colors)

-   **Primary Blue (주요 파랑):** `blue-600` (FileToQR 로고 및 핵심 CTA 버튼)
    -   호버/활성: `blue-700`
-   **Primary Purple (주요 보라):** `purple-600` (강조, 그라데이션)
    -   호버/활성: `purple-700`
-   **Primary Pink (주요 핑크):** `pink-500` (강조, 그라데이션, 포인트)
    -   호버/활성: `pink-600`
-   **Hero Gradient (히어로 섹션 그라데이션):** `bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500` (index.html 히어로 섹션 참고하여 확장)

### 2.2. 보조 색상 (Secondary Colors)

-   **Success (성공):** `green-500` (텍스트: `text-green-500`, 배경: `bg-green-500`)
-   **Error (오류):** `red-500` (텍스트: `text-red-500`, 배경: `bg-red-500`)
-   **Warning (경고):** `yellow-500` (텍스트: `text-yellow-500`, 배경: `bg-yellow-500`)
-   **Info (정보):** `sky-500` (텍스트: `text-sky-500`, 배경: `bg-sky-500`)

### 2.3. 텍스트 색상 (Text Colors)

-   **기본 텍스트:** `text-slate-700`
-   **부제목/강조 텍스트:** `text-slate-900`
-   **링크:** `text-blue-600`
    -   호버: `text-blue-700 underline`
-   **비활성/설명 텍스트:** `text-slate-500`

### 2.4. 배경 색상 (Background Colors)

-   **기본 페이지 배경:** `bg-slate-50`
-   **카드/섹션 배경:** `bg-white`
-   **강조 섹션 배경 (그라데이션 대안):** `bg-gradient-to-r from-slate-50 to-slate-100`
-   **어두운 배경 (푸터 등):** `bg-slate-800` (텍스트는 `text-slate-200` 또는 `text-white` 사용)

## 3. 타이포그래피 (Typography)

가독성과 현대적인 느낌을 강조하는 타이포그래피를 사용합니다.

### 3.1. 기본 글꼴

-   **기본:** `font-sans` (Tailwind CSS 기본값: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"`)

### 3.2. 글꼴 스타일 (크기, 두께, 줄 간격 - Tailwind CSS 기준)

-   **H1 (페이지 제목):** `text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl leading-tight` (줄 간격: `leading-tight` 또는 `leading-snug`)
-   **H2 (섹션 제목):** `text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl leading-snug`
-   **H3 (하위 섹션 제목):** `text-2xl font-semibold text-slate-800 leading-relaxed`
-   **H4 (카드 제목 등):** `text-xl font-semibold text-slate-800 leading-relaxed`
-   **본문 (Paragraph):** `text-base text-slate-700 leading-relaxed` (기본) 또는 `text-lg leading-8 text-slate-600` (소개 문단 등)
-   **버튼 텍스트:** `text-base font-medium` 또는 `text-sm font-semibold` (작은 버튼)
-   **캡션/작은 텍스트:** `text-sm text-slate-500 leading-normal`

## 4. 버튼 스타일 (Button Styles)

일관되고 명확한 인터랙션을 제공하는 버튼 스타일을 정의합니다. 모든 버튼은 `rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2` 기본 스타일을 가집니다.

-   **Primary Button (주요 버튼):**
    -   기본: `px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500`
    -   크게: `px-6 py-3 text-lg`
-   **Secondary Button (보조 버튼):**
    -   기본: `px-4 py-2 bg-purple-600 text-white hover:bg-purple-700 focus:ring-purple-500`
-   **Outline Button (테두리 버튼):**
    -   기본: `px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 focus:ring-slate-400`
    -   색상 변형 (예: 파랑): `border-blue-500 text-blue-600 hover:bg-blue-50 focus:ring-blue-500`
-   **Text Button (텍스트 버튼):**
    -   기본: `px-2 py-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 focus:ring-blue-500 rounded-md`
-   **비활성 상태 (Disabled):** `opacity-50 cursor-not-allowed` (모든 버튼 유형에 추가)

## 5. 카드 및 컨테이너 스타일 (Card & Container Styles)

정보를 구조화하고 시각적으로 구분하는 카드 및 컨테이너 스타일입니다.

-   **기본 카드:** `bg-white rounded-xl shadow-lg overflow-hidden`
    -   패딩: `p-6` 또는 `p-8`
-   **강조 카드 (그림자 더 강하게):** `shadow-2xl`
-   **컨테이너 (페이지 중앙 정렬):** `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`
-   **둥근 모서리 기본:** `rounded-lg` 또는 `rounded-xl`
-   **테두리:** `border border-slate-200` (필요시)

## 6. 애니메이션 및 전환 (Animations & Transitions)

사용자 인터랙션을 부드럽게 하고, 시각적 즐거움을 더하는 애니메이션을 일관되게 사용합니다.

### 6.1. 미세한 상호작용 (Micro-interactions)

-   **버튼 호버/클릭:** `transition-colors duration-200 ease-in-out`, `transform hover:scale-105 active:scale-95 transition-transform duration-150`
-   **입력 필드 포커스:** `focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow duration-200`
-   **링크 호버:** `underline transition-all duration-150`

### 6.2. 페이지 로드 및 콘텐츠 등장

-   **Fade In:** `animate-fadeIn` (아래 CSS 참고)
    \`\`\`css
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-fadeIn { animation: fadeIn 0.5s ease-out forwards; }
    \`\`\`
-   **Slide Up + Fade In:** `animate-slideUpFadeIn` (아래 CSS 참고)
    \`\`\`css
    @keyframes slideUpFadeIn {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-slideUpFadeIn { animation: slideUpFadeIn 0.5s ease-out forwards; }
    \`\`\`
-   **지연 적용 (Staggered Animation):** Tailwind CSS의 `delay-*` 유틸리티 또는 JavaScript로 순차적 등장 효과.

### 6.3. 스크롤 기반 애니메이션

-   `index.html`의 `service-flow-section` 카드 등장 애니메이션(\`animate-scroll-fade-in\`) 참고.
    -   일반적으로 `opacity-0`으로 시작, 스크롤 위치에 따라 `opacity-100 transition-opacity duration-500 ease-in-out` 등으로 변경.
    -   Intersection Observer API 활용 권장.

### 6.4. 일관성

-   **지속 시간 (Duration):**
    -   빠른 인터랙션: `duration-100`, `duration-150`
    -   일반 전환: `duration-200`, `duration-300`
    -   등장 애니메이션: `duration-500`, `duration-700`
-   **타이밍 함수 (Easing):**
    -   일반: `ease-in-out`
    -   등장/사라짐: `ease-out`

## 7. 레이아웃 및 간격 (Layout & Spacing)

Tailwind CSS의 스페이싱 스케일과 그리드 시스템을 적극 활용하여 일관된 레이아웃과 여백을 유지합니다.

### 7.1. 그리드 시스템

-   **기본:** `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6` 등 Tailwind CSS 그리드 활용.

### 7.2. 여백 (Margins & Paddings)

-   Tailwind CSS 스페이싱 스케일 (\`p-1\`, \`m-2\`, \`space-y-4\` 등)을 일관되게 사용.
-   예: 섹션 간 여백은 \`py-12 sm:py-16 lg:py-20\`, 카드 내부 패딩은 \`p-6\` 또는 \`p-8\`.

## 8. 아이콘

-   Heroicons (Tailwind CSS Labs 제공) 또는 유사한 SVG 아이콘 세트 사용 권장.
-   일관된 크기 및 \`stroke-width\` 적용.

## 9. 반응형 디자인

-   Tailwind CSS의 반응형 접두사 (\`sm:\`, \`md:\`, \`lg:\`, \`xl:\`)를 적극 활용하여 모든 화면 크기에서 최적의 사용성을 제공.

--- 