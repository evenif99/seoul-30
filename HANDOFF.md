# HANDOFF

Last updated: 2026-05-20 (Phase 17 complete)

## Current State

Phase 17 (stale cache fallback + hardening) is complete. The app gracefully degrades when the Seoul Open API is unavailable by returning the most recent cached snapshot with an amber banner. All HIGH-severity error risks from the audit have been resolved.

## What Was Done (Phase 13–17)

### Phase 13 — Anonymous Place Rating
- `PlaceFeedback` model added to `prisma/schema.prisma` (unique: placeId + sessionId)
- `GET /api/places/[id]/feedback` — returns `{ up, down }` aggregate counts
- `POST /api/places/[id]/feedback` — upsert with toggle support (same vote = cancel)
- `hooks/use-feedback.ts` — optimistic UI, localStorage vote cache, rollback on error
- `components/seoul30/FeedbackPanel.tsx` — 👍/👎 buttons on place detail page

### Phase 14 — PWA Web Push Notifications
- `WebPushSubscription` model (Prisma + Neon), endpoint-unique upsert
- `POST /api/push/subscribe` + `DELETE` — subscribe / unsubscribe
- `GET|POST /api/push/send` — broadcast push, auto-prune 410/404 endpoints
- `vercel.json` — Vercel Cron daily 09:00 KST
- `hooks/use-push.ts` — permission flow, subscribe/unsubscribe state machine
- `components/seoul30/PushSubscribeButton.tsx` — in Header (mobile) and desktop bar
- `public/sw.js` — push + notificationclick event handlers added

### Phase 15 — i18n (next-intl v4)
- Cookie-based locale (`NEXT_LOCALE`), no URL restructuring
- `messages/ko.json` + `messages/en.json` — all key UI namespaces
- `i18n/request.ts` — `getRequestConfig` reads cookie, falls back to `ko`
- `next.config.mjs` — wrapped with `createNextIntlPlugin`
- `app/layout.tsx` — `NextIntlClientProvider` + dynamic `html lang` attribute
- `components/seoul30/LanguageToggle.tsx` — sets cookie, reloads page
- All key components updated: Hero, FilterBar, EmptyState, BottomTabBar, FeedbackPanel, PushSubscribeButton, MapViewInner, place detail page

### Phase 16 — Score Breakdown UI
- `components/seoul30/ScoreBadge.tsx` — new component
  - Shows `total`점 badge with color: green (75+), blue (55+), gray (below 55)
  - Shows reason pills for dimensions that exceed threshold (access≥20, relevance≥20, cost≥15, congestion≥10, timefit≥10, freshness≥3)
  - Uses `useTranslations('score')` — ko/en both supported
- `PlaceCard.tsx` — accepts optional `score?: ScoreBreakdown`, renders ScoreBadge inline with the free/paid badge
- `app/page.tsx` — `{ place, score }` destructured from `displayResults`, `score` passed to PlaceCard
- `messages/ko.json` + `messages/en.json` — `score` namespace with 7 keys (label + 6 dimensions)
- `tests/components/ScoreBadge.test.tsx` — 4 tests: total display, full reasons, no reasons below threshold, low score display

## Do-Not-Touch Rules

- API keys server-side only (`lib/config/env.ts` + Route Handlers)
- Do not commit `.env.local` or any real secret values
- Do not edit `components/ui/` unless directly required by the phase
- `NEXT_PUBLIC_` prefix only for values safe to expose to the browser
- No scope creep beyond the requested phase

## Env Vars Needed for Full Function

```bash
DATABASE_URL=                        # Neon PostgreSQL
SEOUL_OPEN_API_KEY=                  # Seoul Open API (server-side)
NEXT_PUBLIC_BASE_URL=                # canonical domain
USE_MOCK_DATA=true                   # set false to use real API
VAPID_EMAIL=                         # Web Push identity
VAPID_PUBLIC_KEY=                    # generate: npx web-push generate-vapid-keys
VAPID_PRIVATE_KEY=
NEXT_PUBLIC_VAPID_PUBLIC_KEY=        # same value as VAPID_PUBLIC_KEY
CRON_SECRET=                         # arbitrary secret, guards /api/push/send
```

### Phase 17 — Stale Cache Fallback + Hardening

**Hardening (커밋 1 — 독립 방어 수정):**
- `feedback/route.ts` GET/POST Prisma 호출 → try-catch, DB 장애 시 500 반환
- `push/send/route.ts` `checkAuth` → CRON_SECRET 미설정 시 운영 인증 차단 (`NODE_ENV === 'development'`에서만 허용)
- `push/send/route.ts` `sendPushToAll` Prisma findMany + 핸들러 → try-catch
- `hooks/use-push.ts` subscribe/unsubscribe → try-catch; 실패 시 상태 자동 복구

**Phase 17 Stale Fallback (커밋 2):**
- `lib/types/api.ts` — `isStale?: boolean` 필드 추가
- `lib/cache/recommendation.cache.ts` — `getStaleSnapshot()` 추가 (TTL 무시, 만료 스냅샷도 반환)
- `app/api/places/route.ts` — `fetchSeoulCultureEvents()` 반환값이 빈 배열이면 stale 스냅샷 조회 후 `isStale: true`로 반환, 스냅샷도 없으면 mock 폴백
- `app/page.tsx` — `isStale` 수신, 필터 위 앰버 배너 표시
- `messages/ko.json` + `messages/en.json` — `common.staleData` 추가

## Verification Status (Phase 17)

- `npx tsc --noEmit` — passed
- `npm run test` — 16/16 unit + component tests passing
- Dev server running on `localhost:3001`

## Next Action

Start Phase 18 planning (accessibility + skeleton loading states). See `PROJECT_SCOPE.md` for constraints.
