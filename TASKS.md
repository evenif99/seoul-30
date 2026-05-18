# TASKS.md

마지막 업데이트: 2026-05-18

## 완료된 작업

- [x] 기본 레이아웃 (모바일/데스크톱 반응형)
- [x] PlaceCard 컴포넌트
- [x] FilterBar (카테고리/혼잡/시간/무료)
- [x] Hero 섹션 (시간대별 인사말)
- [x] BottomTabBar / DesktopNav
- [x] EmptyState

## 대기 중인 작업

현재 없음 — 다음 작업은 사용자 지시 대기

## 다음 작업 후보 (미결정, 우선순위 미정)

- [ ] 장소 상세 페이지 `/place/[id]` (PlaceCard CTA 연결)
- [ ] 북마크 localStorage 저장
- [ ] 서울시 공공 API 실연동 (서울 열린데이터 광장)
- [ ] 탭 콘텐츠 구현 (검색, 저장, 내 정보)

## Codex 핸드오프 노트

**현재 상태**: 정적 mock 데이터로 동작하는 필터링 가능한 장소 추천 UI 완성.

**다음 작업 시작점**:
1. `lib/data.ts`의 `PLACES` 배열과 `Place` 타입을 먼저 확인할 것
2. `app/page.tsx`의 필터 로직 구조를 파악 후 수정할 것
3. 새 페이지는 `app/` 하위에 App Router 방식으로 추가

**주의사항**:
- `next.config.mjs`에 `ignoreBuildErrors: true` — 타입 오류가 있어도 빌드됨
- `components/ui/` 는 건드리지 말 것 (shadcn/ui 자동 생성)
- 신규 UI 컴포넌트는 `components/seoul30/`에 추가
