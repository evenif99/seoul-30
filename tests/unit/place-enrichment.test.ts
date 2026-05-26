import { describe, expect, it } from 'vitest'
import { enrichPlace } from '@/lib/adapters/enrichment'
import type { NormalizedPlace } from '@/lib/types/place'

const base: Omit<NormalizedPlace, 'sourceType' | 'tags'> = {
  id: 'test-1',
  slug: 'test-1',
  name: '테스트 장소',
  category: 'culture',
  district: '강남구',
  isFree: true,
}

describe('enrichPlace', () => {
  it('LIBRARY 장소에 indoor 태그를 추가한다', () => {
    const place = enrichPlace({ ...base, sourceType: 'LIBRARY' })
    expect(place.tags).toEqual(['indoor'])
  })

  it('PARK 장소에 outdoor 태그를 추가한다', () => {
    const place = enrichPlace({ ...base, sourceType: 'PARK' })
    expect(place.tags).toEqual(['outdoor'])
  })

  it('SPORTS 장소에 indoor 태그를 추가한다', () => {
    const place = enrichPlace({ ...base, sourceType: 'SPORTS' })
    expect(place.tags).toEqual(['indoor'])
  })

  it('CULTURE_SPACE 장소에 indoor 태그를 추가한다', () => {
    const place = enrichPlace({ ...base, sourceType: 'CULTURE_SPACE' })
    expect(place.tags).toEqual(['indoor'])
  })

  it('CULTURE_EVENT 장소에 indoor 태그를 추가한다', () => {
    const place = enrichPlace({ ...base, sourceType: 'CULTURE_EVENT' })
    expect(place.tags).toEqual(['indoor'])
  })

  it('MOCK 장소는 기존 tags를 그대로 유지한다', () => {
    const place = enrichPlace({ ...base, sourceType: 'MOCK', tags: ['outdoor', 'parking'] })
    expect(place.tags).toEqual(['outdoor', 'parking'])
  })

  it('MOCK 장소는 tags가 없어도 추가하지 않는다', () => {
    const place = enrichPlace({ ...base, sourceType: 'MOCK' })
    expect(place.tags).toBeUndefined()
  })

  it('이미 tags가 있는 실제 API 장소는 덮어쓰지 않는다', () => {
    const place = enrichPlace({
      ...base,
      sourceType: 'LIBRARY',
      tags: ['indoor', 'wheelchair'],
    })
    expect(place.tags).toEqual(['indoor', 'wheelchair'])
  })

  it('enrichPlace는 원본 객체를 변경하지 않는다 (immutability)', () => {
    const original: NormalizedPlace = { ...base, sourceType: 'PARK' }
    const enriched = enrichPlace(original)
    expect(original.tags).toBeUndefined()
    expect(enriched).not.toBe(original)
  })
})
