# Seoul 30

**서울 시민을 위한 30분 생활권 공공시설 추천 PWA**

현재 위치에서 대중교통 30분 이내의 도서관·공원·문화공간·스포츠시설을 무료 우선·혼잡도 반영으로 추천합니다.

🔗 **Live** → [seoul-30-webapp.vercel.app](https://seoul-30-webapp.vercel.app)

---

<table>
<tr>
<td><img src="https://seoul-30-webapp.vercel.app/screenshots/mobile-home.png" width="320" alt="모바일 홈 화면" /></td>
<td><img src="https://seoul-30-webapp.vercel.app/screenshots/desktop-home.png" width="540" alt="데스크톱 홈 화면" /></td>
</tr>
</table>

---

## 핵심 기능

| 기능 | 내용 |
|------|------|
| 🗺 스코어링 엔진 | 6차원(접근성·카테고리·비용·혼잡도·운영시간·임박도) 100점 모델 |
| 📍 GPS 추정 | Haversine 기반 대중교통 이동시간 추정 (도보/따릉이/버스/지하철) |
| 🏙 실시간 API | 서울시 5개 Open API 병렬 연동 + Neon PostgreSQL 스냅샷 캐시 |
| 🖼 이미지 보강 | TourAPI 4.0으로 실제 장소 사진 자동 적용 |
| 🗾 지도 | Naver Maps v3 — 위성/하이브리드 뷰, 마커 클러스터링, 미니맵 |
| 🌐 다국어 | 한국어 / 영어 (next-intl v4, 쿠키 기반 즉시 전환) |
| 📲 PWA | 홈 화면 설치, 오프라인 캐시, Web Push 알림, 4-tier SW 캐시 |
| ⭐ 평점 | 익명 👍/👎 피드백 (세션 기반 중복 방지, Prisma + Neon) |
| 🔖 북마크 | localStorage 저장 — 실 API 장소 포함 |
| 🔍 복합 필터 | 카테고리·태그·자치구·시간·무료·운영중·검색어, URL 동기화 |
| ♿ 접근성 | Skip link · ARIA 랜드마크 · aria-pressed 토글 · tablist/tabpanel · ESC 닫기 |
| 📊 운영 대시보드 | `/admin` — Push 구독 분포·장소 참여도 Top 5·스냅샷 신선도·데이터 품질 |

---

## 기술 스택

| 영역 | 기술 |
|------|------|
| Framework | Next.js 15 App Router · React 19 · TypeScript strict |
| Styling | Tailwind CSS v4 · shadcn/ui |
| Maps | Naver Maps JavaScript API v3 |
| Database | Prisma 5 · Neon PostgreSQL (ap-southeast-1) |
| i18n | next-intl v4 (ko/en, cookie-based) |
| Push | Web Push VAPID · Vercel Cron |
| Testing | Vitest · React Testing Library · Playwright E2E |
| CI/CD | GitHub Actions · Vercel Hobby (무료) |
| Observability | Vercel Analytics · 구조화 JSON 로그 |

---

## 아키텍처

```
GET /api/places
  └─ Seoul Open API × 5 (병렬)
       ├─ 문화행사 · 문화공간 · 도서관 · 공원 · 체육시설
       └─ TourAPI 이미지 보강 (상위 30개)
  └─ Neon DB 스냅샷 캐시 (1h TTL) → 만료 폴백 → mock 폴백
  └─ scorePlace() — 6차원 가중합 → 정렬 반환
```

**주요 설계 결정**

- **`toSeoulLatLng()`** — 0값·경계 밖 좌표를 `undefined`로 변환, 오핀 방지
- **스냅샷 캐시** — GPS 요청은 캐시 우회(사용자별 결과 일관성), 일반 요청은 DB 캐시
- **`React.cache()`** — `generateMetadata` + `Page` 이중 호출 방지 (per-request 중복 제거)
- **서버 전용 API 키** — `NEXT_PUBLIC_` 없는 키는 Route Handler에서만 접근
- **하드 필터** — 카테고리·자치구·태그는 점수가 아닌 하드 필터로 정확히 적용

---

## 로컬 실행

```bash
git clone https://github.com/evenif99/seoul-30.git
cd seoul-30
npm install
cp .env.example .env.local   # USE_MOCK_DATA=true 유지 시 API 키 없이도 동작
npm run dev                  # http://localhost:3001
```

---

## 테스트

```bash
npm run test        # Vitest 유닛 + 컴포넌트 (253개)
npm run test:e2e    # Playwright E2E (16개)
npx tsc --noEmit   # TypeScript 타입 체크
npm run build       # 프로덕션 빌드
```

---

## 환경변수

```bash
# 데이터베이스
DATABASE_URL=                        # Neon PostgreSQL 연결 문자열

# 서울 공공데이터 (서버 전용)
SEOUL_OPEN_API_KEY=                  # data.seoul.go.kr 인증키
TOUR_API_KEY=                        # 한국관광공사 TourAPI 4.0

# 배포 도메인
NEXT_PUBLIC_BASE_URL=https://seoul-30-webapp.vercel.app

# 기능 플래그
USE_MOCK_DATA=true                   # false 시 실제 API 사용
ENABLE_REALTIME_CITY_DATA=false      # 따릉이 실시간 데이터
ENABLE_CULTURE_EVENTS_API=false      # 서울 문화행사 API

# 캐시 설정
SNAPSHOT_TTL_SECONDS=7200           # 스냅샷 캐시 TTL (초, 기본 2시간 — API 쿼터 절약)

# Web Push VAPID
VAPID_EMAIL=
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
CRON_SECRET=                         # Vercel Cron 호출 인증키

# Naver Maps (브라우저 노출 안전)
NEXT_PUBLIC_NAVER_MAP_CLIENT_ID=     # NCP 콘솔 Application Client ID
```

> **보안 규칙** — API 키는 `.env.local` 또는 배포 환경변수에만 저장. 코드·커밋에 절대 포함 금지.

---

## 운영 확인

```bash
curl https://seoul-30-webapp.vercel.app/api/health
# {"status":"ok","db":"ok","seoulApi":"ok"}
```

→ 상세 운영 가이드: [docs/RUNBOOK.md](docs/RUNBOOK.md)

---

## 문서

| 파일 | 내용 |
|------|------|
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | 파일 구조 및 런타임 아키텍처 |
| [docs/PROJECT_SCOPE.md](docs/PROJECT_SCOPE.md) | Phase별 완료 범위 |
| [docs/RUNBOOK.md](docs/RUNBOOK.md) | 헬스체크 · 배포 · 롤백 · 장애 대응 |
| [docs/HANDOFF.md](docs/HANDOFF.md) | 인계 상태 및 작업 규칙 |

---

## 알려진 제한사항

- Playwright 로컬 실행 시 Windows에서 프로세스 종료 후 hang 발생 (CI는 정상)
- 복지시설 API는 좌표 미제공으로 지도 핀 통합 보류
- 따릉이 실시간 데이터는 `ENABLE_REALTIME_CITY_DATA=true` 시 활성 (기본 비활성)

---

## 라이선스

MIT
