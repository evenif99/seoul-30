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

## Initial Findings

| id | Current place | Finding | Recommended action |
|---|---|---|---|
| `mock-1` | 성수문화예술마당 | Search results show a different address candidate: `서울특별시 성동구 고산자로 71`, while mock uses `성수일로 77`. | Verify official current address, then update coordinates/address or remove if temporary site is no longer operating. |
| `mock-2` | 서울숲 도서관 | Looks more like a feature inside Seoul Forest than a stable standalone public library. | Replace with an official library record or reclassify/remove. |
| `mock-14` | 노원구 공공 테니스장 | Generic name; not a stable facility identity. | Replace with a specific official tennis court/facility. |
| `mock-15` | 강남구 공공 수영장 | Generic name; not a stable facility identity. | Replace with a specific official public pool. |
| `mock-29` | 서울종합운동장 실내수영장 | Mock address/district points to 광진구 능동로 1, but search results identify the facility around 잠실/송파구. | Correct to the official 잠실 facility or remove. |
| `mock-31` | 서초구 실내체육관 | Generic name; needs official identity confirmation. | Replace with a specific official sports facility. |
| `mock-35` | 서대문구립 복지관 | Generic name; likely not a precise official facility name. | Replace with a specific official welfare center. |
| `mock-36` | 동작구 사회복지관 | Generic name/address mismatch risk; official welfare centers use specific names such as 사당종합사회복지관, 본동종합사회복지관, etc. | Replace with a specific official welfare center. |
| `mock-37` | 도봉구 종합사회복지관 | Generic name; needs official identity confirmation. | Replace with a specific official welfare center. |
| `mock-38` | 강동구 복지관 | Generic name; needs official identity confirmation. | Replace with a specific official welfare center. |

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
