# HANDOFF

Last updated: 2026-05-20 (Phase 20 complete — all phases done)

## Current State

Phase 20 (launch hardening) is complete. Phase 1–20 전체 완료. 운영 가능 상태. The app gracefully degrades when the Seoul Open API is unavailable by returning the most recent cached snapshot with an amber banner. All HIGH-severity error risks from the audit have been resolved.

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

### Phase 18 — Skeleton Loading + Accessibility
- `components/seoul30/PlaceCardSkeleton.tsx` — shimmer 카드, `aria-hidden="true"`, PlaceCard 레이아웃 동일
- `app/page.tsx` — 로딩 중 빈 화면(`null`) 대신 3개 PlaceCardSkeleton 표시
- `app/page.tsx` — 결과 카운트 `<p>`에 `aria-live="polite"` + `aria-atomic="true"` (스크린리더 카운트 변경 알림)
- `app/page.tsx` — 리스트 섹션에 `aria-busy={loading}` (로딩 중 busy 상태 명시)
- `components/seoul30/Header.tsx` — skip-to-content `<span>` → `<a href="#main-content">` (키보드 포커스 시 visible)
- `tests/components/PlaceCardSkeleton.test.tsx` — 3 tests (19/19 통과)

### Phase 19 — Static Pages + PWA Installability
- `app/about/page.tsx` — 서비스 소개 (점수 기준 6개 항목 표, 데이터 출처 목록), ko/en 자동 전환
- `app/privacy/page.tsx` — 개인정보 처리방침 (수집 없음, localStorage, 푸시, 외부 서비스), ko/en
- `messages/ko.json` + `messages/en.json` — `about`/`privacy` 네임스페이스 (제목, 섹션 레이블)
- `public/manifest.json` — `purpose: "any maskable"`, `shortcuts` (저장한 장소 바로가기), `categories`, `prefer_related_applications: false`
- `app/sitemap.ts` — /about (priority 0.4), /privacy (priority 0.2) 추가
- `app/page.tsx` — 리스트 하단 About · Privacy 푸터 링크
- `tests/unit/manifest.test.ts` — 5 tests (24/24 통과)

### Phase 20 — Launch Hardening
- `lib/config/env.ts` — `validateEnv()`: DATABASE_URL 필수 확인, ENABLE_CULTURE_EVENTS_API=true 시 SEOUL_OPEN_API_KEY 확인, VAPID 키 쌍 일치 확인. process.env 직접 읽어 vi.stubEnv 테스트 가능
- `app/api/health/route.ts` — `GET /api/health`: validateEnv() → DB `SELECT 1` ping → `{ status, db, timestamp }` 반환. 503 on failure.
- `RUNBOOK.md` — 헬스 체크 명령, 5개 장애 시나리오 대응, 시크릿 교체 절차, 배포/롤백 방법, 로컬 개발 환경변수 표
- `tests/unit/env.test.ts` — 5 tests (29/29 통과)

## Verification Status (Phase 20 — Final)

- `npx tsc --noEmit` — passed
- `npm run test` — 29/29 unit + component tests passing
- `GET /api/health` — env + DB 상태 확인 엔드포인트 가동
- Dev server running on `localhost:3001`

## 운영 시작 체크리스트

1. `curl https://seoul-30.vercel.app/api/health` → `{"status":"ok","db":"ok"}`
2. VAPID 키, CRON_SECRET, DATABASE_URL Vercel 환경변수 확인
3. 첫 날 09:00 KST Vercel Cron 발송 여부 확인 (`/api/push/send` 로그)
4. `/about`, `/privacy` 페이지 접근 가능 여부 확인
