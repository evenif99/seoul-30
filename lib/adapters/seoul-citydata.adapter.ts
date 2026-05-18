import { env } from '@/lib/config/env'
import type { RealtimeSignal, CongestionLevel } from '@/lib/types/realtime'

// 서울시 실시간 도시데이터 API는 자치구 단위가 아닌 핫스팟(역·광장·공원) 단위 areaCode를 사용한다.
// 자치구 → 대표 핫스팟 areaCode 매핑 (25개 자치구 전체 커버)
const DISTRICT_TO_AREA: Record<string, string> = {
  강남구: '강남역',
  서초구: '강남역',
  마포구: '홍대입구역',
  종로구: '경복궁·광화문·서울시청',
  중구: '명동·남대문·북창',
  용산구: '이태원',
  성동구: '성수역',
  광진구: '건대입구역',
  송파구: '잠실역',
  영등포구: '여의도',
  관악구: '낙성대역',
  동대문구: '동대문',
  서대문구: '신촌·이대역',
  노원구: '노원역',
  강서구: '발산역',
  구로구: '구로디지털단지역',
  은평구: '불광역',
  성북구: '고려대역',
  강북구: '수유역',
  도봉구: '쌍문역',
  중랑구: '상봉역',
  동작구: '이수역',
  양천구: '목동',
  강동구: '천호역',
  금천구: '가산디지털단지역',
}

const CONGESTION_MAP: Record<string, CongestionLevel> = {
  여유: '여유',
  보통: '보통',
  약간붐빔: '약간붐빔',
  붐빔: '붐빔',
}

interface CitydataPpltnRow {
  AREA_NM: string
  AREA_CONGEST_LVL: string
  AREA_CONGEST_MSG: string
}

export async function fetchSeoulCongestion(district: string): Promise<RealtimeSignal | null> {
  const key = env.SEOUL_OPEN_API_KEY
  if (!key) return null

  const areaCode = DISTRICT_TO_AREA[district]
  if (!areaCode) return null

  try {
    const encoded = encodeURIComponent(areaCode)
    const url = `http://openapi.seoul.go.kr:8088/${key}/json/citydata_ppltn/1/5/${encoded}`
    const res = await fetch(url, {
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) return null

    const data = await res.json()
    // root key: "SeoulRtd.citydata_ppltn" (서울시 실시간 도시데이터 API 스펙)
    const rows: CitydataPpltnRow[] = data?.['SeoulRtd.citydata_ppltn'] ?? []
    const row = rows[0]
    if (!row) return null

    return {
      areaCode,
      areaName: row.AREA_NM,
      congestionLevel: CONGESTION_MAP[row.AREA_CONGEST_LVL] ?? null,
      congestionMessage: row.AREA_CONGEST_MSG,
      updatedAt: new Date().toISOString(),
      isMock: false,
    }
  } catch {
    return null
  }
}
