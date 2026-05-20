# PROJECT_SCOPE

Last updated: 2026-05-20 (Phase 12 complete)

## Product Goal
Build a low-cost MVP PWA that recommends Seoul public places reachable within 30 minutes using a simple scoring model and public data integration.

## Completed Scope (Phase 1-12)
- Mock-first recommendation app with district/category/free/open-now/search filters
- List and map view (Leaflet + OpenStreetMap)
- Place detail pages, bookmarks/recent views (localStorage)
- PWA baseline (manifest, service worker, offline page)
- Seoul Open API adapters and cache-first recommendation API
- Production hardening (rate limiting, error boundary, CI build checks)
- Testing suite:
  - Vitest unit tests for scoring dimensions
  - React Testing Library component tests (`PlaceCard`, `FilterBar`, `BookmarkButton`)
  - Playwright E2E golden paths (home -> detail, filter -> result change)

## Excluded Scope (Still Deferred)
- Authentication / accounts
- Anonymous place rating (Phase 13)
- Push notifications (Phase 14)
- i18n (Phase 15)
- Admin dashboard / export / chatbot / vector DB

## Key Constraints
- Keep MVP small and deployable at low cost (Vercel Hobby + Neon Free)
- No secrets in code; env vars only
- Server-side route handlers only for external API calls
- No scope creep beyond requested phase
