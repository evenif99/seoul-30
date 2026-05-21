import { fetchSeoulPlaces } from '@/lib/adapters/seoul-culture.adapter'
import { featureFlags } from '@/lib/config/feature-flags'
import { MOCK_PLACES } from '@/lib/mock/places'
import type { NormalizedPlace } from '@/lib/types/place'

export interface PlaceDetailData {
  place: NormalizedPlace | null
  places: NormalizedPlace[]
  isMock: boolean
}

export async function getPlaceDetailData(id: string): Promise<PlaceDetailData> {
  if (featureFlags.cultureEventsApi) {
    const realPlaces = (await fetchSeoulPlaces()).filter((place) => place.name.trim().length > 0)
    const realPlace = realPlaces.find((place) => place.id === id)

    if (realPlace) {
      return { place: realPlace, places: realPlaces, isMock: false }
    }

    if (realPlaces.length > 0 && !id.startsWith('mock-')) {
      return { place: null, places: realPlaces, isMock: false }
    }
  }

  return {
    place: MOCK_PLACES.find((place) => place.id === id) ?? null,
    places: MOCK_PLACES,
    isMock: true,
  }
}
