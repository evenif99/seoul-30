import type { DdareungiStation } from '@/lib/data/ddareungi'

export type TransitMode = '도보' | '따릉이' | '버스' | '지하철'

export interface TransitEstimate {
  minutes: number
  mode: TransitMode
}

const EARTH_RADIUS_KM = 6371

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180
}

export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a))
}

export function nearestDdareungiStation(
  lat: number,
  lng: number,
  stations: DdareungiStation[],
  radiusKm = 0.5,
): DdareungiStation | null {
  let nearest: DdareungiStation | null = null
  let nearestDistance = Number.POSITIVE_INFINITY

  for (const station of stations) {
    const distance = haversineKm(lat, lng, station.lat, station.lng)
    if (distance <= radiusKm && distance < nearestDistance) {
      nearest = station
      nearestDistance = distance
    }
  }

  return nearest
}

function minutesFor(distKm: number, kmPerHour: number, overheadMinutes: number): number {
  return Math.round((distKm / kmPerHour) * 60 + overheadMinutes)
}

export function estimateTransit(
  distKm: number,
  ddareungiNearUser: boolean,
  ddareungiNearDest: boolean,
): TransitEstimate {
  const candidates: TransitEstimate[] = []
  const ddareungiOk = ddareungiNearUser && ddareungiNearDest

  if (distKm <= 1.5) {
    candidates.push({ mode: '도보', minutes: minutesFor(distKm, 4, 0) })
  }
  if (distKm >= 0.8 && distKm <= 6 && ddareungiOk) {
    candidates.push({ mode: '따릉이', minutes: minutesFor(distKm, 13, 3) })
  }
  if (distKm > 0.5) {
    candidates.push({ mode: '버스', minutes: minutesFor(distKm, 18, 5) })
  }
  if (distKm > 2) {
    candidates.push({ mode: '지하철', minutes: minutesFor(distKm, 35, 7) })
  }

  if (candidates.length === 0) {
    return { mode: '도보', minutes: minutesFor(distKm, 4, 0) }
  }

  return candidates.reduce((best, next) => (next.minutes < best.minutes ? next : best))
}

export function transitAccessScore(minutes: number): number {
  if (minutes <= 10) return 30
  if (minutes <= 20) return 25
  if (minutes <= 30) return 18
  if (minutes <= 40) return 10
  if (minutes <= 50) return 4
  return 0
}
