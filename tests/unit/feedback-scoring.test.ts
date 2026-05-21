import { describe, expect, it } from 'vitest'
import { calcFeedbackBonus, scorePlace, type FeedbackStats } from '@/lib/scoring'
import type { NormalizedPlace } from '@/lib/types/place'
import type { RecommendationInput } from '@/lib/types/recommendation'

describe('calcFeedbackBonus', () => {
  it('returns 0 when stats is undefined', () => {
    expect(calcFeedbackBonus(undefined)).toBe(0)
  })

  it('returns 0 when totalCount is below threshold (< 3)', () => {
    expect(calcFeedbackBonus({ upCount: 2, totalCount: 2 })).toBe(0)
    expect(calcFeedbackBonus({ upCount: 0, totalCount: 1 })).toBe(0)
  })

  it('returns +2 when upRatio >= 0.75 (high approval)', () => {
    expect(calcFeedbackBonus({ upCount: 3, totalCount: 4 })).toBe(2)  // 75%
    expect(calcFeedbackBonus({ upCount: 10, totalCount: 10 })).toBe(2) // 100%
    expect(calcFeedbackBonus({ upCount: 8, totalCount: 10 })).toBe(2)  // 80%
  })

  it('returns -3 when upRatio <= 0.25 (low approval)', () => {
    expect(calcFeedbackBonus({ upCount: 0, totalCount: 5 })).toBe(-3)  // 0%
    expect(calcFeedbackBonus({ upCount: 1, totalCount: 4 })).toBe(-3)  // 25%
    expect(calcFeedbackBonus({ upCount: 0, totalCount: 10 })).toBe(-3) // 0%
  })

  it('returns 0 for middle ratios (between 25% and 75%)', () => {
    expect(calcFeedbackBonus({ upCount: 2, totalCount: 4 })).toBe(0)  // 50%
    expect(calcFeedbackBonus({ upCount: 3, totalCount: 6 })).toBe(0)  // 50%
    expect(calcFeedbackBonus({ upCount: 2, totalCount: 5 })).toBe(0)  // 40%
  })
})

const place: NormalizedPlace = {
  id: 'mock-1',
  slug: 'test-place',
  sourceType: 'MOCK',
  name: '테스트 장소',
  category: 'library',
  district: '종로구',
  isFree: true,
}

const input: RecommendationInput = {
  district: '종로구',
  category: 'library',
}

describe('scorePlace with feedbackStats', () => {
  it('includes feedbackBonus 0 when no stats provided', () => {
    const score = scorePlace(place, input, null)
    expect(score.feedbackBonus).toBe(0)
    expect(score.total).toBe(score.access + score.relevance + score.cost + score.congestion + score.timefit + score.freshness)
  })

  it('adds +2 to total when place has high approval', () => {
    const highApproval: FeedbackStats = { upCount: 4, totalCount: 5 }
    const scoreWithBonus = scorePlace(place, input, null, true, true, highApproval)
    const scoreWithout = scorePlace(place, input, null)
    expect(scoreWithBonus.feedbackBonus).toBe(2)
    expect(scoreWithBonus.total).toBe(scoreWithout.total + 2)
  })

  it('subtracts 3 from total when place has low approval', () => {
    const lowApproval: FeedbackStats = { upCount: 0, totalCount: 5 }
    const scoreWithPenalty = scorePlace(place, input, null, true, true, lowApproval)
    const scoreWithout = scorePlace(place, input, null)
    expect(scoreWithPenalty.feedbackBonus).toBe(-3)
    expect(scoreWithPenalty.total).toBe(scoreWithout.total - 3)
  })
})
