# HANDOFF

Last updated: 2026-05-20 (Naver Maps 적용 완료 — Leaflet 대체)

## Current State

Phase 20 (launch hardening) is complete. Phase 1–20 전체 완료. 운영 가능 상태. The app gracefully degrades when the Seoul Open API is unavailable by returning the most recent cached snapshot with an amber banner. All HIGH-severity error risks from the audit have been resolved.

### Naver Maps 적용 (Post-Phase-25)
- `leaflet`, `react-leaflet`, `react-leaflet-cluster`, `@types/leaflet` 패키지 제거
- `lib/types/naver-maps.d.ts` — Naver Maps JavaScript API v3 TypeScript 타입 선언 추가
- `components/seoul30/MapView.tsx` — `next/script` + `mounted` 상태로 hydration 안전하게 로드
  - `strategy="afterInteractive"` + `onLoad` → `setReady(true)` 패턴
  - `ncpKeyId` 파라미터 사용 (NCP 신규 콘솔 X-NCP-APIGW-API-KEY-ID 형식)
- `components/seoul30/MapViewInner.tsx` — 완전 재작성:
  - 위성/하이브리드 뷰 토글 (`Layers` 버튼)
  - 현재 위치 이동 버튼 (`LocateFixed` 버튼, Geolocation API)
  - 그리드 기반 마커 클러스터링 (외부 라이브러리 없음, zoom 레벨 연동)
  - 마커 클릭 시 장소 팝업, 클러스터 클릭 시 줌인
  - `m.setMap(null)` try-catch 방어 (인증 실패 상태에서 SDK 내부 오류 방지)
- `messages/ko.json` + `messages/en.json` — `common.mapLoading/mapSatellite/mapNormal/mapMyLocation` 추가
- `.env.example` — `NEXT_PUBLIC_NAVER_MAP_CLIENT_ID` 항목 추가
- `package.json` — dev 포트 3001 고정 (`next dev -p 3001`)
- `playwright.config.ts` — baseURL + webServer.url 3001로 수정
- TypeScript 오류 없음, 43/43 통과, Vercel 배포 정상

### Phase 25 — Release readiness
- `components/seoul30/PlaceCard.tsx` — `Train`, `Bus`, `Footprints` 미사용 import 제거
- `components/seoul30/MapViewInner.tsx` — 지도 팝업 무료/유료 `t('common.free')` / `t('common.paid')` 적용
- `app/bookmarks/page.tsx` — `aria-label="홈으로"` → `tNav('home')` 적용
- `app/offline/page.tsx` — 전체 i18n: `getTranslations('offline')` 서버 컴포넌트로 리팩터
- `app/about/page.tsx` + `app/privacy/page.tsx` — `isKo` 분기 제거: `t('backHome')`, `t('intro')`, `t('scoringNote')` 사용
- `messages/ko.json` + `messages/en.json` — `offline`, `about.backHome/intro/scoringNote`, `privacy.backHome` 추가
- TASKS.md, PROJECT_SCOPE.md, README.md Phase 21-25 전체 반영
- TypeScript 오류 없음, 43/43 통과

### Phase 24 — 성능/접근성 하드닝
- `next.config.mjs` — `typescript: { ignoreBuildErrors: true }` 제거 (빌드 시 타입 오류 차단)
- `next.config.mjs` — `/about`, `/privacy` Cache-Control 헤더 추가 (`max-age=3600, stale-while-revalidate=86400`)
- `components/seoul30/PlaceCard.tsx` — `'use client'` + `useTranslations('place')` 적용
  - 카테고리 레이블: ko/en 분리 (`place.category.*`)
  - 무료/유료 뱃지: `tCommon('free')` / `tCommon('paid')`
  - CTA "상세 보기" → `t('viewDetail')`
  - `aria-label` → `t('ariaLabel', { name })`
  - 알 수 없는 카테고리는 원본 값 fallback (KNOWN_CATEGORIES Set)
- `messages/ko.json` + `messages/en.json` — `place` 네임스페이스 추가 (viewDetail, ariaLabel, category.*)
- TypeScript 오류 없음, 43/43 통과

### Phase 23 — Engagement polish (저장 UX + i18n 완성)
- `components/seoul30/BottomTabBar.tsx` — `useBookmark()` 추가, 북마크 수 배지 (0개면 숨김, 100+이면 99+)
- `components/seoul30/ShareButton.tsx` — `useTranslations('share')` 적용 (하드코딩 제거)
- `components/seoul30/BookmarkButton.tsx` — `useTranslations('bookmark')` 적용 (aria-label 하드코딩 제거)
- `app/bookmarks/page.tsx` — `useTranslations('bookmarks')` 적용 (전체 한국어 하드코딩 제거)
- `messages/ko.json` + `messages/en.json` — `share`, `bookmark`, `bookmarks`, `nav.bookmarkCount` 네임스페이스 추가
- `tests/components/BottomTabBar.test.tsx` — 3 tests: 배지 없음 / 카운트 표시 / 99+ 처리 (43/43 통과)

### Phase 22 — 데이터 신뢰성 투명화
- `lib/types/api.ts` — `ApiResponse`에 `snapshotAt?: string | null` 필드 추가
- `lib/cache/recommendation.cache.ts` — `getSnapshot()` / `getStaleSnapshot()` 반환 타입을 `SnapshotResult | null`로 변경 (`results` + `snapshotAt` 포함)
- `app/api/places/route.ts` — 캐시 히트 / stale 응답에 `snapshotAt` ISO 문자열 포함
- `lib/utils/relative-time.ts` — 외부 라이브러리 없이 ko/en 상대 시간 포매터 (방금 전 / N분 전 / N시간 전 / N일 전)
- `app/page.tsx` — stale 배너: "N시간 전 기준" 문구 삽입 / 정상 캐시 히트: "N분 전 업데이트" subtle 표시
- `messages/ko.json` + `messages/en.json` — `common.staleData` `{age}` 파라미터 추가, `common.cachedData` 신규
- `tests/unit/relative-time.test.ts` — 8 tests (40/40 통과)

### Phase 21 — Observability (무료)
- `app/api/places/route.ts` — 결과 출처(api/cache/stale/mock), 소요시간, 결과 수를 `console.info` JSON 로그로 출력 (Vercel Function 로그에서 확인 가능)
- `app/api/places/route.ts` — Seoul API 빈 응답 + 스냅샷 없음 시 `console.error` JSON 로그 추가
- `app/api/diagnostics/route.ts` — `GET /api/diagnostics`: 마지막 스냅샷 시각, 피드백 수, 푸시 구독자 수 반환 (DB 조회, 비용 0)
- `tests/unit/diagnostics.test.ts` — 3 tests (32/32 통과)
- 외부 APM 서비스 없음, Vercel 내장 로그 + 기존 Neon DB만 사용

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
- `vercel.json` — Vercel Cron daily 09:00 KST (UTC 00:00, `"0 0 * * *"`)
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

## Verification Status (최종)

- `npx tsc --noEmit` — passed
- `npm run test` — 43/43 unit + component tests passing
- `GET /api/health` — env + DB 상태 확인 엔드포인트 가동
- Dev server: `http://localhost:3001` (포트 고정)
- Naver Maps: 로컬 + Vercel 배포 모두 정상 동작 확인

## Completed Post-Phase-20 Fixes

- [x] `middleware.ts` → `proxy.ts` 리네임, export `middleware` → `proxy` (Next.js 16 deprecation 해결)
- [x] `app/api/push/send/route.ts` — `webpush.setVapidDetails()` 모듈 최상위 → `sendPushToAll()` 내부 이동 (Vercel build 오류 해결)
- [x] `vercel.json` cron — `0 9 * * *` → `0 0 * * *` (UTC 00:00 = KST 09:00 정정)
- [x] `app/api/realtime/[areaCode]/route.ts` 삭제 — 클라이언트에서 호출되지 않는 데드 라우트
- [x] Leaflet → Naver Maps 교체 (위성 뷰, 현재 위치, 그리드 클러스터링, ncpKeyId 인증)
- [x] `package.json` dev 포트 3001 고정, `playwright.config.ts` 포트 동기화 (CI 수정)

## 운영 시작 체크리스트

1. `curl https://seoul-30.vercel.app/api/health` → `{"status":"ok","db":"ok"}`
2. VAPID 키, CRON_SECRET, DATABASE_URL, NEXT_PUBLIC_NAVER_MAP_CLIENT_ID Vercel 환경변수 확인
3. 첫 날 09:00 KST Vercel Cron 발송 여부 확인 (`/api/push/send` 로그)
4. `/about`, `/privacy` 페이지 접근 가능 여부 확인
5. 지도 탭 → Naver Maps 타일 정상 출력 확인
