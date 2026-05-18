# Seoul 30

> A PWA that recommends public facilities and cultural venues reachable within 30 minutes — built for Seoul residents.

Seoul 30 is a decision-support tool, not a map replacement. It uses rule-based scoring on Seoul Open Data to surface the best nearby destination right now, considering district, category, operating hours, admission cost, and real-time congestion signals.

The full UI works out of the box with mock data — no API keys required to run locally.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Database | PostgreSQL via Neon Free + Prisma 5 |
| Deployment | Vercel Hobby |
| Public Data | Seoul Open Data Plaza API |

---

## Implementation Status

### ✅ Phase 1 — Project Setup
- Prisma 5 + Neon PostgreSQL (Singapore) schema applied
- `next.config.mjs` — manifest cache headers and API `no-store` headers configured
- `.env.example` — environment variable structure documented (no real values committed)

### ✅ Phase 2 — Core Logic (Mock-First)
- **Domain types** (`lib/types/`): `NormalizedPlace`, `RecommendationResult`, `RealtimeSignal`, `ApiResponse`
- **Seoul 25-district constants** (`lib/districts.ts`)
- **Mock data** (`lib/mock/`): 12 sample places, per-district congestion signals
- **Rule-based scoring** (`lib/scoring.ts`): pure function, max 100 pts
- **API Route Handlers**:
  - `GET /api/places?district=&category=&freeOnly=` — scored recommendation list
  - `GET /api/realtime/[areaCode]` — congestion level with mock fallback
- **Feature flags**: `USE_MOCK_DATA` / `ENABLE_REALTIME_CITY_DATA` / `ENABLE_CULTURE_EVENTS_API`
- **Prisma Client singleton** (`lib/prisma.ts`)
- **Server-only env module** (`lib/config/env.ts`, `lib/config/feature-flags.ts`)

### ✅ Phase 3 — UI Build-Out
- District selector (`DistrictSelector`) — all 25 Seoul districts
- Home page wired to `/api/places` with live loading state and filter reset
- Place detail page (`/place/[id]`) — address, hours, phone, homepage, Kakao Map deep-link CTA
- Bookmark and recent-view hooks backed by `localStorage` (max 100 / max 20)
- `BookmarkButton` component works inside `<Link>` without triggering navigation

### ✅ Phase 4 — PWA Foundation
- `public/manifest.json` — standalone display, Korean locale, `#1A6B5A` theme color
- `public/icons/icon.svg` — fixed-color branded SVG icon (no `prefers-color-scheme` dependency)
- `app/layout.tsx` — manifest link and `appleWebApp` metadata wired via Next.js Metadata API
- `app/offline/page.tsx` — offline fallback page

### ✅ Phase 7 — Search & Filter Enhancement
- `FilterBar.tsx` — place name search input added (client-side, matches name + address)
- `FilterBar.tsx` — "지금 운영 중" toggle added (filters to currently open places only)
- `ActiveFilters` type extended with `search: string` and `openNow: boolean`
- `app/page.tsx` — client-side filtering applied on API results (search + openNow are UI-layer only, no extra API call)
- `app/page.tsx` — URL query string sync via `window.history.replaceState` (shareable filter links: `?category=park&openNow=true&search=숲`)
- `app/page.tsx` — URL params restored on mount; filter reset clears URL

### ✅ Phase 6 — DB Caching Layer & Travel Mode Disclosure
- `lib/cache/recommendation.cache.ts` — `RecommendationSnapshot` read/write helpers with 1-hour TTL
- `app/api/places/route.ts` — cache-first pattern: DB snapshot checked before Seoul API is called; result written to cache on miss
- Mock data is never cached — DB cache activates only when `ENABLE_CULTURE_EVENTS_API=true`
- `Hero.tsx` — added "대중교통 기준 · 자치구 단위 추천" disclosure (Option A decision: fixed to public transit, district-level granularity)
- Cache write failures are non-fatal; service degrades gracefully to live API

### ✅ Phase 5 — Real API Integration
- `lib/adapters/seoul-culture.adapter.ts` — fetches and normalizes `culturalEventInfo` API (100 events, 1-hour Next.js cache)
- `lib/adapters/seoul-citydata.adapter.ts` — fetches `citydata_ppltn` congestion data with district → hotspot mapping for all 25 districts (5-minute cache)
- `lib/types/place.ts` — added `eventStartDate` field to `NormalizedPlace` for freshness scoring
- `lib/scoring.ts` — freshness scoring implemented: +5 pts for events opening within 7 days, +3 pts within 30 days
- Both route handlers updated: real API called when feature flags enabled, mock fallback on any error
- No UI changes required — feature flags (`ENABLE_CULTURE_EVENTS_API`, `ENABLE_REALTIME_CITY_DATA`) gate the switch

---

## Scoring Logic

Recommendations are ranked by a rule-based weighted sum — no external AI involved.

```
score = access(0–30) + relevance(0–25) + cost(0–15) + congestion(0–15) + timefit(0–10) + freshness(0–5)
```

| Dimension | Criteria |
|---|---|
| `access` | Place district matches selected district (30 pts); no filter selected (10 pts) |
| `relevance` | Category matches filter (25 pts); "all" selected (12 pts) |
| `cost` | Free admission (15 pts); paid (5 pts); 0 pts if `freeOnly` filter is active and place is paid |
| `congestion` | 여유 → 15, 보통 → 10, 약간붐빔 → 3, 붐빔 → 0, no signal → 8 (neutral) |
| `timefit` | Currently open (10 pts); no hours data (5 pts) |
| `freshness` | Event opening within 7 days → 5 pts; within 30 days → 3 pts; no date → 0 pts |

---

## Local Development

```bash
# 1. Clone
git clone https://github.com/evenif99/seoul-30.git
cd seoul-30

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env.local
# Fill in DATABASE_URL and SEOUL_OPEN_API_KEY
# Leave USE_MOCK_DATA=true to run without any API keys

# 4. Apply DB schema
npx prisma db push

# 5. Start dev server
npm run dev
# → http://localhost:3000
```

---

## Environment Variables

```bash
# .env.local

# Required — Neon PostgreSQL connection string
DATABASE_URL=

# Required for Phase 5 real API — not needed for mock mode
SEOUL_OPEN_API_KEY=        # data.seoul.go.kr → My Page → API Key Management

# Feature flags (defaults enable mock mode, no API keys needed)
USE_MOCK_DATA=true
ENABLE_REALTIME_CITY_DATA=false
ENABLE_CULTURE_EVENTS_API=false
```

> `SEOUL_OPEN_API_KEY` is used exclusively in server-side Route Handlers. It is never exposed to the browser.

---

## Project Structure

```
seoul-30-webapp/
├── app/
│   ├── page.tsx                         # Home — district selector + recommendation list
│   ├── place/[id]/page.tsx              # Place detail page
│   ├── offline/page.tsx                 # PWA offline fallback
│   └── api/
│       ├── places/route.ts              # Scored recommendation list endpoint
│       └── realtime/[areaCode]/route.ts # Congestion proxy endpoint
├── components/
│   ├── seoul30/                         # Domain UI components
│   └── ui/                              # shadcn/ui base components
├── hooks/                               # localStorage hooks (bookmarks, recent views)
├── lib/
│   ├── cache/                           # DB cache helpers
│   │   └── recommendation.cache.ts      # RecommendationSnapshot read/write (1h TTL)
│   ├── adapters/                        # Seoul Open API adapters (server-only)
│   │   ├── seoul-culture.adapter.ts     # culturalEventInfo → NormalizedPlace[]
│   │   └── seoul-citydata.adapter.ts   # citydata_ppltn → RealtimeSignal
│   ├── config/                          # env.ts, feature-flags.ts (server-only)
│   ├── types/                           # Domain type definitions
│   ├── mock/                            # Mock places and congestion data
│   ├── scoring.ts                       # Recommendation scoring pure function
│   ├── districts.ts                     # Seoul 25-district constants
│   └── prisma.ts                        # PrismaClient singleton
├── prisma/schema.prisma                 # DB schema
├── public/
│   ├── manifest.json                    # PWA manifest
│   └── icons/icon.svg                   # Branded fixed-color app icon
└── .env.example                         # Environment variable template
```

---

## Database Schema

```prisma
model Place                    // Static public facility data (seeded)
model ExternalCache            // Normalized external API response cache
model RecommendationSnapshot   // Scored result cache keyed by query parameters
```

---

## Security

- All API keys are injected via `.env.local` or deployment environment variables only — never hardcoded
- `.env` and `.env*.local` are git-ignored and never committed
- External API calls are made exclusively in server-side Route Handlers
- Raw external API responses are not persisted — only normalized summary fields are cached
- `NEXT_PUBLIC_` prefix is reserved for values safe to expose to the browser

---

## Operating Cost Target

Vercel Hobby (free) + Neon Free tier (0.5 GB) = **$0/month**

Seoul 30 is both a portfolio project and a publicly accessible service for Seoul residents.

---

## License

MIT
