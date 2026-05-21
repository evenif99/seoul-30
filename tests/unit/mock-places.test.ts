import { describe, expect, it } from 'vitest'
import { MOCK_PLACES } from '@/lib/mock/places'

const SEOUL = { latMin: 37.413, latMax: 37.715, lngMin: 126.734, lngMax: 127.270 }

describe('mock place data quality', () => {
  it('uses unique ids and slugs', () => {
    const ids = new Set(MOCK_PLACES.map((place) => place.id))
    const slugs = new Set(MOCK_PLACES.map((place) => place.slug))

    expect(ids.size).toBe(MOCK_PLACES.length)
    expect(slugs.size).toBe(MOCK_PLACES.length)
  })

  it('has required public-facing place fields', () => {
    for (const place of MOCK_PLACES) {
      expect(place.name.trim()).toBeTruthy()
      expect(place.category.trim()).toBeTruthy()
      expect(place.district.trim()).toBeTruthy()
      expect(place.address?.trim()).toBeTruthy()
      expect(place.nearestStation?.trim()).toBeTruthy()
    }
  })

  it('keeps all coordinates inside Seoul bounds', () => {
    for (const place of MOCK_PLACES) {
      expect(place.latitude, `${place.id} latitude`).toBeGreaterThanOrEqual(SEOUL.latMin)
      expect(place.latitude, `${place.id} latitude`).toBeLessThanOrEqual(SEOUL.latMax)
      expect(place.longitude, `${place.id} longitude`).toBeGreaterThanOrEqual(SEOUL.lngMin)
      expect(place.longitude, `${place.id} longitude`).toBeLessThanOrEqual(SEOUL.lngMax)
    }
  })
})
