# HANDOFF

---

## ▶ 다음 작업 계획 — Phase 66–70 (Codex 인계)

> **인계 기준일**: 2026-05-27<br>
> **현재 브랜치**: master<br>
> **현재 테스트**: 유닛 253개 · E2E 16개 · TS 0 오류<br>
> **배포 URL**: https://seoul-30-webapp.vercel.app<br>
> **Phase 62–65**: 완료 (이 파일 하단 기록 참조)<br>
> **작업 원칙**: 각 Phase는 독립적으로 완료 가능. Phase 연달아 진행 금지 — 완료 보고 후 다음 진행.<br>
> **배포 원칙**: 각 Phase 완료 후 검증 결과를 문서화하고 `master`에 커밋/푸시하여 GitHub Actions와 Vercel 자동 배포를 확인한다.

### Phase 방향 요약 (66–70)

| Phase | 분류 | 핵심 목표 |
|---|---|---|
| 66 | 유지보수 | 개발 환경 안정화 — dev/build/Prisma/CI 루틴 정비 |
| 67 | 유지보수 | 지도·위치 회귀 테스트 강화 — MapView Playwright smoke |
| 68 | 유지보수 | 문서·인코딩 정리 — HANDOFF/RUNBOOK/known issues 갱신 |
| 69 | 소규모 기능 | 추천 설명력 개선 — 스코어 breakdown 사용자 노출 |
| 70 | 소규모 기능 | 저장함·최근본 UX 고도화 — 정렬·카드 UI 개선 |

> **우선순위 원칙**: 66–68 유지보수 완료 후 69–70 기능확장. 환경성 문제가 해결되지 않은 상태에서 기능확장 금지.

---

## Phase 66 - 개발 환경 안정화 ✅ 완료 (2026-05-27)

**목표**: npm run dev · build · Prisma · CI 파이프라인의 반복성 문제를 정리하고, 신규 기여자(Codex 포함)가 환경 설정 없이 작업을 시작할 수 있는 루틴을 문서화한다.

### 배경 (수정 동기)

아래 문제들이 반복적으로 발생했으며, 코드 변경과 무관하게 환경성 원인으로 시간을 소모했다:

- **Prisma 7.8.0 DLL 잠금**: Windows에서 `npm run dev` 실행 중 `prisma generate` 재실행 시 `.prisma/` DLL 잠금으로 `EPERM` 에러 발생
- **npm 10 lockfile 불일치**: `package-lock.json` 버전이 CI(Node 20 + npm 10)와 로컬에서 달라 `npm ci` 실패
- **Naver Maps CSP 누락**: NCP 콘솔 등록 도메인 불일치로 지도 렌더링 실패 (로컬 `localhost:3001` 미등록)
- **E2E 로컬 hang**: Windows에서 Playwright 프로세스 종료 후 명령 프롬프트가 반응 없이 멈춤 (CI 정상)

### 작업 범위

**1. Prisma DLL 잠금 방지 루틴 문서화 및 `package.json` scripts 정비**
- `docs/WINDOWS_PRISMA_DLL_LOCK.md` 내용을 `docs/RUNBOOK.md`의 "로컬 개발" 섹션으로 통합
- `package.json`의 `predev` 훅(`prisma generate`) 동작을 주석 및 README에 명시
- `.prisma/` 캐시 디렉토리를 `.gitignore`에 있는지 확인 (없으면 추가)
- **코드 변경 최소화** — 스크립트 변경 없이 문서로만 해결

**2. npm 10 lockfile 동기화**
- 로컬에서 `npm install` 재실행 후 `package-lock.json` 을 `npm ci` 호환 상태로 커밋
- `.github/workflows/ci.yml`에서 `npm ci` 실패 시 원인이 lockfile인지 판별하는 주석 추가
- Node 버전 핀: `.nvmrc` 또는 `engines` 필드에 `"node": ">=20"` 명시 여부 확인 → 없으면 추가

**3. Naver Maps NCP 도메인 등록 체크리스트**
- `docs/RUNBOOK.md`에 "Naver Maps 지도 미표시 대응" 섹션 추가:
  - NCP 콘솔 → Application → Web 서비스 URL에 등록해야 하는 도메인 목록
  - 로컬: `http://localhost:3001`
  - 프로덕션: `https://seoul-30-webapp.vercel.app`
  - Preview: Vercel preview URL 와일드카드 등록 방법 (`*.vercel.app`)
- 이 정보가 현재 어디에도 명시되지 않음 — 문서만 추가, 코드 변경 없음

**4. E2E 로컬 hang 해결책 문서화**
- `docs/RUNBOOK.md`에 "Windows E2E hang 해결" 추가:
  - `npx playwright test --reporter=list` 사용 권장 (progress reporter가 hang 빈도 낮음)
  - hang 발생 시: `taskkill /F /IM node.exe /T` 로 강제 종료
  - CI는 정상이므로 로컬 실패 시 CI 결과로 판단
- `.github/workflows/ci.yml`에 `--reporter=list` 옵션이 이미 있는지 확인

**5. `.env.example` 최신화**
- `SNAPSHOT_TTL_SECONDS`, `ADMIN_SECRET` 항목이 `.env.example`에 있는지 확인 → 없으면 추가 (Phase 61에서 env.ts에 추가됐으나 example 미반영 가능성)
- 각 변수에 한 줄 주석으로 용도 설명 추가

### 검증 방법
```bash
# lockfile 동기화 후
npm ci                  # CI 환경과 동일하게 클린 인스톨
npx tsc --noEmit        # TS 0 오류
npm run test            # 기존 테스트 수 이상 통과 (regression 없음)
npm run build           # 빌드 정상
# RUNBOOK 문서 추가 후 파일 존재 및 링크 유효성만 확인
```

### 금지 사항
- `lib/scoring.ts`, `prisma/schema.prisma` 수정 금지
- 새 npm 패키지 추가 금지 (문서·설정 변경만)
- Vercel env var 추가 금지 (기존 변수 문서화만)

### 완료 결과

| 항목 | 변경 파일 | 내용 |
|---|---|---|
| LF 정규화 | `.gitattributes` (신규) | `*.ts/tsx/js/md/yml` eol=lf, 바이너리 binary |
| Node 버전 핀 | `package.json` | `engines.node: ">=20"` 추가 |
| E2E hang 감소 | `playwright.config.ts` | `reporter: 'list'` 추가 |
| 환경변수 현행화 | `.env.example` | `SNAPSHOT_TTL_SECONDS`, `ADMIN_SECRET` 추가 |
| 운영 가이드 현행화 | `docs/RUNBOOK.md` | Windows Prisma DLL·E2E hang 주의사항, Naver Maps 시나리오 5, diagnostics 필드 전체, 환경변수 표 추가 |

**테스트**: 유닛 **254개** 통과 · TS 0 오류 · E2E 16개 (CI 기준)

---

## Phase 67 - 지도·위치 회귀 테스트 강화 ✅ 완료 (2026-05-27)

**목표**: Naver Maps 관련 런타임 장애(CSP, SDK 재마운트, 위치 기반 추천 흐름)가 배포 후 무음으로 터지지 않도록 Playwright smoke 테스트로 고정한다.

### 배경 (수정 동기)

- Naver Maps는 코드 자체보다 **next/script 재마운트**, **CSP 헤더 누락**, **NCP SDK runtime asset** 같은 배포 환경 조건이 실제 사용자 흐름에서 장애를 유발
- 현재 E2E(`home.spec.ts`)는 지도 탭 전환, 마커 표시, 위치 기반 추천 흐름을 검증하지 않음
- CSP의 Naver 허용 도메인이 변경될 때 자동으로 감지할 테스트가 없음

### 작업 범위

**1. MapView 탭 전환 Playwright smoke (`tests/e2e/home.spec.ts` 또는 신규 `map.spec.ts`)**
- "지도 보기" 탭 클릭 → `[data-testid="map-view"]` 또는 Naver Maps canvas 요소가 DOM에 존재하는지 확인
- 지도 렌더링 실패 시 `MapErrorFallback` 컴포넌트가 표시되는지 확인 (긍정/부정 케이스 분리)
- GPS 권한은 `page.context().grantPermissions(['geolocation'])` + `setGeolocation()` 으로 모킹
- **주의**: 실제 Naver SDK 로딩은 CI 샌드박스에서 차단될 수 있음 → `USE_MOCK_DATA=true` 상태에서만 실행, SDK 로딩 완료 assert는 제외

**2. CSP 헤더 Naver 도메인 회귀 테스트 (`tests/unit/security-headers.test.ts`)**
- 기존 테스트에 Naver Maps CSP 도메인 항목 추가 확인:
  - `oapi.map.naver.com` (SDK script)
  - `openapi.map.naver.com` (API)
  - `*.pstatic.net` (타일 이미지 CDN)
- 이미 있으면 pass, 없으면 assert 추가
- CSP 변경 시 자동으로 실패하도록 고정

**3. 위치 기반 추천 흐름 smoke (`tests/e2e/home.spec.ts`)**
- `setGeolocation({ latitude: 37.5665, longitude: 126.9780 })` (서울 시청 좌표)
- LocationOnboardingModal "허용" 버튼 클릭 → 장소 목록이 정렬 업데이트되는지 확인
- 에러 없이 `[data-testid="place-card-link"]` 가 하나 이상 표시되면 pass

**4. `next/script` Naver SDK 재마운트 방어 확인**
- 현재 `MapView.tsx` / `MapViewInner.tsx`가 SDK 중복 로드를 방어하는지 코드 확인
- 방어 로직(`window.naver` 존재 체크 또는 `onLoad` 콜백 중복 방지)이 없으면 추가
- 단위 테스트로 검증 불가 → Playwright에서 페이지 재방문 후 지도 에러 없음으로 확인

### 검증 방법
```bash
npm run test                       # 유닛 regression 없음
npm run test:e2e                   # 신규 smoke 포함 전체 통과
npm run test:e2e -- map.spec.ts    # 지도 smoke 개별 실행
```

### 금지 사항
- 실제 Naver SDK 네트워크 호출을 CI에서 성공으로 assert 하지 말 것 (환경 의존)
- `MapViewInner.tsx` 리팩토링 금지 — smoke 통과에 필요한 최소한의 `data-testid` 추가만 허용
- GPS 기능 변경 금지 — 테스트용 `grantPermissions` 설정만 추가

### 완료 결과

| 항목 | 변경 파일 | 내용 |
|---|---|---|
| CSP 회귀 | `tests/unit/security-headers.test.ts` | 이미 oapi/openapi/pstatic 등 Naver 도메인 전체 커버 — 추가 불필요 |
| 지도 탭 smoke | `tests/e2e/map.spec.ts` (신규) | 지도 뷰 전환 · 리스트 복귀 2개 테스트 |
| 위치 기반 smoke | `tests/e2e/map.spec.ts` (신규) | 온보딩 모달 허용 · 버튼 직접 클릭 2개 테스트 |
| map-view-container | `app/page.tsx` | 지도 뷰 wrapper에 `data-testid="map-view-container"` 추가 |
| SDK 재마운트 방어 | `components/seoul30/MapView.tsx` 코드 확인 | `window.naver?.maps` 체크 이미 구현됨 — 변경 불필요 |

**설계 원칙**: SDK 로딩 결과(fallback/로딩/실제 지도)에 의존하지 않고 뷰 전환 동작만 검증.
CLIENT_ID 미설정 → `map-fallback` 렌더 케이스는 `MapView.test.tsx` 유닛 테스트가 담당.

**테스트**: 유닛 **254개** 통과 · E2E **20개** 통과 (신규 4개 추가)

---

## Phase 68 - 문서·인코딩 정리 (예정)

**목표**: 운영 판단에 사용되는 문서들을 현행 상태와 일치시키고, 인코딩 문제로 가독성이 떨어지는 문서를 수정한다. 코드 변경 없음.

### 배경 (수정 동기)

- 일부 `.md` 파일이 CRLF/LF 혼재 또는 인코딩 문제로 GitHub/Codex 환경에서 한글 깨짐 발생
- `docs/RUNBOOK.md`가 Phase 62–67 변경 사항을 반영하지 않아 운영 판단 시 오래된 정보 제공
- `docs/TASKS.md`가 완료된 항목과 미완료 항목이 혼재해 현행 상태를 파악하기 어려움
- `docs/ARCHITECTURE.md`의 파일 구조, 테스트 수가 Phase 65 기준으로 미동기화 가능성 있음

### 작업 범위

**1. 인코딩 문제 점검 및 수정**
- `docs/` 하위 `.md` 파일 전체를 UTF-8 BOM 없음 + LF 기준으로 정규화
- Windows CRLF로 저장된 파일 확인: `git diff --check` 또는 `file` 명령으로 파악
- `.gitattributes`에 `*.md text eol=lf` 규칙이 있는지 확인 → 없으면 추가
- **주의**: 코드 파일(`.ts`, `.tsx`, `.js`)은 건드리지 말 것 — `.md`만 대상

**2. `docs/RUNBOOK.md` 현행화**
- "헬스체크" 섹션: `/api/health` 응답 형식이 현재 코드와 일치하는지 확인
- "환경변수" 섹션: `SNAPSHOT_TTL_SECONDS`, `ADMIN_SECRET` 항목 추가 (Phase 61·47에서 추가됐지만 RUNBOOK 미반영 가능)
- "Naver Maps 지도 미표시" 섹션: Phase 66에서 추가한 NCP 도메인 체크리스트 연결
- "배포 롤백" 섹션: Vercel 롤백 절차가 현재 프로젝트 URL(`seoul-30-webapp.vercel.app`)과 일치하는지 확인
- "알려진 제한사항" 갱신: Windows E2E hang, Playwright 로컬 hang 항목 최신화

**3. `docs/TASKS.md` 정리**
- 완료된 Phase(53–67) 항목은 접어두거나 "완료" 섹션으로 이동
- 진행 중(68–70) 항목을 상단에 명확히 표시
- 형식: `- [x] 완료 항목` / `- [ ] 미완료 항목`

**4. `docs/ARCHITECTURE.md` 파일 구조 + 테스트 수 동기화**
- Phase 65 완료 후 변경된 파일(`EmptyState.tsx` 'use client' 제거, `ScoreBadge.tsx` 'use client' 제거, `next.config.mjs` analyzer 추가) 파일 구조 주석 갱신
- `# Total: 253 unit tests, 16 E2E specs` 수치 확인 후 업데이트
- `vitest.config.ts`, `next.config.mjs` 설명 현행화

**5. `README.md` 테스트 수 재확인**
- `npm run test` 주석의 테스트 수가 현재 실제 수(253개)와 일치하는지 확인 → 불일치 시 수정

### 검증 방법
```bash
git diff --check                   # CRLF 혼재 파일 없음 확인
npm run test                       # 문서 변경으로 테스트 영향 없음 확인
# GitHub에서 .md 파일 한글 렌더링 육안 확인
```

### 금지 사항
- `.ts`, `.tsx`, `.js` 코드 파일 수정 금지 — 문서·설정만 대상
- `package.json`, `package-lock.json` 수정 금지
- 새 기능 추가 금지

---

## Phase 69 - 추천 설명력 개선 (예정)

**목표**: 사용자가 "왜 이 장소가 추천됐는가"를 직관적으로 이해할 수 있도록 스코어 breakdown을 UI에 노출한다. 스코어링 로직 자체는 변경하지 않는다.

### 배경

- `lib/scoring.ts`의 6차원 스코어(`accessScore`, `categoryScore`, `costScore`, `crowdScore`, `timefitScore`, `freshnessScore`)가 내부적으로 계산되지만 사용자에게는 총점만 노출됨
- `ScoreBadge.tsx`에 `SCORE_REASONS` 기반 피드백 뱃지가 있지만 조건이 좁아 대부분의 장소에 표시되지 않음
- "도보 5분", "무료", "지금 운영 중" 같은 핵심 이유 2–3개를 카드에 칩 형태로 노출하면 전환율(상세 페이지 방문) 개선 가능

### 작업 범위

**1. `RecommendationResult` 타입에 `reasons` 필드 추가 (`lib/types/recommendation.ts`)**
```typescript
// 기존
export interface RecommendationResult {
  place: NormalizedPlace
  score: number
  transitMinutes?: number
}

// 추가
export interface RecommendationResult {
  place: NormalizedPlace
  score: number
  transitMinutes?: number
  reasons: RecommendReason[]   // 상위 2–3개 추천 이유
}

export type RecommendReason =
  | 'free'           // 무료
  | 'open_now'       // 지금 운영 중
  | 'nearby'         // 가까운 거리 (10분 이내)
  | 'low_crowd'      // 혼잡도 낮음
  | 'high_rated'     // 이용자 호평
  | 'new_event'      // 최근 행사 (7일 이내 시작)
```

**2. `scorePlace()` 함수에서 `reasons` 생성 (`lib/scoring.ts`)**
- **로직 변경 없음** — 기존 스코어 계산 결과를 읽어 `reasons` 배열만 추가로 반환
- 규칙 (단순, 명확한 조건만):
  - `isFree === true` → `'free'`
  - `timefitScore >= 8` → `'open_now'` (운영시간 내)
  - `accessScore >= 8` → `'nearby'` (이동시간 10분 이내 기준)
  - `crowdScore >= 8` → `'low_crowd'`
  - feedbackBonus >= 2 → `'high_rated'`
  - `freshnessScore >= 8` → `'new_event'`
- 최대 3개까지만 포함 (우선순위: nearby > free > open_now > high_rated > low_crowd > new_event)

**3. `PlaceCard.tsx`에 reasons 칩 표시**
- 카드 하단 또는 점수 뱃지 옆에 최대 2개 칩 표시
- 칩 스타일: Tailwind `text-xs font-medium px-2 py-0.5 rounded-full` + 카테고리 색상
- i18n: `ko.json` / `en.json`에 `reasons.free`, `reasons.open_now`, `reasons.nearby`, `reasons.low_crowd`, `reasons.high_rated`, `reasons.new_event` 키 추가

**4. 회귀 테스트 (`tests/unit/scoring.test.ts`)**
- `reasons` 필드가 올바르게 생성되는지 기존 테스트 케이스에 assert 추가
- `scorePlace()` 반환값 타입이 `RecommendationResult`와 일치하는지 TypeScript 수준에서 보장

### 검증 방법
```bash
npx tsc --noEmit        # 타입 오류 없음
npm run test            # scoring.test.ts 포함 전체 통과
npm run build           # 빌드 통과
```

### 금지 사항
- `lib/scoring.ts`의 기존 점수 계산 공식 변경 금지
- `reasons` 로직이 스코어 계산에 영향을 주어선 안 됨 (부가 필드만 추가)
- `components/ui/` shadcn 파일 수정 금지

---

## Phase 70 - 저장함·최근본 UX 고도화 (예정)

**목표**: bookmarks 페이지의 정렬·필터·카드 UI를 개선해 실제 사용 패턴(재방문 판단, 비교)을 지원한다.

### 배경

- 현재 북마크/최근본 장소 목록은 저장 순서 고정, 정렬 없음
- PlaceCard가 홈 추천 목록과 동일한 레이아웃 — bookmarks 문맥에 맞는 정보(저장 일시, 마지막 방문)가 없음
- 모바일 기준 카드 목록이 스크롤이 길어질 때 페이지 내 탭 전환이 비직관적

### 작업 범위

**1. 북마크 목록 정렬 옵션 추가 (`app/bookmarks/page.tsx`)**
- 정렬 기준: "저장 최신순" (기본) / "이름순" / "카테고리순"
- 정렬 상태는 `useState`로만 관리 (URL sync 불필요)
- i18n 키: `bookmarks.sortByDate`, `bookmarks.sortByName`, `bookmarks.sortByCategory`

**2. 최근본 목록 날짜 표시**
- `RecentTracker` 에서 `visitedAt` 타임스탬프가 localStorage에 저장되고 있는지 확인
- 저장 중이면: 카드에 "3일 전 방문" 형태 상대 시간 표시 (`lib/utils/relative-time.ts` 재사용)
- 저장 안 되고 있으면: `visitedAt: Date.now()` 함께 저장하도록 RecentTracker 수정 후 표시

**3. 빈 상태 UX 개선 (`app/bookmarks/page.tsx`)**
- 북마크 0개: "아직 저장한 장소가 없어요. 홈에서 마음에 드는 장소를 저장해보세요" + 홈 링크 버튼
- 최근본 0개: "최근에 방문한 장소가 없어요" + 홈 링크 버튼
- 현재 EmptyState 컴포넌트를 재사용하되, `action` prop으로 링크 버튼 추가 (없으면 추가)
- i18n 키: `bookmarks.emptyBookmarks`, `bookmarks.emptyRecent`, `bookmarks.goHome`

**4. 탭 스크롤 개선 (모바일)**
- 탭 전환 시 목록 상단으로 `window.scrollTo(0, 0)` 호출 — 현재 탭 전환 후 스크롤 위치가 유지되어 비직관적
- `useEffect([activeTab])` 에서 처리

### 검증 방법
```bash
npx tsc --noEmit        # 타입 오류 없음
npm run test            # 기존 테스트 regression 없음
npm run build           # 빌드 통과
npm run test:e2e        # bookmarks 관련 E2E 통과
```

### 금지 사항
- localStorage 스키마 변경 시 기존 저장 데이터와 하위 호환 유지 필수
  - `visitedAt` 없는 기존 항목은 표시 시 "방문 시간 미기록"으로 처리
- `components/ui/` 수정 금지
- 북마크 데이터를 서버(DB)로 이전하지 말 것 — localStorage 전략 유지

---

## Phase 완료 루틴

---

## Phase 완료 루틴

1. 구현 범위 확인: 해당 Phase 외 파일 변경이 섞였는지 `git status --short`와 `git diff`로 점검.
2. 검증: 최소 `npx tsc --noEmit`, `npm run test`, 위험도에 따라 `npm run build` / `npm run test:e2e` 실행.
3. 문서화: `docs/HANDOFF.md`, `docs/PROJECT_SCOPE.md`, `docs/ARCHITECTURE.md`, `docs/TASKS.md`, 필요 시 `README.md` 테스트 수 갱신.
4. Git 작업: `git add` → 의미 있는 메시지로 `git commit -m "..."` → `git push origin master`.
5. 배포 확인: GitHub Actions 결과와 Vercel Production 배포 완료 여부 확인. 배포 후 Phase 성격에 맞는 URL을 smoke check.
6. 다음 Phase 진행 전: 완료 결과와 검증/배포 상태 보고 후 사용자 승인 대기.

---

## Phase 62 - ISR + 정적 페이지 SEO 강화 (2026-05-27 완료 + 후속 수정)

**목표**: 검색엔진 인덱싱 품질 향상 — 장소 상세 페이지를 ISR(증분 정적 재생성)으로 전환하고, sitemap·robots 설정을 정비한다.

### 작업 범위

**1. 장소 상세 페이지 ISR 전환 (`app/place/[id]/page.tsx`)**
- 현재: `force-dynamic` (매 요청마다 서버 렌더링)
- 목표: `revalidate = 3600` (1시간 ISR) — 스냅샷 캐시와 동일 주기
- `generateStaticParams()` 는 구현하지 않음 (장소 ID가 동적이므로 on-demand ISR)
- `fetch` 호출에 `next: { revalidate: 3600 }` 옵션 전달 방식으로 전환
- 주의: `getPlaceDetailData()`가 내부적으로 Prisma를 사용하므로 ISR 적용 가능 범위 확인 필수

**2. sitemap 품질 개선 (`app/sitemap.ts`)**
- 현재 sitemap이 mock 장소 URL만 포함하거나 누락 여부 확인
- 정적 라우트(`/`, `/about`, `/privacy`, `/bookmarks`) 우선순위 설정
- 장소 상세 URL은 스냅샷 DB에서 placeId 목록을 조회해 동적으로 포함
- `changeFrequency`, `priority`, `lastModified` 필드 정확히 설정

**3. robots.ts 확인 및 정비 (`app/robots.ts`)**
- `/admin` 경로 크롤링 차단 여부 확인
- `/api/*` 경로 disallow 확인
- Vercel 배포 도메인(`NEXT_PUBLIC_BASE_URL`) 기반 sitemap URL 생성

**4. OG 메타데이터 검토 (`app/place/[id]/opengraph-image.tsx`)**
- 장소 이미지 없을 때 fallback OG 이미지 정상 렌더링 확인
- `og:url` 정규 URL 설정 여부 확인

### 검증 방법
```bash
npm run build          # 빌드 오류 없음 확인
npx tsc --noEmit       # TS 0 오류 확인
npm run test           # 247개 이상 통과 (regression 없음)
curl https://seoul-30-webapp.vercel.app/sitemap.xml   # 배포 후 sitemap 확인
```

### 금지 사항
- `generateStaticParams()` 로 전체 장소를 빌드 타임에 pre-render 하지 말 것 (API 쿼터 소진)
- mock 장소 ID를 sitemap에 하드코딩하지 말 것

### 후속 점검/수정 결과
- `app/sitemap.ts`: 스냅샷이 비어 있을 때 `MOCK_PLACES`로 fallback하던 동작 제거. mock place URL이 sitemap에 노출되지 않도록 수정.
- `app/place/[id]/opengraph-image.tsx`: Prisma 기반 상세 조회를 사용하므로 `runtime = 'nodejs'` 명시.
- `tests/unit/seo-metadata.test.ts`: sitemap snapshot URL, mock fallback 금지, robots admin/API 차단 회귀 테스트 추가.
- 검증: `npx tsc --noEmit`, `npm run test`(252개), `npm run build` 통과.

---

## Phase 63 - Push 알림 열람률 추적 (2026-05-27 완료)

**목표**: Push 알림 클릭 후 실제 앱 방문을 측정할 수 있도록 UTM 파라미터를 딥링크 URL에 추가한다.

### 작업 범위

**1. Push 알림 딥링크 URL에 UTM 파라미터 추가 (`app/api/push/send/route.ts`)**
- 현재 딥링크: `/?category=culture`
- 목표: `/?category=culture&utm_source=push&utm_medium=notification&utm_campaign=daily`
- `utm_campaign` 값은 `send` API 호출 시 쿼리스트링으로 받거나 날짜 기반 자동 생성

**2. SW notificationclick URL 전달 유지 확인 (`public/sw.js`)**
- 현재 `existing.navigate(url)` 로 딥링크 URL을 그대로 전달하는지 확인
- UTM이 포함된 URL이 탈락 없이 브라우저로 전달되는지 검증

**3. UTM 파라미터 수신 확인 (`app/page.tsx`)**
- `useSearchParams()`에서 `utm_source` 등을 읽어 Vercel Analytics에 이벤트 전송 (선택)
- 단순히 URL에 포함하는 것만으로도 Vercel Analytics / Google Analytics가 자동 추적함
- 별도 클라이언트 이벤트 코드는 오버엔지니어링이므로 URL 주입만 구현

**4. 회귀 테스트 추가 (`tests/unit/push-send.test.ts`)**
- 기존 `push-send.test.ts`에 UTM 파라미터 포함 여부 테스트 추가
- `notificationData.url`에 `utm_source=push`가 포함되는지 assert

### 완료 결과
- `app/api/push/send/route.ts`: 알림 payload URL에 `utm_source=push`, `utm_medium=notification`, `utm_campaign` 자동 추가.
- 기본 캠페인은 `daily`; `/api/push/send?campaign=weekly_digest` 처럼 호출하면 `utm_campaign` 값으로 반영.
- 카테고리 딥링크는 `/?category=culture&utm_source=push&utm_medium=notification&utm_campaign=daily` 형태 유지.
- `public/sw.js`: 기존 `event.notification.data.url` → `existing.navigate(url)` / `clients.openWindow(url)` 전달 구조 확인, 회귀 테스트 보강.
- `tests/unit/push-send.test.ts`: UTM 기본값과 커스텀 캠페인 검증 추가.
- 검증: `npm run test -- tests/unit/push-send.test.ts tests/unit/service-worker-cache.test.ts` 통과 (18개), `npm run test` 통과 (252개), `npx tsc --noEmit` 통과.

### 주의 사항
- UTM 파라미터는 사용자에게 노출되는 URL에만 추가 (서버 로그·DB에 저장 금지)
- Vercel 무료 플랜에서 Analytics는 이미 활성화됨 — 추가 비용 없음
- `CRON_SECRET` 인증 로직은 건드리지 말 것

---

## Phase 64 - 필터 UX 개선 (2026-05-27 완료)

**목표**: 복합 필터(카테고리+태그+자치구+시간+무료+운영중+검색어) 상태의 URL 동기화 안정화와 사용자 편의 개선.

### 작업 범위

**1. 필터 초기화 버튼 추가 (`app/page.tsx`, `components/seoul30/FilterBar.tsx`)**
- 활성 필터가 1개 이상일 때 "필터 초기화" 버튼 표시
- 클릭 시 모든 필터를 기본값으로 리셋 + URL 쿼리스트링 제거
- i18n 키: `common.resetFilters` (ko: "초기화", en: "Reset")

**2. 활성 필터 수 뱃지 표시**
- FilterBar 또는 모바일 필터 토글 버튼에 활성 필터 수 표시 (예: "필터 3")
- 필터 패널이 닫혀 있을 때도 현재 적용된 필터 수를 알 수 있게

**3. URL 동기화 엣지케이스 수정**
- 페이지 새로고침 시 URL 쿼리스트링에서 필터 상태 복원 검증
- 브라우저 뒤로가기 시 필터 상태 복원 검증
- `useSearchParams` + `useRouter.replace` 패턴 일관성 확인

**4. 모바일 필터 패널 접근성**
- 필터 패널 열기/닫기 버튼에 `aria-expanded` 추가
- 필터 패널 닫힌 상태에서 ESC 키 동작 무시 (현재 PushSubscribeButton과 충돌 가능성 확인)

### 검증 방법
```bash
npm run test           # 기존 테스트 regression 없음
npm run test:e2e       # filter.spec.ts 통과 확인
```

### 주의 사항
- `lib/scoring.ts` 수정 금지 — 필터는 하드 필터(route.ts)에서 적용, scoring 로직 불변
- 태그 필터 AND 교집합 로직(`tag-filter.test.ts`) regression 금지

### 완료 결과
- `components/seoul30/FilterBar.tsx`: 활성 필터 수 배지(`필터 {count}` / `Filters {count}`)와 `common.resetFilters` 기반 초기화 버튼 추가.
- `app/page.tsx`: URL 필터 파싱을 `parseUrlState()`로 정규화하고, `time` 쿼리 누락을 수정. 새로고침 및 `popstate` 뒤/앞 이동 시 URL 상태를 복원.
- `app/page.tsx`: 초기화 버튼 클릭 시 category/time/free/open/search/tags/district를 기본값으로 되돌리고 URL query를 제거. 위치 기반 정렬 상태도 기존 동작대로 함께 초기화.
- `messages/ko.json`, `messages/en.json`: `common.resetFilters`, `common.activeFiltersCount` 추가.
- `tests/components/FilterBar.test.tsx`: 활성 필터 수 및 reset callback 테스트 추가.
- `tests/e2e/filter.spec.ts`: query 기반 복합 필터 복원, reset 후 query 제거 회귀 테스트 추가.
- 모바일 전용 필터 패널은 현재 코드베이스에 별도 구현이 없어 신규 패널을 만들지 않음. 기존 필터 버튼들은 `aria-pressed`/group label을 유지하고, 새 배지는 닫힌 패널에 종속되지 않는 상시 표시 UI로 처리.

### 검증 결과
- `npx tsc --noEmit` — 통과.
- `npm run test -- tests/components/FilterBar.test.tsx` — 3개 통과.
- `npm run test` — 253개 통과.
- `npm run build` — 통과.
- `npm run test:e2e -- tests/e2e/filter.spec.ts` — 6개 스펙 모두 `ok`; 로컬 Windows/샌드박스 네트워크 차단 로그로 명령 종료 전 timeout 발생(기존 문서화된 로컬 hang 계열, 테스트 assertion 실패 없음).

---

## Phase 65 - 성능 최적화 (2026-05-27 완료)

**목표**: 번들 크기 분석 및 불필요한 Client Component를 Server Component로 이동. LCP·INP·CLS 지표 개선.

### 작업 범위

**1. 번들 분석 (`@next/bundle-analyzer`)**
- `npm install --save-dev @next/bundle-analyzer` 후 `next.config.mjs`에 analyzer 설정
- `ANALYZE=true npm run build` 로 번들 리포트 생성
- 주요 확인 항목: shadcn/ui 컴포넌트 중 사용하지 않는 것, lucide-react 아이콘 tree-shaking 적용 여부
- 분석 후 `@next/bundle-analyzer`는 devDependency 유지, `next.config.mjs` 설정은 env 플래그로 조건부 활성화

**2. 불필요한 `'use client'` 제거**
- `'use client'` 선언된 컴포넌트 중 상태·이벤트가 없는 순수 표시 컴포넌트 확인
- 후보: `PlaceImage.tsx`, `EmptyState.tsx`, `ScoreBadge.tsx` — 실제 파일 읽고 판단
- Server Component 전환 시 `onClick`/`useState`/`useEffect` 사용 여부 먼저 확인 필수

**3. lucide-react 아이콘 최적화**
- 현재 `import { MapPin, Clock, ... } from 'lucide-react'` 방식 확인
- Next.js + lucide-react 최신 버전은 named export tree-shaking 지원 — 추가 작업 불필요할 수 있음
- 번들 분석 결과 lucide가 크면 `import MapPin from 'lucide-react/dist/esm/icons/map-pin'` 방식으로 전환

**4. 이미지 preload 힌트 추가 (`app/layout.tsx`)**
- LCP 이미지(홈 화면 첫 번째 PlaceCard 이미지)를 예측할 수 없으므로 `fetchpriority="high"` 속성 적용 검토
- `PlaceImage.tsx`에서 첫 번째 이미지에 `priority` prop 전달하는 패턴 확인

### 주의 사항
- `components/ui/` (shadcn 자동 생성) 수정 금지
- `ANALYZE=true` 빌드 산출물(`.next/analyze/`)은 `.gitignore`에 추가
- Server Component 전환은 실제 파일을 읽어 확인 후 진행 — 추정으로 수정 금지

### 완료 결과
- `@next/bundle-analyzer` devDependency 추가, `next.config.mjs`에 `ANALYZE=true` 조건부 analyzer 래퍼 적용.
- `.gitignore`에 `.next/analyze/` 명시 추가.
- `components/seoul30/EmptyState.tsx`, `components/seoul30/ScoreBadge.tsx`: 상태/이벤트가 없는 순수 표시 컴포넌트라 명시적 `'use client'` 제거.
- `components/seoul30/PlaceImage.tsx`: 기존 `priority` 전달 구조를 유지하고 LCP 후보 이미지에 `fetchPriority="high"`가 같이 전달되도록 보강.
- `PlaceImage.tsx`는 `onError` fallback 상태가 있어 Client Component 유지.
- Analyzer 확인 결과 `lucide-react`는 개별 ESM icon 파일 단위로 tree-shaking됨. 직접 `dist/esm/icons/*` import 전환은 이득이 작아 보류.
- `components/ui/` 자동 생성 파일들은 수정하지 않음. 분석 리포트상 실제 라우트 번들에는 사용된 UI 컴포넌트만 포함됨.

### 검증 결과
- `npx tsc --noEmit` — 통과.
- `npm run build` — 통과.
- `ANALYZE=true` + `npx next build --webpack` — 통과, `.next/analyze/client.html`, `nodejs.html`, `edge.html` 생성 확인.
- 참고: Next 16 기본 `next build`는 Turbopack이라 기존 `@next/bundle-analyzer` 리포트를 생성하지 않음. 분석 시 PowerShell 기준 `$env:ANALYZE='true'; npx next build --webpack; Remove-Item Env:ANALYZE` 사용.

---

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
| `@tests` alias | vitest.config.ts + tsconfig.json에 추가 | 테스트 파일이 전체 `tsc --noEmit` 대상에 포함되어 TS 검증에도 alias 필요 |
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
- **배포 URL**: https://seoul-30-webapp.vercel.app
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
- Vercel 배포 — 정상 (https://seoul-30-webapp.vercel.app)
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
