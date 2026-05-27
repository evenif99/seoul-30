# BUGFIX 기록

> Phase 66–70 누적 코드베이스에 대한 버그 감사 및 수정 기록  
> 감사 기준일: 2026-05-27

---

## 감사 범위

전체 코드를 대상으로 버그 발생 가능 지점을 분류하고, 우선순위별로 3개 그룹(Group A/B/C)에 나누어 순차 수정한다.

| 그룹 | 포함 버그 | 특성 | 상태 |
|---|---|---|---|
| Group A | BUG-01, 02, 04, 05 | 시간 판정 로직 공유 — 단일 커밋 필수 | ✅ 완료 (`7d4c301`) |
| Group B | BUG-06, 07, 08 | 독립 안전 픽스 | ✅ 완료 (이 커밋) |
| Group C | BUG-03 | 데이터 파괴적 변경 (별도 Phase) | 🔜 예정 |

> **BUG-09 재평가**: `getTourApiKey()`의 `process.env.TOUR_API_KEY ?? env.TOUR_API_KEY` 패턴은  
> `vi.stubEnv` 테스트 격리를 위해 의도된 구현. 실제 버그 아님으로 판정, 픽스 제외.

---

## Group A — 시간 로직 통합 (BUG-01/02/04/05)

**커밋**: `7d4c301`  
**영향 파일**: `lib/utils/time.ts`(신규), `lib/scoring.ts`, `app/page.tsx`  
**테스트**: 263 → 285개 (+22)

### BUG-01 · `calcTimefit` 비표준 시간 형식 NaN 취약

| | 내용 |
|---|---|
| **위치** | `lib/scoring.ts` `calcTimefit()` |
| **원인** | `openTimeText.split(':').map(Number)`로 파싱. `"09시"`, `"오전 9:00"` 등 비표준 형식 입력 시 `Number('09시')` → `NaN`. `NaN >= NaN` → false → timefit 항상 0 |
| **수정** | `lib/utils/time.ts`의 `isCurrentlyOpen()` 위임. `parseHHMM()`이 정규식 기반으로 안전하게 파싱, 실패 시 `null` 반환 → 닫힘 처리 |
| **회귀 위험** | 기존 테스트 통과 확인 (표준 `"HH:MM"` 형식은 동일 동작) |

### BUG-02 · `isOpenNow` vs `calcTimefit` 기준 불일치

| | 내용 |
|---|---|
| **위치** | `app/page.tsx` `isOpenNow()` |
| **원인** | 운영시간 미기록 시 `isOpenNow`는 `return true`(모두 통과), `calcTimefit`은 PARK만 10점·나머지 5점. 사용자가 "지금 운영 중" 필터 적용 시 실제 운영 여부 무관하게 도서관·스포츠시설 전부 노출 |
| **수정** | `isOpenNow`: 미기록 시 `place.sourceType === 'PARK'`만 `true`. `isCurrentlyOpen()` 위임으로 `calcTimefit`과 동일 기준 |
| **UX 변화** | 운영시간 미기록 도서관이 openNow 필터에서 제외. 의도된 수정. mock 모드(표준 시간 제공)는 영향 없음 |

### BUG-04 · `calcFreshness` UTC/KST 날짜 경계 오차

| | 내용 |
|---|---|
| **위치** | `lib/scoring.ts` `calcFreshness()` |
| **원인** | `new Date('YYYY-MM-DD')`는 UTC 자정으로 파싱. 서버가 UTC로 실행되므로 KST 기준 날짜 경계에서 최대 1일 오차 발생 |
| **수정** | KST 오프셋(+9h)을 더한 밀리초를 86400000으로 나눠 KST 날짜 단위로 비교 |
| **테스트 영향** | 기존 테스트 fake time `2026-05-18T01:00:00Z` + `eventStartDate: '2026-05-20'` → daysUntil 1→2, 결과값 5→5 변동 없음 ✅ |

### BUG-05 · 자정 넘김 운영시간 미처리

| | 내용 |
|---|---|
| **위치** | `lib/scoring.ts` `calcTimefit()`, `app/page.tsx` `isOpenNow()` |
| **원인** | `closeTime < openTime` 케이스(예: 22:00–02:00) 미처리. `kstMinutes >= 1320 && kstMinutes < 120` → false → 운영 중인데 닫힘 처리 |
| **수정** | `isCurrentlyOpen()`에 분기 추가: `closeMin <= openMin`이면 `cur >= openMin || cur < closeMin` |
| **현실 영향** | 서울 공공시설에서 자정 넘김 운영은 드물지만, 향후 실 API 연동 시 대비 |

---

## Group B — 독립 안전 픽스 (BUG-06/07/08)

**커밋**: 이 커밋  
**영향 파일**: `lib/data/tourImages.ts`, `app/page.tsx`, `app/api/places/[id]/feedback/route.ts`  
**테스트**: 285개 유지

### BUG-06 · TourAPI `pickBestMatch` 무관 장소 이미지 오적용

| | 내용 |
|---|---|
| **위치** | `lib/data/tourImages.ts` `pickBestMatch()` |
| **원인** | 마지막 fallback `items[0]`이 검색어와 전혀 무관한 첫 번째 결과를 반환. 예) "삼성도서관" 검색 → items[0]이 "삼성전자 홍보관"이면 그 이미지가 도서관 카드에 적용 |
| **수정** | `items[0]` fallback 제거. 3단계 매칭(정확 일치 → 자치구+이름 앞 4자 → 이름 앞 4자)으로 제한. 미일치 시 `undefined` 반환 → 이미지 없음 처리 |
| **영향 범위** | 실 API 모드(`ENABLE_CULTURE_EVENTS_API=true`)에서만 활성화. 일부 장소 이미지 감소 가능 (오매핑 이미지가 사라지는 것이 올바른 동작) |

### BUG-07 · `app/page.tsx` `recentIds` stale — soft-dedup 세션 내 미반영

| | 내용 |
|---|---|
| **위치** | `app/page.tsx` |
| **원인** | `recentIds`를 마운트 1회 `useEffect`로 `localStorage` 직접 읽음. 같은 세션에서 카드 클릭 → `useRecent().push()` 호출해도 홈의 `recentIds` 갱신 안됨 → soft-dedup이 새로 본 장소를 반영 못함 |
| **수정** | `useState` + 독립 `useEffect` 제거. `useRecent()` 훅 import 후 `const { recent: recentIds } = useRecent()` 공유. 훅 상태 변경 시 즉시 반영 |
| **리렌더 영향** | `useRecent().push()` 호출 시 HomePage 리렌더 발생. 카드 클릭 직후 다른 페이지로 이동하므로 실제 화면 노출 없음 |

### BUG-08 · `feedback/route.ts` sessionId 최대 길이 미검증

| | 내용 |
|---|---|
| **위치** | `app/api/places/[id]/feedback/route.ts` |
| **원인** | `sessionId.length < 8`만 검증. 수천 자 문자열도 DB 저장 가능. Neon Free Row 크기 부담 |
| **수정** | `sessionId.length > 128` 조건 추가 |

---

## Group C — ID 불안정 (BUG-03) 예정

**상태**: 🔜 별도 Phase로 진행  
**이유**: 실행 시 DB `PlaceFeedback` + `RecommendationSnapshot` 전체 삭제 및 localStorage 버전 마이그레이션 수반. 다른 픽스와 분리 필수.

| | 내용 |
|---|---|
| **위치** | `lib/adapters/seoul-culture.adapter.ts` 및 모든 데이터 어댑터 |
| **원인** | `id: \`ce-${index}-...\`` — Array.map index 기반. API 응답 순서 변경 시 같은 장소가 다른 ID → 투표 데이터 孤兒(orphan) |
| **수정 방향** | `createHash('md5').update(구+제목+날짜).digest('hex').slice(0,8)`로 콘텐츠 기반 ID 생성 |
| **준비 사항** | DB truncate (PlaceFeedback, RecommendationSnapshot), localStorage 스키마 버전(`seoul30:schema_v`) 마이그레이션 |

---

## 재평가 항목

### BUG-09 · `getTourApiKey` 이중 참조 → 실제 버그 아님

`process.env.TOUR_API_KEY ?? env.TOUR_API_KEY` 패턴은 의도된 구현:  
- `env` 객체는 모듈 로드 시점에 고정 → `vi.stubEnv` 반영 불가  
- `process.env`를 런타임에 직접 읽어야 테스트에서 환경변수 격리 동작  
- 단순화 시 tourImages 테스트 2개 실패 확인 후 원복  

### BUG-10 · `normalizeSpaceRow` X/Y 좌표 주석 혼용

주석 "X_COORD as latitude"가 의도인지 오류인지 실 API 데이터 없이 판단 불가.  
실 API 활성화 후 지도 핀 위치 확인 시 판별 가능. 현재는 TODO 보류.
