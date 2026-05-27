/**
 * seoulParks adapter 단위 테스트
 *
 * Seoul Open API (ListParkService) 실 응답 형식 fixture로
 * 파싱·정규화 동작을 검증한다.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PARK_API_RESPONSE } from '@tests/fixtures/seoul-api.fixture'

vi.mock('@/lib/config/env', () => ({
  env: { SEOUL_OPEN_API_KEY: 'TEST_KEY' },
}))

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

const { fetchSeoulParks } = await import('@/lib/data/seoulParks')

beforeEach(() => {
  mockFetch.mockReset()
})

describe('fetchSeoulParks', () => {
  it('정상 응답 파싱 — 유효 데이터 공원 반환', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => PARK_API_RESPONSE,
    })

    const places = await fetchSeoulParks()

    // P_ZONE 없는 항목(index 3) 제거 → 3개
    expect(places).toHaveLength(3)

    const first = places[0]
    expect(first.name).toBe('서울숲')
    expect(first.category).toBe('park')
    expect(first.district).toBe('성동구')
    expect(first.isFree).toBe(true)
    expect(first.latitude).toBeCloseTo(37.5441, 3)
    expect(first.longitude).toBeCloseTo(127.0370, 3)
    expect(first.description).toBe('도심 속 자연공원으로 다양한 생태 체험이 가능합니다.')
  })

  it('공원은 openTimeText/closeTimeText 없음 (undefined)', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => PARK_API_RESPONSE,
    })

    const places = await fetchSeoulParks()
    for (const p of places) {
      expect(p.openTimeText).toBeUndefined()
      expect(p.closeTimeText).toBeUndefined()
    }
  })

  it('빈 좌표 문자열 → latitude/longitude undefined', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => PARK_API_RESPONSE,
    })

    const places = await fetchSeoulParks()
    const noCoord = places.find((p) => p.name === '좌표없는공원')

    expect(noCoord).toBeDefined()
    expect(noCoord!.latitude).toBeUndefined()
    expect(noCoord!.longitude).toBeUndefined()
  })

  it('P_ZONE 없는 행은 필터링', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => PARK_API_RESPONSE,
    })

    const places = await fetchSeoulParks()
    const noZone = places.find((p) => p.name === '구없는공원')
    expect(noZone).toBeUndefined()
  })

  it('sourceType이 PARK로 설정됨', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => PARK_API_RESPONSE,
    })

    const places = await fetchSeoulParks()
    for (const p of places) {
      expect(p.sourceType).toBe('PARK')
    }
  })

  it('HTTP 오류 → 빈 배열 반환', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 500 })

    const result = await fetchSeoulParks()
    expect(result).toEqual([])
  })

  it('네트워크 예외 → 빈 배열 반환', async () => {
    mockFetch.mockRejectedValueOnce(new Error('timeout'))

    const result = await fetchSeoulParks()
    expect(result).toEqual([])
  })

  it('빈 row 배열 → 빈 배열 반환', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ListParkService: { row: [] } }),
    })

    const result = await fetchSeoulParks()
    expect(result).toEqual([])
  })
})
