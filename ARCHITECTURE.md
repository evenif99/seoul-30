# ARCHITECTURE

Last updated: 2026-05-18 (Phase 11 complete)

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, TypeScript strict) |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Database | PostgreSQL via Neon Free (Singapore) + Prisma 5 |
| Deployment | Vercel Hobby ($0/month) |
| Map | Leaflet + OpenStreetMap (react-leaflet, no API key needed) |
| Public Data | Seoul Open Data Plaza API |

## Repository

- Local workspace: `c:\project\seoul-30-webapp`
- Git remote: `https://github.com/evenif99/seoul-30.git`
- Branch: `master`
- Deployed: Vercel (auto-deploy on push to master)

## Folder Structure

```
app/
  page.tsx                        # Home — district selector, filter bar, list/map toggle
  place/[id]/
    page.tsx                      # Place detail (generateMetadata, JSON-LD, ShareButton)
    opengraph-image.tsx           # Dynamic OG image (edge runtime, 1200×630)
  bookmarks/page.tsx              # My places — saved + recent tabs
  offline/page.tsx                # PWA offline fallback
  layout.tsx                      # Root layout — skip-to-content, ErrorBoundary, SW registrar
  sitemap.ts / robots.ts          # SEO
  api/
    places/route.ts               # GET scored recommendation list (cache-first)
    realtime/[areaCode]/route.ts  # GET congestion proxy

components/
  seoul30/                        # Domain UI components
    PlaceCard.tsx                 # Place card (priority prop for LCP)
    MapView.tsx                   # next/dynamic ssr:false wrapper
    MapViewInner.tsx              # Leaflet map, brand DivIcon markers, BoundsController
    FilterBar.tsx                 # search + openNow + category/freeOnly filters
    DistrictSelector.tsx          # 25-district picker
    BottomTabBar.tsx / DesktopNav.tsx  # Route-based navigation (usePathname)
    BookmarkButton.tsx / ShareButton.tsx / RecentTracker.tsx
    Hero.tsx / Header.tsx / EmptyState.tsx
  ui/                             # shadcn/ui primitives
  ErrorBoundary.tsx               # React class error boundary
  ServiceWorkerRegistrar.tsx      # Registers /sw.js on client mount

hooks/
  use-bookmark.ts                 # localStorage bookmarks (max 100)
  use-recent.ts                   # localStorage recent views (max 20)

lib/
  types/
    place.ts                      # NormalizedPlace, PlaceSourceType
    recommendation.ts             # RecommendationResult, ScoreBreakdown
  mock/
    places.ts                     # 12 sample NormalizedPlace (all with lat/lng)
    realtime.ts                   # Per-district mock congestion signals
  adapters/
    seoul-culture.adapter.ts      # culturalEventInfo API → NormalizedPlace[]
    seoul-citydata.adapter.ts     # citydata_ppltn API → RealtimeSignal
  cache/
    recommendation.cache.ts       # RecommendationSnapshot read/write (1h TTL)
  config/
    env.ts                        # Server-only env validation
    feature-flags.ts              # USE_MOCK_DATA / ENABLE_* flags
  scoring.ts                      # Pure scoring function (max 100 pts)
  districts.ts                    # Seoul 25-district constants
  prisma.ts                       # PrismaClient singleton

prisma/schema.prisma              # Place, ExternalCache, RecommendationSnapshot models
public/
  manifest.json                   # PWA manifest
  sw.js                           # Service worker (offline fallback)
  icons/icon.svg                  # Branded SVG icon

middleware.ts                     # Rate limiting: 60 req/min/IP on /api/*
.github/workflows/ci.yml          # CI: tsc --noEmit + next build
```

## Data / API Flow

```
Client (browser)
  └─ GET /api/places?district=&category=&freeOnly=
        └─ feature flag: USE_MOCK_DATA=true  →  MOCK_PLACES (always)
        └─ feature flag: ENABLE_CULTURE_EVENTS_API=true
              └─ RecommendationSnapshot (DB cache, 1h TTL)  hit → return
              └─ cache miss → fetchSeoulCultureEvents() → score → cache write
        └─ feature flag: ENABLE_REALTIME_CITY_DATA=true
              └─ fetchSeoulCongestion(district) → congestion score
        └─ scorePlaces() → sort → top 10 → JSON response
```

## Scoring Formula

```
score = access(0-30) + relevance(0-25) + cost(0-15) + congestion(0-15) + timefit(0-10) + freshness(0-5)
```

## Feature Flags (env)

| Flag | Default | Effect |
|---|---|---|
| `USE_MOCK_DATA` | `true` | Use MOCK_PLACES, skip API calls |
| `ENABLE_CULTURE_EVENTS_API` | `false` | Call Seoul culturalEventInfo API |
| `ENABLE_REALTIME_CITY_DATA` | `false` | Call Seoul citydata_ppltn API |

## Security Rules

- All API keys injected via `.env.local` / Vercel env vars only — never hardcoded
- External API calls exclusively in server-side Route Handlers
- `NEXT_PUBLIC_` prefix only for values safe to expose to browser
- Rate limiting on all `/api/*` routes via `middleware.ts`

## Known Constraints

- Rate limiter is in-memory per edge instance — not shared across Vercel instances
- DB cache activates only when `ENABLE_CULTURE_EVENTS_API=true`
- Leaflet map uses OpenStreetMap tiles — no API key required
- Neon Free tier: 0.5 GB storage limit
