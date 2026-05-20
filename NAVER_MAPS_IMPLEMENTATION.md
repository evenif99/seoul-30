# Naver Maps 적용 기록

> 작성일: 2026-05-20  
> 목적: Leaflet + OpenStreetMap을 Naver Maps JavaScript API v3로 교체하는 과정에서 겪은 시행착오와 최종 해결 방법을 기록

---

## 배경 — 왜 Naver Maps를 선택했는가

| 후보 | 검토 결과 |
|---|---|
| **Leaflet + OpenStreetMap** | 기존 적용 중. 한국 지도 품질 낮음, 위성 뷰 없음, 경쟁력 부족 |
| **Google Maps** | 결제 수단 등록 필수, 초과 시 자동 과금 위험 |
| **Kakao Maps** | 카카오 디벨로퍼스에서 비즈니스 계정만 허용 (개인 사용 불가) |
| **Naver Maps** | NCP 개인 플랜 월 300,000 Map Views 무료, 위성 뷰 지원 ✅ |

**목표 기능**: 위성/하이브리드 뷰 토글, 현재 위치 버튼, 마커 클러스터링

---

## 전체 시행착오 목록

### 실패 1 — 잘못된 콘솔에서 API 키 발급 시도

**상황**  
Naver Maps API 키를 발급하려고 `developers.naver.com` (네이버 디벨로퍼스) 에 접속했으나, 해당 사이트에는 Maps API가 존재하지 않음 (CAPTCHA, Search Trend 등만 제공).

**원인**  
Naver Maps JavaScript API는 **NAVER Cloud Platform** (`console.ncloud.com`) 에서만 발급 가능. 두 사이트가 완전히 별개의 서비스임.

**해결**  
`console.ncloud.com` → 상단 메뉴 Services → Maps → Application 등록

---

### 실패 2 — VPC vs Classic 환경 혼동

**상황**  
NCP 콘솔에서 Application을 등록했는데 브레드크럼에 "VPC Maps > Application" 으로 표시됨. Classic 환경이 필요한 것 아닌가 의심.

**원인 추정 (결과적으로 오해였음)**  
한국(서울) 리전은 VPC 환경만 제공함. Classic 환경 선택 불가.

```
선택하신 리전에서는 VPC만 제공하고 있습니다.
```

**해결**  
VPC 환경 그대로 사용. `oapi.map.naver.com` 엔드포인트가 VPC Application을 정상 지원함.

---

### 실패 3 — 스크립트 URL 도메인 오류

**상황**  
최초 구현 시 스크립트 URL을 아래와 같이 작성:

```
https://openapi.map.naver.com/openapi/v3/maps.js?ncpClientId=...
```

지도 렌더링 안 됨. "인증 실패" 에러.

**원인**  
Naver Maps v3의 올바른 도메인은 `oapi.map.naver.com` (앞의 `open` 없음).  
Naver Maps SDK 소스 코드 내 정규식 확인:

```javascript
var k = /(o|open)api\.map\.naver\.com\/openapi\/v3\/maps\.js\b/
```

두 도메인 모두 SDK 내부에서 인식하지만, 실제 인증 요청은 `oapi.map.naver.com`으로 보내야 함.

**해결**

```
https://oapi.map.naver.com/openapi/v3/maps.js?ncpClientId=...
```

---

### 실패 4 — 웹 서비스 URL 슬래시(/) 불일치

**상황**  
NCP Application에 `http://localhost:3001` (슬래시 없음) 을 등록했으나 인증 계속 실패.  
F12 콘솔 에러:

```
URI: http://localhost:3001/   ← 슬래시 있음
```

**원인**  
Naver Maps SDK는 `document.location.href`를 기반으로 URI를 추출함. 루트 경로 접속 시 브라우저는 항상 `http://localhost:3001/` (슬래시 포함) 로 전송.  
NCP는 등록된 URL과 **정확히 일치**하는지 검사함.

**해결**  
NCP Application 수정 → Web 서비스 URL에 슬래시 포함 버전으로 등록:

```
http://localhost:3001/    ← 슬래시 포함 필수
http://localhost:3000/
https://seoul-30-webapp.vercel.app/
```

---

### 실패 5 — ncpClientId vs ncpKeyId 파라미터 혼동 (핵심 원인)

**상황**  
URL 슬래시 문제 해결 후에도 동일한 "Authentication Failed (Error Code 200)" 에러 지속.  
모든 설정이 정확해 보였지만 수십 분 동안 해결 안 됨.

**원인 발견 과정**  
F12 DevTools에서 Naver Maps SDK 소스코드(`maps.js`) 를 직접 분석:

```javascript
// SDK 내부 인증 분기 로직
var r = "...oapi.map.naver.com/v1/validatev3" +
  (S ? "?ncpClientId=" + S : "") + ...   // 구버전 엔드포인트

var s = "...oapi.map.naver.com/v3/auth" +
  (O ? "?ncpKeyId=" + O : "") + ...      // 신버전 엔드포인트

var C = !!O  // ncpKeyId가 있으면 신버전 /v3/auth 사용
var a = C ? s : r
```

**핵심 차이점**:

| 파라미터 | 인증 엔드포인트 | 대상 |
|---|---|---|
| `ncpClientId` | `/v1/validatev3` | 구형 NCP 콘솔 발급 키 |
| `ncpKeyId` | `/v3/auth` | **현재 NCP 콘솔** 발급 키 (X-NCP-APIGW-API-KEY-ID) |

현재 NCP 콘솔에서 발급되는 키는 `X-NCP-APIGW-API-KEY-ID` 형식으로, 이것이 `ncpKeyId`에 해당함.  
`ncpClientId`로 전달하면 구버전 엔드포인트로 요청이 가고 인증 실패.

**해결**  
스크립트 URL 파라미터를 `ncpClientId` → `ncpKeyId`로 변경:

```javascript
// 변경 전 (실패)
`https://oapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${CLIENT_ID}`

// 변경 후 (성공)
`https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${CLIENT_ID}`
```

이 변경 즉시 지도 정상 출력 확인.

---

### 실패 6 — React Hydration Mismatch (#418 에러)

**상황**  
지도 탭에서 `Uncaught Error: Minified React error #418` 발생.  
Vercel 배포 환경에서 지도가 전혀 렌더링되지 않음.

**원인**  
`next/script`의 `strategy="afterInteractive"` 스크립트가 브라우저 캐시에 의해 React hydration 완료 전에 로드되는 경우가 발생.  
`onLoad` 콜백이 hydration 도중 `setReady(true)`를 호출 → 서버 렌더 HTML(로딩 상태)과 클라이언트 렌더(MapViewInner) 불일치 → #418 에러.

추가로, 최초 구현에 `useEffect`에서 `window.naver?.maps` 체크 코드가 있었는데, 이것도 SSR/클라이언트 불일치를 유발.

**해결**  
`mounted` 상태를 추가해 Script를 클라이언트 마운트 이후에만 주입:

```tsx
const [mounted, setMounted] = useState(false)
const [ready, setReady] = useState(false)

useEffect(() => {
  setMounted(true)  // 마운트 후에만 Script 렌더
}, [])

return (
  <div>
    {mounted && (
      <Script
        src={`https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${CLIENT_ID}`}
        strategy="afterInteractive"
        onLoad={() => setReady(true)}
      />
    )}
    {mounted && ready ? <MapViewInner /> : <LoadingDiv />}
  </div>
)
```

서버와 클라이언트 모두 초기 렌더에서 로딩 상태를 출력하므로 hydration 불일치 없음.

---

### 실패 7 — marker.setMap(null) SDK 내부 오류

**상황**  
인증 실패 상태에서 `rebuildMarkers` 함수 실행 시 아래 에러 발생:

```
Cannot read properties of null (reading 'capitalize')
at rebuildMarkers (MapViewInner.tsx:83)
```

**원인**  
Naver Maps 인증이 실패한 상태에서도 `naver.maps.Marker` 객체가 부분적으로 생성됨.  
이후 `marker.setMap(null)` 호출 시 SDK 내부에서 `Ht.capitalize()` 함수를 null에 적용하려다 오류 발생.  
(SDK 소스 내 `capitalize` 함수는 이벤트 이름 처리에 사용됨)

**해결**  
`setMap(null)` 호출을 try-catch로 감싸 인증 실패 상태에서의 SDK 내부 오류가 앱을 크래시시키지 않도록 방어:

```typescript
markersRef.current.forEach((m) => {
  try { m.setMap(null) } catch {}
})
```

---

### 실패 8 — 개발 서버 포트 불일치 (Playwright CI 실패)

**상황**  
GitHub Actions에서 E2E 테스트 실패:

```
Error: Timed out waiting 120000ms from config.webServer.
```

**원인**  
`package.json`의 dev 스크립트를 `next dev -p 3001`로 변경했으나,  
`playwright.config.ts`의 `baseURL`과 `webServer.url`이 여전히 `http://localhost:3000`을 바라보고 있었음.

**해결**  
`playwright.config.ts` 포트 3001로 동기화:

```typescript
use: {
  baseURL: 'http://localhost:3001',  // 3000 → 3001
},
webServer: {
  command: 'npm run dev',
  url: 'http://localhost:3001',       // 3000 → 3001
  ...
}
```

---

## 최종 정상 동작 구성

### 환경변수

```bash
# .env.local
NEXT_PUBLIC_NAVER_MAP_CLIENT_ID=<NCP_Application_Client_ID>
```

### NCP Application 설정

| 항목 | 값 |
|---|---|
| 콘솔 | console.ncloud.com (NAVER Cloud Platform) |
| 환경 | VPC (한국 리전은 VPC 전용) |
| API 선택 | Dynamic Map ✅ |
| Web 서비스 URL | `http://localhost:3001/` (슬래시 포함) |
| Web 서비스 URL | `https://your-app.vercel.app/` (슬래시 포함) |

### 스크립트 URL

```
https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=<CLIENT_ID>
```

- 도메인: `oapi.map.naver.com` (`openapi` 아님)
- 파라미터: `ncpKeyId` (`ncpClientId` 아님) — 현재 NCP 콘솔 키 형식

### MapView 로드 패턴

```tsx
// mounted 이후 Script 주입 → hydration 안전
const [mounted, setMounted] = useState(false)
useEffect(() => { setMounted(true) }, [])

{mounted && <Script src="...?ncpKeyId=..." onLoad={() => setReady(true)} />}
{mounted && ready ? <MapViewInner /> : <LoadingState />}
```

---

## 구현된 기능

| 기능 | 구현 방법 |
|---|---|
| 지도 렌더링 | `naver.maps.Map` 임피어러티브 초기화, `useRef`로 인스턴스 관리 |
| 위성/하이브리드 뷰 | `map.setMapTypeId(naver.maps.MapTypeId.HYBRID)` |
| 현재 위치 | `navigator.geolocation.getCurrentPosition` → `map.setCenter()` |
| 마커 클러스터링 | 외부 라이브러리 없이 그리드 기반 구현 (zoom < 12 → 0.025°, zoom < 14 → 0.01°) |
| 장소 선택 팝업 | 마커 클릭 → React state 업데이트 → 팝업 오버레이 |
| 자동 바운드 피팅 | `map.fitBounds()` 장소 목록 변경 시 자동 적용 |

---

## 핵심 교훈

1. **NCP 콘솔과 Naver 디벨로퍼스는 완전히 다른 플랫폼** — Maps API는 반드시 `console.ncloud.com`에서 등록
2. **URL 슬래시는 정확히 일치시켜야 함** — 브라우저 Location은 루트에서 슬래시를 포함해 전송
3. **`ncpKeyId` vs `ncpClientId`** — 현재 NCP 콘솔이 발급하는 키는 `ncpKeyId` 파라미터로 전달해야 신버전 `/v3/auth` 엔드포인트로 인증됨. SDK 소스 직접 분석으로 발견
4. **next/script hydration** — `strategy="afterInteractive"` 스크립트도 캐시된 경우 hydration 전에 실행될 수 있음. `mounted` 상태로 주입 시점 제어 필요
5. **포트 변경 시 모든 설정 파일 동기화** — `package.json`, `playwright.config.ts`, `.env.example`, NCP 등록 URL 전부 확인
