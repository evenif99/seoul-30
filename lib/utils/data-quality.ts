import type { NormalizedPlace } from '@/lib/types/place'
import { isSuspiciousCoord } from '@/lib/utils/coords'

export interface FieldCoverage {
  count: number
  total: number
  pct: number   // 0–100, 소수점 1자리
}

export interface SourceSummary {
  total: number
  withCoords: number
  withImage: number
}

export interface PlaceDataQuality {
  total: number
  withCoords: FieldCoverage
  withImage: FieldCoverage
  withAddress: FieldCoverage
  withPhone: FieldCoverage
  withHomepage: FieldCoverage
  withOpenHours: FieldCoverage
  withTags: FieldCoverage
  /** 좌표는 있지만 정밀도가 3자리 미만인 의심 좌표 보유 장소 수 */
  suspiciousCoords: number
  /** sourceType별 집계 */
  bySource: Record<string, SourceSummary>
}

function coverage(count: number, total: number): FieldCoverage {
  return {
    count,
    total,
    pct: total === 0 ? 0 : Math.round((count / total) * 1000) / 10,
  }
}

/**
 * NormalizedPlace 배열의 데이터 품질 지표를 계산한다.
 * /api/diagnostics, /admin 페이지에서 공용으로 사용.
 */
export function calcDataQuality(places: NormalizedPlace[]): PlaceDataQuality {
  const total = places.length

  let coordCount = 0
  let imageCount = 0
  let addressCount = 0
  let phoneCount = 0
  let homepageCount = 0
  let openHoursCount = 0
  let tagsCount = 0
  let suspiciousCount = 0

  const bySource: Record<string, SourceSummary> = {}

  for (const p of places) {
    const hasCoords = p.latitude != null && p.longitude != null

    if (hasCoords) {
      coordCount++
      if (isSuspiciousCoord(p.latitude!, p.longitude!)) suspiciousCount++
    }
    if (p.imageUrl) imageCount++
    if (p.address) addressCount++
    if (p.phone) phoneCount++
    if (p.homepageUrl) homepageCount++
    if (p.openTimeText && p.closeTimeText) openHoursCount++
    if (p.tags && p.tags.length > 0) tagsCount++

    // sourceType별 집계
    const src = p.sourceType ?? 'UNKNOWN'
    if (!bySource[src]) bySource[src] = { total: 0, withCoords: 0, withImage: 0 }
    bySource[src].total++
    if (hasCoords) bySource[src].withCoords++
    if (p.imageUrl) bySource[src].withImage++
  }

  return {
    total,
    withCoords: coverage(coordCount, total),
    withImage: coverage(imageCount, total),
    withAddress: coverage(addressCount, total),
    withPhone: coverage(phoneCount, total),
    withHomepage: coverage(homepageCount, total),
    withOpenHours: coverage(openHoursCount, total),
    withTags: coverage(tagsCount, total),
    suspiciousCoords: suspiciousCount,
    bySource,
  }
}
