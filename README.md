# Seoul 30 — 서울 30분 생활권 추천

서울 시민이 현재 위치 또는 자치구 기준으로 **30분 안에 갈 수 있는 공공문화·공공시설·생활편의 장소**를 추천하는 웹앱 / PWA.

지도앱·교통앱 대체가 아닌 **의사결정 보조형 추천 서비스**. 서울시 공공데이터 기반 규칙 기반 scoring으로 추천하며, API 키 없이도 mock 데이터로 전체 UI 흐름이 동작합니다.

---

## 기술 스택

| 분류 | 기술 |
|------|------|
| 프레임워크 | Next.js 16 (App Router) |
| 언어 | TypeScript strict |
| 스타일 | Tailwind CSS v4 + shadcn/ui |
| DB | PostgreSQL (Neon Free) + Prisma 5 |
| 배포 | Vercel Hobby |
| 공공데이터 | 서울 열린데이터광장 Open API |

---

## 구현 현황

### ✅ Phase 1 — 환경 세팅
- Prisma 5 + Neon (Singapore) DB 연결 및 스키마 적용
- `next.config.mjs` manifest 캐시 헤더 + API `no-store` 헤더 추가
- `.env.example` 환경변수 구조 정의 (실제 값 미포함)

### ✅ Phase 2 — 코어 로직 (mock 기반)
- **도메인 타입** (`lib/types/`): `NormalizedPlace`, `RecommendationResult`, `RealtimeSignal`, `ApiResponse`
- **서울 25개 자치구 상수** (`lib/districts.ts`)
- **mock 데이터** (`lib/mock/`): 12개 장소, 구별 혼잡도
- **규칙 기반 scoring** (`lib/scoring.ts`): 최대 100점 순수 함수
- **API Route Handlers**:
  - `GET /api/places?district=&category=&freeOnly=` — scoring 적용 추천 목록
  - `GET /api/realtime/[areaCode]` — 혼잡도 (mock fallback)
- **Feature flags**: `USE_MOCK_DATA` / `ENABLE_REALTIME_CITY_DATA` / `ENABLE_CULTURE_EVENTS_API`
- **Prisma Client 싱글톤** (`lib/prisma.ts`)
- **서버 전용 env 모듈** (`lib/config/env.ts`, `lib/config/feature-flags.ts`)

### 🔄 Phase 3 — UI 확장 (진행 중)
- 자치구 선택 UI (`DistrictSelector`)
- `/api/places` 연동 및 홈 페이지 리팩토링
- 장소 상세 페이지 (`/place/[id]`)
- 북마크 · 최근조회 (localStorage 훅)

### 📋 Phase 4 — PWA (예정)
- `public/manifest.json` + 아이콘
- 오프라인 fallback 페이지

### 📋 Phase 5 — 실 API 연결 (예정)
- 서울시 문화행사 정보 API adapter
- 서울시 실시간 도시데이터 API adapter + Neon 캐시

---

## 추천 로직

외부 AI 없이 규칙 기반 가중치 합산으로 추천합니다.

```
score = access(0~30) + relevance(0~25) + cost(0~15) + congestion(0~15) + timefit(0~10) + freshness(0~5)
```

| 항목 | 기준 |
|------|------|
| access | 선택 자치구와 장소 위치 일치 여부 |
| relevance | 카테고리 필터 일치 여부 |
| cost | 무료 여부 |
| congestion | 실시간 혼잡도 (없으면 중립 8점) |
| timefit | 현재 시간 운영 중 여부 |
| freshness | 행사 시작 임박 여부 (Phase 5 완성 예정) |

---

## 로컬 실행

```bash
# 1. 저장소 클론
git clone https://github.com/evenif99/seoul-30.git
cd seoul-30

# 2. 의존성 설치
npm install

# 3. 환경변수 설정
cp .env.example .env.local
# .env.local 에 DATABASE_URL, SEOUL_OPEN_API_KEY 입력
# API 키 없이 시작하려면 USE_MOCK_DATA=true 유지

# 4. DB 스키마 적용
npx prisma db push

# 5. 개발 서버 실행
npm run dev
# → http://localhost:3000
```

---

## 환경변수

```bash
# .env.local

# DB (필수)
DATABASE_URL=              # Neon PostgreSQL 연결 문자열

# 서울 열린데이터광장 (Phase 5 실 연결 시 필수, 현재는 mock으로 대체)
SEOUL_OPEN_API_KEY=        # data.seoul.go.kr 마이페이지 → 인증키 관리

# Feature flags (기본값으로 mock 데이터 사용)
USE_MOCK_DATA=true
ENABLE_REALTIME_CITY_DATA=false
ENABLE_CULTURE_EVENTS_API=false
```

> `SEOUL_OPEN_API_KEY`는 서버 사이드 Route Handler에서만 사용합니다. 브라우저에 노출되지 않습니다.

---

## 폴더 구조

```
seoul-30-webapp/
├── app/
│   ├── page.tsx                        # 홈 (지역 선택 + 추천 목록)
│   ├── place/[id]/page.tsx             # 장소 상세
│   └── api/
│       ├── places/route.ts             # 추천 목록 API (scoring 적용)
│       └── realtime/[areaCode]/route.ts # 혼잡도 proxy API
├── components/
│   ├── seoul30/                        # 도메인 UI 컴포넌트
│   └── ui/                             # shadcn/ui 기본 컴포넌트
├── lib/
│   ├── config/                         # env.ts, feature-flags.ts (서버 전용)
│   ├── types/                          # 도메인 타입 정의
│   ├── mock/                           # mock 장소·혼잡도 데이터
│   ├── scoring.ts                      # 추천 scoring 순수 함수
│   ├── districts.ts                    # 서울 25개 자치구 상수
│   └── prisma.ts                       # PrismaClient 싱글톤
├── hooks/                              # localStorage 훅
├── prisma/schema.prisma                # DB 스키마
└── .env.example                        # 환경변수 템플릿
```

---

## DB 스키마

```prisma
model Place { ... }                   // 공공시설 정적 데이터 (seed)
model ExternalCache { ... }           // 외부 API 응답 요약 캐시 (raw 저장 금지)
model RecommendationSnapshot { ... }  // 추천 결과 캐시
```

---

## 보안 원칙

- API 키는 서버 사이드(`/api/*` Route Handler)에서만 사용
- `.env`, `.env*.local` 은 `.gitignore`에 포함 — Git에 커밋되지 않음
- 외부 API raw response 전체 저장 금지 — 정규화된 요약 필드만 DB 캐시
- `NEXT_PUBLIC_` prefix는 브라우저에 공개되어도 무방한 값에만 사용

---

## 운영 목표

- Vercel Hobby (무료) + Neon Free (0.5GB) 조합으로 **월 $0 운영**
- 포트폴리오 서비스이면서 실제 서울 시민이 사용할 수 있는 공개 서비스

---

## 라이선스

MIT
