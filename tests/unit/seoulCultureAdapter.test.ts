/**
 * Seoul Culture Adapter 단위 테스트
 *
 * fetchSeoulCultureEvents (culturalEventInfo API)와
 * fetchSeoulCultureSpaces (culturalSpaceInfo API)의 파싱·정규화를 검증한다.
 *
 * 좌표 매핑 주의:
 *   - CultureEvent:  LAT → 위도, LOT → 경도 (일반 관례)
 *   - CultureSpace:  X_COORD → 위도(lat), Y_COORD → 경도(lng)
 *                    (서울시 culturalSpaceInfo API 특이 사항 — 코드 주석 기록됨)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  CULTURE_EVENT_API_RESPONSE,
  CULTURE_SPACE_API_RESPONSE,
} from '@tests/fixtures/seoul-api.fixture'

vi.mock('@/lib/config/env', () => ({
  env: { SEOUL_OPEN_API_KEY: 'TEST_KEY' },
}))

// enrichPlace는 태그·crowdLevel 등을 부가하므로 pass-through로 모킹
vi.mock('@/lib/adapters/enrichment', () => ({
  enrichPlace: (p: unknown) => p,
}))

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

const { fetchSeoulCultureEvents, fetchSeoulCultureSpaces } =
  await import('@/lib/adapters/seoul-culture.adapter')

beforeEach(() => {
  mockFetch.mockReset()
})

// ─── fetchSeoulCultureEvents ──────────────────────────────────────────────────

describe('fetchSeoulCultureEvents', () => {
  it('정상 행사 파싱 — 유효 데이터 반환', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => CULTURE_EVENT_API_RESPONSE,
    })

    const places = await fetchSeoulCultureEvents()

    // GUNAME 없는 행 없음 → 3개 전체 반환
    expect(places).toHaveLength(3)

    const first = places[0]
    expect(first.name).toBe('서울 현대미술 특별전')
    expect(first.category).toBe('culture')
    expect(first.district).toBe('종로구')
    expect(first.isFree).toBe(true)
    expect(first.latitude).toBeCloseTo(37.5796, 3)
    expect(first.longitude).toBeCloseTo(126.9785, 3)
    expect(first.imageUrl).toBe('https://culture.seoul.go.kr/img/event1.jpg')
    expect(first.eventStartDate).toBe('2024-03-01')
  })

  it('IS_FREE=N, USE_FEE=50000원 → isFree=false, feeText 포함', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => CULTURE_EVENT_API_RESPONSE,
    })

    const places = await fetchSeoulCultureEvents()
    const paid = places.find((p) => p.name === '뮤지컬 레미제라블')

    expect(paid).toBeDefined()
    expect(paid!.isFree).toBe(false)
    expect(paid!.feeText).toBe('50000원')
  })

  it('IS_FREE=N, USE_FEE=0원 → isFree=true (무료 텍스트 감지)', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => CULTURE_EVENT_API_RESPONSE,
    })

    const places = await fetchSeoulCultureEvents()
    const zeroFee = places.find((p) => p.name === '북토크 이벤트')

    expect(zeroFee).toBeDefined()
    expect(zeroFee!.isFree).toBe(true)
  })

  it('빈 LAT/LOT → latitude/longitude undefined', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => CULTURE_EVENT_API_RESPONSE,
    })

    const places = await fetchSeoulCultureEvents()
    const noCoord = places.find((p) => p.name === '북토크 이벤트')

    expect(noCoord!.latitude).toBeUndefined()
    expect(noCoord!.longitude).toBeUndefined()
  })

  it('CODENAME → category 매핑 검증', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => CULTURE_EVENT_API_RESPONSE,
    })

    const places = await fetchSeoulCultureEvents()
    const exhibition = places.find((p) => p.name === '서울 현대미술 특별전')
    const musical    = places.find((p) => p.name === '뮤지컬 레미제라블')
    const talk       = places.find((p) => p.name === '북토크 이벤트')

    expect(exhibition!.category).toBe('culture')   // 전시/미술
    expect(musical!.category).toBe('culture')      // 뮤지컬·오페라
    expect(talk!.category).toBe('culture')         // 강연/토크
  })

  it('ORG_LINK가 fallback으로 사용됨 (HMPG_ADDR 없을 때)', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => CULTURE_EVENT_API_RESPONSE,
    })

    const places = await fetchSeoulCultureEvents()
    const talk = places.find((p) => p.name === '북토크 이벤트')

    expect(talk!.homepageUrl).toBe('https://example.com')
  })

  it('HTTP 오류 → 빈 배열 반환', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 429 })

    const result = await fetchSeoulCultureEvents()
    expect(result).toEqual([])
  })

  it('네트워크 예외 → 빈 배열 반환', async () => {
    mockFetch.mockRejectedValueOnce(new Error('timeout'))

    const result = await fetchSeoulCultureEvents()
    expect(result).toEqual([])
  })

  it('sourceType이 CULTURE_EVENT로 설정됨', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => CULTURE_EVENT_API_RESPONSE,
    })

    const places = await fetchSeoulCultureEvents()
    for (const p of places) {
      expect(p.sourceType).toBe('CULTURE_EVENT')
    }
  })
})

// ─── fetchSeoulCultureSpaces ──────────────────────────────────────────────────

describe('fetchSeoulCultureSpaces', () => {
  it('정상 공간 파싱 — 유효 데이터 반환', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => CULTURE_SPACE_API_RESPONSE,
    })

    const places = await fetchSeoulCultureSpaces()

    // GUNAME 없는 행 없음 → 3개 전체
    expect(places).toHaveLength(3)

    const first = places[0]
    expect(first.name).toBe('서울시립미술관')
    expect(first.category).toBe('culture')   // 미술관
    expect(first.district).toBe('종로구')
    expect(first.isFree).toBe(true)
    // X_COORD=37.5704(위도), Y_COORD=126.9705(경도) → fixture 기준
    expect(first.latitude).toBeCloseTo(37.5704, 3)
    expect(first.longitude).toBeCloseTo(126.9705, 3)
    expect(first.phone).toBe('02-2124-8800')
    expect(first.imageUrl).toBe('https://culture.seoul.go.kr/img/space1.jpg')
  })

  it('CODENAME 도서관 → category library', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => CULTURE_SPACE_API_RESPONSE,
    })

    const places = await fetchSeoulCultureSpaces()
    const lib = places.find((p) => p.name === '강남구립도서관')

    expect(lib).toBeDefined()
    expect(lib!.category).toBe('library')
  })

  it('X_COORD=0, Y_COORD=0 → latitude/longitude undefined', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => CULTURE_SPACE_API_RESPONSE,
    })

    const places = await fetchSeoulCultureSpaces()
    const noCoord = places.find((p) => p.name === '좌표이상공연장')

    expect(noCoord).toBeDefined()
    expect(noCoord!.latitude).toBeUndefined()
    expect(noCoord!.longitude).toBeUndefined()
  })

  it('IS_FREE=N, 유효 USE_FEE → isFree=false, feeText 포함', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => CULTURE_SPACE_API_RESPONSE,
    })

    const places = await fetchSeoulCultureSpaces()
    const paid = places.find((p) => p.name === '좌표이상공연장')

    expect(paid!.isFree).toBe(false)
    expect(paid!.feeText).toBe('10000원')
  })

  it('USAGE_DAY_WEEK_AND_TIME이 description으로 사용됨', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => CULTURE_SPACE_API_RESPONSE,
    })

    const places = await fetchSeoulCultureSpaces()
    const museum = places.find((p) => p.name === '서울시립미술관')

    expect(museum!.description).toBe('화~일 10:00~20:00')
  })

  it('USAGE_DAY_WEEK_AND_TIME 없으면 FAC_DESC fallback', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => CULTURE_SPACE_API_RESPONSE,
    })

    const places = await fetchSeoulCultureSpaces()
    // 강남구립도서관: USAGE_DAY_WEEK_AND_TIME='', FAC_DESC='강남구 구립도서관입니다.'
    const lib = places.find((p) => p.name === '강남구립도서관')

    expect(lib!.description).toBe('강남구 구립도서관입니다.')
  })

  it('sourceType이 CULTURE_SPACE로 설정됨', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => CULTURE_SPACE_API_RESPONSE,
    })

    const places = await fetchSeoulCultureSpaces()
    for (const p of places) {
      expect(p.sourceType).toBe('CULTURE_SPACE')
    }
  })

  it('HTTP 오류 → 빈 배열 반환', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 503 })

    const result = await fetchSeoulCultureSpaces()
    expect(result).toEqual([])
  })

  it('네트워크 예외 → 빈 배열 반환', async () => {
    mockFetch.mockRejectedValueOnce(new TypeError('fetch failed'))

    const result = await fetchSeoulCultureSpaces()
    expect(result).toEqual([])
  })
})
