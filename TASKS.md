# TASKS

Last updated: 2026-05-20 (Phase 20 complete — all phases done)

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

### Phase 19 — Static Pages + PWA Installability
- [x] `app/about/page.tsx` — 서비스 소개, 점수 기준, 데이터 출처 (ko/en)
- [x] `app/privacy/page.tsx` — 개인정보 처리방침 (ko/en)
- [x] `messages/ko.json` + `messages/en.json` — about/privacy 네임스페이스 추가
- [x] `public/manifest.json` — maskable 아이콘 목적 추가, shortcuts, categories, prefer_related_applications: false
- [x] `app/sitemap.ts` — /about, /privacy 추가
- [x] `app/page.tsx` — 리스트 하단 About/Privacy 푸터 링크
- [x] `tests/unit/manifest.test.ts` — 5 tests
- [x] TypeScript check + 24/24 tests passing

### Phase 20 — Launch Hardening
- [x] `lib/config/env.ts` — `validateEnv()` 추가 (DATABASE_URL, SEOUL_OPEN_API_KEY, VAPID 쌍 검증)
- [x] `app/api/health/route.ts` — GET /api/health (env 검증 + DB ping)
- [x] `RUNBOOK.md` — 헬스 체크, 시나리오별 대응, 시크릿 교체, 배포/롤백 절차
- [x] `tests/unit/env.test.ts` — validateEnv 5 tests
- [x] TypeScript check + 29/29 tests passing

### Phase 21 — Observability
- [x] `app/api/places/route.ts` — 결과 출처(api/cache/stale/mock) + durationMs JSON 로그
- [x] `app/api/diagnostics/route.ts` — GET /api/diagnostics (lastSnapshotAt, feedbackCount, pushSubscriberCount)
- [x] `tests/unit/diagnostics.test.ts` — 3 tests (32/32)

### Phase 22 — 데이터 신뢰성 투명화
- [x] `lib/types/api.ts` — `snapshotAt?: string | null` 추가
- [x] `lib/cache/recommendation.cache.ts` — `SnapshotResult` 반환 타입 (results + snapshotAt)
- [x] `lib/utils/relative-time.ts` — ko/en 상대 시간 포매터 (외부 라이브러리 없음)
- [x] `app/page.tsx` — stale 배너 데이터 나이 표시, 캐시 히트 subtle 인디케이터
- [x] `tests/unit/relative-time.test.ts` — 8 tests (40/40)

### Phase 23 — Engagement polish
- [x] `components/seoul30/BottomTabBar.tsx` — 북마크 카운트 배지 (0 숨김, 99+ 처리)
- [x] `components/seoul30/ShareButton.tsx` — `useTranslations('share')` 적용
- [x] `components/seoul30/BookmarkButton.tsx` — `useTranslations('bookmark')` 적용
- [x] `app/bookmarks/page.tsx` — 전체 i18n 적용
- [x] `tests/components/BottomTabBar.test.tsx` — 3 tests (43/43)

### Phase 24 — 성능/접근성 하드닝
- [x] `next.config.mjs` — `typescript.ignoreBuildErrors` 제거
- [x] `next.config.mjs` — about/privacy Cache-Control 헤더 (1h + 24h SWR)
- [x] `components/seoul30/PlaceCard.tsx` — 'use client' + 전체 i18n (카테고리, 무료/유료, CTA, aria-label)
- [x] `messages` — `place` 네임스페이스 추가 (43/43)

### Phase 25 — Release readiness
- [x] `PlaceCard.tsx` — `Train`, `Bus`, `Footprints` 미사용 import 제거
- [x] `MapViewInner.tsx` — 지도 팝업 무료/유료 i18n
- [x] `app/bookmarks/page.tsx` — aria-label="홈으로" i18n 수정
- [x] `app/offline/page.tsx` — 전체 i18n (`getTranslations('offline')`)
- [x] `app/about/page.tsx` + `app/privacy/page.tsx` — isKo 분기 제거, `t('backHome')` / `t('intro')` / `t('scoringNote')` 통일
- [x] `messages` — offline, about.backHome/intro/scoringNote, privacy.backHome 추가
- [x] TASKS.md, PROJECT_SCOPE.md, README.md, HANDOFF.md Phase 21-25 반영
- [x] TypeScript 오류 없음, 43/43 통과

## Deferred Items

- Playwright Windows exit-hang — 로컬 한정 이슈, CI 통과 확인됨
- [ ] Playwright Windows exit-hang (local-only issue — tests pass)

## Completed Post-Phase-20 Fixes

- [x] `middleware.ts` → `proxy.ts` 리네임, export `middleware` → `proxy` (Next.js 16 deprecation 해결)
- [x] `app/api/push/send/route.ts` — `webpush.setVapidDetails()` 모듈 최상위 → `sendPushToAll()` 내부 이동 (Vercel build 오류 해결)
- [x] `vercel.json` cron — `0 9 * * *` (UTC 09:00 = KST 18:00) → `0 0 * * *` (UTC 00:00 = KST 09:00)
- [x] `app/api/realtime/[areaCode]/route.ts` 삭제 — 클라이언트에서 호출되지 않는 데드 라우트

## Constraints Reminder

- Vercel Hobby + Neon Free — no paid infra
- No secrets in code
- Server-side-only external API calls
- No scope creep beyond requested phase
