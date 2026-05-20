# ARCHITECTURE

Last updated: 2026-05-20 (Phase 12 complete)

## Stack
- Next.js 16 App Router
- React 19 + TypeScript strict
- Tailwind CSS + shadcn/ui
- Prisma + Neon PostgreSQL
- Leaflet + OpenStreetMap
- Vitest + React Testing Library + Playwright

## Relevant Structure
```txt
app/
  api/
    places/route.ts
    realtime/[areaCode]/route.ts
  page.tsx
  place/[id]/page.tsx
  bookmarks/page.tsx

components/seoul30/
  PlaceCard.tsx
  FilterBar.tsx
  BookmarkButton.tsx
  MapView.tsx
  MapViewInner.tsx

lib/
  scoring.ts
  mock/places.ts
  mock/realtime.ts
  adapters/
  cache/recommendation.cache.ts
  config/env.ts
  config/feature-flags.ts

tests/
  unit/scoring.test.ts
  components/PlaceCard.test.tsx
  components/FilterBar.test.tsx
  components/BookmarkButton.test.tsx
  e2e/home.spec.ts
  setup.tsx

vitest.config.ts
playwright.config.ts
.github/workflows/ci.yml
```

## Data and API Flow
1. Client calls `GET /api/places` with query filters.
2. Server reads feature flags and cache snapshot.
3. Server uses mock or real API adapters, applies `scorePlace`, sorts, returns top results.
4. Client applies UI-only filters (`search`, `openNow`) and renders list/map.

## Env Var Usage
- `DATABASE_URL`: Prisma / Neon connection
- `SEOUL_OPEN_API_KEY`: server-side external API access
- `NEXT_PUBLIC_BASE_URL`: canonical URL generation
- `USE_MOCK_DATA`, `ENABLE_CULTURE_EVENTS_API`, `ENABLE_REALTIME_CITY_DATA`: runtime feature switches

## Cache Strategy
- Recommendation snapshots in DB with TTL (1 hour)
- Real-time congestion adapter cache window (5 minutes)
- Mock mode bypasses external fetch and DB snapshot write

## Test and CI Architecture (Phase 12)
- Unit/component tests run with `vitest run` on jsdom
- E2E tests run with Playwright against local dev server
- CI pipeline order:
  1. install
  2. prisma generate
  3. type-check
  4. vitest
  5. playwright
  6. build

## Known Runtime Notes
- Next.js logs a deprecation warning for `middleware.ts` naming (`proxy` migration pending).
- On this local Windows environment, Playwright tests pass but command exit can hang after completion.
