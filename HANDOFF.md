# HANDOFF

Last updated: 2026-05-20 (Phase 15 complete)

## Current State

Phase 15 (i18n) is complete and pushed to `main`. The app is fully functional with Korean (default) and English support. All previous phases (1–14) are stable.

## What Was Done (Phase 13–15)

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

## Verification Status (Phase 15)

- `npx tsc --noEmit` — passed
- `npm run test` — 12/12 unit + component tests passing
- Dev server running on `localhost:3001`
- All key UI strings render in both `ko` and `en` via LanguageToggle

## Next Action

Start Phase 16 planning. See `PROJECT_SCOPE.md` for constraints before proposing scope.
