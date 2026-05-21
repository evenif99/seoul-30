import type { NormalizedPlace } from '@/lib/types/place'
import { haversineKm } from '@/lib/utils/transit-time'

export interface NearbyPlace {
  place: NormalizedPlace
  distanceKm: number
}

export function hasUsableCoordinates(
  place: NormalizedPlace,
): place is NormalizedPlace & { latitude: number; longitude: number } {
  return place.latitude != null && place.longitude != null
}

export function nearbyPlacesFor(
  target: NormalizedPlace,
  places: NormalizedPlace[],
  limit = 3,
  maxDistanceKm = 3,
): NearbyPlace[] {
  if (!hasUsableCoordinates(target)) return []

  return places
    .filter((place) => place.id !== target.id && hasUsableCoordinates(place))
    .map((place) => ({
      place,
      distanceKm: haversineKm(target.latitude, target.longitude, place.latitude!, place.longitude!),
    }))
    .filter((item) => item.distanceKm <= maxDistanceKm)
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, limit)
}
