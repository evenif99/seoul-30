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
