# ARCHITECTURE

## Phase 59 Architecture Note (2026-05-27)

**접근성(a11y) 구조 정정 — 중첩 `<main>` 제거 · ARIA 완성도 강화**

### 중첩 `<main>` 버그 수정 (critical HTML error)
`app/layout.tsx`가 `<main id="main-content">` 로 자식을 감싸고, `app/page.tsx` 내부에도 `<main id="main-content">` 가 존재해 중첩 `<main>` + 중복 `id` 문제가 있었다. `layout.tsx` 의 `<main>` 을 `<div>` 로 교체하여 각 페이지가 자체 `<main>` 랜드마크를 선언하도록 역할을 분리했다.

Skip link (`href="#main-content"`) 가 동작하려면 모든 페이지에 앵커가 있어야 한다. `about`, `privacy`, `offline`, `place/[id]`, `bookmarks` 5개 페이지의 최외곽 `<div>` 를 `<main id="main-content">` 로 변환했다.

### ARIA 완성도
- **토글 버튼**: 정렬 그룹(추천순/가까운순)과 뷰 모드 그룹(목록/지도) 모두에 `aria-pressed` + `role="group"` + `aria-label` 추가.
- **PushSubscribeButton**: 카테고리 칩에 `aria-pressed={selected.has(cat)}`, 패널에 `role="dialog"` + `aria-modal` + `aria-label`, ESC 키로 패널 닫기(`keydown` 리스너, cleanup 포함).
- **bookmarks tablist/tabpanel**: `role="tablist"` 에 `aria-label`, 각 `role="tab"` 에 `id` + `aria-controls`, 탭 패널에 `role="tabpanel"` + `aria-labelledby` + `id="tabpanel-places"` 완성.

`aria-pressed` (toggle) vs `aria-selected` (tab) — WAI-ARIA 역할별로 구분해서 적용.

Regression coverage: `tests/unit/a11y-structure.test.ts` (18 assertions — nested main 방지, skip anchors, aria-pressed, tablist/tabpanel 완성도, i18n 키 존재).

---

## Phase 58 Architecture Note (2026-05-27)

**운영 대시보드 강화 — Push 구독 분포 · 장소 참여도 Top 5 · 스냅샷 신선도**

### 신규 데이터 집계 (DB 쿼리 패턴)

**Push 카테고리 분포 집계:**
- `WebPushSubscription.findMany({ select: { tags: true } })` → JS에서 집계
- 빈 `tags` = 전체 카테고리 구독으로 처리 → 해당 구독을 5개 카테고리 각각에 +1 가산
- `allCategoriesCount` / `perCategory` 로 구조화

**장소 참여도 Top 5 (2-query groupBy 패턴):**
```
1. groupBy(placeId, _count: id, take: 10) → top placeId 목록
2. groupBy([placeId, vote], where: { placeId: in top }) → UP/DOWN 분리
```
raw SQL 없이 Prisma만으로 투표 분리를 달성. `upPct = Math.round(up/total * 100)`.

**스냅샷 신선도:**
- `count({ where: { createdAt: { gte: Date.now() - 24h } } })` — 24시간 내 생성 수
- 마지막 스냅샷 경과 시간: `< 1h` 녹색, `< 24h` 보통, `≥ 24h` 주황 stale

`/api/diagnostics` 에 `snapshotsLast24h`, `pushCategoryStats`, `topPlaces` 필드 추가.  
`/admin` 페이지에 3개 섹션 추가 (스냅샷 신선도 · Push 구독 현황 · 장소 참여도 Top 5).

---

## Phase 57 Architecture Note (2026-05-27)

**데이터 품질/정합성 강화 — 품질 메트릭 유틸리티 + 의심 좌표 탐지**

### `lib/utils/data-quality.ts` (신규)

```typescript
export function calcDataQuality(places: NormalizedPlace[]): PlaceDataQuality
```

`PlaceDataQuality`: 좌표·이미지·주소·전화·홈페이지·운영시간·태그 각 필드에 대해 `{ count, total, pct }` (`FieldCoverage`) + `suspiciousCoords: number` + `bySource: Record<string, SourceSummary>`.

`pct` 는 `Math.round(count/total * 1000) / 10` (소수점 1자리 반올림).

### `isSuspiciousCoord(lat, lng)` in `lib/utils/coords.ts`

소수점 3자리 미만 좌표는 ~100m+ 오차 가능 → 의심 좌표로 분류.  
`toSeoulLatLng()` 는 수정하지 않음 — 기존 유효성 검사 로직 불변.

```typescript
// 소수점 자릿수 카운트
const decimalPlaces = (n: number) => {
  const dot = n.toString().indexOf('.')
  return dot === -1 ? 0 : n.toString().length - dot - 1
}
return decimalPlaces(lat) < 3 || decimalPlaces(lng) < 3
```

### Admin / Diagnostics 강화

`/api/diagnostics` 에 `dataQuality` 필드 추가:
- 최근 스냅샷의 `resultJson` 이 있으면 실 API 장소 기반 (`source: 'snapshot'`)
- 없으면 `MOCK_PLACES` 기반 (`source: 'mock'`)

`/admin` 페이지에 데이터 품질 섹션 추가:
- `PctBar` 컴포넌트 — 색상 코딩 (red < 50%, amber < 70% warn, green)
- sourceType별 좌표/이미지 보유율 테이블

MOCK_PLACES 품질 게이트 (자동화): 좌표 ≥ 80%, 주소 ≥ 90%, 태그 ≥ 70%, 의심좌표 < 20%.

---

## Phase 56 Architecture Note (2026-05-27)

**Push 개인화 UX 완성 — 구독 태그 조회·편집 + notificationclick URL 네비게이션**

### PushSubscribeButton 재작성

구독 상태별 4-state UI:
- `loading` / `unsupported` → `null`
- `denied` → 비활성 표시 버튼
- `unsubscribed` → 구독 버튼 → 카테고리 선택 패널 (ChevronDown 토글)
- `subscribed` → `"알림 구독 중 · 문화, 도서관"` 형태로 현재 태그 요약 표시 → 클릭 시 편집 패널

### `hooks/use-push.ts` 강화

```typescript
const PUSH_TAGS_KEY = 'seoul30:push:tags'

// 신규
currentTags: string[]          // localStorage 복원 (빈 배열 = 전체)
updateTags(tags: string[])     // PushManager 재구독 없이 서버 태그만 갱신
```

`subscribe` 시 localStorage에 tags 저장, `unsubscribe` 시 삭제.  
`updateTags` 는 기존 endpoint를 재사용해 `/api/push/subscribe` POST upsert 재호출 — 브라우저 알림 권한 팝업 없이 태그만 갱신.

### notificationclick URL 네비게이션 수정

```javascript
// 이전 (버그): URL로 이동하지 않고 focus만
existing.focus()

// 이후 (수정): 카테고리 딥링크 URL로 실제 이동
existing.navigate(url).then((client) => client?.focus())
```

`WindowClient.navigate(url)` 이 필요한 이유: 기존 창이 열려 있을 때 `focus()` 만으로는 창을 앞으로 가져오지만 URL이 변경되지 않는다. 알림 딥링크(`/?category=xxx`)가 실제로 로드되어야 카테고리 필터가 적용된다.

SW 캐시 버전 `v5` 범프 (v4 → v5).

---

## Phase 55 Architecture Note (2026-05-27)

Next.js image optimization is fully enabled. `unoptimized: true` is removed and replaced with a `remotePatterns` allowlist in `next.config.mjs`, covering Unsplash, Seoul culture API, Seoul subdomains (`*.seoul.go.kr`), TourAPI (`*.visitkorea.or.kr`), and Naver pstatic CDN (`*.pstatic.net`). Images served via `<Image>` are now converted to WebP/AVIF and cached through Vercel's image CDN.

Both `Noto_Sans_KR` and `Inter` now specify `display: 'swap'`, eliminating FOIT during font load and reducing CLS. `preconnect` hints are added for `culture.seoul.go.kr` and `images.unsplash.com`; `dns-prefetch` hints cover `openapi.map.naver.com` and `tong.visitkorea.or.kr`.

Regression coverage for `remotePatterns` is in `tests/unit/image-config.test.ts` (6 assertions).

## Phase 54 Architecture Note (2026-05-27)

Web Push now supports category-based tag personalization. The Prisma `WebPushSubscription` model has a `tags String[] @default([])` field applied via `npx prisma db push` (no migration files).

- **Subscribe** (`/api/push/subscribe`): accepts `tags` in the POST body; unknown categories are silently stripped.
- **Send** (`/api/push/send?category=xxx`): filters subscriptions where `tags` is empty (= all categories) OR `tags` contains the requested category.
- **`PushSubscribeButton`**: shows a category chip panel before subscribing (all 5 selected by default); subscribing with all selected sends `[]` (empty = all).
- Category payload drives the push notification title and deep-link URL (`/?category=xxx`).
- `new URL(req.url).searchParams` (not `req.nextUrl`) is used in Route Handlers for compatibility with plain `Request` objects in tests.

## Phase 53 Architecture Note (2026-05-27)

Portfolio polish: README fully rewritten with screenshot table, feature table, architecture notes, tech stack, and current test counts. About page data sources corrected (OpenStreetMap → Naver Maps JavaScript API v3, TourAPI 4.0 added). `layout.tsx` `authors` metadata links to GitHub profile.

## Phase 52 Architecture Note (2026-05-26)

The web app manifest now includes concrete installability metadata beyond the baseline fields: `id`, `display_override`, 192/512 PNG icons, and screenshots for both narrow and wide form factors. Screenshots are real captures of the home experience served from port `3001`. The service worker cache version is `v3` so clients refresh PWA shell/API/image caches after the manifest and screenshot asset changes.

## Phase 51 Architecture Note (2026-05-26)

CI and Lighthouse now use port `3001` consistently across Playwright, build-time base URL, and LHCI. Lighthouse collection is intentionally limited to categories that are stable in current Lighthouse releases: `performance`, `accessibility`, `best-practices`, and `seo`. PWA installability is covered by manifest/icon/service-worker tests instead of a Lighthouse `pwa` category assertion, which can be absent in newer Lighthouse versions.

## Additional Phase Note - PWA Icon and CSP Hardening (2026-05-26)

PWA installability now has concrete PNG icon assets in addition to the SVG maskable icon. The manifest includes `192x192` and `512x512` PNG entries under `/icons/`, and shortcut icons point to an existing PNG file. Push notification `icon`/`badge` paths in `public/sw.js` resolve to the same 192 PNG.

The CSP now allows both `oapi.map.naver.com` and `openapi.map.naver.com`, matching the current script URL and existing DNS prefetch hint.

## Phase 50 Architecture Note (2026-05-26)

Security headers are defined centrally in `next.config.mjs` and apply to `/:path*`. The CSP intentionally allows the Naver Maps SDK/assets and Vercel Analytics while blocking frame embedding and object execution.

Map rendering now fails closed into a usable fallback: missing `NEXT_PUBLIC_NAVER_MAP_CLIENT_ID`, Naver script load failure, or `MapViewInner` render errors all leave the list experience intact.

Lighthouse CI audits `http://localhost:3001/` only, using `npx next start -p 3001`.

## Phase 49 Architecture Note (2026-05-26)

PWA install UX is browser-event driven. `hooks/use-pwa-install.ts` listens for `beforeinstallprompt`, stores the deferred prompt, wraps `prompt()`, and hides the CTA after install, standalone launch, or a `localStorage` "later" decision. `components/seoul30/PwaInstallBanner.tsx` is mounted near the top of `app/page.tsx`.

Offline recommendation UX is service-worker driven. `public/sw.js` uses a network-first strategy for `/api/places`; when the network fails and a cached API response exists, it returns JSON with `isStale: true`, `isOfflineCache: true`, and a `snapshotAt` value. `app/page.tsx` renders this as an explicit cached-place notice.

Last updated: 2026-05-21 (Phase 34 + PlaceMiniMap navigation fix)

## Documentation Layout

- Root `README.md` is the project entry point.
- Operational docs live in `docs/`: `TASKS.md`, `PROJECT_SCOPE.md`, `HANDOFF.md`, `RUNBOOK.md`, `NAVER_MAPS_IMPLEMENTATION.md`, `MOCK_PLACE_AUDIT.md`.

## Latest Architecture Note

`components/seoul30/PlaceMiniMap.tsx` handles Naver Maps SDK reuse during client navigation. This prevents detail pages opened from the nearby-place list from rendering an empty mini map when the SDK script is already loaded.

Last updated: 2026-05-21 (Phase 32 + Pin Accuracy Fix — Codex handoff)

## Stack

- Next.js 15 App Router
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
    diagnostics/route.ts             # GET — 운영 상태 요약 (DB 카운트, 품질, Push 분포, Top 5)
  place/[id]/
    page.tsx                         # place detail (server component) — <main id="main-content">
    opengraph-image.tsx              # OG image generation
  admin/page.tsx                     # 운영 대시보드 (secret 인증) — Phase 47+
  bookmarks/page.tsx                 # tablist/tabpanel ARIA 완성 — <main id="main-content">
  about/page.tsx                     # <main id="main-content">
  privacy/page.tsx                   # <main id="main-content">
  offline/page.tsx                   # <main id="main-content">
  layout.tsx                         # NextIntlClientProvider + skip link + <div> 래퍼 (main 중첩 방지)
  page.tsx                           # main recommendation list + map view — <main id="main-content">
  robots.ts
  sitemap.ts

components/seoul30/
  BottomTabBar.tsx                   # aria-current="page" 포함
  BookmarkButton.tsx
  DesktopNav.tsx                     # aria-current="page" 포함
  DistrictSelector.tsx
  EmptyState.tsx
  FeedbackPanel.tsx                  # 👍/👎 rating UI (Phase 13)
  FilterBar.tsx                      # aria-pressed on all filter/tag buttons
  Header.tsx
  Hero.tsx                           # suppressHydrationWarning on greeting (hydration fix)
  LanguageToggle.tsx                 # ko/en toggle (Phase 15)
  LocationOnboardingModal.tsx        # GPS permission onboarding (shadcn Dialog — focus trap 내장)
  MapView.tsx                        # dynamic import wrapper (ssr: false)
  MapViewInner.tsx                   # Naver Maps view + grid clustering + onSelectPlace
  PlaceCard.tsx                      # data-testid="place-card-link" on Link; aria-label on Link
  PlaceImage.tsx                     # <Image> wrapper with remotePatterns + fallback
  PlaceMiniMap.tsx                   # 단일 마커 Naver Maps 미니맵 (zoom 15)
  PlaceCardSkeleton.tsx              # shimmer skeleton
  PushSubscribeButton.tsx            # 4-state UI; subscribed 상태에서 태그 요약 + 편집 패널;
                                     # aria-pressed chips, ESC 닫기, role="dialog" 패널
  RecentTracker.tsx
  ScoreBadge.tsx                     # score breakdown badge
  ShareButton.tsx

hooks/
  use-feedback.ts                    # optimistic rating state
  use-push.ts                        # push permission + subscribe flow;
                                     # currentTags(localStorage), updateTags(no re-subscribe)
  use-bookmark.ts
  use-recent.ts
  use-pwa-install.ts

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
  data/seoulLibrary.ts               # SeoulPublicLibraryInfo fetcher
  data/seoulParks.ts                 # ListParkService fetcher
  data/seoulSports.ts                # ListPublicReservationSport fetcher
  utils/transit-time.ts              # Haversine + transit estimate helpers
  utils/coords.ts                    # toSeoulLatLng() — Seoul bounds validation;
                                     # isSuspiciousCoord() — decimal precision < 3 = suspect
  utils/data-quality.ts              # calcDataQuality() — field coverage metrics + bySource + suspicious
  utils/place-distance.ts            # nearby places, coordinate-only Haversine ranking
  utils/admin-auth.ts                # isAdminAuthorized() — ADMIN_SECRET 비교
  prisma.ts                          # singleton Prisma client
  types/place.ts                     # NormalizedPlace, PlaceSourceType, PlaceTag
  types/recommendation.ts
  mock/places.ts                     # 38 mock places, tags + nearestStation
  mock/realtime.ts
  adapters/
  cache/recommendation.cache.ts
  config/env.ts
  config/feature-flags.ts

prisma/
  schema.prisma

public/
  sw.js                              # service worker — 4-tier cache (static/api/pages/images);
                                     # image cache: pathname.startsWith('/_next/image');
                                     # notificationclick: existing.navigate(url).then(focus);
                                     # CACHE_VERSION = 'v5'
  manifest.json
  offline/index.html

tests/
  unit/
    scoring.test.ts
    transit-time.test.ts
    coords.test.ts                    # toSeoulLatLng bounds (20 cases) + isSuspiciousCoord (4)
    tag-filter.test.ts
    feedback-scoring.test.ts
    place-enrichment.test.ts
    place-distance.test.ts
    relative-time.test.ts
    env.test.ts
    tourImages.test.ts
    mock-places.test.ts
    seoulCongestion.test.ts
    diagnostics.test.ts               # pushCategoryStats, topPlaces, snapshotsLast24h, dataQuality
    json-ld.test.ts                   # schema.org JSON-LD
    admin-auth.test.ts
    push-send.test.ts                 # push broadcast + category filter
    manifest.test.ts
    service-worker-cache.test.ts      # v5, /_next/image pathname, notificationclick navigate
    security-headers.test.ts
    lighthouse-ci.test.ts
    image-config.test.ts              # remotePatterns regression
    data-quality.test.ts              # calcDataQuality (7) + isSuspiciousCoord (6) + MOCK 품질 게이트 (5)
    a11y-structure.test.ts            # 중첩 main 방지, skip anchors, aria-pressed, tablist/tabpanel (18)
  components/
    PlaceCard.test.tsx
    FilterBar.test.tsx
    BookmarkButton.test.tsx
  e2e/
    home.spec.ts
    filter.spec.ts
    place-detail.spec.ts
    admin.spec.ts
    i18n.spec.ts
  setup.tsx
  __mocks__/next-intl-server.ts

# Total: 203 unit tests, 14 E2E specs

proxy.ts                             # rate limiting (/api/* only)
vercel.json                          # Vercel Cron (daily 09:00 KST → /api/push/send)
next.config.mjs                      # createNextIntlPlugin + headers + remotePatterns
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
  tags?: PlaceTag[]          // 태그 칩
  nearestStation?: string    // 가장 가까운 역
  eventStartDate?: string    // "YYYY-MM-DD" — freshness scoring (CULTURE_EVENT only)
}
```

## Coordinate Handling (lib/utils/coords.ts)

Seoul 경계 검증 + 0값 거부 유틸리티:
- `toSeoulLatLng(rawLat, rawLng)` → `{ latitude?, longitude? }`
- Seoul 경계: lat 37.413–37.715, lng 126.734–127.270
- NaN, 0, 경계 밖 좌표는 `{}` 반환 → map 핀 미표시 처리
- seoulLibrary/Parks/Sports 3개 fetcher 모두 이 유틸리티 사용
- `isSuspiciousCoord(lat, lng)` → boolean — 소수점 3자리 미만 좌표 = 정밀도 낮음 (~100m+ 오차)
- Seoul `culturalSpaceInfo`: observed `X_COORD=latitude`, `Y_COORD=longitude`; do not assume conventional X=longitude for that service
- Naver Maps API 좌표 순서: `new naver.maps.LatLng(lat, lng)` (위도 먼저)
- Seoul Sports API: X=경도(longitude), Y=위도(latitude)

## Database Models (Prisma + Neon)

```prisma
Place                   # public facility data (seed-only, no admin)
ExternalCache           # external API response cache (normalizedJson only)
RecommendationSnapshot  # recommendation result cache with TTL
PlaceFeedback           # anonymous UP/DOWN rating (unique: placeId+sessionId)
WebPushSubscription     # Web Push endpoint storage; tags String[] @default([]) for category personalization
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

## Web Push Architecture (Phase 14 + 54 + 56)

- VAPID keys set via env vars (`VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_EMAIL`)
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY` exposed to browser for `PushManager.subscribe`
- Subscriptions stored in `WebPushSubscription` (endpoint-unique upsert) with `tags String[] @default([])`
- **Category filtering** (Phase 54): `?category=xxx` on send endpoint targets subscriptions where `tags` is empty OR `tags` contains `xxx`; empty `tags` = subscribed to all categories
- **Tag personalization UX** (Phase 56): `currentTags` from `localStorage('seoul30:push:tags')`; `updateTags()` re-POSTs without permission dialog; subscribed state shows tag summary
- Valid categories: `culture`, `library`, `park`, `sports`, `welfare`
- `/api/push/send` (GET|POST) triggered daily by Vercel Cron at 09:00 KST
- Expired subscriptions (410/404) auto-deleted on send failure
- `CRON_SECRET` env var guards the send endpoint
- Route Handlers use `new URL(req.url).searchParams` (not `req.nextUrl`) for test compatibility

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

## Admin Dashboard (/admin?secret=…)

`app/admin/page.tsx` — DB 직접 조회 (no internal API call), force-dynamic.

| 섹션 | 내용 |
|---|---|
| 데이터베이스 | 마지막 스냅샷·스냅샷 수·피드백 수·평가된 장소·Push 구독자 |
| 스냅샷 신선도 | 24h 생성 수 + 경과 시간 색상 코딩 |
| Push 구독 현황 | 전체/카테고리별 구독 수 + PctBar |
| 장소 참여도 Top 5 | placeId · 총 피드백 · 👍 비율 (색상 코딩) |
| 피처 플래그 | 서울 API · 실시간 혼잡도 · Mock 모드 |
| 데이터 품질 | 필드 보유율 바 차트 + sourceType별 테이블 + 의심 좌표 경고 |
| 장소 데이터 | Mock 장소 수·태그 보유·무료 장소 |

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
| `ADMIN_SECRET` | server | /admin 페이지 인증 (쿼리 파라미터 `?secret=`) |

## CI Pipeline

```
install → prisma generate → tsc --noEmit → vitest → playwright → next build
```

## Known Runtime Notes

- `proxy.ts` (formerly `middleware.ts`) — rate limiting, Next.js 15 proxy convention 적용 완료.
- Playwright process exit can hang on Windows after all tests pass (CI 통과 확인됨).
- Prisma generate requires dev server to be stopped on Windows (DLL file lock on `query_engine-windows.dll.node`).
- `PlaceImage.tsx` uses Next.js `<Image>` with `remotePatterns` allowlist (no `unoptimized: true`); images converted to WebP/AVIF via Vercel CDN.
- `public/sw.js` image cache intercepts `url.pathname.startsWith('/_next/image')` — NOT `url.hostname`. Phase 55에서 `unoptimized: true` 제거 이후 모든 `<Image>` 요청이 `/_next/image?url=...` (동일 출처)로 프록시되므로 hostname 체크는 동작하지 않음. 캐시 버전 `v5` (Phase 56 — notificationclick navigate 수정 후 범프).
- i18n cookie `NEXT_LOCALE` must be set via `page.evaluate(() => document.cookie = ...)` in Playwright tests — `page.context().addCookies()` causes domain mismatch resulting in duplicate cookies.
- `app/layout.tsx` wraps children in `<div>` (not `<main>`) — each individual page declares its own `<main id="main-content">` to avoid nested landmark elements. Skip link `href="#main-content"` resolves on all pages.

Last updated: 2026-05-27 (Phase 59 — a11y 구조 수정, Phase 60 — 릴리즈 패키징)
