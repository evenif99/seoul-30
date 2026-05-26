import { describe, it, expect } from 'vitest'
import type { NormalizedPlace } from '@/lib/types/place'

// JSON-LD 생성 로직을 page.tsx에서 추출해 동일하게 검증
function buildJsonLd(place: NormalizedPlace) {
  return {
    '@context': 'https://schema.org',
    '@type': 'TouristAttraction',
    name: place.name,
    description: place.description ?? undefined,
    isAccessibleForFree: place.isFree,
    ...(place.address && {
      address: {
        '@type': 'PostalAddress',
        streetAddress: place.address,
        addressLocality: place.district,
        addressCountry: 'KR',
      },
    }),
    ...(place.phone && { telephone: place.phone }),
    ...(place.homepageUrl && { url: place.homepageUrl }),
    ...(place.imageUrl && { image: place.imageUrl }),
    ...(place.latitude && place.longitude && {
      geo: {
        '@type': 'GeoCoordinates',
        latitude: place.latitude,
        longitude: place.longitude,
      },
    }),
  }
}

const basePlace: NormalizedPlace = {
  id: 'mock-1',
  slug: 'test-place',
  sourceType: 'MOCK',
  name: '성동구립 뚝섬도서관',
  category: 'library',
  district: '성동구',
  isFree: true,
}

describe('Place JSON-LD 구조화 데이터', () => {
  it('@context와 @type이 올바르게 설정된다', () => {
    const ld = buildJsonLd(basePlace)
    expect(ld['@context']).toBe('https://schema.org')
    expect(ld['@type']).toBe('TouristAttraction')
  })

  it('name 필드가 포함된다', () => {
    const ld = buildJsonLd(basePlace)
    expect(ld.name).toBe('성동구립 뚝섬도서관')
  })

  it('isFree가 isAccessibleForFree로 매핑된다', () => {
    const freeLd = buildJsonLd({ ...basePlace, isFree: true })
    expect(freeLd.isAccessibleForFree).toBe(true)

    const paidLd = buildJsonLd({ ...basePlace, isFree: false })
    expect(paidLd.isAccessibleForFree).toBe(false)
  })

  it('address가 있으면 PostalAddress 포함', () => {
    const ld = buildJsonLd({ ...basePlace, address: '고산자로 71', district: '성동구' })
    expect(ld.address).toEqual({
      '@type': 'PostalAddress',
      streetAddress: '고산자로 71',
      addressLocality: '성동구',
      addressCountry: 'KR',
    })
  })

  it('address 없으면 address 필드 미포함', () => {
    const ld = buildJsonLd(basePlace)
    expect(ld.address).toBeUndefined()
  })

  it('좌표가 있으면 GeoCoordinates 포함', () => {
    const ld = buildJsonLd({ ...basePlace, latitude: 37.5476, longitude: 127.0504 })
    expect(ld.geo).toEqual({
      '@type': 'GeoCoordinates',
      latitude: 37.5476,
      longitude: 127.0504,
    })
  })

  it('좌표 없으면 geo 필드 미포함', () => {
    const ld = buildJsonLd(basePlace)
    expect(ld.geo).toBeUndefined()
  })

  it('imageUrl 있으면 image 필드 포함', () => {
    const ld = buildJsonLd({ ...basePlace, imageUrl: 'https://images.unsplash.com/test.jpg' })
    expect(ld.image).toBe('https://images.unsplash.com/test.jpg')
  })

  it('phone 있으면 telephone 필드 포함', () => {
    const ld = buildJsonLd({ ...basePlace, phone: '02-1234-5678' })
    expect(ld.telephone).toBe('02-1234-5678')
  })

  it('homepageUrl 있으면 url 필드 포함', () => {
    const ld = buildJsonLd({ ...basePlace, homepageUrl: 'https://example.go.kr' })
    expect(ld.url).toBe('https://example.go.kr')
  })

  it('JSON 직렬화가 유효한 JSON 문자열을 반환한다', () => {
    const fullPlace: NormalizedPlace = {
      ...basePlace,
      address: '고산자로 71',
      latitude: 37.5476,
      longitude: 127.0504,
      imageUrl: 'https://images.unsplash.com/test.jpg',
      phone: '02-1234-5678',
    }
    const serialized = JSON.stringify(buildJsonLd(fullPlace))
    expect(() => JSON.parse(serialized)).not.toThrow()
    const parsed = JSON.parse(serialized)
    expect(parsed['@type']).toBe('TouristAttraction')
    expect(parsed.isAccessibleForFree).toBe(true)
  })
})
