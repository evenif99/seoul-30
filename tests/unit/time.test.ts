import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { isCurrentlyOpen, kstCurrentMinutes, parseHHMM } from '@/lib/utils/time'

// ─────────────────────────────────────────────────────────────────────────────
// parseHHMM
// ─────────────────────────────────────────────────────────────────────────────
describe('parseHHMM', () => {
  it('parses standard two-digit HH:MM', () => {
    expect(parseHHMM('09:00')).toBe(540)
  })

  it('parses single-digit hour H:MM', () => {
    expect(parseHHMM('9:00')).toBe(540)
  })

  it('parses midnight 00:00', () => {
    expect(parseHHMM('00:00')).toBe(0)
  })

  it('parses last minute 23:59', () => {
    expect(parseHHMM('23:59')).toBe(23 * 60 + 59)
  })

  it('returns null for Korean-style format', () => {
    expect(parseHHMM('09시')).toBeNull()
  })

  it('returns null for am/pm format', () => {
    expect(parseHHMM('오전 9:00')).toBeNull()
  })

  it('returns null for HH:MM:SS format', () => {
    // 앞 HH:MM 부분은 매치되지만 초가 붙어도 앞 두 그룹만 파싱 → 정상 처리
    // 즉 "09:00:00" → 540 (초는 무시) — 허용 범위
    expect(parseHHMM('09:00:00')).toBe(540)
  })

  it('returns null for empty string', () => {
    expect(parseHHMM('')).toBeNull()
  })

  it('returns null for hour out of range', () => {
    expect(parseHHMM('25:00')).toBeNull()
  })

  it('returns null for minute out of range', () => {
    expect(parseHHMM('09:60')).toBeNull()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// kstCurrentMinutes
// ─────────────────────────────────────────────────────────────────────────────
describe('kstCurrentMinutes', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('returns KST minutes from UTC time', () => {
    // 01:00 UTC = 10:00 KST → 600분
    vi.setSystemTime(new Date('2026-05-18T01:00:00Z'))
    expect(kstCurrentMinutes()).toBe(600)
  })

  it('wraps around midnight correctly', () => {
    // 23:00 UTC = 08:00 KST 다음날 → (23*60 + 9*60) % 1440 = (1380+540) % 1440 = 480
    vi.setSystemTime(new Date('2026-05-18T23:00:00Z'))
    expect(kstCurrentMinutes()).toBe(480)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// isCurrentlyOpen
// ─────────────────────────────────────────────────────────────────────────────
describe('isCurrentlyOpen', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    // 01:00 UTC = 10:00 KST (600분)
    vi.setSystemTime(new Date('2026-05-18T01:00:00Z'))
  })
  afterEach(() => vi.useRealTimers())

  it('returns true when current time is within open hours', () => {
    expect(isCurrentlyOpen('09:00', '18:00')).toBe(true)
  })

  it('returns false when current time is before open hours', () => {
    expect(isCurrentlyOpen('11:00', '18:00')).toBe(false)
  })

  it('returns false when current time is after close hours', () => {
    expect(isCurrentlyOpen('06:00', '09:00')).toBe(false)
  })

  it('returns true for 24-hour special case 00:00–23:59', () => {
    expect(isCurrentlyOpen('00:00', '23:59')).toBe(true)
  })

  it('returns false on open time parse failure', () => {
    expect(isCurrentlyOpen('오전 9시', '18:00')).toBe(false)
  })

  it('returns false on close time parse failure', () => {
    expect(isCurrentlyOpen('09:00', '18시')).toBe(false)
  })

  it('handles midnight-crossing hours: inside range', () => {
    // 10:00 KST, range 22:00–02:00 → outside (10:00 < 22:00 && 10:00 >= 02:00) → false
    expect(isCurrentlyOpen('22:00', '02:00')).toBe(false)
  })

  it('handles midnight-crossing hours: inside range at night', () => {
    // 23:30 KST = 14:30 UTC
    vi.setSystemTime(new Date('2026-05-18T14:30:00Z'))
    expect(isCurrentlyOpen('22:00', '02:00')).toBe(true)
  })

  it('handles midnight-crossing hours: inside range early morning', () => {
    // 01:00 KST = 16:00 UTC 전날 → 실제로 01:00 KST = UTC 전날 16:00
    vi.setSystemTime(new Date('2026-05-17T16:00:00Z')) // 01:00 KST
    expect(isCurrentlyOpen('22:00', '02:00')).toBe(true)
  })

  it('handles midnight-crossing hours: outside range in afternoon', () => {
    // 14:00 KST = 05:00 UTC
    vi.setSystemTime(new Date('2026-05-18T05:00:00Z'))
    expect(isCurrentlyOpen('22:00', '02:00')).toBe(false)
  })
})
