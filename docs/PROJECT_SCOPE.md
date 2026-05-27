# PROJECT_SCOPE

## Phase 59 Scope Update (2026-05-27)

**접근성·성능·UX 마감 — 구조적 a11y 버그 수정 + ARIA 완성도**

### 구조적 수정 (critical)
- `app/layout.tsx`: `<main id="main-content">` → `<div>` — 중첩 `<main>` + 중복 `id` 제거. 각 페이지가 자체 `<main>` 랜드마크를 선언.
- `app/page.tsx`: 정렬 토글 버튼에 `aria-pressed`, 뷰 모드 토글 버튼에 `aria-pressed` 추가. 두 그룹 모두 `role="group"` + `aria-label` 추가.
- `app/bookmarks/page.tsx`: tablist `aria-label`, 각 tab에 `id` + `aria-controls`, 탭 패널에 `role="tabpanel"` + `aria-labelledby` + `id="tabpanel-places"` 완성.
- 하위 페이지 skip link 앵커 추가 — `about`, `privacy`, `offline`, `place/[id]`, `bookmarks` 모두 `id="main-content"` 선언 (from `<div>` → `<main>`).

### ARIA 강화
- `PushSubscribeButton`: 카테고리 칩 버튼에 `aria-pressed={selected.has(cat)}` 추가 (selecting + editing 패널 양쪽). ESC 키로 패널 닫기 지원 (`keydown` 리스너). 패널에 `role="dialog"` + `aria-modal` + `aria-label` 추가.

### i18n 신규 키
- `common.sortLabel`: "정렬 방식" / "Sort order" — sort group aria-label
- `common.viewModeLabel`: "보기 방식" / "View mode" — view toggle group aria-label

### 테스트
- `tests/unit/a11y-structure.test.ts` 신규 — 18개 회귀 방지 케이스:
  - layout 중첩 main 방지, 각 페이지 skip anchor 존재, aria-pressed 선언 확인, PushSubscribeButton ESC/aria-pressed, bookmarks tablist/tabpanel 완성도, i18n 키 존재.
- 테스트 203개 통과 (185 → 203, 신규 18개).

## Phase 58 Scope Update (2026-05-27)

- `/api/diagnostics` 강화 — `snapshotsLast24h`, `pushCategoryStats`, `topPlaces` 필드 추가.
  - `pushCategoryStats`: 전체 구독자 수, 전체 카테고리 구독자 수, 카테고리별 구독자 수 (빈 tags = 전체로 처리).
  - `topPlaces`: `placeFeedback.groupBy(placeId)` Top 5, 각 `upCount`/`downCount`/`upPct` 포함.
  - `snapshotsLast24h`: 최근 24시간 생성 스냅샷 수.
- `/admin` 페이지 — 3개 섹션 추가:
  1. **스냅샷 신선도**: 24h 생성 수 + 경과 시간 (1시간 미만 → 녹색, 24h 초과 → 주황 stale 표시).
  2. **Push 구독 현황**: 전체 구독자 수, 전체 카테고리 구독 비율, 카테고리별 구독자 수 + PctBar.
  3. **장소 참여도 Top 5**: placeId · 피드백 수 · 👍 비율 테이블 (70%↑ 녹색, 40%↓ 빨강).
- `tests/unit/diagnostics.test.ts` — 3개 케이스 추가: `snapshotsLast24h`, `pushCategoryStats`, `topPlaces`.
- 테스트 185개 통과 (182 → 185, 신규 3개).

## Phase 57 Scope Update (2026-05-27)

- `lib/utils/data-quality.ts` 신규 — `calcDataQuality(places)` 유틸리티: 좌표/이미지/주소/전화/홈페이지/운영시간/태그 보유율(FieldCoverage), 소스별 요약(bySource), 의심 좌표 수.
- `lib/utils/coords.ts` — `isSuspiciousCoord(lat, lng)` 추가: 소수점 3자리 미만 좌표 = 정밀도 낮은 의심 좌표 판별 (~100m+ 오차 가능).
- `/api/diagnostics` 강화 — `dataQuality` 필드 추가: 최근 스냅샷 있으면 실 API 장소 기반, 없으면 MOCK_PLACES 기반, `source: 'snapshot' | 'mock'` 명시.
- `/admin` 페이지 강화 — 데이터 품질 섹션 신규: 필드별 보유율 바 차트, sourceType별 좌표/이미지 보유율 테이블, 의심 좌표 경고.
- `tests/unit/data-quality.test.ts` 신규 — `isSuspiciousCoord` 6케이스 + `calcDataQuality` 7케이스 + MOCK_PLACES 품질 게이트(좌표 80%↑, 주소 90%↑, 태그 70%↑, 의심좌표 20%↓).
- `tests/unit/coords.test.ts` — `isSuspiciousCoord` 4케이스 추가.
- `tests/unit/diagnostics.test.ts` — `dataQuality` 필드 검증 케이스 추가.
- 테스트 182개 통과 (160 → 182, 신규 22개).

## Phase 56 Scope Update (2026-05-27)

- `hooks/use-push.ts` — `currentTags: string[]` 상태 추가 (localStorage `seoul30:push:tags` 복원), `updateTags(tags)` 함수 신규 (PushManager 재구독 없이 서버 태그만 갱신), `subscribe`/`unsubscribe` 시 localStorage 동기화.
- `PushSubscribeButton` — 구독 중 상태에서 현재 태그 요약 표시 (`알림 구독 중 · 문화, 도서관` 형태) + 편집 패널 신규 (ChevronDown 토글, 카테고리 칩, 저장/취소/구독취소).
- `sw.js` — `notificationclick` 버그 수정: 기존 창 있을 때 `existing.focus()`만 하던 것을 `existing.navigate(url).then(client?.focus())`로 교체 → 카테고리 딥링크 URL로 실제 이동. 캐시 버전 v4 → **v5** 범프.
- i18n 키 추가 (ko + en): `push.editTitle`, `push.subscribedAll`, `push.save`, `push.unsubscribeAction`.
- `tests/unit/service-worker-cache.test.ts` — v5 버전 + notificationclick navigate 회귀 테스트 추가.
- 테스트 160개 통과.

## Additional Phase Scope Update — SW 이미지 캐시 버그 수정 (2026-05-27)

- `public/sw.js` — Phase 55에서 `unoptimized: true` 제거로 인한 이미지 캐싱 회귀 수정.
  - 기존: `url.hostname === 'images.unsplash.com'` (Next.js Image 최적화 이후 절대 매칭 안 됨)
  - 변경: `url.pathname.startsWith('/_next/image')` (모든 최적화 이미지 캐시)
  - 캐시 버전 `v3` → `v4` 범프 (클라이언트 SW 강제 갱신).
- `PushSubscribeButton` — 카테고리 취소 시 선택 상태 초기화 (전체 선택 기본값으로 복귀).
- `tests/unit/service-worker-cache.test.ts` — `v4` + `/_next/image` 인터셉트 회귀 검증 추가.
- 테스트 159개 통과.

## Phase 55 Scope Update (2026-05-27)

- `unoptimized: true` 제거 → `remotePatterns` 설정으로 Next.js 이미지 최적화(WebP/AVIF) 활성화.
- `display: 'swap'` 폰트 명시 → FOIT 제거, CLS 개선.
- `preconnect` 추가: `culture.seoul.go.kr`, `dns-prefetch` 추가: `tong.visitkorea.or.kr`.
- `tests/unit/image-config.test.ts` 신규 — remotePatterns 회귀 검증 (158개 통과).

## Phase 54 Scope Update (2026-05-27)

- `WebPushSubscription` 모델에 `tags String[] @default([])` 추가 → `npx prisma db push` 적용.
- subscribe API — `tags` 수신·저장 (알 수 없는 카테고리 제거).
- send API — `?category=xxx` 쿼리 파라미터로 타겟 발송 (빈 tags = 전체 대상 포함), 카테고리별 제목·딥링크.
- `usePush` hook — `subscribe(tags: string[])` 파라미터 추가.
- `PushSubscribeButton` — 구독 전 카테고리 chip 선택 UI (기본 전체 선택, 외부 클릭 닫기).
- i18n 키 추가: `selectTitle`, `confirm`, `cancel`, `categories.*` (ko + en).
- 테스트 152개 통과 (카테고리 필터 4개 추가).

## Phase 53 Scope Update (2026-05-26)

- README.md 전면 재작성 — 포트폴리오용, 스크린샷 테이블, 현행 테스트 수(148/14), Phase 잡동사니 제거.
- About 페이지 데이터 소스 수정 — OpenStreetMap → Naver Maps v3, TourAPI 4.0 추가.
- layout.tsx authors 메타데이터 → GitHub 프로필 링크.

## Phase 52 Scope Update (2026-05-26)

- Completed PWA installability polish with manifest `id`, display override, screenshots, and cache version bump.
- Kept the work asset-only/local; no new paid services, no database changes, no environment variable changes.
- Added deterministic tests so manifest screenshot/icon paths cannot drift again.

## Phase 51 Scope Update (2026-05-26)

- Stabilized Lighthouse CI without adding paid services.
- Kept all local/CI app server checks on port `3001`.
- Treated Lighthouse as a quality signal, with accessibility as the blocking gate and other categories as warnings.
- Kept PWA verification in deterministic unit tests for manifest/icon/SW assets.

## Additional Phase Scope Update (2026-05-26)

- Fixed PWA icon asset gaps after Phase 50 review.
- Strengthened installability by adding 192/512 PNG maskable icons to the manifest.
- Kept the work within free/local assets only; no new paid services or env changes.
- Hardened CSP Naver Maps compatibility without relaxing frame/object protections.

## Phase 50 Scope Update (2026-05-26)

- Added production security headers without adding paid services.
- Added Lighthouse CI with temporary public upload storage and port `3001`.
- Added MapView fallback/error handling for Naver Maps configuration and load failures.

## Phase 49 Scope Update (2026-05-26)

- Completed PWA install prompt flow with `beforeinstallprompt`.
- Added home-screen install CTA and “later” persistence via localStorage.
- Improved offline `/api/places` fallback so cached API data is marked stale/offline instead of looking fresh.
- Deferred Push tag personalization because it requires a Prisma schema change and Neon `db push` approval/capacity check.

Last updated: 2026-05-26 (Phase 48 + Additional Phase: Filter Hard Apply)

## Current Scope Status

- Completed through Phase 45 + bug fixes (2026-05-26).
- Post-Phase 34 fix included: `PlaceMiniMap` supports nearby detail page navigation without losing Naver Maps initialization.
- Markdown operations docs are centralized in `docs/`; root `README.md` remains the entry document.
- 버그 수정 4건 완료: 상세 페이지 404, 지도 핀 10개 제한, 북마크/최근본 실 API 장소 미출력.

Last updated: 2026-05-21 (Phase 33 — TourAPI Image Integration)

## Product Goal

Low-cost MVP PWA that recommends Seoul public places reachable within 30 minutes by public transit.
Dual purpose: working portfolio piece + real deployable service at $0/month.

## Completed Scope (Phase 1–20)

| Phase | Summary |
|---|---|
| 1 | Project setup — Next.js 16, Tailwind, shadcn/ui, TypeScript strict |
| 2 | Mock data + scoring model (6 dimensions, rule-based) |
| 3 | PlaceCard UI, FilterBar (category / crowd / time / free-only) |
| 4 | PWA baseline — manifest, service worker, offline page |
| 5 | Seoul Open API adapters (culture events + culture spaces) |
| 6 | DB caching layer — RecommendationSnapshot + ExternalCache (Prisma + Neon) |
| 7 | Search filter, open-now filter, URL query param sync |
| 8 | Bookmarks and recent views (localStorage + dedicated pages) |
| 9 | SEO — OG image, share button, sitemap.ts, JSON-LD |
| 10 | Production hardening — rate limiting middleware, error boundary, CI build gate |
| 11 | Map view — Leaflet + OpenStreetMap, marker clustering, bounds auto-fit |
| 12 | Testing suite — Vitest unit, RTL component, Playwright E2E, CI integration |
| 13 | Anonymous place rating — PlaceFeedback model, sessionId dedup, optimistic UI |
| 14 | PWA Web Push — VAPID, WebPushSubscription model, Vercel Cron daily trigger |
| 15 | i18n — next-intl v4, ko/en, cookie-based locale, LanguageToggle component |
| 16 | Score breakdown UI — ScoreBadge on PlaceCard, reason pills, ko/en labels |
| 17 | Stale cache fallback (Seoul API 장애 시 만료 스냅샷 반환) + defensive hardening |
| 18 | Skeleton loading states + accessibility (aria-live, aria-busy, skip-to-content) |
| 19 | Static pages (About/Privacy) + PWA polish (manifest shortcuts, maskable icon, categories) |
| 20 | Launch hardening — validateEnv(), /api/health, docs/RUNBOOK.md |
| 21 | Observability — structured JSON logs on recommendation flow, /api/diagnostics endpoint |
| 22 | Data freshness transparency — snapshotAt in API response, relative time in stale banner + cache indicator |
| 23 | Engagement polish — bookmark count badge in BottomTabBar, ShareButton/BookmarkButton/Bookmarks page i18n |
| 24 | Performance/accessibility hardening — ignoreBuildErrors 제거, static page cache headers, PlaceCard full i18n |
| 25 | Release readiness — dead import cleanup, MapViewInner i18n, offline/about/privacy i18n 완성, MD 전체 최신화 |
| Post-25 | Naver Maps 교체 — Leaflet 제거, 위성/하이브리드 뷰 토글, 현재 위치 버튼, 그리드 클러스터링, ncpKeyId 인증 |
| Additional Phase | Location-based transit access scoring — Ddareungi station proximity (Seoul Open API), transit minutes/mode badge per place card |
| Additional Phase | GPS onboarding modal — 첫 방문 시 위치 권한 안내 모달, 거부 시 amber 배너, localStorage 재표시 방지 |
| Additional Phase | E2E CI fix — `test.beforeEach` addInitScript로 모달 사전 dismiss, GitHub Actions 통과 복구 |
| 26 | Real Data Transition — fetchSeoulCultureSpaces 추가, fetchSeoulPlaces 통합, /api/health Seoul API ping, 실 데이터 품질 방어 |
| 27 | Data Source Expansion — 도서관/공원/체육시설 Seoul Open API fetcher, PlaceSourceType 확장(LIBRARY/PARK/SPORTS), fetchSeoulPlaces 5소스 통합 |
| 28 | Place Detail Enrichment — PlaceCard 카테고리 placeholder, PlaceMiniMap(단일 마커 Naver Maps), 상세 페이지 미니맵/대중교통 노트/homepage i18n |
| 29 | UX & Filter Improvements — GPS 시간 필터 실동작, 거리순/추천순 정렬 토글, EmptyState 대체 추천, 지도 팝업 "목록에서 보기" 연동 |
| 30 | Operational Readiness — lib/logger.ts 구조화 로그 공통화, global-error.tsx, diagnostics 강화(snapshotCount/flags), Analytics 확인, RUNBOOK 최신화 |
| 31 | Mock Data Expansion — 15→38 장소, 17개 자치구, Unsplash imageUrl 전체, PlaceTag 타입 + tags/nearestStation 필드 |
| 32 | Detail Page Enrichment — 상세 페이지 hero image, tag chips, nearest station, CATEGORY_HERO / TAG_CONFIG 맵, 레이아웃 전면 재설계 |
| Pin Accuracy | 핀포인트 오차 최소화 — toSeoulLatLng() 유틸리티(Seoul bounds guard), 3개 API fetcher 통일, 38개 mock 좌표 전면 보정, PlaceMiniMap zoom 16→15 |
| 33 | TourAPI Image Integration — TourAPI 4.0 `searchKeyword2` + `detailImage2`, real API image enrichment, server-only `TOUR_API_KEY` |
| 33.5 | Mock Place Audit Prep — mock 좌표/존재 감사 문서, 문화공간 좌표 방향 수정, mock data 품질 테스트 |
| 34 | Nearby Places + Pin Accuracy First — 실제 API 상세 페이지 연결, 좌표 검증된 근처 장소 추천, 좌표 없는 복지시설 API 지도 통합 보류 |
| 35 | Portfolio Polish — OG 이미지(ImageResponse), layout 메타데이터 강화, README 포트폴리오 전면 개선 |
| 36 | Mock Place Audit & Fix — 10개 문제 장소 실재 시설로 교체, 주소/좌표 보정, MOCK_PLACE_AUDIT.md 업데이트 |
| 37 | Tag-based Facility Filter — FilterBar 태그 pills (indoor/outdoor/wheelchair/family/pet/parking/wifi), AND 교집합 필터, URL sync |
| 38 | Accessibility & Core Web Vitals — userScalable:false 제거(WCAG 1.4.4), preconnect/dns-prefetch, aria-hidden 보강 |
| 39 | Seoul Realtime Congestion Test Coverage — seoulCongestion.test.ts 8개 케이스, vi.hoisted env mock 패턴 |
| 40 | Feedback-loop Scoring + Recent-view Dedup — feedbackBonus ScoreBreakdown 필드, calcFeedbackBonus(), soft-dedup (최근 3개 후위 이동) |
| 41 | Admin Diagnostics Dashboard — /admin 서버 렌더링 페이지 (DB 상태, 피처 플래그, 장소 데이터) |
| 42 | E2E Test Expansion — 1 → 13개 스펙 (filter/place-detail/i18n/admin), tag-filter data-testid 추가 |
| 43 | SW Cache Strategy — 4-tier 캐시 (static/api/pages/images), v2, SKIP_WAITING 메시지 핸들러 |
| 44 | Push-send Unit Tests — 8개 테스트 (Bearer auth, 구독자 발송, 410 expired 자동 삭제, Vercel cron 스케줄 검증) |
| 45 | JSON-LD Structured Data — schema.org TouristAttraction, 11개 유닛 테스트, i18n E2E 안정화 (serviceWorkers:block) |
| Bug Fix | 상세 페이지 404 + 지도 핀 30개 + 북마크/최근본 실 API 장소 지원 (place 데이터 localStorage 저장) |
| 46 | Real API Data Quality — enrichPlace() sourceType별 태그 자동 추론, PARK timefit 24/7 보정(5→10점), ScoreBadge feedbackBonus 표시, 테스트 9개 추가 |
| 47 | Admin 보안 + 테스트 커버리지 — ADMIN_SECRET ?secret= 접근 제어, isAdminAuthorized() 유틸, coords.ts 경계 테스트 16개, 유닛 134개 |
| 48 | 상세 페이지 성능 + MapView 북마크 — fetchByIdPrefix() 단일 소스 fetch, 스냅샷 우선 조회, 지도 팝업 BookmarkButton 추가 |
| Additional Phase | 필터 하드 적용 — 카테고리/자치구/태그 scoring-only → client-side 하드 필터, 선택 조건 미충족 시 EmptyState 정상 출력 |

## Deferred / Not In Scope

- Playwright Windows exit-hang (로컬 한정, CI 통과 확인됨)
- Authentication / user accounts
- Vector DB / AI-powered recommendations
- Chatbot integration
- Data export
- Turn-by-turn routing or paid transit APIs; current transit access remains a heuristic estimate using straight-line distance

## Key Constraints

- **Cost**: Vercel Hobby (free) + Neon Free tier — no paid services
- **Secrets**: All API keys via env vars only — never in code or commits
- **External API calls**: Server-side only (Route Handlers) — no client-side secret exposure
- **Scope**: No feature beyond the requested phase — no enterprise patterns, no premature abstraction
- **MVP**: Small, verifiable units — working over perfect

## Security Rules (must remain in effect)

- All API keys in `.env.local` or deployment env vars only
- Never hardcode API keys, tokens, passwords in code, markdown, or commit messages
- External API calls only from server-side Route Handlers
- Never pass secret keys to browser / client components
- `NEXT_PUBLIC_` prefix only for values safe to expose publicly
