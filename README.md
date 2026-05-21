# Seoul 30

**서울 시민을 위한 30분 생활권 공공시설 추천 PWA**

> 현재 위치에서 대중교통 30분 이내의 도서관·공원·문화공간·스포츠시설을 무료 우선·혼잡도 반영으로 추천합니다.

🔗 **Live**: [seoul-30-webapp.vercel.app](https://seoul-30-webapp.vercel.app)

---

## 프로젝트 개요

Seoul 30은 서울시 공공데이터 API와 자체 스코어링 엔진을 결합해, 사용자 위치·시간대·혼잡도를 고려한 장소 추천을 제공하는 풀스택 PWA입니다.

**핵심 기능**
- 6차원 스코어링 엔진 (접근성 30점 + 카테고리 25점 + 비용 15점 + 혼잡도 15점 + 운영시간 10점 + 행사임박도 5점)
- GPS 기반 대중교통 이동시간 추정 (도보/따릉이/버스/지하철 Haversine 모델)
- 서울시 5개 Open API 실시간 연동 + Neon PostgreSQL 스냅샷 캐시 + 만료 폴백
- TourAPI 4.0 이미지 자동 보강 (공공데이터포털)
- Naver Maps 핀포인트 (Seoul 경계 검증, 위성/하이브리드 뷰, 미니맵)
- ko/en 이중 언어 (next-intl v4, 쿠키 기반)
- PWA (오프라인 페이지, 웹 푸시 알림, 홈 설치)
- 익명 장소 평점 (👍/👎, Prisma + Neon)
- 근처 장소 추천 섹션

---

## 기술 스택

| 영역 | 사용 기술 |
|---|---|
| Framework | Next.js 16 App Router + React 19 + TypeScript strict |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Maps | Naver Maps JavaScript API v3 (ncpKeyId) |
| Database | Prisma 5 + Neon PostgreSQL (ap-southeast-1) |
| i18n | next-intl v4 (ko/en, cookie-based) |
| Auth/Push | Web Push VAPID + Vercel Cron |
| Testing | Vitest + React Testing Library + Playwright E2E |
| CI/CD | GitHub Actions + Vercel Hobby (무료) |
| Analytics | Vercel Analytics |

---

## 아키텍처 하이라이트

```
사용자 요청
  └─ app/api/places/route.ts
       ├─ Seoul 5개 API 병렬 호출 (문화행사/문화공간/도서관/공원/체육시설)
       ├─ TourAPI 이미지 보강 (imageUrl 없는 상위 10개)
       ├─ 스냅샷 캐시 → 만료 폴백 → mock 폴백
       └─ 6차원 scorePlace() → 정렬 반환

lib/utils/coords.ts      Seoul 경계 검증 (lat 37.413–37.715, lng 126.734–127.270)
lib/utils/transit-time.ts Haversine 기반 대중교통 이동시간 추정
lib/utils/place-distance.ts 좌표 기반 근처 장소 선별
```

**주요 설계 결정**
- **좌표 없는 장소는 핀 미표시**: `toSeoulLatLng()` — 0값·경계 밖 좌표를 `undefined`로 변환해 지도 오핀 방지
- **스냅샷 캐시**: GPS 요청은 캐시 우회(사용자별 결과 불일치 방지), 일반 요청은 DB 캐시 사용
- **mock 우선 개발**: `USE_MOCK_DATA=true` 환경변수로 API 키 없이도 전체 기능 동작
- **서버 전용 API 키**: `NEXT_PUBLIC_` prefix 없는 키는 Route Handler에서만 접근

---

## 로컬 실행

```bash
git clone https://github.com/evenif99/seoul-30.git
cd seoul-30
npm install
cp .env.example .env.local
# .env.local 값 입력 (아래 환경변수 섹션 참고)
npm run dev          # http://localhost:3001
```

API 키 없이도 실행 가능: `.env.local`에서 `USE_MOCK_DATA=true` 유지.

---

## 테스트

```bash
npm run test          # Vitest unit + component (58개)
npm run test:e2e      # Playwright E2E
npx tsc --noEmit      # TypeScript 타입 체크
npm run build         # 프로덕션 빌드
```

---

## 환경변수

```bash
# 데이터베이스
DATABASE_URL=                        # Neon PostgreSQL 연결 문자열

# 서울 공공데이터 (서버 전용)
SEOUL_OPEN_API_KEY=                  # data.seoul.go.kr 인증키
TOUR_API_KEY=                        # data.go.kr 한국관광공사 TourAPI 4.0

# 정식 도메인 (OG 이미지·sitemap 생성용)
NEXT_PUBLIC_BASE_URL=https://seoul-30-webapp.vercel.app

# 기능 플래그
USE_MOCK_DATA=true                   # false 시 실제 API 사용
ENABLE_REALTIME_CITY_DATA=false      # true 시 따릉이 데이터 연동
ENABLE_CULTURE_EVENTS_API=false      # true 시 서울 문화 API 사용

# Web Push VAPID (Phase 14)
# 키 생성: npx web-push generate-vapid-keys
VAPID_EMAIL=
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
NEXT_PUBLIC_VAPID_PUBLIC_KEY=        # VAPID_PUBLIC_KEY와 동일값
CRON_SECRET=                         # Vercel Cron 호출 인증 임의 문자열

# Naver Maps (브라우저 노출 안전)
NEXT_PUBLIC_NAVER_MAP_CLIENT_ID=     # NCP 콘솔 Application Client ID (ncpKeyId 형식)
```

**보안 규칙**
- API 키는 `.env.local` 또는 배포 환경변수에만 저장 — 코드·커밋에 절대 포함 금지
- 외부 API 호출은 Route Handler(서버)에서만
- `NEXT_PUBLIC_` prefix는 브라우저 노출이 안전한 값에만 사용

---

## 운영 확인

```bash
curl https://seoul-30-webapp.vercel.app/api/health
# {"status":"ok","db":"ok","seoulApi":"ok"}
```

상세 운영 가이드: [docs/RUNBOOK.md](docs/RUNBOOK.md)

---

## 문서

| 파일 | 내용 |
|---|---|
| [docs/TASKS.md](docs/TASKS.md) | Phase별 작업 체크리스트 |
| [docs/PROJECT_SCOPE.md](docs/PROJECT_SCOPE.md) | 완료 범위 및 제외 항목 |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | 파일 구조 및 런타임 아키텍처 |
| [docs/HANDOFF.md](docs/HANDOFF.md) | 인계 상태 및 작업 규칙 |
| [docs/RUNBOOK.md](docs/RUNBOOK.md) | 헬스체크, 배포, 롤백, 장애 대응 |
| [docs/MOCK_PLACE_AUDIT.md](docs/MOCK_PLACE_AUDIT.md) | Mock 장소 좌표 감사 |

---

## 알려진 제한사항

- Playwright 로컬 실행 시 Windows에서 프로세스 종료 후 hang 발생 (테스트 자체는 정상 통과, CI 문제 없음)
- 따릉이 실시간 데이터는 `ENABLE_REALTIME_CITY_DATA=true` 시 활성 (기본 비활성)
- 복지시설 API는 좌표 미제공으로 지도 핀 통합 보류

---

## 라이선스

MIT
