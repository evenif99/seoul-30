import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { buildReasons, scorePlace } from '@/lib/scoring'
import type { NormalizedPlace } from '@/lib/types/place'
import type { ScoreBreakdown } from '@/lib/types/recommendation'

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

  it('awards full timefit points for parks with no hours (24/7 assumption)', () => {
    const parkPlace: NormalizedPlace = {
      ...basePlace,
      sourceType: 'PARK',
      openTimeText: undefined,
      closeTimeText: undefined,
    }
    const score = scorePlace(parkPlace, {}, null)

    expect(score.timefit).toBe(10)
  })

  it('returns neutral timefit points for non-park places with no hours', () => {
    const libraryPlace: NormalizedPlace = {
      ...basePlace,
      sourceType: 'LIBRARY',
      openTimeText: undefined,
      closeTimeText: undefined,
    }
    const score = scorePlace(libraryPlace, {}, null)

    expect(score.timefit).toBe(5)
  })

  it('sets total to the sum of all dimensions', () => {
    const score = scorePlace(basePlace, { district: 'Seongdong-gu', category: 'park' }, null)

    expect(score.total).toBe(
      score.access + score.relevance + score.cost + score.congestion + score.timefit + score.freshness,
    )
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// buildReasons — Phase 69
// ─────────────────────────────────────────────────────────────────────────────
const baseScore: ScoreBreakdown = {
  access: 10,
  relevance: 12,
  cost: 5,
  congestion: 8,
  timefit: 5,
  freshness: 0,
  feedbackBonus: 0,
  total: 40,
}

describe('buildReasons', () => {
  it('returns empty array when no conditions are met', () => {
    const place = { ...basePlace, isFree: false }
    const score: ScoreBreakdown = { ...baseScore, timefit: 0, congestion: 8, feedbackBonus: 0, freshness: 0 }
    expect(buildReasons(place, score)).toEqual([])
  })

  it('includes "free" for a free place', () => {
    const reasons = buildReasons(basePlace, { ...baseScore, timefit: 0 })
    expect(reasons).toContain('free')
  })

  it('includes "open_now" when timefit >= 8', () => {
    const reasons = buildReasons({ ...basePlace, isFree: false }, { ...baseScore, timefit: 10 })
    expect(reasons).toContain('open_now')
  })

  it('includes "nearby" when transitMinutes <= 10', () => {
    const reasons = buildReasons({ ...basePlace, isFree: false }, { ...baseScore, transitMinutes: 8 })
    expect(reasons).toContain('nearby')
  })

  it('does NOT include "nearby" when transitMinutes is undefined', () => {
    const reasons = buildReasons(basePlace, { ...baseScore })
    expect(reasons).not.toContain('nearby')
  })

  it('includes "low_crowd" when congestion >= 12', () => {
    const reasons = buildReasons({ ...basePlace, isFree: false }, { ...baseScore, congestion: 15, timefit: 0 })
    expect(reasons).toContain('low_crowd')
  })

  it('includes "high_rated" when feedbackBonus >= 2', () => {
    const reasons = buildReasons({ ...basePlace, isFree: false }, { ...baseScore, feedbackBonus: 2, timefit: 0 })
    expect(reasons).toContain('high_rated')
  })

  it('includes "new_event" when freshness >= 3', () => {
    const reasons = buildReasons({ ...basePlace, isFree: false }, { ...baseScore, freshness: 5, timefit: 0 })
    expect(reasons).toContain('new_event')
  })

  it('caps result at 3 reasons (priority: nearby > free > open_now)', () => {
    const score: ScoreBreakdown = {
      ...baseScore,
      transitMinutes: 5,
      timefit: 10,
      congestion: 15,
      feedbackBonus: 2,
      freshness: 5,
    }
    const reasons = buildReasons(basePlace, score)
    expect(reasons).toHaveLength(3)
    // 우선순위: nearby > free > open_now
    expect(reasons[0]).toBe('nearby')
    expect(reasons[1]).toBe('free')
    expect(reasons[2]).toBe('open_now')
  })
})
