import { NextResponse } from 'next/server'
import { featureFlags } from '@/lib/config/feature-flags'
import { MOCK_PLACES } from '@/lib/mock/places'
import { getMockRealtime } from '@/lib/mock/realtime'
import { fetchSeoulCultureEvents } from '@/lib/adapters/seoul-culture.adapter'
import { fetchSeoulCongestion } from '@/lib/adapters/seoul-citydata.adapter'
import { getSnapshot, getStaleSnapshot, setSnapshot } from '@/lib/cache/recommendation.cache'
import { getDdareungiStations } from '@/lib/data/ddareungi'
import { scorePlace } from '@/lib/scoring'
import { nearestDdareungiStation } from '@/lib/utils/transit-time'
import type { RecommendationInput } from '@/lib/types/recommendation'
import type { ApiResponse } from '@/lib/types/api'

export async function GET(request: Request) {
  const t0 = Date.now()
  const { searchParams } = new URL(request.url)
  const latParam = searchParams.get('lat')
  const lngParam = searchParams.get('lng')
  const parsedUserLat = latParam ? Number(latParam) : undefined
  const parsedUserLng = lngParam ? Number(lngParam) : undefined
  const userLat = Number.isFinite(parsedUserLat) ? parsedUserLat : undefined
  const userLng = Number.isFinite(parsedUserLng) ? parsedUserLng : undefined
  const hasUserCoords = userLat != null && userLng != null

  const input: RecommendationInput = {
    district: searchParams.get('district') ?? undefined,
    category: searchParams.get('category') ?? undefined,
    isFreeOnly: searchParams.get('freeOnly') === 'true',
    maxTravelMinutes: Number(searchParams.get('maxMinutes') ?? 30),
    userLat,
    userLng,
  }

  // 실 API 모드일 때만 DB 캐시 조회 (mock 결과는 캐시하지 않음)
  if (featureFlags.cultureEventsApi && !hasUserCoords) {
    const cached = await getSnapshot(input.district, input.category, input.isFreeOnly)
    if (cached) {
      logPlacesRequest({ source: 'cache', durationMs: Date.now() - t0, resultCount: cached.results.length, input })
      const body: ApiResponse<typeof cached.results> = {
        data: cached.results,
        isMock: false,
        snapshotAt: cached.snapshotAt.toISOString(),
      }
      return NextResponse.json(body)
    }
  }

  // Places 소스 결정
  let places = MOCK_PLACES
  let isMock = true
  let isStale = false

  if (featureFlags.cultureEventsApi) {
    const apiPlaces = await fetchSeoulCultureEvents()
    if (apiPlaces.length > 0) {
      places = apiPlaces
      isMock = false
    } else {
      // Seoul API 장애 또는 빈 응답 → 만료된 스냅샷이라도 반환
      const stale = await getStaleSnapshot(input.district, input.category, input.isFreeOnly)
      if (stale) {
        logPlacesRequest({ source: 'stale', durationMs: Date.now() - t0, resultCount: stale.results.length, input })
        const body: ApiResponse<typeof stale.results> = {
          data: stale.results,
          isMock: false,
          isStale: true,
          snapshotAt: stale.snapshotAt.toISOString(),
        }
        return NextResponse.json(body)
      }
      // 스냅샷도 없으면 mock으로 폴백
      console.error(JSON.stringify({ event: 'places_api_empty_no_snapshot', district: input.district ?? null }))
    }
  }

  // Realtime 소스 결정
  let realtime = input.district ? getMockRealtime(input.district) : null

  if (featureFlags.realtimeCityData && input.district) {
    const liveSignal = await fetchSeoulCongestion(input.district)
    if (liveSignal) realtime = liveSignal
  }

  const stations =
    featureFlags.realtimeCityData && userLat != null && userLng != null
      ? await getDdareungiStations()
      : []

  const ddareungiNearUser =
    stations.length === 0 || userLat == null || userLng == null
      ? true
      : nearestDdareungiStation(userLat, userLng, stations) !== null

  const filtered = places.filter((p) => {
    if (input.isFreeOnly && !p.isFree) return false
    return true
  })

  const results = filtered
    .map((place) => {
      const ddareungiNearDest =
        stations.length === 0 || place.latitude == null || place.longitude == null
          ? true
          : nearestDdareungiStation(place.latitude, place.longitude, stations) !== null

      return {
        place,
        score: scorePlace(place, input, realtime, ddareungiNearUser, ddareungiNearDest),
        isMock,
      }
    })
    .sort((a, b) => b.score.total - a.score.total)
    .slice(0, 10)

  // 실 API 결과만 DB에 캐시
  if (!isMock && !hasUserCoords) {
    await setSnapshot(results, input.district, input.category, input.isFreeOnly)
  }

  logPlacesRequest({ source: isMock ? 'mock' : 'api', durationMs: Date.now() - t0, resultCount: results.length, input })
  const body: ApiResponse<typeof results> = { data: results, isMock, isStale }
  return NextResponse.json(body)
}

function logPlacesRequest({
  source,
  durationMs,
  resultCount,
  input,
}: {
  source: 'api' | 'cache' | 'stale' | 'mock'
  durationMs: number
  resultCount: number
  input: RecommendationInput
}) {
  console.info(
    JSON.stringify({
      event: 'places_request',
      source,
      durationMs,
      resultCount,
      district: input.district ?? null,
      category: input.category ?? null,
      isFreeOnly: input.isFreeOnly,
    }),
  )
}
