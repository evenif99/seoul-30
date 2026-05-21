import { describe, it, expect } from 'vitest'
import type { NormalizedPlace } from '@/lib/types/place'

function passesTagFilter(place: NormalizedPlace, selectedTags: string[]): boolean {
  if (selectedTags.length === 0) return true
  if (!place.tags || place.tags.length === 0) return true  // 실 API 장소 통과
  return selectedTags.every((tag) => place.tags!.includes(tag as NormalizedPlace['tags'] extends (infer T)[] | undefined ? T : never))
}

const base: NormalizedPlace = {
  id: 'test-1',
  slug: 'test-place',
  sourceType: 'MOCK',
  name: '테스트 장소',
  category: 'library',
  district: '종로구',
  isFree: true,
}

describe('tag filter logic', () => {
  it('passes when no tags selected', () => {
    const place = { ...base, tags: ['indoor'] as NormalizedPlace['tags'] }
    expect(passesTagFilter(place, [])).toBe(true)
  })

  it('passes when place has no tags (real API place)', () => {
    expect(passesTagFilter(base, ['indoor'])).toBe(true)
  })

  it('passes when place has all selected tags', () => {
    const place = { ...base, tags: ['indoor', 'wheelchair', 'wifi'] as NormalizedPlace['tags'] }
    expect(passesTagFilter(place, ['indoor', 'wheelchair'])).toBe(true)
  })

  it('filters out when place is missing a selected tag', () => {
    const place = { ...base, tags: ['outdoor'] as NormalizedPlace['tags'] }
    expect(passesTagFilter(place, ['outdoor', 'wheelchair'])).toBe(false)
  })

  it('filters out when place has different tags entirely', () => {
    const place = { ...base, tags: ['parking', 'wifi'] as NormalizedPlace['tags'] }
    expect(passesTagFilter(place, ['indoor'])).toBe(false)
  })

  it('passes when single selected tag matches', () => {
    const place = { ...base, tags: ['family', 'outdoor'] as NormalizedPlace['tags'] }
    expect(passesTagFilter(place, ['family'])).toBe(true)
  })
})
