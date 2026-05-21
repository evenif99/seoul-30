import { env } from '@/lib/config/env'
import type { NormalizedPlace } from '@/lib/types/place'

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
        const lat = parseFloat(r.LATITUDE)
        const lng = parseFloat(r.LONGITUDE)

        return {
          id: `park-${i}-${r.P_PARK.slice(0, 10).replace(/\W/g, '')}`,
          slug: `park-${i}`,
          sourceType: 'PARK' as const,
          name: r.P_PARK,
          category: 'park',
          district: r.P_ZONE,
          address: r.P_ADDR || undefined,
          // 좌표 없는 공원은 undefined — 지도 마커 없이 리스트만 표시
          latitude: isNaN(lat) || lat === 0 ? undefined : lat,
          longitude: isNaN(lng) || lng === 0 ? undefined : lng,
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
