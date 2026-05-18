# ARCHITECTURE.md

## 기술 스택

| 항목 | 선택 |
|------|------|
| 프레임워크 | Next.js 15 (App Router) |
| 언어 | TypeScript |
| 스타일 | Tailwind CSS v4 |
| 컴포넌트 라이브러리 | shadcn/ui (`components/ui/`) |
| 빌드 | Turbopack |

## 디렉토리 구조

```
seoul-30-webapp/
├── app/
│   ├── layout.tsx          # 루트 레이아웃, ThemeProvider
│   ├── page.tsx            # 메인 페이지 (필터 state 관리)
│   └── globals.css
├── components/
│   ├── seoul30/            # 도메인 컴포넌트
│   │   ├── PlaceCard.tsx   # 장소 카드 (이미지, 배지, CTA)
│   │   ├── FilterBar.tsx   # 카테고리/혼잡/시간/무료 필터
│   │   ├── Hero.tsx        # 상단 헤딩 + 오늘 조건 칩
│   │   ├── Header.tsx      # 모바일 헤더
│   │   ├── BottomTabBar.tsx # 모바일 하단 탭
│   │   ├── DesktopNav.tsx  # 데스크톱 사이드바 탭
│   │   └── EmptyState.tsx  # 필터 결과 없음 상태
│   └── ui/                 # shadcn/ui 기본 컴포넌트
├── lib/
│   ├── data.ts             # 타입 정의 + 정적 mock 데이터
│   └── utils.ts            # cn() 유틸
├── hooks/
│   ├── use-mobile.ts
│   └── use-toast.ts
└── next.config.mjs         # ignoreBuildErrors, images.unoptimized, turbopack
```

## 데이터 흐름

```
lib/data.ts (PLACES, 필터 옵션 상수)
    ↓
app/page.tsx (필터 state: useState + useMemo로 filteredPlaces 계산)
    ↓
FilterBar (필터 UI, onFiltersChange 콜백)
PlaceCard (개별 카드, 북마크 로컬 state)
EmptyState (결과 없음)
```

## 레이아웃 패턴

- 모바일: `Header` (상단 sticky) + 스크롤 main + `BottomTabBar` (하단 fixed)
- 데스크톱(md+): `DesktopNav` (좌측 sticky aside) + 스크롤 main

## 주요 설계 결정

- **필터 state는 page.tsx에 집중**: FilterBar는 UI만, 로직은 parent에서 관리
- **북마크는 PlaceCard 로컬**: MVP 단계, persist 불필요
- **정적 데이터**: 실 API 연동 전까지 `lib/data.ts`의 PLACES 배열 사용
- **ignoreBuildErrors**: 빠른 개발 속도 우선, 타입 오류 무시
