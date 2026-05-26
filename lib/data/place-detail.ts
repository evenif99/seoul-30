import { fetchSeoulPlaces } from '@/lib/adapters/seoul-culture.adapter'
import { featureFlags } from '@/lib/config/feature-flags'
import { MOCK_PLACES } from '@/lib/mock/places'
import { prisma } from '@/lib/prisma'
import type { NormalizedPlace } from '@/lib/types/place'
import type { RecommendationResult } from '@/lib/types/recommendation'

export interface PlaceDetailData {
  place: NormalizedPlace | null
  places: NormalizedPlace[]
  isMock: boolean
}

/** DB 스냅샷 캐시에서 place ID로 장소를 검색.
 *  Seoul API가 동일 장소를 항상 반환하지 않을 경우의 fallback. */
async function findInSnapshots(id: string): Promise<NormalizedPlace | null> {
  try {
    const snapshots = await prisma.recommendationSnapshot.findMany({
      select: { resultJson: true },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })
    for (const snapshot of snapshots) {
      const results = snapshot.resultJson as unknown as RecommendationResult[]
      const found = results.find((r) => r.place.id === id)
      if (found) return found.place
    }
  } catch {
    // DB 조회 실패 시 무시
  }
  return null
}

export async function getPlaceDetailData(id: string): Promise<PlaceDetailData> {
  if (featureFlags.cultureEventsApi) {
    const realPlaces = (await fetchSeoulPlaces()).filter((place) => place.name.trim().length > 0)
    const realPlace = realPlaces.find((place) => place.id === id)

    if (realPlace) {
      return { place: realPlace, places: realPlaces, isMock: false }
    }

    // Seoul API에서 해당 장소를 찾지 못한 경우 — DB 스냅샷 캐시에서 검색
    // (API 페이지네이션/변동으로 누락된 경우 대비)
    if (!id.startsWith('mock-')) {
      const fromSnapshot = await findInSnapshots(id)
      if (fromSnapshot) {
        return { place: fromSnapshot, places: realPlaces, isMock: false }
      }
      if (realPlaces.length > 0) {
        return { place: null, places: realPlaces, isMock: false }
      }
    }
  }

  return {
    place: MOCK_PLACES.find((place) => place.id === id) ?? null,
    places: MOCK_PLACES,
    isMock: true,
  }
}
