import { describe, expect, it } from 'vitest'
import { calcDataQuality } from '@/lib/utils/data-quality'
import { isSuspiciousCoord } from '@/lib/utils/coords'
import { MOCK_PLACES } from '@/lib/mock/places'
import type { NormalizedPlace } from '@/lib/types/place'

// ── 테스트용 최소 장소 팩토리 ────────────────────────────────────────────────
function makePlace(overrides: Partial<NormalizedPlace> = {}): NormalizedPlace {
  return {
    id: 'test-1',
    slug: 'test-place',
    sourceType: 'MOCK',
    name: '테스트 장소',
    category: 'culture',
    district: '종로구',
    isFree: true,
    ...overrides,
  }
}

// ── isSuspiciousCoord ────────────────────────────────────────────────────────
describe('isSuspiciousCoord', () => {
  it('소수점 3자리 이상은 정상 좌표로 판별', () => {
    expect(isSuspiciousCoord(37.566, 126.978)).toBe(false)
    expect(isSuspiciousCoord(37.5665, 126.9780)).toBe(false)
    expect(isSuspiciousCoord(37.413124, 126.734567)).toBe(false)
  })

  it('소수점 0자리(정수)는 의심 좌표', () => {
    expect(isSuspiciousCoord(37, 127)).toBe(true)
  })

  it('소수점 1자리는 의심 좌표', () => {
    expect(isSuspiciousCoord(37.5, 127.0)).toBe(true)
    expect(isSuspiciousCoord(37.6, 126.9)).toBe(true)
  })

  it('소수점 2자리는 의심 좌표', () => {
    expect(isSuspiciousCoord(37.56, 126.97)).toBe(true)
  })

  it('한 축만 정밀도가 낮아도 의심 좌표', () => {
    expect(isSuspiciousCoord(37.5, 126.9780)).toBe(true)   // lat만 1자리
    expect(isSuspiciousCoord(37.5665, 126.97)).toBe(true)  // lng만 2자리
  })

  it('정확히 소수점 3자리는 정상', () => {
    expect(isSuspiciousCoord(37.566, 126.978)).toBe(false)
  })
})

// ── calcDataQuality ──────────────────────────────────────────────────────────
describe('calcDataQuality', () => {
  it('빈 배열이면 모든 count가 0, pct가 0', () => {
    const q = calcDataQuality([])
    expect(q.total).toBe(0)
    expect(q.withCoords.count).toBe(0)
    expect(q.withCoords.pct).toBe(0)
  })

  it('좌표 없는 장소는 withCoords에 집계되지 않음', () => {
    const places = [
      makePlace({ id: '1', latitude: undefined, longitude: undefined }),
      makePlace({ id: '2', latitude: 37.566, longitude: 126.978 }),
    ]
    const q = calcDataQuality(places)
    expect(q.withCoords.count).toBe(1)
    expect(q.withCoords.total).toBe(2)
    expect(q.withCoords.pct).toBe(50)
  })

  it('이미지/주소/전화/홈페이지/운영시간/태그 보유율 정확히 계산', () => {
    const places = [
      makePlace({
        id: '1',
        imageUrl: 'https://example.com/img.jpg',
        address: '서울시 종로구',
        phone: '02-1234-5678',
        homepageUrl: 'https://example.com',
        openTimeText: '09:00',
        closeTimeText: '18:00',
        tags: ['indoor'],
      }),
      makePlace({ id: '2' }),  // 필드 없음
    ]
    const q = calcDataQuality(places)
    expect(q.withImage.count).toBe(1)
    expect(q.withAddress.count).toBe(1)
    expect(q.withPhone.count).toBe(1)
    expect(q.withHomepage.count).toBe(1)
    expect(q.withOpenHours.count).toBe(1)
    expect(q.withTags.count).toBe(1)
    // 각 pct는 50%
    expect(q.withImage.pct).toBe(50)
  })

  it('의심 좌표 장소를 suspiciousCoords에 집계', () => {
    const places = [
      makePlace({ id: '1', latitude: 37.5, longitude: 127.0 }),    // 의심 (1자리)
      makePlace({ id: '2', latitude: 37.566, longitude: 126.978 }), // 정상 (3자리)
    ]
    const q = calcDataQuality(places)
    expect(q.suspiciousCoords).toBe(1)
  })

  it('sourceType별 bySource 집계 정확', () => {
    const places = [
      makePlace({ id: '1', sourceType: 'LIBRARY', latitude: 37.566, longitude: 126.978, imageUrl: 'http://x.com' }),
      makePlace({ id: '2', sourceType: 'LIBRARY' }),
      makePlace({ id: '3', sourceType: 'PARK', latitude: 37.566, longitude: 126.978 }),
    ]
    const q = calcDataQuality(places)
    expect(q.bySource['LIBRARY'].total).toBe(2)
    expect(q.bySource['LIBRARY'].withCoords).toBe(1)
    expect(q.bySource['LIBRARY'].withImage).toBe(1)
    expect(q.bySource['PARK'].total).toBe(1)
    expect(q.bySource['PARK'].withCoords).toBe(1)
  })

  it('pct는 소수점 1자리로 반올림', () => {
    // 1/3 = 33.3...%
    const places = [
      makePlace({ id: '1', latitude: 37.566, longitude: 126.978 }),
      makePlace({ id: '2' }),
      makePlace({ id: '3' }),
    ]
    const q = calcDataQuality(places)
    expect(q.withCoords.pct).toBe(33.3)
  })
})

// ── MOCK_PLACES 품질 게이트 ───────────────────────────────────────────────────
describe('MOCK_PLACES 데이터 품질 게이트', () => {
  const q = calcDataQuality(MOCK_PLACES)

  it('Mock 장소 수는 30개 이상', () => {
    expect(q.total).toBeGreaterThanOrEqual(30)
  })

  it('좌표 보유율 80% 이상', () => {
    expect(q.withCoords.pct).toBeGreaterThanOrEqual(80)
  })

  it('주소 보유율 90% 이상', () => {
    expect(q.withAddress.pct).toBeGreaterThanOrEqual(90)
  })

  it('태그 보유율 70% 이상', () => {
    expect(q.withTags.pct).toBeGreaterThanOrEqual(70)
  })

  it('의심 좌표는 전체의 20% 미만', () => {
    const suspiciousPct = q.total === 0 ? 0 : (q.suspiciousCoords / q.total) * 100
    expect(suspiciousPct).toBeLessThan(20)
  })
})
