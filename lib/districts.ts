export interface District {
  name: string   // 예: "성동구"
  code: string   // 서울 열린데이터 도시데이터 지역 코드 (실 API 연결 시 확정)
}

export const SEOUL_DISTRICTS: District[] = [
  { name: '강남구', code: 'GANGNAM' },
  { name: '강동구', code: 'GANGDONG' },
  { name: '강북구', code: 'GANGBUK' },
  { name: '강서구', code: 'GANGSEO' },
  { name: '관악구', code: 'GWANAK' },
  { name: '광진구', code: 'GWANGJIN' },
  { name: '구로구', code: 'GURO' },
  { name: '금천구', code: 'GEUMCHEON' },
  { name: '노원구', code: 'NOWON' },
  { name: '도봉구', code: 'DOBONG' },
  { name: '동대문구', code: 'DONGDAEMUN' },
  { name: '동작구', code: 'DONGJAK' },
  { name: '마포구', code: 'MAPO' },
  { name: '서대문구', code: 'SEODAEMUN' },
  { name: '서초구', code: 'SEOCHO' },
  { name: '성동구', code: 'SEONGDONG' },
  { name: '성북구', code: 'SEONGBUK' },
  { name: '송파구', code: 'SONGPA' },
  { name: '양천구', code: 'YANGCHEON' },
  { name: '영등포구', code: 'YEONGDEUNGPO' },
  { name: '용산구', code: 'YONGSAN' },
  { name: '은평구', code: 'EUNPYEONG' },
  { name: '종로구', code: 'JONGNO' },
  { name: '중구', code: 'JUNG' },
  { name: '중랑구', code: 'JUNGNANG' },
]

export const DISTRICT_NAMES = SEOUL_DISTRICTS.map((d) => d.name)
