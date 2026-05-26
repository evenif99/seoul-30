import type { NormalizedPlace, PlaceTag } from '@/lib/types/place'

/** sourceType별 기본 태그 — 실제 API는 tags 필드를 제공하지 않으므로 자동 추론 */
const SOURCE_DEFAULT_TAGS: Partial<Record<NormalizedPlace['sourceType'], PlaceTag[]>> = {
  LIBRARY:       ['indoor'],
  PARK:          ['outdoor'],
  SPORTS:        ['indoor'],
  CULTURE_SPACE: ['indoor'],
  CULTURE_EVENT: ['indoor'],
  // MOCK: 그대로 유지 (mock 데이터의 기존 tags 사용)
}

/**
 * 실제 API 장소에 sourceType 기반 기본 태그를 보강합니다.
 * - MOCK 장소는 기존 tags 필드를 그대로 유지
 * - 이미 tags가 있는 장소는 덮어쓰지 않음
 */
export function enrichPlace(place: NormalizedPlace): NormalizedPlace {
  if (place.sourceType === 'MOCK') return place
  if (place.tags && place.tags.length > 0) return place

  const defaultTags = SOURCE_DEFAULT_TAGS[place.sourceType]
  if (!defaultTags) return place

  return { ...place, tags: defaultTags }
}
