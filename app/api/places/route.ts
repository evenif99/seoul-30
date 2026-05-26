import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { featureFlags } from '@/lib/config/feature-flags'
import { MOCK_PLACES } from '@/lib/mock/places'
import { getMockRealtime } from '@/lib/mock/realtime'
import { fetchSeoulPlaces } from '@/lib/adapters/seoul-culture.adapter'
import { fetchSeoulCongestion } from '@/lib/adapters/seoul-citydata.adapter'
import { getSnapshot, getStaleSnapshot, setSnapshot } from '@/lib/cache/recommendation.cache'
import { getDdareungiStations } from '@/lib/data/ddareungi'
import { mergeTourImages } from '@/lib/data/tourImages'
import { scorePlace, type FeedbackStats } from '@/lib/scoring'
import { nearestDdareungiStation } from '@/lib/utils/transit-time'
import type { RecommendationInput } from '@/lib/types/recommendation'
import type { ApiResponse } from '@/lib/types/api'
import { logger } from '@/lib/logger'

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
    const raw = await fetchSeoulPlaces()
    // 이름 없는 항목 제거 (실 API 응답 방어)
    const apiPlaces = raw.filter((p) => p.name && p.name.trim().length > 0)
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
      logger.error({ event: 'places_api_empty_no_snapshot', district: input.district ?? null })
    }
  }

  // Realtime 소스 결정
  let realtime = input.district ? getMockRealtime(input.district) : null

  if (featureFlags.realtimeCityData && input.district) {
    const liveSignal = await fetchSeoulCongestion(input.district)
    if (liveSignal) realtime = liveSignal
  }

  // 피드백 집계 — UP/DOWN 투표 수를 place 단위로 집계 (실패 시 빈 맵으로 폴백)
  const feedbackMap: Record<string, FeedbackStats> = {}
  try {
    const feedbacks = await prisma.placeFeedback.findMany({
      select: { placeId: true, vote: true },
    })
    for (const fb of feedbacks) {
      if (!feedbackMap[fb.placeId]) feedbackMap[fb.placeId] = { upCount: 0, totalCount: 0 }
      feedbackMap[fb.placeId].totalCount++
      if (fb.vote === 'UP') feedbackMap[fb.placeId].upCount++
    }
  } catch {
    // DB 장애 시 피드백 없이 진행
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

  let results = filtered
    .map((place) => {
      const ddareungiNearDest =
        stations.length === 0 || place.latitude == null || place.longitude == null
          ? true
          : nearestDdareungiStation(place.latitude, place.longitude, stations) !== null

      return {
        place,
        score: scorePlace(place, input, realtime, ddareungiNearUser, ddareungiNearDest, feedbackMap[place.id]),
        isMock,
      }
    })
    .sort((a, b) => b.score.total - a.score.total)
    .slice(0, 30)

  if (!isMock) {
    results = await mergeTourImages(results)
  }

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
  logger.info({
    event: 'places_request',
    source,
    durationMs,
    resultCount,
    district: input.district ?? null,
    category: input.category ?? null,
    isFreeOnly: input.isFreeOnly,
  })
}
