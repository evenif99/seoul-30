import { afterEach, describe, expect, it, vi } from 'vitest'

const mockEnv = vi.hoisted(() => ({ SEOUL_OPEN_API_KEY: 'test_key' }))
vi.mock('@/lib/config/env', () => ({ env: mockEnv }))

import { fetchSeoulCongestion } from '@/lib/adapters/seoul-citydata.adapter'

afterEach(() => {
  vi.restoreAllMocks()
  mockEnv.SEOUL_OPEN_API_KEY = 'test_key'
})

function jsonResponse(body: unknown) {
  return { ok: true, json: async () => body }
}

const SAMPLE_ROW = {
  AREA_NM: '강남역',
  AREA_CONGEST_LVL: '보통',
  AREA_CONGEST_MSG: '사람이 몰릴 수 있어요.',
}

describe('fetchSeoulCongestion', () => {
  it('returns null when SEOUL_OPEN_API_KEY is missing', async () => {
    mockEnv.SEOUL_OPEN_API_KEY = ''
    const result = await fetchSeoulCongestion('강남구')
    expect(result).toBeNull()
  })

  it('returns null for district not in area mapping', async () => {
    const result = await fetchSeoulCongestion('알수없는구')
    expect(result).toBeNull()
  })

  it('returns RealtimeSignal with parsed congestion for a known district', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      jsonResponse({ 'SeoulRtd.citydata_ppltn': [SAMPLE_ROW] }) as any
    )

    const result = await fetchSeoulCongestion('강남구')
    expect(result).not.toBeNull()
    expect(result?.congestionLevel).toBe('보통')
    expect(result?.areaName).toBe('강남역')
    expect(result?.isMock).toBe(false)
    expect(result?.updatedAt).toBeTruthy()
  })

  it('returns null when the API response has no rows', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      jsonResponse({ 'SeoulRtd.citydata_ppltn': [] }) as any
    )
    const result = await fetchSeoulCongestion('강남구')
    expect(result).toBeNull()
  })

  it('returns null when the API responds with a non-ok status', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({ ok: false } as any)
    const result = await fetchSeoulCongestion('강남구')
    expect(result).toBeNull()
  })

  it('returns null on network error (fetch throws)', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('network error'))
    const result = await fetchSeoulCongestion('마포구')
    expect(result).toBeNull()
  })

  it('maps all four congestion levels without error', async () => {
    const levels = ['여유', '보통', '약간붐빔', '붐빔'] as const
    for (const level of levels) {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        jsonResponse({ 'SeoulRtd.citydata_ppltn': [{ ...SAMPLE_ROW, AREA_CONGEST_LVL: level }] }) as any
      )
      const result = await fetchSeoulCongestion('강남구')
      expect(result?.congestionLevel).toBe(level)
    }
  })

  it('includes area code and name matching the district mapping', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      jsonResponse({ 'SeoulRtd.citydata_ppltn': [{ ...SAMPLE_ROW, AREA_NM: '홍대입구역' }] }) as any
    )
    const result = await fetchSeoulCongestion('마포구')
    expect(result?.areaCode).toBe('홍대입구역')
    expect(result?.areaName).toBe('홍대입구역')
  })
})
