# RUNBOOK

## Phase 52 PWA Installability Notes

- Manifest is served at `/manifest.json`.
- Required install assets:
  - `/icons/icon-192.png`
  - `/icons/icon-512.png`
  - `/screenshots/mobile-home.png`
  - `/screenshots/desktop-home.png`
- Service worker cache version after Phase 52: `v3`.
- If installability regresses, run `npm run test` first; manifest tests verify icon, shortcut, and screenshot file paths.

## Phase 51 CI / Lighthouse Notes

- CI server checks use port `3001` only.
- Lighthouse CI starts the production server with `npx next start -p 3001`.
- LHCI audits `http://localhost:3001/`.
- Playwright CI runs with one worker and one retry to reduce transient E2E flake; local Windows can still hang after all E2E tests pass.
- Blocking gate: accessibility score must be at least `0.9`.
- Warning gates: performance `0.8`, best-practices `0.9`, seo `0.9`.
- PWA installability is checked with unit tests around `public/manifest.json`, icon files, and service worker references rather than a Lighthouse `pwa` category assertion.
- Last local smoke result for Phase 51: performance `0.98`, accessibility `0.96`, best-practices `0.93`, seo `1.00`.

If CI fails in the Lighthouse step:
1. Open the temporary public storage URL printed by LHCI.
2. Check whether the failure is an assertion error or a server startup timeout.
3. If startup timed out, confirm no workflow step changed the required port `3001`.
4. If an assertion failed, treat accessibility as blocking; review warning categories before deciding whether to tighten or relax thresholds.

Seoul 30 운영 런북. 배포 후 문제 발생 시 첫 번째로 참조한다.

---

## 운영 상태 확인

```
GET /api/diagnostics
```

| 필드 | 설명 |
|---|---|
| `lastSnapshotAt` | 마지막 Seoul API 캐시 시각 (null이면 한 번도 API 호출 없음) |
| `snapshotCount` | DB에 저장된 스냅샷 총 개수 |
| `snapshotsLast24h` | 최근 24시간 내 생성된 스냅샷 수 (신선도 지표) |
| `feedbackCount` | 누적 👍/👎 피드백 수 |
| `ratedPlacesCount` | 피드백이 1건 이상 있는 장소 수 |
| `pushSubscriberCount` | 현재 웹 푸시 구독자 수 |
| `pushCategoryStats` | Push 구독 카테고리 분포 (`total`, `allCategoriesCount`, `perCategory`) |
| `topPlaces` | 피드백 참여도 Top 5 장소 (`placeId`, `total`, `upCount`, `downCount`, `upPct`) |
| `snapshotTtlSeconds` | 현재 적용 중인 스냅샷 캐시 TTL (초, 기본 7200 = 2시간) |
| `seoulApiEnabled` | `ENABLE_CULTURE_EVENTS_API` 플래그 상태 |
| `realtimeCityDataEnabled` | `ENABLE_REALTIME_CITY_DATA` 플래그 상태 |
| `dataQuality` | 데이터 품질 메트릭 (좌표·이미지·주소 보유율, 의심 좌표 수) |

DB 장애 시 503 반환.

---

## 헬스 체크

```
GET /api/health
```

| 응답 | 의미 |
|---|---|
| `{ "status": "ok", "db": "ok", "seoulApi": "ok" }` | 정상 |
| `{ "status": "ok", "db": "ok", "seoulApi": "skipped" }` | Seoul API 키 미설정 (mock 모드) |
| `{ "status": "degraded", "db": "error" }` | DB 연결 실패 (503) |
| `{ "status": "error", "error": "[env] ..." }` | 필수 환경변수 누락 (503) |

배포 직후 반드시 확인할 것. `curl https://seoul-30-webapp.vercel.app/api/health`

---

## 시나리오별 대응

### 1. DB 연결 실패 (`/api/health` → `db: error`)

**원인**: Neon 프리 티어 슬립, 연결 풀 소진, 자격증명 만료

**대응**:
1. [Neon 콘솔](https://console.neon.tech) 접속 → 프로젝트 상태 확인
2. Vercel 대시보드 → Settings → Environment Variables → `DATABASE_URL` 값 확인
3. Neon에서 연결 문자열 재발급 후 Vercel에 재설정 → Redeploy

### 2. 서울 Open API 장애 (데이터 오래됨 배너 노출)

**자동 처리**: API 빈 응답 시 DB 스냅샷(캐시)으로 자동 폴백, 앰버 배너 표시
- 캐시 TTL: `SNAPSHOT_TTL_SECONDS` 환경변수 기준 (기본 7200초 = 2시간). 스냅샷이 없으면 mock 데이터로 폴백

**Phase 26 이후 데이터 소스**: 문화행사(culturalEventInfo) + 문화공간(culturalSpaceInfo) + 도서관(SeoulPublicLibraryInfo) + 공원(ListParkService) + 체육시설(ListPublicReservationSport)

**개별 소스 장애 시**: 해당 소스만 빈 배열 반환, 나머지 소스 결과는 정상 반환

**수동 확인**: `ENABLE_CULTURE_EVENTS_API=false` 로 설정하면 항상 mock 모드

**API 복구 확인**: 서울 열린데이터광장(data.seoul.go.kr) 상태 페이지 참조
- `/api/health` → `seoulApi: error` 이면 Seoul API 연결 문제

### 3. 환경변수 오류 (`/api/health` → `status: error`)

에러 메시지에 누락된 변수명이 명시됨.

```
[env] Configuration error:
  • DATABASE_URL is required
```

Vercel → Settings → Environment Variables → 해당 변수 추가 후 Redeploy.

### 4. 푸시 알림 미발송

**체크리스트**:
- Vercel Cron 설정 확인: `vercel.json` → `/api/push/send` 매일 09:00 KST (UTC 00:00 = `"0 0 * * *"`)
- `CRON_SECRET`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_EMAIL` 환경변수 존재 여부 확인

**수동 발송 테스트**:
```bash
curl -X POST https://seoul-30-webapp.vercel.app/api/push/send \
  -H "Authorization: Bearer {CRON_SECRET}"
```

응답: `{ "sent": N, "total": M }`

**구독자가 0명인 경우**: 정상 (`sent: 0, total: 0`)

### 5. Naver Maps 지도 미표시

**증상**: 지도 탭이 빈 화면이거나 `MapErrorFallback` 컴포넌트 표시

**원인 1 — NCP 허용 도메인 미등록** (가장 흔한 원인)

브라우저 콘솔에서 `Naver Maps API error: unauthorized` 또는 `401` 에러 확인.  
NCP 콘솔 → Application → 해당 앱 → "서비스 URL" 탭에 아래 도메인이 모두 등록되어 있어야 한다:

| 환경 | 등록 URL |
|---|---|
| 로컬 개발 | `http://localhost:3001` |
| Vercel 프로덕션 | `https://seoul-30-webapp.vercel.app` |
| Vercel Preview | `https://*.vercel.app` (와일드카드, NCP 지원 여부 확인 필요) |

등록 후 새 Client ID를 발급받지 않아도 됨 — 도메인 추가 즉시 적용.

**원인 2 — CSP 헤더 누락**

`next.config.mjs`의 CSP에 아래 도메인이 포함되어 있어야 한다:
- `oapi.map.naver.com` (SDK script)
- `openapi.map.naver.com` (API)
- `*.pstatic.net` (지도 타일 CDN)

누락 시 `tests/unit/security-headers.test.ts` 실행 → assert 실패로 확인 가능.

**원인 3 — `NEXT_PUBLIC_NAVER_MAP_CLIENT_ID` 미설정**

Vercel 환경변수 또는 `.env.local`에 값이 없으면 지도 초기화 스킵됨.  
`MapView.tsx`에서 `process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID` 없을 때 `MapErrorFallback` 렌더링.

### 6. 높은 오류율 (Vercel Functions)

1. Vercel 대시보드 → Observability → Functions → 오류 로그 확인
2. 오류가 Prisma 연결이면 → 시나리오 1
3. 오류가 외부 API이면 → 시나리오 2
4. 오류가 `validateEnv`이면 → 시나리오 3

---

## 시크릿 교체 절차

### CRON_SECRET 교체

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

1. Vercel → Environment Variables → `CRON_SECRET` 업데이트
2. Redeploy
3. 기존 Cron 요청은 다음 실행 시 자동 적용

### VAPID 키 교체

```bash
npx web-push generate-vapid-keys
```

주의: 키를 교체하면 **모든 기존 푸시 구독이 무효화**된다.
구독자는 재구독 필요. DB의 `WebPushSubscription` 테이블을 먼저 비울 것.

```sql
TRUNCATE "WebPushSubscription";
```

---

## 배포 절차

```bash
npx tsc --noEmit
npm run test
npm run build
git push origin master
# → Vercel 자동 배포 (약 2~3분)
# → 배포 후: curl /api/health 확인
```

### Phase 완료 후 배포 루틴

각 Phase는 완료 보고 전에 검증·문서화·커밋·푸시·배포 확인까지 한 번의 루틴으로 마감한다.

1. `git status --short`로 의도한 변경만 포함됐는지 확인.
2. `npx tsc --noEmit`, `npm run test`, 필요 시 `npm run build` / `npm run test:e2e` 실행.
3. `docs/HANDOFF.md`, `docs/PROJECT_SCOPE.md`, `docs/ARCHITECTURE.md`, `docs/TASKS.md`에 Phase 결과와 테스트 수 반영.
4. `git add .` 후 Phase 단위 커밋 생성.
5. `git push origin master`로 GitHub Actions와 Vercel 자동 배포 트리거.
6. 배포 완료 후 `curl https://seoul-30-webapp.vercel.app/api/health` 및 Phase별 핵심 URL smoke check.

### 롤백

Vercel 대시보드 → Deployments → 직전 배포 → `...` → **Promote to Production**

---

## 로컬 개발

```bash
npm run dev          # localhost:3001 (3000은 다른 프로젝트 사용 중)
npm run test         # Vitest unit + component (253개)
npm run test:e2e     # Playwright E2E (16개 스펙, reporter=list)
npx tsc --noEmit     # 타입 체크
npm run build        # 프로덕션 빌드 검증
npx prisma studio    # DB GUI
```

### Windows 개발 환경 주의사항

**Prisma DLL 잠금 (`EPERM` 오류)**
- `npm run dev` 실행 중 별도 터미널에서 `prisma generate` 실행 금지
- `npm run dev` 는 `predev` 훅으로 generate를 선행 실행함 — 별도 실행 불필요
- schema.prisma 변경 시: `npm run dev` 중지 → `npx prisma generate` → `npx prisma db push` → `npm run dev` 재시작
- EPERM 발생 시: `Stop-Process -Name node -Force` → `Remove-Item -Recurse -Force node_modules\.prisma` → `npx prisma generate`
- 상세 가이드: [docs/WINDOWS_PRISMA_DLL_LOCK.md](WINDOWS_PRISMA_DLL_LOCK.md)

**E2E 로컬 hang (Windows)**
- Playwright 테스트가 모두 통과해도 명령 프롬프트가 멈출 수 있음 (CI는 정상)
- `playwright.config.ts`에 `reporter: 'list'` 설정으로 빈도 감소
- hang 발생 시 강제 종료: `taskkill /F /IM node.exe /T`
- 테스트 결과 자체는 정상 — CI GitHub Actions 결과로 최종 판단

### 로그 확인 (Phase 30 통합)

모든 서버 사이드 로그는 `lib/logger.ts` 공통 유틸을 통해 JSON 구조화 포맷으로 출력됩니다.

```json
{ "level": "info", "ts": "2026-05-21T...", "event": "places_request", "source": "api", "durationMs": 312 }
```

Vercel 대시보드 → Observability → Logs 에서 확인 가능.

### 필수 환경변수 (.env.local)

| 변수 | 필수 | 설명 |
|---|---|---|
| `DATABASE_URL` | ✅ | Neon PostgreSQL 연결 문자열 |
| `SEOUL_OPEN_API_KEY` | 조건부 | `ENABLE_CULTURE_EVENTS_API=true` 시 필수 |
| `NEXT_PUBLIC_BASE_URL` | 권장 | OG/sitemap 절대 URL |
| `NEXT_PUBLIC_NAVER_MAP_CLIENT_ID` | 지도 사용 시 | NCP 콘솔 Application Client ID (ncpKeyId 형식) |
| `VAPID_EMAIL` | 푸시 사용 시 | `mailto:` 형식 |
| `VAPID_PUBLIC_KEY` | 푸시 사용 시 | `npx web-push generate-vapid-keys` |
| `VAPID_PRIVATE_KEY` | 푸시 사용 시 | 위와 동일 커맨드 |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | 푸시 사용 시 | `VAPID_PUBLIC_KEY`와 동일 값 |
| `CRON_SECRET` | 푸시 사용 시 | 임의 32바이트 base64url 문자열 |
| `SNAPSHOT_TTL_SECONDS` | 선택 | 스냅샷 캐시 TTL (초, 기본 7200 = 2시간) |
| `ADMIN_SECRET` | 선택 | `/admin` 접근 제어 — 미설정 시 공개, 설정 시 `?secret=` 파라미터 필요 |
