import { env } from '@/lib/config/env'
import type { NormalizedPlace } from '@/lib/types/place'
import { fetchSeoulLibraries } from '@/lib/data/seoulLibrary'
import { fetchSeoulParks } from '@/lib/data/seoulParks'
import { fetchSeoulSports } from '@/lib/data/seoulSports'
import { toSeoulLatLng } from '@/lib/utils/coords'
import { enrichPlace } from '@/lib/adapters/enrichment'
import { stableId } from '@/lib/utils/stable-id'

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

interface CultureSpaceRow {
  CODENAME: string   // 분류 (미술관, 박물관, 도서관 등)
  GUNAME: string     // 자치구
  FAC_NAME: string   // 시설명
  ADDR: string       // 주소
  FAC_DESC: string   // 시설 소개
  HMPG_ADDR: string  // 홈페이지
  PHNE: string       // 전화번호
  X_COORD: string    // 경도
  Y_COORD: string    // 위도
  MAIN_IMG: string
  IS_FREE: string    // "Y" | "N"
  USE_FEE: string
  USAGE_DAY_WEEK_AND_TIME: string  // 운영시간 텍스트
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

const SPACE_CODENAME_TO_CATEGORY: Record<string, string> = {
  '미술관': 'culture',
  '박물관': 'culture',
  '공연장': 'culture',
  '복합문화공간': 'culture',
  '문화원': 'culture',
  '도서관': 'library',
  '생활문화센터': 'welfare',
  '기타': 'culture',
}

function seoulApiUrl(key: string, service: string, start: number, end: number): string {
  return `http://openapi.seoul.go.kr:8088/${key}/json/${service}/${start}/${end}/`
}

export async function fetchSeoulCultureEvents(): Promise<NormalizedPlace[]> {
  const key = env.SEOUL_OPEN_API_KEY
  if (!key) return []

  try {
    const res = await fetch(seoulApiUrl(key, 'culturalEventInfo', 1, 100), {
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return []

    const data = await res.json()
    const rows: CultureEventRow[] = data?.culturalEventInfo?.row ?? []

    return rows
      .filter((row) => row.GUNAME && row.TITLE)
      .map((row, i) => normalizeEventRow(row, i))
  } catch {
    return []
  }
}

export async function fetchSeoulCultureSpaces(): Promise<NormalizedPlace[]> {
  const key = env.SEOUL_OPEN_API_KEY
  if (!key) return []

  try {
    const res = await fetch(seoulApiUrl(key, 'culturalSpaceInfo', 1, 100), {
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return []

    const data = await res.json()
    const rows: CultureSpaceRow[] = data?.culturalSpaceInfo?.row ?? []

    return rows
      .filter((row) => row.GUNAME && row.FAC_NAME)
      .map((row, i) => normalizeSpaceRow(row, i))
  } catch {
    return []
  }
}

// 문화행사 + 문화공간 + 도서관 + 공원 + 체육시설 통합 (id prefix로 소스 구분)
export async function fetchSeoulPlaces(): Promise<NormalizedPlace[]> {
  const [events, spaces, libraries, parks, sports] = await Promise.all([
    fetchSeoulCultureEvents(),
    fetchSeoulCultureSpaces(),
    fetchSeoulLibraries(),
    fetchSeoulParks(),
    fetchSeoulSports(),
  ])
  return [...events, ...spaces, ...libraries, ...parks, ...sports].map(enrichPlace)
}

const FREE_FEE_EXACT = new Set(['무료', '0원', '없음', '0', 'free'])

function isDefinitelyFree(isFreeFlagY: boolean, useFeeText?: string): boolean {
  if (isFreeFlagY) return true
  const normalized = useFeeText?.trim().toLowerCase()
  return !!normalized && FREE_FEE_EXACT.has(normalized)
}

function normalizeEventRow(row: CultureEventRow, index: number): NormalizedPlace {
  const isFree = isDefinitelyFree(row.IS_FREE === 'Y', row.USE_FEE)
  const { latitude, longitude } = toSeoulLatLng(row.LAT, row.LOT)
  const startDate = row.STRTDATE ? row.STRTDATE.split(' ')[0] : undefined

  return {
    id: stableId('ce', row.GUNAME, row.TITLE, startDate ?? ''),
    slug: `culture-event-${index}`,
    sourceType: 'CULTURE_EVENT',
    name: row.TITLE,
    category: CODENAME_TO_CATEGORY[row.CODENAME] ?? 'culture',
    district: row.GUNAME,
    address: row.PLACE || undefined,
    latitude,
    longitude,
    isFree,
    feeText: isFree ? undefined : (row.USE_FEE || undefined),
    homepageUrl: row.HMPG_ADDR || row.ORG_LINK || undefined,
    description: row.DATE || undefined,
    imageUrl: row.MAIN_IMG || undefined,
    eventStartDate: startDate,
  }
}

function normalizeSpaceRow(row: CultureSpaceRow, index: number): NormalizedPlace {
  const isFree = isDefinitelyFree(row.IS_FREE === 'Y', row.USE_FEE)
  // culturalSpaceInfo currently returns X_COORD as latitude and Y_COORD as longitude.
  const { latitude, longitude } = toSeoulLatLng(row.X_COORD, row.Y_COORD)

  return {
    id: stableId('cs', row.GUNAME, row.FAC_NAME, row.ADDR?.slice(0, 20) ?? ''),
    slug: `culture-space-${index}`,
    sourceType: 'CULTURE_SPACE',
    name: row.FAC_NAME,
    category: SPACE_CODENAME_TO_CATEGORY[row.CODENAME] ?? 'culture',
    district: row.GUNAME,
    address: row.ADDR || undefined,
    latitude,
    longitude,
    isFree,
    feeText: isFree ? undefined : (row.USE_FEE || undefined),
    homepageUrl: row.HMPG_ADDR || undefined,
    phone: row.PHNE || undefined,
    description: row.USAGE_DAY_WEEK_AND_TIME || row.FAC_DESC || undefined,
    imageUrl: row.MAIN_IMG || undefined,
  }
}
