/**
 * seoulSports adapter 단위 테스트
 *
 * Seoul Open API (ListPublicReservationSport) 실 응답 형식 fixture로
 * 파싱·정규화 동작을 검증한다.
 *
 * 주의: 체육시설 API는 X = 경도(longitude), Y = 위도(latitude) 반환.
 *       adapter에서 toSeoulLatLng(Y, X) 순서로 호출한다.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SPORTS_API_RESPONSE } from '@tests/fixtures/seoul-api.fixture'

vi.mock('@/lib/config/env', () => ({
  env: { SEOUL_OPEN_API_KEY: 'TEST_KEY' },
}))

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

const { fetchSeoulSports } = await import('@/lib/data/seoulSports')

beforeEach(() => {
  mockFetch.mockReset()
})

describe('fetchSeoulSports', () => {
  it('정상 응답 파싱 — 유효 데이터 반환', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => SPORTS_API_RESPONSE,
    })

    const places = await fetchSeoulSports()

    // AREANM 없는 항목(index 3) 제거 → 3개
    expect(places).toHaveLength(3)

    const first = places[0]
    expect(first.name).toBe('한강공원 테니스장')
    expect(first.category).toBe('sports')
    expect(first.district).toBe('영등포구')
    expect(first.isFree).toBe(false)
    expect(first.feeText).toBe('유료')
    // Y=위도, X=경도 순서로 toSeoulLatLng(Y,X) 호출 → 좌표 정상 매핑
    expect(first.latitude).toBeCloseTo(37.5280, 3)
    expect(first.longitude).toBeCloseTo(126.9341, 3)
  })

  it('PAYFREE=무료 → isFree=true, feeText=undefined', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => SPORTS_API_RESPONSE,
    })

    const places = await fetchSeoulSports()
    const free = places.find((p) => p.name === '송파구민체육센터 수영장')

    expect(free).toBeDefined()
    expect(free!.isFree).toBe(true)
    expect(free!.feeText).toBeUndefined()
  })

  it('PAYFREE=유료 → isFree=false, feeText=유료', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => SPORTS_API_RESPONSE,
    })

    const places = await fetchSeoulSports()
    const paid = places.find((p) => p.name === '한강공원 테니스장')

    expect(paid!.isFree).toBe(false)
    expect(paid!.feeText).toBe('유료')
  })

  it('X/Y 좌표 0 → latitude/longitude undefined', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => SPORTS_API_RESPONSE,
    })

    const places = await fetchSeoulSports()
    const noCoord = places.find((p) => p.name === '좌표없는체육관')

    expect(noCoord).toBeDefined()
    expect(noCoord!.latitude).toBeUndefined()
    expect(noCoord!.longitude).toBeUndefined()
  })

  it('AREANM 없는 행은 필터링 제외', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => SPORTS_API_RESPONSE,
    })

    const places = await fetchSeoulSports()
    const noArea = places.find((p) => p.name === '지역없는스포츠')
    expect(noArea).toBeUndefined()
  })

  it('sourceType이 SPORTS로 설정됨', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => SPORTS_API_RESPONSE,
    })

    const places = await fetchSeoulSports()
    for (const p of places) {
      expect(p.sourceType).toBe('SPORTS')
    }
  })

  it('HTTP 오류 → 빈 배열 반환', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 429 })

    const result = await fetchSeoulSports()
    expect(result).toEqual([])
  })

  it('네트워크 예외 → 빈 배열 반환', async () => {
    mockFetch.mockRejectedValueOnce(new Error('AbortError'))

    const result = await fetchSeoulSports()
    expect(result).toEqual([])
  })
})
