/**
 * seoulLibrary adapter 단위 테스트
 *
 * Seoul Open API (SeoulPublicLibraryInfo) 실 응답 형식 fixture로
 * 파싱·정규화 동작을 검증한다.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  LIBRARY_API_RESPONSE,
  LIBRARY_FIXTURE_ROWS,
} from '@tests/fixtures/seoul-api.fixture'

// env 모킹 — API 키 존재 시뮬레이션
vi.mock('@/lib/config/env', () => ({
  env: { SEOUL_OPEN_API_KEY: 'TEST_KEY' },
}))

// global fetch 모킹
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

// fetchSeoulLibraries 동적 import (모킹 설정 후 로드)
const { fetchSeoulLibraries } = await import('@/lib/data/seoulLibrary')

beforeEach(() => {
  mockFetch.mockReset()
})

describe('fetchSeoulLibraries', () => {
  it('정상 응답 파싱 — 유효 좌표 도서관 반환', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => LIBRARY_API_RESPONSE,
    })

    const places = await fetchSeoulLibraries()

    // GUNAME 없는 항목(index 3) 제거 → 3개
    expect(places).toHaveLength(3)

    const first = places[0]
    expect(first.name).toBe('강남구립 도곡정보문화도서관')
    expect(first.category).toBe('library')
    expect(first.district).toBe('강남구')
    expect(first.isFree).toBe(true)
    expect(first.latitude).toBeCloseTo(37.4931, 3)
    expect(first.longitude).toBeCloseTo(127.0433, 3)
    expect(first.openTimeText).toBe('09:00')
    expect(first.closeTimeText).toBe('22:00')
    expect(first.homepageUrl).toBe('https://library.gangnam.go.kr')
    expect(first.phone).toBe('02-1234-5678')
  })

  it('좌표 0 → latitude/longitude undefined', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => LIBRARY_API_RESPONSE,
    })

    const places = await fetchSeoulLibraries()
    const noCoord = places.find((p) => p.name === '좌표없는도서관')

    expect(noCoord).toBeDefined()
    expect(noCoord!.latitude).toBeUndefined()
    expect(noCoord!.longitude).toBeUndefined()
  })

  it('서울 경계 밖 좌표 → latitude/longitude undefined', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => LIBRARY_API_RESPONSE,
    })

    const places = await fetchSeoulLibraries()
    const outOfBounds = places.find((p) => p.name === '경계밖도서관')

    expect(outOfBounds).toBeDefined()
    expect(outOfBounds!.latitude).toBeUndefined()
    expect(outOfBounds!.longitude).toBeUndefined()
  })

  it('GUNAME 없는 행은 필터링하여 제외', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => LIBRARY_API_RESPONSE,
    })

    const places = await fetchSeoulLibraries()
    const noDistrict = places.find((p) => p.name === '구이름없는도서관')
    expect(noDistrict).toBeUndefined()
  })

  it('빈 운영시간 → openTimeText/closeTimeText undefined', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => LIBRARY_API_RESPONSE,
    })

    const places = await fetchSeoulLibraries()
    const noTime = places.find((p) => p.name === '좌표없는도서관')

    expect(noTime!.openTimeText).toBeUndefined()
    expect(noTime!.closeTimeText).toBeUndefined()
  })

  it('API 키 없으면 빈 배열 반환', async () => {
    vi.resetModules()
    vi.doMock('@/lib/config/env', () => ({ env: { SEOUL_OPEN_API_KEY: '' } }))
    const { fetchSeoulLibraries: fn } = await import('@/lib/data/seoulLibrary')

    const result = await fn()
    expect(result).toEqual([])
  })

  it('HTTP 오류 응답 → 빈 배열 반환', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 503 })

    const places = await fetchSeoulLibraries()
    expect(places).toEqual([])
  })

  it('네트워크 예외 → 빈 배열 반환 (graceful fallback)', async () => {
    mockFetch.mockRejectedValueOnce(new Error('network error'))

    const places = await fetchSeoulLibraries()
    expect(places).toEqual([])
  })

  it('sourceType이 LIBRARY로 설정됨', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => LIBRARY_API_RESPONSE,
    })

    const places = await fetchSeoulLibraries()
    for (const p of places) {
      expect(p.sourceType).toBe('LIBRARY')
    }
  })

  it('id가 lib- 접두사를 가진 안정적 해시 형식', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => LIBRARY_API_RESPONSE,
    })

    const places = await fetchSeoulLibraries()
    // BUG-03 수정: index 기반 ID → 콘텐츠 해시 기반 ID
    // 접두사 lib- 확인, 숫자 인덱스(lib-0-, lib-1-)가 아닌 해시 형식
    expect(places[0].id).toMatch(/^lib-[a-z0-9]+$/)
    expect(places[1].id).toMatch(/^lib-[a-z0-9]+$/)
    // 서로 다른 도서관은 서로 다른 ID
    expect(places[0].id).not.toBe(places[1].id)
    // 동일 입력은 항상 동일 ID (결정론적)
    expect(places[0].id).toBe(places[0].id)
  })
})
