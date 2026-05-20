import { describe, it, expect, vi, afterEach } from 'vitest'
import { relativeTime } from '@/lib/utils/relative-time'

afterEach(() => vi.useRealTimers())

function isoAgo(ms: number): string {
  return new Date(Date.now() - ms).toISOString()
}

describe('relativeTime', () => {
  it('returns "방금 전" for under 1 minute (ko)', () => {
    expect(relativeTime(isoAgo(30_000), 'ko')).toBe('방금 전')
  })

  it('returns "just now" for under 1 minute (en)', () => {
    expect(relativeTime(isoAgo(30_000), 'en')).toBe('just now')
  })

  it('returns minutes ago (ko)', () => {
    expect(relativeTime(isoAgo(5 * 60_000), 'ko')).toBe('5분 전')
  })

  it('returns minutes ago (en)', () => {
    expect(relativeTime(isoAgo(5 * 60_000), 'en')).toBe('5m ago')
  })

  it('returns hours ago (ko)', () => {
    expect(relativeTime(isoAgo(3 * 60 * 60_000), 'ko')).toBe('3시간 전')
  })

  it('returns hours ago (en)', () => {
    expect(relativeTime(isoAgo(3 * 60 * 60_000), 'en')).toBe('3h ago')
  })

  it('returns days ago (ko)', () => {
    expect(relativeTime(isoAgo(2 * 24 * 60 * 60_000), 'ko')).toBe('2일 전')
  })

  it('returns days ago (en)', () => {
    expect(relativeTime(isoAgo(2 * 24 * 60 * 60_000), 'en')).toBe('2d ago')
  })
})
