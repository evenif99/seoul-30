# PROJECT_SCOPE

Last updated: 2026-05-18 (Phase 11 complete)

## Product Goal

A PWA that recommends public facilities and cultural venues in Seoul reachable within 30 minutes by public transit — built for Seoul residents. Dual purpose: portfolio project + real deployable service at $0/month.

## Completed Scope (Phase 1–11)

### Core
- Rule-based scoring engine (access / relevance / cost / congestion / timefit / freshness)
- Mock-first architecture — full UI works with `USE_MOCK_DATA=true`, no API keys required
- Seoul Open Data Plaza integration gated by feature flags

### UI
- Home page: district selector, filter bar (category, freeOnly, search, openNow), recommendation list
- **List / Map view toggle** — Leaflet + OpenStreetMap map with brand markers
- Place detail page (`/place/[id]`) with Kakao Map deep-link CTA, share button, bookmark
- My Places page (bookmarks + recent views) via localStorage
- PWA: manifest, service worker, offline fallback page

### Data & API
- `GET /api/places` — scored recommendation list, cache-first (1h DB snapshot)
- `GET /api/realtime/[areaCode]` — congestion proxy
- Seoul culturalEventInfo adapter (100 events, 1h Next.js cache)
- Seoul citydata_ppltn adapter (congestion, 5min cache)

### Production
- Rate limiting middleware (60 req/min/IP on /api/*)
- React ErrorBoundary with Korean fallback UI
- Skip-to-content accessibility link
- GitHub Actions CI (tsc --noEmit + next build)
- Dynamic OG images, JSON-LD structured data, sitemap, robots.txt

## Excluded Scope (Intentionally Deferred)

- User authentication / accounts (bookmarks are localStorage-only)
- Phase 12: Testing suite (Vitest + Playwright) — next planned
- Phase 13: Anonymous place rating (thumbs up/down)
- Phase 14: PWA push notifications (district-level alerts)
- Phase 15: i18n (Korean / English)

## Key Constraints

- **$0/month**: Vercel Hobby + Neon Free tier
- No scope creep — implement only what is requested
- Read existing code before making assumptions
- No enterprise patterns — small, verifiable units only
- All secrets via env vars only — never hardcoded

## Environment Variables Required

| Variable | Required for |
|---|---|
| `DATABASE_URL` | Prisma / Neon DB |
| `SEOUL_OPEN_API_KEY` | Real API mode only (optional in mock mode) |
| `NEXT_PUBLIC_BASE_URL` | Sitemap, OG absolute URLs |
| `USE_MOCK_DATA` | Feature flag (default: true) |
| `ENABLE_REALTIME_CITY_DATA` | Feature flag (default: false) |
| `ENABLE_CULTURE_EVENTS_API` | Feature flag (default: false) |
