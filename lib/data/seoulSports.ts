import { env } from '@/lib/config/env'
import type { NormalizedPlace } from '@/lib/types/place'
import { toSeoulLatLng } from '@/lib/utils/coords'

interface SportsRow {
  SVCNM: string    // 서비스명 (시설+종목)
  AREANM: string   // 지역 (자치구)
  PLACENM: string  // 시설명
  DTLCONT: string  // 상세내용
  SVCURL: string   // 예약 URL
  X: string        // 경도
  Y: string        // 위도
  PAYFREE: string  // 유료/무료
}

export async function fetchSeoulSports(): Promise<NormalizedPlace[]> {
  const key = env.SEOUL_OPEN_API_KEY
  if (!key) return []

  try {
    const url = `http://openapi.seoul.go.kr:8088/${key}/json/ListPublicReservationSport/1/100/`
    const res = await fetch(url, {
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return []

    const data = await res.json()
    const rows: SportsRow[] = data?.ListPublicReservationSport?.row ?? []

    return rows
      .filter((r) => r.AREANM && r.SVCNM)
      .map((r, i) => {
        const { latitude, longitude } = toSeoulLatLng(r.Y, r.X)
        const isFree = r.PAYFREE === '무료'

        return {
          id: `sport-${i}-${r.SVCNM.slice(0, 10).replace(/\W/g, '')}`,
          slug: `sports-${i}`,
          sourceType: 'SPORTS' as const,
          name: r.SVCNM,
          category: 'sports',
          district: r.AREANM,
          address: r.PLACENM || undefined,
          latitude,
          longitude,
          isFree,
          feeText: isFree ? undefined : '유료',
          homepageUrl: r.SVCURL || undefined,
          description: r.DTLCONT || undefined,
        }
      })
  } catch {
    return []
  }
}
