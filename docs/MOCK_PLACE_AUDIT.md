# Mock Place Audit

Last updated: 2026-05-21

## Purpose

Phase 34 depends on trustworthy coordinates. Before adding nearby-place recommendations, mock data needs a pin accuracy and existence audit so Naver Map markers do not point to the wrong building or a retired place.

## Manual Security Step

The TourAPI key was exposed in chat. Rotate it before continuing with production checks:

1. Go to data.go.kr and regenerate or issue a new TourAPI service key.
2. Replace `TOUR_API_KEY` in `.env.local`.
3. Replace `TOUR_API_KEY` in Vercel Environment Variables.
4. Redeploy Vercel.
5. Do not paste the raw key into chat, markdown, commits, issue text, or screenshots.

Use the Decoding key in `.env.local`; the app URL-encodes it when calling TourAPI.

## Coordinate Source Priority

1. Seoul Open Data / official facility API coordinates.
2. Facility or district official page address, then geocoding after explicit approval.
3. Manual Naver Map visual confirmation.

Naver Geocoding can be useful, but it may be billable. Do not introduce it as an automated step without user approval.

## Initial Findings — Resolved (Phase 36, 2026-05-21)

| id | Before | After | Change |
|---|---|---|---|
| `mock-1` | 성수문화예술마당 (성수일로 77) | 성수문화예술마당 (고산자로 71) | 주소·좌표 수정 |
| `mock-2` | 서울숲 도서관 (독립적 시설 아님) | 성동구립 왕십리도서관 (왕십리광장로 22) | 실 공공도서관으로 교체 |
| `mock-14` | 노원구 공공 테니스장 (제네릭) | 태릉국제테니스장 (화랑로 727) | 정식 시설명·주소·좌표 교체 |
| `mock-15` | 강남구 공공 수영장 (제네릭) | 강남구민체육센터 (학동로 452) | 정식 시설명·주소·좌표 교체 |
| `mock-29` | 서울종합운동장 실내수영장 (광진구 — 오류) | 잠실종합운동장 실내수영장 (송파구 올림픽로 25) | 자치구·주소·좌표·역 정보 수정 |
| `mock-31` | 서초구 실내체육관 (제네릭) | 서초구민체육센터 | 정식 시설명으로 변경 |
| `mock-35` | 서대문구립 복지관 (제네릭) | 서대문종합사회복지관 | 정식 시설명으로 변경 |
| `mock-36` | 동작구 사회복지관 (제네릭) | 사당종합사회복지관 | 정식 시설명으로 변경 |
| `mock-37` | 도봉구 종합사회복지관 (제네릭) | 도봉종합사회복지관 | 정식 시설명으로 변경 |
| `mock-38` | 강동구 복지관 (제네릭) | 강동종합사회복지관 | 정식 시설명으로 변경 |

All 10 flagged mock places resolved. 58/58 tests passing.

## Real API Coordinate Finding

`culturalSpaceInfo` returned DDP as:

- `X_COORD`: `37.56735731522952`
- `Y_COORD`: `127.00977973484339`

That means this service currently exposes `X_COORD` as latitude and `Y_COORD` as longitude. The adapter now routes culture event and culture space coordinates through `toSeoulLatLng()` to avoid swapped or out-of-Seoul pins.

## Next Build-Up

1. Replace or remove generic mock places.
2. Prefer places that already come from the current Seoul Open API fetchers.
3. Keep 30-40 mock places, but only stable, named public facilities.
4. Add a small per-place `auditStatus` document row before changing coordinates.
5. Verify on `http://localhost:3001` list view, map view, and each detail minimap.
