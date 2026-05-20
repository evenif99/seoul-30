# TASKS

Last updated: 2026-05-20 (Phase 18 complete)

## Completed Phases (1–15)

### Phase 13 — Anonymous Place Rating
- [x] `PlaceFeedback` model in `prisma/schema.prisma` + `npx prisma db push`
- [x] `GET|POST /api/places/[id]/feedback` route
- [x] `hooks/use-feedback.ts` — sessionId, optimistic update, rollback
- [x] `components/seoul30/FeedbackPanel.tsx` — rating UI on place detail page
- [x] TypeScript check + README + commit + push

### Phase 14 — PWA Web Push Notifications
- [x] `npm install web-push @types/web-push`
- [x] `WebPushSubscription` model in `prisma/schema.prisma` + db push
- [x] `POST|DELETE /api/push/subscribe` route
- [x] `GET|POST /api/push/send` route (CRON_SECRET guard)
- [x] `public/sw.js` — push + notificationclick handlers
- [x] `hooks/use-push.ts` — permission flow + state machine
- [x] `components/seoul30/PushSubscribeButton.tsx`
- [x] `vercel.json` — Cron daily 09:00 KST
- [x] `.env.example` — VAPID + CRON_SECRET entries
- [x] TypeScript check + README + commit + push

### Phase 15 — i18n (next-intl v4)
- [x] `npm install next-intl`
- [x] `messages/ko.json` + `messages/en.json`
- [x] `i18n/request.ts` — cookie-based `getRequestConfig`
- [x] `next.config.mjs` — `createNextIntlPlugin`
- [x] `app/layout.tsx` — `NextIntlClientProvider`, dynamic `html lang`
- [x] `components/seoul30/LanguageToggle.tsx`
- [x] Header, page.tsx — LanguageToggle integrated
- [x] Hero, FilterBar, EmptyState, BottomTabBar — `useTranslations`
- [x] FeedbackPanel, PushSubscribeButton, MapViewInner — `useTranslations`
- [x] `app/place/[id]/page.tsx` — `getTranslations` (server)
- [x] TypeScript check + README + commit + push

### Phase 16 — Score Breakdown UI
- [x] `components/seoul30/ScoreBadge.tsx` — total score badge + reason pills
- [x] `PlaceCard.tsx` — accepts optional `score` prop, renders ScoreBadge
- [x] `app/page.tsx` — passes `score` from `RecommendationResult` to PlaceCard
- [x] `messages/ko.json` + `messages/en.json` — `score` namespace added
- [x] `tests/components/ScoreBadge.test.tsx` — 4 tests
- [x] TypeScript check + 16/16 tests passing + README + commit + push

### Phase 17 — Stale Cache Fallback + Hardening

#### Hardening (커밋 1)
- [x] `feedback/route.ts` GET/POST — Prisma 호출 try-catch, DB 장애 시 500 반환
- [x] `push/send/route.ts` — CRON_SECRET 미설정 시 운영 환경 인증 차단 (개발만 허용)
- [x] `push/send/route.ts` — sendPushToAll Prisma findMany try-catch
- [x] `push/send/route.ts` — GET/POST 핸들러 try-catch
- [x] `hooks/use-push.ts` — subscribe/unsubscribe try-catch; 오류 시 상태 복구

#### Phase 17 Stale Fallback (커밋 2)
- [x] `lib/types/api.ts` — `isStale?: boolean` 추가
- [x] `lib/cache/recommendation.cache.ts` — `getStaleSnapshot()` (TTL 무시)
- [x] `app/api/places/route.ts` — Seoul API 빈 응답 시 stale 스냅샷 반환 (`isStale: true`)
- [x] `app/page.tsx` — `isStale` 상태 수신, 앰버 배너 표시
- [x] `messages/ko.json` + `messages/en.json` — `common.staleData` 추가
- [x] TypeScript check + 16/16 tests passing

### Phase 18 — Skeleton Loading + Accessibility
- [x] `components/seoul30/PlaceCardSkeleton.tsx` — shimmer skeleton (aria-hidden)
- [x] `app/page.tsx` — 로딩 중 `null` → 3개 PlaceCardSkeleton 표시
- [x] `app/page.tsx` — 결과 카운트 `<p>` 에 `aria-live="polite"` + `aria-atomic="true"`
- [x] `app/page.tsx` — 리스트 섹션에 `aria-busy={loading}`
- [x] `components/seoul30/Header.tsx` — skip-to-content `<span>` → `<a>` (focus 시 visible)
- [x] `tests/components/PlaceCardSkeleton.test.tsx` — 3 tests
- [x] TypeScript check + 19/19 tests passing

## Open Items

- [ ] Phase 19–20 scope TBD
- [ ] Middleware `proxy` migration (deferred — not blocking)
- [ ] Playwright Windows exit-hang (local-only issue — tests pass)

## Constraints Reminder

- Vercel Hobby + Neon Free — no paid infra
- No secrets in code
- Server-side-only external API calls
- No scope creep beyond requested phase
