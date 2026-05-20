# ARCHITECTURE

Last updated: 2026-05-20 (Phase 15 complete)

## Stack

- Next.js 16 App Router
- React 19 + TypeScript strict
- Tailwind CSS v4 + shadcn/ui
- Prisma 5 + Neon PostgreSQL (ap-southeast-1)
- Leaflet + OpenStreetMap + react-leaflet + react-leaflet-cluster
- next-intl v4 (i18n)
- web-push (VAPID Web Push)
- Vitest + React Testing Library + Playwright

## File Structure

```
app/
  api/
    places/route.ts                  # GET — scoring + recommendation
    places/[id]/feedback/route.ts    # GET|POST — place rating aggregate
    push/subscribe/route.ts          # POST|DELETE — Web Push subscription
    push/send/route.ts               # GET|POST — broadcast push (Vercel Cron)
    realtime/[areaCode]/route.ts     # GET — real-time congestion (external)
  place/[id]/
    page.tsx                         # place detail (server component)
    opengraph-image.tsx              # OG image generation
  bookmarks/page.tsx
  offline/page.tsx
  layout.tsx                         # NextIntlClientProvider + html lang
  page.tsx                           # main recommendation list + map view
  robots.ts
  sitemap.ts

components/seoul30/
  BottomTabBar.tsx
  BookmarkButton.tsx
  DesktopNav.tsx
  DistrictSelector.tsx
  EmptyState.tsx
  FeedbackPanel.tsx                  # 👍/👎 rating UI (Phase 13)
  FilterBar.tsx
  Header.tsx
  Hero.tsx
  LanguageToggle.tsx                 # ko/en toggle (Phase 15)
  MapView.tsx                        # dynamic import wrapper (ssr: false)
  MapViewInner.tsx                   # Leaflet map + clustering
  PlaceCard.tsx
  PushSubscribeButton.tsx            # Web Push subscribe/unsubscribe (Phase 14)
  RecentTracker.tsx
  ShareButton.tsx

hooks/
  use-feedback.ts                    # optimistic rating state (Phase 13)
  use-push.ts                        # push permission + subscribe flow (Phase 14)

i18n/
  request.ts                         # next-intl getRequestConfig (cookie-based)

messages/
  ko.json                            # Korean strings (default)
  en.json                            # English strings

lib/
  scoring.ts                         # scorePlace — 6 dimensions, KST-aware timefit
  prisma.ts                          # singleton Prisma client
  types/place.ts
  types/recommendation.ts
  mock/places.ts
  mock/realtime.ts
  adapters/
  cache/recommendation.cache.ts
  config/env.ts
  config/feature-flags.ts

prisma/
  schema.prisma

public/
  sw.js                              # service worker (offline + push events)
  manifest.json
  offline/index.html

tests/
  unit/scoring.test.ts
  components/PlaceCard.test.tsx
  components/FilterBar.test.tsx
  components/BookmarkButton.test.tsx
  e2e/home.spec.ts
  setup.tsx

middleware.ts                        # rate limiting (/api/* only)
vercel.json                          # Vercel Cron (daily 09:00 KST → /api/push/send)
next.config.mjs                      # createNextIntlPlugin + headers
vitest.config.ts
playwright.config.ts
.github/workflows/ci.yml
```

## Database Models (Prisma + Neon)

```prisma
Place                   # public facility data (seed-only, no admin)
ExternalCache           # external API response cache (normalizedJson only)
RecommendationSnapshot  # recommendation result cache with TTL
PlaceFeedback           # anonymous UP/DOWN rating (unique: placeId+sessionId)
WebPushSubscription     # Web Push endpoint storage (unique: endpoint)
```

## Data and API Flow

```
Client
  └─ GET /api/places?district=&category=&isFreeOnly=&maxTravelMinutes=
       └─ check RecommendationSnapshot (TTL 1h)
       └─ USE_MOCK_DATA=true  → MOCK_PLACES
          USE_MOCK_DATA=false → Seoul Open API adapters → normalize
       └─ scorePlace() → sort → return top results

Client-side UI filters (no server round-trip):
  search (name/address substring)
  openNow (local time check)
  viewMode list | map
```

## i18n Architecture (Phase 15)

- Library: next-intl v4, **without URL-based routing** (no `app/[locale]/`)
- Locale stored in `NEXT_LOCALE` cookie (1-year expiry)
- `i18n/request.ts` reads cookie on every server render, falls back to `ko`
- `NextIntlClientProvider` wraps the entire app in `app/layout.tsx`
- Client components: `useTranslations(namespace)`
- Server components: `getTranslations(namespace)` (async)
- `LanguageToggle` sets cookie and calls `window.location.reload()`

## Web Push Architecture (Phase 14)

- VAPID keys set via env vars (`VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_EMAIL`)
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY` exposed to browser for `PushManager.subscribe`
- Subscriptions stored in `WebPushSubscription` (endpoint-unique upsert)
- `/api/push/send` (GET) triggered daily by Vercel Cron at 09:00 KST
- Expired subscriptions (410/404) auto-deleted on send failure
- `CRON_SECRET` env var guards the send endpoint

## Scoring Model

| Dimension | Max | Source |
|---|---|---|
| access | 30 | district match |
| relevance | 25 | category match |
| cost | 15 | isFree / feeText |
| congestion | 15 | real-time or neutral (8) |
| timefit | 10 | KST open hours check |
| freshness | 5 | eventStartDate within 7 days |
| **total** | **100** | sum |

`calcTimefit` uses `getUTCHours() + 9h` (fixed KST offset) — timezone-agnostic across all server environments.

## Env Vars

| Variable | Scope | Purpose |
|---|---|---|
| `DATABASE_URL` | server | Prisma / Neon |
| `SEOUL_OPEN_API_KEY` | server | public data API |
| `NEXT_PUBLIC_BASE_URL` | both | canonical URL for OG / sitemap |
| `USE_MOCK_DATA` | server | bypass real API |
| `ENABLE_CULTURE_EVENTS_API` | server | feature flag |
| `ENABLE_REALTIME_CITY_DATA` | server | feature flag |
| `VAPID_EMAIL` | server | web-push identity |
| `VAPID_PUBLIC_KEY` | server | VAPID signing |
| `VAPID_PRIVATE_KEY` | server | VAPID signing |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | browser | PushManager.subscribe |
| `CRON_SECRET` | server | guard /api/push/send |

## CI Pipeline

```
install → prisma generate → tsc --noEmit → vitest → playwright → next build
```

## Known Runtime Notes

- Next.js warns `middleware.ts` naming is deprecated (migration to `proxy` deferred).
- Playwright process exit can hang on Windows after all tests pass.
- Prisma generate requires dev server to be stopped on Windows (DLL file lock).
