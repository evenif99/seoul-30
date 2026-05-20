import { describe, expect, it } from 'vitest'
import { estimateTransit, haversineKm, transitAccessScore } from '@/lib/utils/transit-time'

describe('transit-time utilities', () => {
  it('calculates the straight-line distance between Seoul Station and Gangnam Station', () => {
    const distance = haversineKm(37.5547, 126.9706, 37.4979, 127.0276)

    expect(distance).toBeGreaterThan(8)
    expect(distance).toBeLessThan(10)
  })

  it('uses walking for a short 0.5km trip', () => {
    const estimate = estimateTransit(0.5, true, true)

    expect(estimate.mode).toBe('도보')
    expect(estimate.minutes).toBeGreaterThanOrEqual(7)
    expect(estimate.minutes).toBeLessThanOrEqual(8)
  })

  it('uses surface transit for a 2km trip when bike stations are nearby', () => {
    const estimate = estimateTransit(2, true, true)

    expect(['따릉이', '버스']).toContain(estimate.mode)
  })

  it('uses subway for a longer 8km trip without bike coverage', () => {
    const estimate = estimateTransit(8, false, false)

    expect(estimate.mode).toBe('지하철')
  })

  it('scores transit access by minute buckets', () => {
    expect(transitAccessScore(10)).toBe(30)
    expect(transitAccessScore(35)).toBe(10)
    expect(transitAccessScore(55)).toBe(0)
  })
})
