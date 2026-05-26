# PROJECT_SCOPE

Last updated: 2026-05-26 (Phase 47 complete)

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
