# HANDOFF

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
