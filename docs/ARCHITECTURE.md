# ARCHITECTURE

Last updated: 2026-05-21 (Phase 34 + PlaceMiniMap navigation fix)

## Documentation Layout

- Root `README.md` is the project entry point.
- Operational docs live in `docs/`: `TASKS.md`, `PROJECT_SCOPE.md`, `HANDOFF.md`, `RUNBOOK.md`, `NAVER_MAPS_IMPLEMENTATION.md`, `MOCK_PLACE_AUDIT.md`.

## Latest Architecture Note

`components/seoul30/PlaceMiniMap.tsx` handles Naver Maps SDK reuse during client navigation. This prevents detail pages opened from the nearby-place list from rendering an empty mini map when the SDK script is already loaded.

Last updated: 2026-05-21 (Phase 32 + Pin Accuracy Fix — Codex handoff)

## Stack

- Next.js 16 App Router
- React 19 + TypeScript strict
- Tailwind CSS v4 + shadcn/ui
- Prisma 5 + Neon PostgreSQL (ap-southeast-1)
- Naver Maps JavaScript API v3
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
  Hero.tsx                           # suppressHydrationWarning on greeting (hydration fix)
  LanguageToggle.tsx                 # ko/en toggle (Phase 15)
  LocationOnboardingModal.tsx        # GPS permission onboarding (first visit)
  MapView.tsx                        # dynamic import wrapper (ssr: false)
  MapViewInner.tsx                   # Naver Maps view + grid clustering + onSelectPlace
  PlaceCard.tsx                      # data-testid="place-card-link" on Link
  PlaceMiniMap.tsx                   # 단일 마커 Naver Maps 미니맵 (zoom 15)
  PlaceCardSkeleton.tsx              # shimmer skeleton (Phase 18)
  PushSubscribeButton.tsx            # Web Push subscribe/unsubscribe (Phase 14)
  RecentTracker.tsx
  ScoreBadge.tsx                     # score breakdown badge (Phase 16)
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
  scoring.ts                         # scorePlace — 6 dimensions, KST-aware timefit + transit access
  data/ddareungi.ts                  # Seoul bikeList fetcher with 10-minute cache
  data/tourImages.ts                 # TourAPI 4.0 image enrichment (searchKeyword2 + detailImage2)
  data/place-detail.ts               # real API detail lookup with mock fallback
  data/seoulLibrary.ts               # SeoulPublicLibraryInfo fetcher (Phase 27)
  data/seoulParks.ts                 # ListParkService fetcher (Phase 27)
  data/seoulSports.ts                # ListPublicReservationSport fetcher (Phase 27)
  utils/transit-time.ts              # Haversine + transit estimate helpers
  utils/coords.ts                    # toSeoulLatLng() — Seoul bounds validation utility
  utils/place-distance.ts            # nearby places, coordinate-only Haversine ranking
  prisma.ts                          # singleton Prisma client
  types/place.ts                     # NormalizedPlace, PlaceSourceType, PlaceTag
  types/recommendation.ts
  mock/places.ts                     # 38 mock places (Phase 31+), tags + nearestStation
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

proxy.ts                             # rate limiting (/api/* only)
vercel.json                          # Vercel Cron (daily 09:00 KST → /api/push/send)
next.config.mjs                      # createNextIntlPlugin + headers
vitest.config.ts
playwright.config.ts
.github/workflows/ci.yml
```

## Key Types (lib/types/place.ts)

```typescript
export type PlaceSourceType = 'CULTURE_EVENT' | 'CULTURE_SPACE' | 'LIBRARY' | 'PARK' | 'SPORTS' | 'MOCK'
export type PlaceTag = 'indoor' | 'outdoor' | 'wheelchair' | 'family' | 'pet' | 'parking' | 'wifi'

export interface NormalizedPlace {
  id: string; slug: string; sourceType: PlaceSourceType
  name: string; category: string; district: string
  address?: string; latitude?: number; longitude?: number
  isFree: boolean; feeText?: string
  openTimeText?: string; closeTimeText?: string   // "HH:MM"
  homepageUrl?: string; phone?: string; description?: string; imageUrl?: string
  tags?: PlaceTag[]          // Phase 32 — 태그 칩
  nearestStation?: string    // Phase 32 — 가장 가까운 역
  eventStartDate?: string    // "YYYY-MM-DD" — freshness scoring (CULTURE_EVENT only)
}
```

## Coordinate Handling (lib/utils/coords.ts)

Seoul 경계 검증 + 0값 거부 유틸리티:
- `toSeoulLatLng(rawLat, rawLng)` → `{ latitude?, longitude? }`
- Seoul 경계: lat 37.413–37.715, lng 126.734–127.270
- NaN, 0, 경계 밖 좌표는 `{}` 반환 → map 핀 미표시 처리
- seoulLibrary/Parks/Sports 3개 fetcher 모두 이 유틸리티 사용
- seoul-culture.adapter also validates culture event/space coordinates through this utility
- Seoul `culturalSpaceInfo`: observed `X_COORD=latitude`, `Y_COORD=longitude`; do not assume conventional X=longitude for that service
- Naver Maps API 좌표 순서: `new naver.maps.LatLng(lat, lng)` (위도 먼저)
- Seoul Sports API: X=경도(longitude), Y=위도(latitude)

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

Optional location-aware access flow:
  app/page.tsx geolocation → GET /api/places?lat=&lng=
       └─ route handler conditionally fetches Ddareungi stations server-side
       └─ haversineKm(user, place) → estimateTransit()
       └─ transitAccessScore(minutes) → ScoreBreakdown transitMinutes/transitMode

Coordinate-based requests bypass RecommendationSnapshot because access minutes are user-specific.

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
| access | 30 | district match fallback, or transit minutes when user/place coordinates exist |
| relevance | 25 | category match |
| cost | 15 | isFree / feeText |
| congestion | 15 | real-time or neutral (8) |
| timefit | 10 | KST open hours check |
| freshness | 5 | eventStartDate within 7 days |
| **total** | **100** | sum |

`calcTimefit` uses `getUTCHours() + 9h` (fixed KST offset) — timezone-agnostic across all server environments.

Transit access estimate:
- walk: 4 km/h, 0 min overhead
- Ddareungi: 13 km/h, 3 min overhead, only when nearby stations exist at user and destination
- bus: 18 km/h, 5 min overhead
- subway: 35 km/h, 7 min overhead
- access buckets: <=10 min 30, <=20 min 25, <=30 min 18, <=40 min 10, <=50 min 4, else 0

## Env Vars

| Variable | Scope | Purpose |
|---|---|---|
| `DATABASE_URL` | server | Prisma / Neon |
| `SEOUL_OPEN_API_KEY` | server | public data API |
| `TOUR_API_KEY` | server | Korea Tourism Organization TourAPI 4.0 image lookup |
| `NEXT_PUBLIC_BASE_URL` | both | canonical URL for OG / sitemap |
| `USE_MOCK_DATA` | server | bypass real API |
| `ENABLE_CULTURE_EVENTS_API` | server | feature flag |
| `ENABLE_REALTIME_CITY_DATA` | server | feature flag |
| `VAPID_EMAIL` | server | web-push identity |
| `VAPID_PUBLIC_KEY` | server | VAPID signing |
| `VAPID_PRIVATE_KEY` | server | VAPID signing |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | browser | PushManager.subscribe |
| `CRON_SECRET` | server | guard /api/push/send |
| `NEXT_PUBLIC_NAVER_MAP_CLIENT_ID` | browser | Naver Maps public key id (`ncpKeyId`) |

## CI Pipeline

```
install → prisma generate → tsc --noEmit → vitest → playwright → next build
```

## Known Runtime Notes

- `proxy.ts` (formerly `middleware.ts`) — rate limiting, Next.js 16 proxy convention 적용 완료.
- Playwright process exit can hang on Windows after all tests pass.
- Prisma generate requires dev server to be stopped on Windows (DLL file lock).
