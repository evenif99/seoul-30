# PROJECT_SCOPE

Last updated: 2026-05-21 (Phase 29: UX & Filter Improvements)

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
| 20 | Launch hardening — validateEnv(), /api/health, RUNBOOK.md |
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

## Deferred / Not In Scope

- Playwright Windows exit-hang (로컬 한정, CI 통과 확인됨)
- Authentication / user accounts
- Admin dashboard
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
