import { env } from '@/lib/config/env'

export interface DdareungiStation {
  id: string
  name: string
  lat: number
  lng: number
  availableBikes: number
}

interface BikeListRow {
  stationId: string
  stationName: string
  stationLatitude: string
  stationLongitude: string
  parkingBikeTotCnt: string
}

interface BikeListResponse {
  rentBikeStatus?: {
    row?: BikeListRow[]
  }
}

let _cache: { data: DdareungiStation[]; expiresAt: number } | null = null
const CACHE_MS = 10 * 60 * 1000 // 10분 — 실시간 대여 가능 수 반영

async function fetchPage(key: string, start: number, end: number): Promise<BikeListRow[]> {
  try {
    const res = await fetch(
      `http://openapi.seoul.go.kr:8088/${key}/json/bikeList/${start}/${end}/`,
      { signal: AbortSignal.timeout(8000) },
    )
    if (!res.ok) return []
    const body = (await res.json()) as BikeListResponse
    return body.rentBikeStatus?.row ?? []
  } catch {
    return []
  }
}

export async function getDdareungiStations(): Promise<DdareungiStation[]> {
  if (_cache && Date.now() < _cache.expiresAt) return _cache.data

  const key = env.SEOUL_OPEN_API_KEY
  if (!key) return []

  // 서울 따릉이 대여소는 약 2,800개 — 1000개 단위로 병렬 호출
  const [p1, p2, p3] = await Promise.all([
    fetchPage(key, 1, 1000),
    fetchPage(key, 1001, 2000),
    fetchPage(key, 2001, 3000),
  ])

  const data: DdareungiStation[] = [...p1, ...p2, ...p3]
    .filter((r) => r.stationLatitude && r.stationLongitude)
    .map((r) => ({
      id: r.stationId,
      name: r.stationName,
      lat: parseFloat(r.stationLatitude),
      lng: parseFloat(r.stationLongitude),
      availableBikes: parseInt(r.parkingBikeTotCnt, 10) || 0,
    }))

  if (data.length > 0) {
    _cache = { data, expiresAt: Date.now() + CACHE_MS }
  }
  return data.length > 0 ? data : (_cache?.data ?? [])
}
