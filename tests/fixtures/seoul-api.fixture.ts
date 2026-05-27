/**
 * Seoul Open API 실 응답 형식을 모사한 Fixture 데이터
 *
 * 실 API 필드명·타입 구조를 그대로 유지하여
 * Adapter 단위 테스트에서 API 응답 파싱을 검증한다.
 *
 * 목적:
 *  - 좌표 이상값(0, 범위 밖, 빈 문자열) 처리 검증
 *  - 필드 누락·빈 값 → undefined 처리 검증
 *  - 유료/무료 판별 로직 검증
 */

// ─── SeoulPublicLibraryInfo ────────────────────────────────────────────────────

export const LIBRARY_FIXTURE_ROWS = [
  {
    LBRRY_NM: '강남구립 도곡정보문화도서관',
    GUNAME: '강남구',
    ADRES: '서울특별시 강남구 도곡로 130',
    LATITUDE: '37.4931',
    LONGITUDE: '127.0433',
    HMPG_ADDR: 'https://library.gangnam.go.kr',
    TEL_NO: '02-1234-5678',
    WEEKDAY_OPEN_TIME: '09:00',
    WEEKDAY_CLOSE_TIME: '22:00',
  },
  {
    // 좌표 0 → latitude/longitude undefined 처리 검증
    LBRRY_NM: '좌표없는도서관',
    GUNAME: '종로구',
    ADRES: '서울특별시 종로구 어딘가',
    LATITUDE: '0',
    LONGITUDE: '0',
    HMPG_ADDR: '',
    TEL_NO: '',
    WEEKDAY_OPEN_TIME: '',
    WEEKDAY_CLOSE_TIME: '',
  },
  {
    // 서울 경계 밖 좌표 → undefined
    LBRRY_NM: '경계밖도서관',
    GUNAME: '마포구',
    ADRES: '서울특별시 마포구 어딘가',
    LATITUDE: '35.1000',
    LONGITUDE: '129.0000',
    HMPG_ADDR: '',
    TEL_NO: '02-0000-0000',
    WEEKDAY_OPEN_TIME: '09:00',
    WEEKDAY_CLOSE_TIME: '18:00',
  },
  {
    // GUNAME 없음 → filter에서 제거
    LBRRY_NM: '구이름없는도서관',
    GUNAME: '',
    ADRES: '서울특별시 어딘가',
    LATITUDE: '37.5600',
    LONGITUDE: '126.9780',
    HMPG_ADDR: '',
    TEL_NO: '',
    WEEKDAY_OPEN_TIME: '',
    WEEKDAY_CLOSE_TIME: '',
  },
]

export const LIBRARY_API_RESPONSE = {
  SeoulPublicLibraryInfo: {
    list_total_count: LIBRARY_FIXTURE_ROWS.length,
    RESULT: { CODE: 'INFO-000', MESSAGE: 'SUCCESS' },
    row: LIBRARY_FIXTURE_ROWS,
  },
}

// ─── ListParkService ───────────────────────────────────────────────────────────

export const PARK_FIXTURE_ROWS = [
  {
    P_PARK: '서울숲',
    P_ZONE: '성동구',
    P_ADDR: '서울특별시 성동구 뚝섬로 273',
    LATITUDE: '37.5441',
    LONGITUDE: '127.0370',
    P_INTRODUCE: '도심 속 자연공원으로 다양한 생태 체험이 가능합니다.',
  },
  {
    P_PARK: '남산공원',
    P_ZONE: '중구',
    P_ADDR: '서울특별시 중구 남산동',
    LATITUDE: '37.5512',
    LONGITUDE: '126.9882',
    P_INTRODUCE: '서울 도심의 상징적인 공원입니다.',
  },
  {
    // 빈 좌표 문자열 → undefined
    P_PARK: '좌표없는공원',
    P_ZONE: '강북구',
    P_ADDR: '서울특별시 강북구 어딘가',
    LATITUDE: '',
    LONGITUDE: '',
    P_INTRODUCE: '',
  },
  {
    // P_ZONE 없음 → filter에서 제거
    P_PARK: '구없는공원',
    P_ZONE: '',
    P_ADDR: '서울특별시 어딘가',
    LATITUDE: '37.5700',
    LONGITUDE: '127.0000',
    P_INTRODUCE: '',
  },
]

export const PARK_API_RESPONSE = {
  ListParkService: {
    list_total_count: PARK_FIXTURE_ROWS.length,
    RESULT: { CODE: 'INFO-000', MESSAGE: 'SUCCESS' },
    row: PARK_FIXTURE_ROWS,
  },
}

// ─── ListPublicReservationSport ────────────────────────────────────────────────

export const SPORTS_FIXTURE_ROWS = [
  {
    SVCNM: '한강공원 테니스장',
    AREANM: '영등포구',
    PLACENM: '여의도한강공원',
    DTLCONT: '한강 테니스 시설 상세 내용',
    SVCURL: 'https://parks.seoul.go.kr/tennis',
    X: '126.9341',
    Y: '37.5280',
    PAYFREE: '유료',
  },
  {
    SVCNM: '송파구민체육센터 수영장',
    AREANM: '송파구',
    PLACENM: '송파구민체육센터',
    DTLCONT: '수영 시설 이용 안내',
    SVCURL: 'https://songpa.go.kr/pool',
    X: '127.1120',
    Y: '37.5145',
    PAYFREE: '무료',
  },
  {
    // X/Y 좌표 0 → undefined
    SVCNM: '좌표없는체육관',
    AREANM: '노원구',
    PLACENM: '노원체육관',
    DTLCONT: '',
    SVCURL: '',
    X: '0',
    Y: '0',
    PAYFREE: '유료',
  },
  {
    // AREANM 없음 → filter에서 제거
    SVCNM: '지역없는스포츠',
    AREANM: '',
    PLACENM: '시설명',
    DTLCONT: '',
    SVCURL: '',
    X: '127.0000',
    Y: '37.5600',
    PAYFREE: '무료',
  },
]

export const SPORTS_API_RESPONSE = {
  ListPublicReservationSport: {
    list_total_count: SPORTS_FIXTURE_ROWS.length,
    RESULT: { CODE: 'INFO-000', MESSAGE: 'SUCCESS' },
    row: SPORTS_FIXTURE_ROWS,
  },
}

// ─── culturalEventInfo ─────────────────────────────────────────────────────────

export const CULTURE_EVENT_ROWS = [
  {
    CODENAME: '전시/미술',
    GUNAME: '종로구',
    TITLE: '서울 현대미술 특별전',
    DATE: '2024-03-01~2024-06-30',
    PLACE: '국립현대미술관',
    USE_FEE: '무료',
    IS_FREE: 'Y',
    MAIN_IMG: 'https://culture.seoul.go.kr/img/event1.jpg',
    HMPG_ADDR: 'https://mmca.go.kr',
    ORG_LINK: '',
    LOT: '126.9785',
    LAT: '37.5796',
    STRTDATE: '2024-03-01 00:00:00.0',
    END_DATE: '2024-06-30 00:00:00.0',
  },
  {
    CODENAME: '뮤지컬·오페라',
    GUNAME: '강남구',
    TITLE: '뮤지컬 레미제라블',
    DATE: '2024-04-01~2024-05-31',
    PLACE: '예술의전당',
    USE_FEE: '50000원',
    IS_FREE: 'N',
    MAIN_IMG: '',
    HMPG_ADDR: 'https://sac.or.kr',
    ORG_LINK: '',
    LOT: '127.0011',
    LAT: '37.4827',
    STRTDATE: '2024-04-01 00:00:00.0',
    END_DATE: '2024-05-31 00:00:00.0',
  },
  {
    // 좌표 없음 → latitude/longitude undefined
    CODENAME: '강연/토크',
    GUNAME: '마포구',
    TITLE: '북토크 이벤트',
    DATE: '2024-04-10',
    PLACE: '홍대 카페',
    USE_FEE: '0원',   // 무료 (IS_FREE=N이지만 USE_FEE 체크)
    IS_FREE: 'N',
    MAIN_IMG: '',
    HMPG_ADDR: '',
    ORG_LINK: 'https://example.com',
    LOT: '',
    LAT: '',
    STRTDATE: '2024-04-10 00:00:00.0',
    END_DATE: '2024-04-10 00:00:00.0',
  },
]

export const CULTURE_EVENT_API_RESPONSE = {
  culturalEventInfo: {
    list_total_count: CULTURE_EVENT_ROWS.length,
    RESULT: { CODE: 'INFO-000', MESSAGE: 'SUCCESS' },
    row: CULTURE_EVENT_ROWS,
  },
}

// ─── culturalSpaceInfo ─────────────────────────────────────────────────────────
//
// 실 API에서 X_COORD = 위도(latitude) 값, Y_COORD = 경도(longitude) 값으로 반환.
// (일반 GIS 관례와 반대 — 주석으로 명시적으로 기록)

export const CULTURE_SPACE_ROWS = [
  {
    CODENAME: '미술관',
    GUNAME: '종로구',
    FAC_NAME: '서울시립미술관',
    ADDR: '서울특별시 종로구 경희궁길 42',
    FAC_DESC: '서울시 대표 현대미술관입니다.',
    HMPG_ADDR: 'https://sema.seoul.go.kr',
    PHNE: '02-2124-8800',
    X_COORD: '37.5704',   // 위도 (latitude)
    Y_COORD: '126.9705',  // 경도 (longitude)
    MAIN_IMG: 'https://culture.seoul.go.kr/img/space1.jpg',
    IS_FREE: 'Y',
    USE_FEE: '무료',
    USAGE_DAY_WEEK_AND_TIME: '화~일 10:00~20:00',
  },
  {
    CODENAME: '도서관',
    GUNAME: '강남구',
    FAC_NAME: '강남구립도서관',
    ADDR: '서울특별시 강남구 논현로 430',
    FAC_DESC: '강남구 구립도서관입니다.',
    HMPG_ADDR: 'https://library.gangnam.go.kr',
    PHNE: '02-3463-6600',
    X_COORD: '37.5161',   // 위도
    Y_COORD: '127.0270',  // 경도
    MAIN_IMG: '',
    IS_FREE: 'Y',
    USE_FEE: '',
    USAGE_DAY_WEEK_AND_TIME: '',
  },
  {
    // X_COORD = 위도 범위 밖 값 → undefined
    CODENAME: '공연장',
    GUNAME: '서초구',
    FAC_NAME: '좌표이상공연장',
    ADDR: '서울특별시 서초구',
    FAC_DESC: '',
    HMPG_ADDR: '',
    PHNE: '',
    X_COORD: '0',          // 0 → undefined
    Y_COORD: '0',
    MAIN_IMG: '',
    IS_FREE: 'N',
    USE_FEE: '10000원',
    USAGE_DAY_WEEK_AND_TIME: '',
  },
]

export const CULTURE_SPACE_API_RESPONSE = {
  culturalSpaceInfo: {
    list_total_count: CULTURE_SPACE_ROWS.length,
    RESULT: { CODE: 'INFO-000', MESSAGE: 'SUCCESS' },
    row: CULTURE_SPACE_ROWS,
  },
}
