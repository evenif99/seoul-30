# Seoul 30

Seoul 30 is a low-cost MVP PWA that recommends Seoul public places reachable within 30 minutes by public transit.
Built as a deployable portfolio app with mock-first behavior and optional real public API integration.

## Tech Stack

- Next.js 16 App Router + React 19 + TypeScript strict
- Tailwind CSS + shadcn/ui
- Prisma + Neon PostgreSQL (Singapore region)
- Naver Maps JavaScript API v3
- Vitest + React Testing Library + Playwright
- Vercel Hobby deployment ($0/month)

## Documentation

Project operation and handoff docs are managed under `docs/`.

- [TASKS](docs/TASKS.md) - phase checklist and pending work
- [PROJECT_SCOPE](docs/PROJECT_SCOPE.md) - completed scope and out-of-scope items
- [ARCHITECTURE](docs/ARCHITECTURE.md) - file structure and runtime architecture
- [HANDOFF](docs/HANDOFF.md) - current handoff state and work rules
- [RUNBOOK](docs/RUNBOOK.md) - health checks, deploy, rollback, and incident notes
- [NAVER_MAPS_IMPLEMENTATION](docs/NAVER_MAPS_IMPLEMENTATION.md) - Naver Maps implementation notes
- [MOCK_PLACE_AUDIT](docs/MOCK_PLACE_AUDIT.md) - mock place coordinate/existence audit

Current status: Phase 34 is complete. Phase 35 is not complete yet and remains the next pending phase.

## Phase Status

- **Phase 1** — Project setup, Next.js scaffold, Tailwind, shadcn/ui
- **Phase 2** — Mock data, scoring model (access / relevance / cost / congestion / timefit / freshness)
- **Phase 3** — PlaceCard UI, FilterBar (category / crowd / time / free-only)
- **Phase 4** — PWA baseline (manifest, service worker, offline page)
- **Phase 5** — Seoul Open API adapters (culture events, culture spaces)
- **Phase 6** — DB caching layer (RecommendationSnapshot, ExternalCache via Prisma + Neon)
- **Phase 7** — Search filter, open-now filter, URL query param sync
- **Phase 8** — Bookmarks and recent views (localStorage + dedicated pages)
- **Phase 9** — SEO (OG image, share button, sitemap, JSON-LD)
- **Phase 10** — Production hardening (rate limiting middleware, error boundary, CI build checks)
- **Phase 11** — Map view (Leaflet + OpenStreetMap, marker clustering, bounds controller)
- **Phase 12** — Testing suite (Vitest unit + RTL component + Playwright E2E, CI integration)
- **Phase 13** — Anonymous place rating (👍 / 👎, PlaceFeedback DB model, optimistic UI)
- **Phase 14** — PWA Web Push notifications (VAPID, WebPushSubscription DB model, Vercel Cron)
- **Phase 15** — i18n with next-intl v4 (ko/en, cookie-based locale, LanguageToggle)
- **Phase 16** — Score explanation breakdown UI (ScoreBadge on PlaceCard, ko/en labels)
- **Phase 17** — Stale cache fallback when Seoul Open API fails + defensive hardening (feedback/push try-catch, CRON_SECRET auth, use-push error state)
- **Phase 18** — Skeleton loading states + accessibility (aria-live, aria-busy, skip-to-content link)
- **Phase 19** — Static pages (About/Privacy) + PWA installability polish (manifest, shortcuts, maskable icon)
- **Phase 20** — Launch hardening (env validation, /api/health, docs/RUNBOOK.md)
- **Phase 21** — Observability: structured JSON logs on recommendation flow, /api/diagnostics endpoint
- **Phase 22** — Data freshness transparency: snapshotAt in API response, relative time in stale banner
- **Phase 23** — Engagement polish: bookmark count badge, ShareButton/BookmarkButton/Bookmarks page i18n
- **Phase 24** — Performance/accessibility hardening: ignoreBuildErrors removed, cache headers, PlaceCard i18n
- **Phase 25** — Release readiness: dead import cleanup, full i18n completion (offline/about/privacy/map), MD sync
- **Post-25** — Naver Maps 적용: Leaflet 대체, 위성 뷰 토글, 현재 위치 버튼, 그리드 클러스터링, ncpKeyId 인증
- **Additional Phase** — Location-based transit access scoring: server-side Ddareungi station lookup (Seoul Open API), transit minutes/mode badges on place cards
- **Additional Phase** — GPS onboarding modal: 첫 방문 시 위치 권한 안내 자동 표시, 거부 배너, localStorage 재표시 방지
- **Additional Phase** — E2E CI fix: `test.beforeEach` addInitScript로 모달 오버레이 사전 해제, GitHub Actions 통과 복구
- **Phase 26** — Real Data Transition: fetchSeoulCultureSpaces 추가, 문화행사+문화공간 병합(fetchSeoulPlaces), /api/health Seoul API ping, 실 데이터 품질 방어
- **Phase 27** — Data Source Expansion: 도서관(SeoulPublicLibraryInfo)/공원(ListParkService)/체육시설(ListPublicReservationSport) fetcher 추가, fetchSeoulPlaces 5개 소스 통합, PlaceSourceType 확장, mock sports 3개 추가
- **Phase 28** — Place Detail Enrichment: PlaceCard 카테고리별 이미지 placeholder, PlaceMiniMap 컴포넌트(Naver Maps 단일 마커), 상세 페이지 미니맵/대중교통 접근성 노트/homepage i18n
- **Phase 29** — UX & Filter Improvements: GPS 활성 시 시간 필터 실제 동작, 거리순/추천순 정렬 토글, EmptyState 대체 추천 2개, 지도 팝업 "목록에서 보기" 버튼 → 리스트 뷰 전환+스크롤
- **Phase 30** — Operational Readiness: lib/logger.ts 공통 구조화 로그, global-error.tsx, diagnostics snapshotCount/flags 추가, RUNBOOK 최신화
- **Phase 31** — Mock Data Expansion: 38 places, tags, nearest station metadata
- **Phase 32** — Detail Page Enrichment: hero image, tag chips, nearest station, refreshed detail layout
- **Phase 33** — TourAPI Image Integration: real API place image enrichment with server-side `TOUR_API_KEY`

## Recent Phase Notes

- Phase 33.5 completed: mock place audit prep, coordinate guard tests, official API coordinate direction fix.
- Phase 34 completed: real API detail lookup and coordinate-only nearby place recommendations.
- Post-Phase 34 fix completed: PlaceMiniMap now initializes correctly after nearby detail page navigation.
- Phase 35 pending: portfolio polish, Lighthouse/performance/accessibility audit, metadata completion.

## Local Run

```bash
git clone https://github.com/evenif99/seoul-30.git
cd seoul-30
npm install
cp .env.example .env.local
# fill in .env.local values (see Environment Variables below)
npm run dev
```

## Test Commands

```bash
npm run test          # Vitest unit + component tests
npm run test:e2e      # Playwright E2E
npx tsc --noEmit      # type check
npm run build         # production build
```

## Environment Variables

```bash
# Database
DATABASE_URL=

# Seoul Open API (server-side only)
SEOUL_OPEN_API_KEY=

# Korea Tourism Organization TourAPI 4.0 (server-side only)
TOUR_API_KEY=

# Canonical URL for OG / sitemap
NEXT_PUBLIC_BASE_URL=https://your-app.vercel.app

# Feature flags
USE_MOCK_DATA=true
ENABLE_REALTIME_CITY_DATA=false
ENABLE_CULTURE_EVENTS_API=false

# Phase 14 — Web Push (VAPID)
# Generate keys: npx web-push generate-vapid-keys
VAPID_EMAIL=admin@example.com
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
NEXT_PUBLIC_VAPID_PUBLIC_KEY=   # same as VAPID_PUBLIC_KEY
CRON_SECRET=                    # arbitrary secret string

# Naver Maps (browser-safe public key id)
NEXT_PUBLIC_NAVER_MAP_CLIENT_ID=
```

Security rules:
- All API keys in `.env.local` or deployment env vars only — never in code
- Server-side external API calls only (Route Handlers)
- `NEXT_PUBLIC_` prefix only for values safe to expose to the browser

## Known Notes

- On Windows, Playwright process exit can hang after tests pass — tests themselves pass correctly.

## License

MIT
