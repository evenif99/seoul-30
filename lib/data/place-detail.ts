import { cache } from 'react'
import { fetchSeoulCultureEvents, fetchSeoulCultureSpaces } from '@/lib/adapters/seoul-culture.adapter'
import { enrichPlace } from '@/lib/adapters/enrichment'
import { featureFlags } from '@/lib/config/feature-flags'
import { MOCK_PLACES } from '@/lib/mock/places'
import { prisma } from '@/lib/prisma'
import { fetchSeoulLibraries } from '@/lib/data/seoulLibrary'
import { fetchSeoulParks } from '@/lib/data/seoulParks'
import { fetchSeoulSports } from '@/lib/data/seoulSports'
import type { NormalizedPlace } from '@/lib/types/place'
import type { RecommendationResult } from '@/lib/types/recommendation'

export interface PlaceDetailData {
  place: NormalizedPlace | null
  places: NormalizedPlace[]
  isMock: boolean
}

/**
 * DB 스냅샷에서 place ID로 장소를 검색한다.
 * 최근 20개 스냅샷을 순서대로 탐색하여 일치하는 장소를 반환.
 */
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

/**
 * 가장 최근 스냅샷의 장소 목록을 반환한다.
 * 상세 페이지의 근처 장소 추천에 사용 — Seoul API 재호출 없이 캐시 활용.
 */
export async function getSnapshotPlaces(): Promise<NormalizedPlace[]> {
  try {
    const snapshot = await prisma.recommendationSnapshot.findFirst({
      select: { resultJson: true },
      orderBy: { createdAt: 'desc' },
    })
    if (!snapshot) return []
    const results = snapshot.resultJson as unknown as RecommendationResult[]
    return results.map((r) => r.place)
  } catch {
    return []
  }
}

/**
 * ID prefix를 기반으로 해당 소스 API만 선택적으로 호출한다.
 * 전체 5개 API 대신 1개만 호출하여 불필요한 네트워크 요청을 줄인다.
 *
 * | prefix  | 소스                     |
 * |---------|--------------------------|
 * | ce-     | 서울 문화행사 API         |
 * | cs-     | 서울 문화공간 API         |
 * | lib-    | 서울 공공도서관 API       |
 * | park-   | 서울 공원 API             |
 * | sport-  | 서울 공공체육시설 API     |
 */
async function fetchByIdPrefix(id: string): Promise<NormalizedPlace[]> {
  const applyEnrich = (places: NormalizedPlace[]) => places.map(enrichPlace)

  if (id.startsWith('ce-'))    return applyEnrich(await fetchSeoulCultureEvents())
  if (id.startsWith('cs-'))    return applyEnrich(await fetchSeoulCultureSpaces())
  if (id.startsWith('lib-'))   return applyEnrich(await fetchSeoulLibraries())
  if (id.startsWith('park-'))  return applyEnrich(await fetchSeoulParks())
  if (id.startsWith('sport-')) return applyEnrich(await fetchSeoulSports())
  return []
}

/**
 * 상세 페이지용 장소 조회:
 * 1. DB 스냅샷 캐시 우선 검색 (API 호출 없음, ~50ms)
 * 2. 스냅샷에 없으면 ID prefix 기반 단일 소스 fetch (1개 API, ~300ms)
 * 3. 실 API 모드 비활성 또는 mock-* ID → MOCK_PLACES 반환
 */
/**
 * React.cache()로 감싸 동일 요청 내 중복 호출(generateMetadata + Page)을
 * 자동으로 dedup — DB/API 호출이 1회로 제한된다.
 */
export const getPlaceDetailData = cache(async function getPlaceDetailData(id: string): Promise<PlaceDetailData> {
  if (featureFlags.cultureEventsApi) {
    // 1단계: DB 스냅샷 캐시 검색
    const fromSnapshot = await findInSnapshots(id)
    if (fromSnapshot) {
      const snapshotPlaces = await getSnapshotPlaces()
      return {
        place: fromSnapshot,
        places: snapshotPlaces.length > 0 ? snapshotPlaces : [fromSnapshot],
        isMock: false,
      }
    }

    // 2단계: mock ID가 아닌 경우 — ID prefix 기반 선택적 fetch
    if (!id.startsWith('mock-')) {
      const sourcePlaces = await fetchByIdPrefix(id)
      const place = sourcePlaces.find((p) => p.id === id) ?? null

      // 근처 장소는 스냅샷에서 보충 (더 다양한 소스 커버)
      const snapshotPlaces = await getSnapshotPlaces()
      const places = snapshotPlaces.length > 0 ? snapshotPlaces : sourcePlaces

      return { place, places, isMock: false }
    }
  }

  return {
    place: MOCK_PLACES.find((place) => place.id === id) ?? null,
    places: MOCK_PLACES,
    isMock: true,
  }
})
