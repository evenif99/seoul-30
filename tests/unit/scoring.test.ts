import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { scorePlace } from '@/lib/scoring'
import type { NormalizedPlace } from '@/lib/types/place'

const basePlace: NormalizedPlace = {
  id: 'test-place',
  slug: 'test-place',
  sourceType: 'MOCK',
  name: 'Test Place',
  category: 'park',
  district: 'Seongdong-gu',
  isFree: true,
  openTimeText: '09:00',
  closeTimeText: '18:00',
}

describe('scorePlace', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-18T01:00:00Z')) // 01:00 UTC = 10:00 KST, within 09:00-18:00
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('awards full access points when district matches', () => {
    const score = scorePlace(basePlace, { district: 'Seongdong-gu' }, null)

    expect(score.access).toBe(30)
  })

  it('awards full relevance points when category matches', () => {
    const score = scorePlace(basePlace, { category: 'park' }, null)

    expect(score.relevance).toBe(25)
  })

  it('reduces cost points for paid places when free-only is requested', () => {
    const paidPlace = { ...basePlace, isFree: false }

    const score = scorePlace(paidPlace, { isFreeOnly: true }, null)

    expect(score.cost).toBe(0)
  })

  it('uses neutral congestion points when realtime data is missing', () => {
    const score = scorePlace(basePlace, {}, null)

    expect(score.congestion).toBe(8)
  })

  it('awards timefit points when the place is currently open', () => {
    const score = scorePlace(basePlace, {}, null)

    expect(score.timefit).toBe(10)
  })

  it('awards freshness points for events starting within seven days', () => {
    const eventPlace = { ...basePlace, eventStartDate: '2026-05-20' }

    const score = scorePlace(eventPlace, {}, null)

    expect(score.freshness).toBe(5)
  })

  it('sets total to the sum of all dimensions', () => {
    const score = scorePlace(basePlace, { district: 'Seongdong-gu', category: 'park' }, null)

    expect(score.total).toBe(
      score.access + score.relevance + score.cost + score.congestion + score.timefit + score.freshness,
    )
  })
})
