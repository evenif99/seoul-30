const SEOUL = { latMin: 37.413, latMax: 37.715, lngMin: 126.734, lngMax: 127.270 }

export function toSeoulLatLng(
  rawLat: string | number | undefined | null,
  rawLng: string | number | undefined | null,
): { latitude?: number; longitude?: number } {
  const lat = typeof rawLat === 'string' ? parseFloat(rawLat) : (rawLat ?? NaN)
  const lng = typeof rawLng === 'string' ? parseFloat(rawLng) : (rawLng ?? NaN)

  if (
    isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0 ||
    lat < SEOUL.latMin || lat > SEOUL.latMax ||
    lng < SEOUL.lngMin || lng > SEOUL.lngMax
  ) {
    return {}
  }
  return { latitude: lat, longitude: lng }
}

/**
 * 좌표 정밀도가 낮아 정확도를 신뢰하기 어려운 의심 좌표인지 판별한다.
 * 소수점 3자리 미만 = 약 100m 이상 오차 가능 → 의심 좌표.
 *
 * 예) 37.5, 127.0 → true (1자리)
 *     37.56, 126.97 → true (2자리)
 *     37.566, 126.978 → false (3자리, 정상)
 */
export function isSuspiciousCoord(lat: number, lng: number): boolean {
  const decimalPlaces = (n: number): number => {
    const str = n.toString()
    const dot = str.indexOf('.')
    return dot === -1 ? 0 : str.length - dot - 1
  }
  return decimalPlaces(lat) < 3 || decimalPlaces(lng) < 3
}
