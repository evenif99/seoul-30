# HANDOFF

## Phase 61 - 실 API 전환 안정화 (2026-05-27)

- **완료**: Fixture 기반 adapter 단위 테스트 4개 파일 신규 (44 테스트), Snapshot TTL 환경변수화 (1h→기본 2h, `SNAPSHOT_TTL_SECONDS`), 관련 admin UI·README 업데이트.
- 유닛 247개 · E2E 14개 · TS 0 오류 · 커밋 master 최신.

### 변경 파일
| 파일 | 변경 내용 |
|---|---|
| `tests/fixtures/seoul-api.fixture.ts` | 신규 — 5개 Seoul Open API 응답 fixture (Library/Park/Sports/CultureEvent/CultureSpace) |
| `tests/unit/seoulLibrary.test.ts` | 신규 — 도서관 adapter 파싱·좌표·폴백 9개 테스트 |
| `tests/unit/seoulParks.test.ts` | 신규 — 공원 adapter 파싱·좌표·폴백 8개 테스트 |
| `tests/unit/seoulSports.test.ts` | 신규 — 체육시설 adapter 유료/무료·좌표·폴백 8개 테스트 |
| `tests/unit/seoulCultureAdapter.test.ts` | 신규 — 문화행사+문화공간 파싱·좌표·CODENAME·폴백 19개 테스트 |
| `vitest.config.ts` | `@tests` alias 추가 (`tests/` 디렉토리) |
| `lib/config/env.ts` | `SNAPSHOT_TTL_SECONDS` 환경변수 추가 (기본 7200) |
| `lib/cache/recommendation.cache.ts` | `TTL_MS` 상수 → `getTTLMs()` 함수, env 값 참조 |
| `app/api/diagnostics/route.ts` | 응답에 `snapshotTtlSeconds` 필드 추가 |
| `app/admin/page.tsx` | 스냅샷 신선도 섹션에 캐시 TTL 표시 행 추가 |
| `README.md` | 환경변수 테이블에 `SNAPSHOT_TTL_SECONDS` 추가 |
| `docs/PROJECT_SCOPE.md` | Phase 61 항목 추가 |
| `docs/HANDOFF.md` | 이 항목 |

### 기술 결정 기록
| 항목 | 결정 | 이유 |
|---|---|---|
| Fixture 방식 | `tests/fixtures/` — 실 API 응답 형식 직접 기술 | HTTP mock보다 API 계약을 명확하게 문서화 |
| `@tests` alias | vitest.config.ts에만 추가 (tsconfig 제외) | 테스트 전용이므로 프로덕션 빌드에 영향 없음 |
| TTL 2h 기본값 | `SNAPSHOT_TTL_SECONDS=7200` | Seoul Open API 일 쿼터 절약, 1h 대비 호출 절반 |
| `getTTLMs()` 함수 | 상수 대신 함수로 env 참조 | 런타임 env 변경 반영, 테스트에서 env mock 적용 |
| CultureSpace X/Y 매핑 | `toSeoulLatLng(X_COORD, Y_COORD)` 유지 (기존 코드·주석) | API가 X=위도, Y=경도로 비관례적으로 반환; 코드 주석·fixture로 문서화 |

## Phase 60 - 릴리즈/포트폴리오 패키징 (2026-05-27)

- **완료**: ARCHITECTURE.md 전면 재작성, README 테스트 수 동기화, 포트폴리오 패키징 완료.
- **프로젝트 상태**: 모든 계획 Phase(53–60) 완료. 유지보수 모드로 전환.
- 유닛 203개 · E2E 14개 · TS 0 오류 · 커밋 master 최신.

### 변경 파일
| 파일 | 변경 내용 |
|---|---|
| `docs/ARCHITECTURE.md` | Phase 56–59 아키텍처 노트, 파일 구조 현행화, 테스트 수 203, Admin Dashboard 섹션 신규 |
| `README.md` | 테스트 수 148→203, 접근성·운영 대시보드 핵심 기능 추가 |
| `docs/PROJECT_SCOPE.md` | Phase 60 항목 추가 |
| `docs/HANDOFF.md` | 이 항목 |

### 기술 결정 기록 (Phase 56–60 종합)
| Phase | 핵심 결정 | 이유 |
|---|---|---|
| 56 | `updateTags()` — PushManager 재구독 없이 서버 태그만 갱신 | 권한 팝업 없이 태그 변경 가능 |
| 56 | `existing.navigate(url)` — notificationclick URL 실제 이동 | `focus()` 만으로는 URL 미변경 |
| 57 | `isSuspiciousCoord` — `toSeoulLatLng()` 수정 없이 별도 분리 | 기존 유효성 검사 로직 불변 |
| 57 | `dataQuality.source` — `'snapshot' \| 'mock'` 명시 | 소비자가 메트릭 신뢰도 판단 가능 |
| 58 | 2-query groupBy (placeId → placeId+vote) | raw SQL 없이 UP/DOWN 분리 |
| 58 | empty tags = 전체 카테고리로 JS 확산 | DB 쿼리 추가 없이 정확한 집계 |
| 59 | layout `<main>` → `<div>` | 각 페이지가 단일 `<main>` 랜드마크 소유 |
| 59 | `aria-pressed` vs `aria-selected` | WAI-ARIA 역할 준수 — toggle ≠ tab |
| 60 | ARCHITECTURE.md 단일 파일 종합 | 신규 기여자가 하나의 파일로 전체 파악 가능 |

## Phase 59 - 접근성·성능·UX 마감 (2026-05-27)

- **완료**: 구조적 a11y 버그(중첩 main) 수정, 토글 버튼 ARIA 완성, PushSubscribeButton ESC 지원, bookmarks tablist/tabpanel 완성, skip link 앵커 전 페이지 적용.
- **다음**: Phase 60 (릴리즈/포트폴리오 패키징).
- 유닛 203개 통과 · E2E 14개 통과 · TS 0 오류.

### 변경 파일
| 파일 | 변경 내용 |
|---|---|
| `app/layout.tsx` | `<main id="main-content">` → `<div>` — 중첩 main 제거 |
| `app/page.tsx` | 정렬·뷰 토글 `aria-pressed` + `role="group"` + `aria-label` |
| `app/bookmarks/page.tsx` | `<main>` 전환, tablist `aria-label`, tab `id`/`aria-controls`, tabpanel 완성 |
| `app/place/[id]/page.tsx` | outer `<div>` → `<main id="main-content">` |
| `app/about/page.tsx` | outer `<div>` → `<main id="main-content">` |
| `app/privacy/page.tsx` | outer `<div>` → `<main id="main-content">` |
| `app/offline/page.tsx` | outer `<div>` → `<main id="main-content">` |
| `components/seoul30/PushSubscribeButton.tsx` | 카테고리 칩 `aria-pressed`, ESC 닫기, 패널 `role="dialog"` |
| `messages/ko.json` + `en.json` | `sortLabel`, `viewModeLabel` 키 추가 |
| `tests/unit/a11y-structure.test.ts` | 신규 — 18개 a11y 회귀 방지 케이스 |

### 기술 결정
- **중첩 main 문제**: layout을 `<div>`로 교체 → 각 페이지가 자체 semantic `<main>` 제공. skip link가 각 페이지의 `#main-content`로 이동. place/bookmarks/static 페이지 모두 `<main>` 변환 완료.
- **aria-pressed vs aria-selected**: toggle button(push/pull 개념) = `aria-pressed`, tab = `aria-selected`. 역할별로 구분.
- **ESC 닫기**: PushSubscribeButton의 `selecting/editing` 상태가 true일 때만 `keydown` 리스너 등록 → cleanup 함수로 메모리 누수 방지.

## Phase 58 - 운영 대시보드 강화 (2026-05-27)

- **완료**: Push 구독 분포 + 장소 참여도 Top 5 + 스냅샷 신선도 지표 추가.
- **다음**: Phase 59 (접근성·성능·UX 마감).
- 유닛 185개 통과 · E2E 14개 통과 · TS 0 오류.

### 변경 파일
| 파일 | 변경 내용 |
|---|---|
| `app/api/diagnostics/route.ts` | `snapshotsLast24h`, `pushCategoryStats`, `topPlaces` 필드 추가 |
| `app/admin/page.tsx` | 스냅샷 신선도·Push 구독 현황·장소 참여도 Top 5 섹션 추가 |
| `tests/unit/diagnostics.test.ts` | 3개 케이스 추가 (snapshotsLast24h, pushCategoryStats, topPlaces) |

### 기술 결정
- Push 카테고리 집계: 빈 tags = 전체 카테고리 구독으로 처리 → 각 카테고리에 +1씩 가산
- `topPlaces`: `groupBy(placeId)` → top 10 ID 추출 → 두 번째 `groupBy([placeId, vote])` 로 UP/DOWN 분리 (2-query 패턴, raw SQL 회피)
- 스냅샷 신선도: `createdAt >= Date.now() - 24h` 카운트 + 경과 시간 색상 코딩 (green/amber)
- DB 오류 시 모든 신규 필드 빈값(0/[]/{}로) 폴백, 기존 로직 불변

## Phase 57 - 데이터 품질/정합성 강화 (2026-05-27)

- **완료**: 데이터 품질 메트릭 유틸리티 + 의심 좌표 탐지 + admin/diagnostics 강화.
- **다음**: Phase 58 (운영 대시보드 강화).
- 유닛 182개 통과 · E2E 14개 통과 · TS 0 오류.

### 변경 파일
| 파일 | 변경 내용 |
|---|---|
| `lib/utils/data-quality.ts` | 신규 — `calcDataQuality`, `FieldCoverage`, `SourceSummary`, `PlaceDataQuality` |
| `lib/utils/coords.ts` | `isSuspiciousCoord(lat, lng)` 추가 — 소수점 3자리 미만 의심 판별 |
| `app/api/diagnostics/route.ts` | `dataQuality` 필드 추가, resultJson 스냅샷에서 실 데이터 추출 |
| `app/admin/page.tsx` | 데이터 품질 섹션 추가 (보유율 바 + sourceType 테이블 + 의심 좌표 경고) |
| `tests/unit/data-quality.test.ts` | 신규 — 22개 테스트 (함수 유닛 + MOCK 품질 게이트) |
| `tests/unit/coords.test.ts` | isSuspiciousCoord 4케이스 추가 |
| `tests/unit/diagnostics.test.ts` | dataQuality 필드 검증 추가 |

### 기술 결정
- `isSuspiciousCoord`: `toSeoulLatLng()`를 건드리지 않고 별도 함수로 분리 — 기존 유효성 검사 로직 불변
- `dataQuality.source`: `'snapshot' | 'mock'` 명시로 메트릭이 어떤 데이터 기반인지 소비자가 알 수 있음
- MOCK_PLACES 품질 게이트: 자동화 테스트로 mock 데이터 품질 저하 회귀 방지

## Phase 56 - Push 개인화 UX 완성 (2026-05-27)

- **완료**: 구독 태그 조회·편집 UI + notificationclick 카테고리 랜딩 수정.
- **다음**: Phase 57 (데이터 품질·정합성 강화).
- 유닛 160개 통과 · E2E 14개 통과 · TS 0 오류.

### 변경 파일
| 파일 | 변경 내용 |
|---|---|
| `hooks/use-push.ts` | `currentTags`, `updateTags` 추가, subscribe/unsubscribe localStorage 동기화 |
| `components/seoul30/PushSubscribeButton.tsx` | 구독 중 태그 요약 표시 + 편집 패널 (ChevronDown, 저장, 구독취소) |
| `public/sw.js` | notificationclick navigate 버그 수정, 캐시 버전 v5 |
| `messages/ko.json` / `en.json` | push.editTitle, subscribedAll, save, unsubscribeAction 추가 |
| `tests/unit/service-worker-cache.test.ts` | v5 + notificationclick navigate 테스트 추가 |

### 기술 결정
- `updateTags`: 브라우저 PushManager 구독 유지 + `/api/push/subscribe` POST upsert만 재호출 → 알림 권한 팝업 없이 태그 갱신
- `currentTags`: localStorage `seoul30:push:tags` 에서 복원, 기존 구독자(키 없음)는 `[]` = 전체로 표시
- 편집 패널 열 때 `currentTags`로 `selected` 초기화

## Additional Phase - SW 이미지 캐시 버그 수정 (2026-05-27)

- **완료**: Phase 55 회귀 수정 — `/_next/image` 경로 인터셉트 + SW 캐시 v4 범프 + PushSubscribeButton 취소 초기화.
- **다음**: 신규 Phase 계획 필요.
- 유닛 159개 통과 · E2E 14개 통과 · TS 0 오류.

### 변경 파일
| 파일 | 변경 내용 |
|---|---|
| `public/sw.js` | 이미지 인터셉트 조건 교체 (`hostname` → `pathname`), 캐시 버전 v4 |
| `components/seoul30/PushSubscribeButton.tsx` | 취소 버튼에 `setSelected(new Set(CATEGORIES))` 추가 |
| `tests/unit/service-worker-cache.test.ts` | v4 + `/_next/image` 인터셉트 회귀 테스트 추가 |
| `docs/PROJECT_SCOPE.md` | Additional Phase 항목 추가 |
| `docs/HANDOFF.md` | 이 항목 |
| `docs/ARCHITECTURE.md` | Phase 53–55 아키텍처 노트, 파일 구조, DB 모델, Web Push 섹션 업데이트 |

## Phase 55 - Core Web Vitals Optimization (2026-05-27)

- **완료**: 이미지 최적화 + 폰트 CLS 수정 + preconnect 추가.
- **다음**: 신규 Phase 계획 필요 (53–55 완료).
- 유닛 158개 통과 · E2E 14개 통과 · TS 0 오류.

## Phase 54 - Push Tag Personalization (2026-05-27)

- **완료**: Push 태그 개인화 — Neon 스키마 변경 (`tags String[]`) + subscribe/send API + 카테고리 선택 UI.
- **다음**: Phase 55 (Core Web Vitals 최적화).
- Neon DB: `WebPushSubscription` 테이블에 `tags TEXT[]` 컬럼 추가됨.
- 유닛 152개 통과 · E2E 14개 통과 · TS 0 오류.

## Phase 53 - Portfolio Polish (2026-05-26)

- **완료**: README.md 포트폴리오용 전면 재작성 + About 페이지 데이터 소스 정정 + layout.tsx authors 메타데이터.
- **다음**: Phase 54 (Push 태그 개인화, Neon 스키마 변경 승인 필요) 또는 Phase 55 (Core Web Vitals 최적화).
- 현재 상태: 유닛 148개 · E2E 14개 통과, TypeScript 0 오류.

## Phase 52 - PWA Installability Final Check (2026-05-26)

- **완료**: manifest installability 보강, 실제 앱 스크린샷 추가, SW cache v3 bump.
- `public/manifest.json`에 `id`, `display_override`, narrow/wide `screenshots` 추가.
- 실제 홈 화면 캡처 파일 추가: `public/screenshots/mobile-home.png`, `public/screenshots/desktop-home.png`.
- PWA 아이콘/스크린샷/shortcut 파일 존재 검증을 `tests/unit/manifest.test.ts`에 추가.
- `public/sw.js` cache version을 `v2` → `v3`로 올려 새 PWA 자산 갱신 유도.
- `.gitignore`에 local LHCI report 폴더(`.lighthouseci/`, `.lhci-local/`) 추가.

## Phase 51 - Lighthouse CI Stabilization (2026-05-26)

- **완료**: CI/LHCI 3001 포트 정렬 및 Lighthouse 기준 안정화.
- `.github/workflows/ci.yml`의 E2E/Build/LHCI `NEXT_PUBLIC_BASE_URL`을 모두 `http://localhost:3001`로 통일.
- `lighthouserc.cjs`에 `startServerReadyTimeout: 120000` 추가.
- Lighthouse 수집 카테고리를 `performance`, `accessibility`, `best-practices`, `seo`로 명시.
- `categories:pwa` assertion은 최신 Lighthouse 계열에서 카테고리 부재로 CI 불안정 가능성이 있어 제거하고, PWA installability는 manifest/icon/SW 테스트로 커버.
- `tests/unit/lighthouse-ci.test.ts`로 3001 포트와 품질 게이트 회귀 검증.
- 로컬 LHCI smoke 결과: performance 0.98, accessibility 0.96, best-practices 0.93, seo 1.00.

## Additional Phase - PWA Icon and CSP Hardening (2026-05-26)

- **완료**: Phase 50 후속 점검에서 발견된 PWA 아이콘 참조 불일치와 CSP 도메인 여유 보강.
- **현재 상태**: Phase 50 + Additional Phase 완료.
- **다음 후보**: GitHub Actions Lighthouse 결과 확인 후 기준값 조정 또는 Phase 51 착수.
- `public/icons/icon-192.png`, `public/icons/icon-512.png` 추가.
- `public/manifest.json`에 192/512 PNG maskable 아이콘과 shortcut PNG 아이콘 경로 추가.
- `public/sw.js`의 Push notification icon/badge 경로와 실제 파일이 일치함.
- `next.config.mjs` CSP에 `https://openapi.map.naver.com`도 허용해 layout dns-prefetch와 정책을 맞춤.
- `tests/unit/manifest.test.ts`, `tests/unit/security-headers.test.ts`에 회귀 검증 추가.

## Phase 50 Port Rule

- Local/CI server checks for Phase 50 must use port `3001`.
- Lighthouse CI is configured to run `npx next start -p 3001` and audit `http://localhost:3001/`.

## Phase 49 Codex Handoff (2026-05-26)

- **완료**: PWA 설치 배너 + 오프라인 캐시 UX.
- **다음**: Phase 50 (보안 헤더 + Lighthouse CI + MapView 에러 바운더리).
- PWA 설치 배너: `hooks/use-pwa-install.ts` + `components/seoul30/PwaInstallBanner.tsx`.
- 오프라인 캐시: `public/sw.js`가 `/api/places` 캐시 fallback에 `isStale`, `isOfflineCache`, `snapshotAt`을 주입.
- 홈 안내: `app/page.tsx`에서 캐시된 장소 안내 문구 표시.
- Push 태그 개인화는 Prisma schema 변경과 Neon `db push` 승인/용량 확인이 필요해 이번 Phase 49에서는 제외.

Last updated: 2026-05-26 (Additional Phase — 필터 하드 적용)

## Current Status (Clean Summary)

- **완료**: Phase 48 + Additional Phase (필터 하드 적용) 완료
- **다음**: Phase 49 (PWA 완성도)
- **배포 URL**: https://seoul-30.vercel.app
- **레포**: https://github.com/evenif99/seoul-30
- **현재 브랜치**: master
- **테스트**: 유닛 134/134 통과 (Vitest) + E2E 15/15 통과 (Playwright)
- **TypeScript**: 0 오류

## 버그 수정 요약 (2026-05-26, 커밋 `4fb4ea4`)

| 버그 | 원인 | 수정 |
|---|---|---|
| 상세 페이지 404 | `getPlaceDetailData` Seoul API 재호출 → 비결정 결과 | DB 스냅샷 캐시 fallback 추가 (`lib/data/place-detail.ts`) |
| 지도 핀 10개 제한 | `route.ts` `.slice(0,10)` 하드코딩 | `.slice(0,30)` 증가 |
| 북마크 미출력 | `resolvePlaces()` MOCK_PLACES만 참조 | bookmark 시 place 데이터 localStorage 저장 + 조회 우선 |
| 최근본 미출력 | 북마크와 동일 구조 원인 | 상세 방문 시 place 데이터 localStorage 저장 |

**참고**: 수정 이전에 저장된 북마크/최근본 데이터는 place 정보 없이 ID만 저장되어 있어 이전 항목은 표시 안됨. 수정 후 새로 북마크하거나 상세 페이지 재방문 시 정상 표시됨.

## Additional Phase — 필터 하드 적용 (2026-05-26)

| 항목 | 변경 전 | 변경 후 | 커밋 |
|---|---|---|---|
| 카테고리 필터 | 점수 가중치만 (타 카테고리 표시됨) | 하드 필터 (해당 카테고리만) | `74a53e4` |
| 자치구 필터 | 점수 가중치만 (타 자치구 표시됨) | GPS 미사용 시 해당 구만 | `74a53e4` |
| 태그 필터 | tags 없는 장소 bypass (Phase 46 전 잔재) | 모든 장소에 AND 교집합 엄격 적용 | `74a53e4` |

**동작 변화**:
- 도봉구 + 공원 선택 → 도봉구 소속 공원 카테고리 장소만 표시
- 조건에 맞는 장소 없으면 EmptyState 정상 출력
- GPS 모드에서는 자치구 점수만 사용 (현재 위치 기반 추천 유지)
- 변경 파일: `app/page.tsx` 1개

## Phase 48 작업 요약

| 항목 | 내용 | 커밋 |
|---|---|---|
| fetchByIdPrefix() 신규 | ID prefix(ce-/cs-/lib-/park-/sport-)로 단일 소스만 fetch | `e8b6aa3` |
| getSnapshotPlaces() 신규 | 최신 스냅샷에서 장소 목록 추출 (근처 추천용, API 재호출 없음) | `e8b6aa3` |
| getPlaceDetailData 개선 | 스냅샷 우선 → selective fetch 순서로 API 호출 최소화 | `e8b6aa3` |
| MapView 팝업 북마크 | `MapViewInner.tsx` — 선택된 장소 팝업에 BookmarkButton 추가 | `e8b6aa3` |

**성능 효과**:
- 이전: 상세 페이지 매 요청마다 Seoul API 5개 병렬 호출 (~1–2초)
- 이후: DB 스냅샷 우선(~50ms) → 미스 시 ID prefix로 1개만 fetch (~300ms)
- 재방문 시 거의 항상 스냅샷 히트로 API 호출 0회

## Phase 47 작업 요약

| 항목 | 내용 | 커밋 |
|---|---|---|
| isAdminAuthorized() 신규 | `lib/utils/admin-auth.ts` — ADMIN_SECRET 미설정→공개, 설정→?secret= 검증 | `79dd4ed` |
| env.ts ADMIN_SECRET 추가 | 옵셔널 환경변수 (미설정 시 '' — 하위 호환) | `79dd4ed` |
| admin 페이지 접근 제어 | `app/admin/page.tsx` — searchParams.secret 불일치 시 notFound() | `79dd4ed` |
| coords.test.ts 신규 | `toSeoulLatLng` 경계 케이스 16개 (유효/무효/경계값/API 특수케이스) | `79dd4ed` |
| admin-auth.test.ts 신규 | `isAdminAuthorized` 공개/보호 모드 8개 케이스 | `79dd4ed` |
| admin E2E 확장 | 1→2개 (공개모드 접근 + ?secret= 파라미터) | `79dd4ed` |

**운영 적용**:
- `ADMIN_SECRET` 미설정 시 기존과 동일하게 `/admin`은 공개 (배포 무중단)
- 보호 필요 시: Vercel 대시보드에서 `ADMIN_SECRET=<임의값>` 설정 후 재배포
- 접근: `https://seoul-30-webapp.vercel.app/admin?secret=<값>`

## Phase 46 작업 요약

| 항목 | 내용 | 커밋 |
|---|---|---|
| enrichPlace() 신규 | `lib/adapters/enrichment.ts` — sourceType별 기본 태그 자동 추론 | `16de8f4` |
| fetchSeoulPlaces 적용 | 5개 소스 통합 후 `.map(enrichPlace)` | `16de8f4` |
| PARK timefit 보정 | `lib/scoring.ts` — hours 없는 PARK → 5점→10점 | `16de8f4` |
| feedbackBonus 표시 | `ScoreBadge.tsx` SCORE_REASONS + ko/en 번역 추가 | `16de8f4` |
| 테스트 9개 추가 | `tests/unit/place-enrichment.test.ts` | `16de8f4` |
| scoring 테스트 2개 추가 | PARK timefit=10, LIBRARY timefit=5 케이스 | `16de8f4` |

**효과**:
- 실제 API 장소(도서관/공원/체육/문화공간/행사)가 태그 필터에 올바르게 반응
- 공원이 야간 시간대에 불이익을 받지 않음 (timefit 5→10)
- 이용자 평점이 높은 장소에 "이용자 호평" 뱃지 표시

## Phase 43–45 작업 요약

| Phase | 내용 | 커밋 |
|---|---|---|
| 43 | SW 캐시 전략 고도화 (4-tier v2, SKIP_WAITING) | `37127f5` |
| 44 | push-send 유닛 테스트 8개 (auth/CRON/410 cleanup) | `c63dc25` |
| 45 | JSON-LD TouristAttraction + 유닛 11개 + i18n E2E 안정화 | `bad9719` |

## Phase 36–42 작업 요약

| Phase | 내용 | 커밋 |
|---|---|---|
| 36 | 10개 mock 장소 실재 시설로 교체 + 좌표 보정 | `d7557c2` |
| 37 | 태그 기반 시설 필터 (FilterBar pills + URL sync) | `bbac72f` |
| 38 | 접근성 + Core Web Vitals (WCAG 1.4.4, preconnect) | `771cc15` |
| 39 | 서울 실시간 혼잡도 테스트 커버리지 8개 케이스 | `1c688af` |
| 40 | 피드백 점수 반영 + 최근 조회 soft-dedup | `4eaa83f` |
| Fix | next-intl MISSING_MESSAGE crash 방어 | `7fd9df3` |
| 41 | /admin 진단 대시보드 (서버 렌더링) | `193a511` |
| 42 | E2E 스펙 1 → 13개 확장 (4개 파일) | `7b9b681` |

---

## Phase 31–32 + Pin Accuracy 작업 요약

### Phase 31 — Mock Data Expansion (2026-05-21)
- `lib/mock/places.ts` — 15 → 38개 장소로 확장, 17개 자치구 커버
- 모든 장소에 Unsplash `imageUrl` 추가 (카테고리별 고품질 이미지 URL)
- `PlaceTag` 타입 정의: `'indoor' | 'outdoor' | 'wheelchair' | 'family' | 'pet' | 'parking' | 'wifi'`
- 모든 38개 장소에 `tags` 배열 + `nearestStation` (가장 가까운 역) 추가

### Phase 32 — Detail Page Enrichment (2026-05-21)
- `lib/types/place.ts` — `PlaceTag` union 타입, `tags?`, `nearestStation?` 필드 추가
- `messages/ko.json` + `messages/en.json` — `detail` 네임스페이스:
  - `detail.nearestStation`: "가장 가까운 역" / "Nearest Station"
  - `detail.tags.indoor/outdoor/wheelchair/family/pet/parking/wifi`
- `app/place/[id]/page.tsx` — 상세 페이지 전면 재설계:
  - **Hero image 섹션** (full-width, h-52): imageUrl 있으면 `<img>`, 없으면 카테고리별 Lucide 아이콘 + 색상 배경 (`CATEGORY_HERO` 맵)
  - **Tag chips 행**: `TAG_CONFIG` 맵 (각 태그별 Lucide 아이콘 + Tailwind 색상 클래스)
  - **Nearest station 행**: `MapPin` 아이콘 + `place.nearestStation` 텍스트
  - **레이아웃 순서**: back button → hero → name/share/bookmark → fee badge → tags → description → info card → minimap → feedback → directions
  - `getTranslations('detail')` as `tDetail` 추가 (기존 `tCommon` 유지)

### Pin Accuracy Fix (2026-05-21, Phase 32+ 독립 작업)
- **`lib/utils/coords.ts`** (신규):
  ```typescript
  const SEOUL = { latMin: 37.413, latMax: 37.715, lngMin: 126.734, lngMax: 127.270 }
  export function toSeoulLatLng(rawLat, rawLng): { latitude?: number; longitude?: number }
  // NaN, 0, 경계 밖 → {} 반환
  ```
- **`lib/data/seoulLibrary.ts`**: 기존 `lng===0` 누락 방어 버그 수정, `toSeoulLatLng` 적용
- **`lib/data/seoulParks.ts`**: `toSeoulLatLng` 적용
- **`lib/data/seoulSports.ts`**: `toSeoulLatLng(r.Y, r.X)` 적용 (X=경도, Y=위도)
- **`lib/mock/places.ts`**: 38개 좌표 전면 보정 (주요 수정: mock-13 3km lng 오차, mock-36 2.7km, mock-9 1.5km)
- **`components/seoul30/PlaceMiniMap.tsx`**: zoom 16 → 15

---

## 이전 주요 Fix 이력

### E2E CI fix — GPS onboarding modal (2026-05-21)
- `tests/e2e/home.spec.ts` — `test.beforeEach`에 `page.addInitScript`로 `seoul30_gps_onboarding='shown'` 사전 주입
- `PlaceCard.tsx` — Link에 `data-testid="place-card-link"` 추가 (EmptyState 링크와 구분)
- E2E 셀렉터: `[data-testid="place-card-link"]`

### React Hydration Error #418 fix
- `components/seoul30/Hero.tsx` — greeting `<p>` 태그에 `suppressHydrationWarning` 추가
- 원인: `getGreetingKey()`가 서버(UTC)와 클라이언트(KST) 시간 불일치

### Naver Maps 적용 (Post-Phase-25)
- `MapViewInner.tsx` — 위성 뷰 토글, 현재 위치, 그리드 클러스터링, `onSelectPlace` 콜백
- `PlaceMiniMap.tsx` — 단일 마커 미니맵, zoom 15, `ncpKeyId` 인증
- 좌표 순서: `new naver.maps.LatLng(lat, lng)` (위도 먼저)
- 인증 파라미터: `ncpKeyId` (구 `ncpClientId` 아님)

---

## Phase 33 작업 요약

### Phase 33 — 실제 장소 이미지 연동 (TourAPI 4.0)
- `lib/data/tourImages.ts` 신규: TourAPI 4.0 `searchKeyword2`로 `contentid` 매칭 후 `detailImage2` 이미지 조회
- `app/api/places/route.ts`: 실제 API 결과 중 `imageUrl` 없는 최종 top-10 장소에만 이미지 보강
- `lib/config/env.ts`: 서버 전용 `TOUR_API_KEY` 추가, `ENABLE_CULTURE_EVENTS_API=true`일 때 필수 검증
- `.env.example` + `README.md`: `TOUR_API_KEY` 수동 설정 안내 추가
- `tests/unit/tourImages.test.ts`: 키 미설정, 기존 이미지 유지, detailImage2 조회, 결과 병합 테스트 추가
- 검증: `cmd /c npx tsc --noEmit`, `cmd /c npm run test` (53/53), `cmd /c npm run build` 통과

## Phase 33.5 + Phase 34 작업 요약

### Phase 33.5 — Mock Place Audit & Pin Accuracy Prep
- `docs/MOCK_PLACE_AUDIT.md` 신규: TourAPI 키 재발급 가이드, 좌표 출처 우선순위, 삭제/대체 의심 mock 목록 정리
- `tests/unit/mock-places.test.ts` 신규: mock place id/slug 중복, 필수 표시 필드, Seoul bounds 좌표 검증
- `lib/adapters/seoul-culture.adapter.ts`: culture event/space 좌표를 `toSeoulLatLng()`로 검증
- 공식 API 조회 결과 `culturalSpaceInfo`의 DDP가 `X_COORD=37.567...`, `Y_COORD=127.009...` 형태임을 확인하여 문화공간 좌표 방향 수정
- Phase 34 전에 `mock-1`, `mock-2`, `mock-14`, `mock-15`, `mock-29`, `mock-31`, `mock-35`~`mock-38`은 삭제/대체/좌표 보정 검토 필요
- 중요: 노출된 `TOUR_API_KEY`는 data.go.kr에서 재발급 후 `.env.local` + Vercel env 교체 필요

- `lib/data/place-detail.ts` 신규: 실제 Seoul API 장소 id도 상세 페이지에서 조회 가능, mock fallback 유지
- `lib/utils/place-distance.ts` 신규: 좌표가 있는 장소만 Haversine 직선거리로 근처 추천
- `app/place/[id]/page.tsx`: 미니맵 아래 "근처 다른 장소" 섹션 추가
- `messages/ko.json` + `messages/en.json`: nearby detail strings 추가
- `tests/unit/place-distance.test.ts`: 거리순 정렬, 좌표 없는 장소 제외 테스트 추가
- 복지시설 API 확인: 동작구 `fcltOpenInfo_DJ`는 주소는 제공하지만 lat/lng가 없어, 네이버맵 핀 정확도 원칙에 따라 지도/추천 통합은 보류
- 로컬 3001 확인: production과 같은 실제 API 모드에서 첫 결과 `ce-*` 상세 페이지 200 확인

---

## 작업 규칙 (Codex 준수 필수)

1. **phase 연달아 작업 금지** — 각 phase 완료 후 결과 보고 + GitHub Actions + Vercel 배포 확인 후 다음 진행
2. **비용 발생 시 반드시 질문** — Vercel Hobby + Neon Free 유지, 유료 서비스 사전 승인 필수
3. **env 파일 변경 전 허락** — `.env.local` 또는 Vercel env var 추가 시 사전 승인
4. **API 키 절대 코드에 포함 금지** — `lib/config/env.ts`에 참조만, 값은 환경변수
5. **외부 API 호출은 서버 사이드만** — `NEXT_PUBLIC_` prefix는 브라우저 노출 안전한 값에만
6. **scope creep 금지** — 요청된 phase 범위 내에서만 구현

---

## 환경변수 현황

| Variable | Scope | 상태 |
|---|---|---|
| `DATABASE_URL` | server | Vercel env 설정됨 |
| `SEOUL_OPEN_API_KEY` | server | Vercel env 설정됨 |
| `NEXT_PUBLIC_BASE_URL` | both | Vercel env 설정됨 |
| `USE_MOCK_DATA` | server | Vercel env 설정됨 |
| `ENABLE_CULTURE_EVENTS_API` | server | Vercel env 설정됨 |
| `ENABLE_REALTIME_CITY_DATA` | server | Vercel env 설정됨 |
| `VAPID_EMAIL` | server | Vercel env 설정됨 |
| `VAPID_PUBLIC_KEY` | server | Vercel env 설정됨 |
| `VAPID_PRIVATE_KEY` | server | Vercel env 설정됨 |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | browser | Vercel env 설정됨 |
| `CRON_SECRET` | server | Vercel env 설정됨 |
| `NEXT_PUBLIC_NAVER_MAP_CLIENT_ID` | browser | Vercel env 설정됨 (ncpKeyId 형식) |
| `TOUR_API_KEY` | server | **수동 설정 필요 — `.env.local` + Vercel env에 추가 후 재배포** |
| `SNAPSHOT_TTL_SECONDS` | server | 선택 — 기본 7200(2h). Vercel env에서 조정 가능 |
| `ADMIN_SECRET` | server | 선택 — 미설정 시 /admin 공개, 설정 시 ?secret= 파라미터 필요 |

---

## 검증 상태 (Additional Phase 완료 기준 — 2026-05-26)

- `npx tsc --noEmit` — 통과 (0 오류) ✅
- `npx vitest run` — 134/134 통과 ✅
- `npx playwright test` — 15/15 통과 ✅
- Vercel 배포 — 정상 (https://seoul-30.vercel.app)
- Naver Maps 핀포인트 — 최대 30개 표시, 38개 mock 좌표 보정 완료
- 상세 페이지 — hero image, tag chips, nearest station + JSON-LD 표시 확인
- 북마크/최근본 — place 데이터 localStorage 저장으로 실 API 장소 표시 지원
- /admin 진단 대시보드 — 접근 가능 확인
- next-intl MISSING_MESSAGE — onError 핸들러로 크래시 방지
- i18n E2E — serviceWorkers:block + waitForNavigation 안정화

## Do-Not-Touch Rules

- `components/ui/` — shadcn 자동 생성 파일, 직접 편집 금지
- `.env.local` — 커밋 금지, gitignore 확인
- `proxy.ts` — Next.js 16 미들웨어 (rate limiting), 목적 외 수정 금지
- `lib/scoring.ts` — 6차원 scoring 로직, phase 범위 없이 수정 금지

## Windows Prisma DLL 잠금 규칙

**dev 서버 켠 상태에서 `prisma generate` 절대 실행 금지.**

- `npm run dev` = `predev`(prisma generate) → `next dev` 자동 순서 실행
- schema.prisma 변경 시: **dev 중지 → generate → db push → dev 재시작**
- 오류 발생 시: `Stop-Process -Name node -Force` → `.prisma` 삭제 → generate 재실행
- 상세 가이드: [docs/WINDOWS_PRISMA_DLL_LOCK.md](WINDOWS_PRISMA_DLL_LOCK.md)
