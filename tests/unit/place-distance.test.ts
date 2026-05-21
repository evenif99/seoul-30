import { describe, expect, it } from 'vitest'
import { nearbyPlacesFor } from '@/lib/utils/place-distance'
import type { NormalizedPlace } from '@/lib/types/place'

const basePlace: NormalizedPlace = {
  id: 'base',
  slug: 'base',
  sourceType: 'MOCK',
  name: 'Base',
  category: 'culture',
  district: 'Jung-gu',
  address: 'Seoul',
  latitude: 37.5665,
  longitude: 126.978,
  isFree: true,
}

function place(id: string, lat: number | undefined, lng: number | undefined): NormalizedPlace {
  return { ...basePlace, id, slug: id, name: id, latitude: lat, longitude: lng }
}

describe('nearbyPlacesFor', () => {
  it('returns closest places with usable coordinates', () => {
    const nearby = nearbyPlacesFor(basePlace, [
      basePlace,
      place('near-2', 37.568, 126.979),
      place('near-1', 37.567, 126.9785),
      place('missing', undefined, undefined),
      place('far', 37.65, 127.08),
    ])

    expect(nearby.map((item) => item.place.id)).toEqual(['near-1', 'near-2'])
    expect(nearby[0].distanceKm).toBeLessThan(nearby[1].distanceKm)
  })

  it('returns an empty list when target coordinates are missing', () => {
    expect(nearbyPlacesFor(place('no-coords', undefined, undefined), [basePlace])).toEqual([])
  })
})
