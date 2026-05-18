import { env } from '@/lib/config/env'
import type { NormalizedPlace } from '@/lib/types/place'

interface CultureEventRow {
  CODENAME: string   // 카테고리 (뮤지컬·오페라, 전시, 연극 등)
  GUNAME: string     // 자치구 (강남구, 종로구 등)
  TITLE: string
  DATE: string       // "YYYY-MM-DD~YYYY-MM-DD"
  PLACE: string      // 장소명
  USE_FEE: string    // 이용요금 텍스트
  IS_FREE: string    // "Y" | "N"
  MAIN_IMG: string
  HMPG_ADDR: string
  ORG_LINK: string
  LOT: string        // 경도
  LAT: string        // 위도
  STRTDATE: string   // "YYYY-MM-DD HH:MM:SS.0"
  END_DATE: string
}

const CODENAME_TO_CATEGORY: Record<string, string> = {
  '뮤지컬·오페라': 'culture',
  '연극': 'culture',
  '무용·퍼포먼스': 'culture',
  '전시/미술': 'culture',
  '전시': 'culture',
  '음악/콘서트': 'culture',
  '강연/토크': 'culture',
  '영화': 'culture',
  '교육/체험': 'welfare',
  '독서/글쓰기': 'library',
  '기타': 'culture',
}

export async function fetchSeoulCultureEvents(): Promise<NormalizedPlace[]> {
  const key = env.SEOUL_OPEN_API_KEY
  if (!key) return []

  try {
    const url = `http://openapi.seoul.go.kr:8088/${key}/json/culturalEventInfo/1/100/`
    const res = await fetch(url, {
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return []

    const data = await res.json()
    // root key: "culturalEventInfo" (서울 열린데이터광장 스펙 기준)
    const rows: CultureEventRow[] = data?.culturalEventInfo?.row ?? []

    return rows
      .filter((row) => row.GUNAME && row.TITLE)
      .map((row, i) => normalizeRow(row, i))
  } catch {
    return []
  }
}

function normalizeRow(row: CultureEventRow, index: number): NormalizedPlace {
  const isFree = row.IS_FREE === 'Y' || row.USE_FEE?.includes('무료')
  const lat = parseFloat(row.LAT)
  const lon = parseFloat(row.LOT)
  const startDate = row.STRTDATE ? row.STRTDATE.split(' ')[0] : undefined

  return {
    id: `ce-${index}-${row.TITLE.slice(0, 12).replace(/\W/g, '')}`,
    slug: `culture-event-${index}`,
    sourceType: 'CULTURE_EVENT',
    name: row.TITLE,
    category: CODENAME_TO_CATEGORY[row.CODENAME] ?? 'culture',
    district: row.GUNAME,
    address: row.PLACE || undefined,
    latitude: isNaN(lat) ? undefined : lat,
    longitude: isNaN(lon) ? undefined : lon,
    isFree,
    feeText: isFree ? undefined : (row.USE_FEE || undefined),
    homepageUrl: row.HMPG_ADDR || row.ORG_LINK || undefined,
    description: row.DATE || undefined,
    imageUrl: row.MAIN_IMG || undefined,
    eventStartDate: startDate,
  }
}
