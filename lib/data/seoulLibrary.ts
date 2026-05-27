import { env } from '@/lib/config/env'
import type { NormalizedPlace } from '@/lib/types/place'
import { toSeoulLatLng } from '@/lib/utils/coords'
import { stableId } from '@/lib/utils/stable-id'

interface LibraryRow {
  LBRRY_NM: string       // 도서관명
  GUNAME: string         // 자치구
  ADRES: string          // 주소
  LATITUDE: string       // 위도
  LONGITUDE: string      // 경도
  HMPG_ADDR: string      // 홈페이지
  TEL_NO: string         // 전화번호
  WEEKDAY_OPEN_TIME: string   // 평일 개관시간 (HH:MM)
  WEEKDAY_CLOSE_TIME: string  // 평일 폐관시간 (HH:MM)
}

export async function fetchSeoulLibraries(): Promise<NormalizedPlace[]> {
  const key = env.SEOUL_OPEN_API_KEY
  if (!key) return []

  try {
    const url = `http://openapi.seoul.go.kr:8088/${key}/json/SeoulPublicLibraryInfo/1/100/`
    const res = await fetch(url, {
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return []

    const data = await res.json()
    const rows: LibraryRow[] = data?.SeoulPublicLibraryInfo?.row ?? []

    return rows
      .filter((r) => r.GUNAME && r.LBRRY_NM)
      .map((r, i) => {
        const { latitude, longitude } = toSeoulLatLng(r.LATITUDE, r.LONGITUDE)
        const open = r.WEEKDAY_OPEN_TIME?.slice(0, 5) || undefined
        const close = r.WEEKDAY_CLOSE_TIME?.slice(0, 5) || undefined

        return {
          id: stableId('lib', r.GUNAME, r.LBRRY_NM, r.ADRES?.slice(0, 20) ?? ''),
          slug: `library-${i}`,
          sourceType: 'LIBRARY' as const,
          name: r.LBRRY_NM,
          category: 'library',
          district: r.GUNAME,
          address: r.ADRES || undefined,
          latitude,
          longitude,
          isFree: true,
          homepageUrl: r.HMPG_ADDR || undefined,
          phone: r.TEL_NO || undefined,
          openTimeText: open,
          closeTimeText: close,
        }
      })
  } catch {
    return []
  }
}
