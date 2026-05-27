import { env } from '@/lib/config/env'
import type { NormalizedPlace } from '@/lib/types/place'
import { toSeoulLatLng } from '@/lib/utils/coords'
import { stableId } from '@/lib/utils/stable-id'

interface ParkRow {
  P_PARK: string       // 공원명
  P_ZONE: string       // 자치구
  P_ADDR: string       // 주소
  LATITUDE: string     // 위도
  LONGITUDE: string    // 경도
  P_INTRODUCE: string  // 공원 소개
}

export async function fetchSeoulParks(): Promise<NormalizedPlace[]> {
  const key = env.SEOUL_OPEN_API_KEY
  if (!key) return []

  try {
    const url = `http://openapi.seoul.go.kr:8088/${key}/json/ListParkService/1/100/`
    const res = await fetch(url, {
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return []

    const data = await res.json()
    const rows: ParkRow[] = data?.ListParkService?.row ?? []

    return rows
      .filter((r) => r.P_ZONE && r.P_PARK)
      .map((r, i) => {
        const { latitude, longitude } = toSeoulLatLng(r.LATITUDE, r.LONGITUDE)

        return {
          id: stableId('park', r.P_ZONE, r.P_PARK, r.P_ADDR?.slice(0, 20) ?? ''),
          slug: `park-${i}`,
          sourceType: 'PARK' as const,
          name: r.P_PARK,
          category: 'park',
          district: r.P_ZONE,
          address: r.P_ADDR || undefined,
          latitude,
          longitude,
          isFree: true,
          description: r.P_INTRODUCE || undefined,
          // 공원은 시간 정보 없음 — timefit 스코어 중립(5점) 처리
          openTimeText: undefined,
          closeTimeText: undefined,
        }
      })
  } catch {
    return []
  }
}
