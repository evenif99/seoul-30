# TASKS

Last updated: 2026-05-18 (Phase 11 complete)

## Completed Phases

| Phase | Description |
|---|---|
| 1 | Project setup — Prisma schema, next.config, .env.example |
| 2 | Core logic (mock-first) — types, scoring, API routes, feature flags |
| 3 | UI build-out — district selector, place detail, bookmark hooks |
| 4 | PWA foundation — manifest, SVG icon, offline page, service worker |
| 5 | Real API integration — Seoul culturalEventInfo + citydata adapters |
| 6 | DB caching layer + travel mode disclosure (Hero.tsx) |
| 7 | Search & filter enhancement — name search, openNow toggle, URL sync |
| 8 | My Places — bookmarks/recent tabs, RecentTracker, route-based nav |
| 9 | SEO & Share — generateMetadata, OG image, JSON-LD, ShareButton, sitemap |
| 10 | Production hardening — rate limiting, ErrorBoundary, a11y, CI |
| 11 | Map view — Leaflet + OpenStreetMap, list/map toggle, marker popups |

## Next Planned Phases

| Phase | Description | Priority |
|---|---|---|
| 12 | Testing suite — Vitest unit tests (scoring), Playwright E2E golden paths | High |
| 13 | Anonymous place rating — thumbs up/down, DB model, no auth required | Medium |
| 14 | PWA push notifications — VAPID, district alerts, Vercel Cron | Medium |
| 15 | i18n — next-intl, Korean/English, URL-based locale routing | Low |

## Currently Blocked

- None.

## Do Not Touch

- `components/ui/` — shadcn/ui generated primitives, modify only if there is a direct UI requirement
- `.env.local` / real API keys — never commit, never hardcode
- `prisma/schema.prisma` — run `prisma db push` after any schema change
