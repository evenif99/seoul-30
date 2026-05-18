import { NextResponse } from 'next/server'
import { featureFlags } from '@/lib/config/feature-flags'
import { MOCK_PLACES } from '@/lib/mock/places'
import { getMockRealtime } from '@/lib/mock/realtime'
import { fetchSeoulCultureEvents } from '@/lib/adapters/seoul-culture.adapter'
import { fetchSeoulCongestion } from '@/lib/adapters/seoul-citydata.adapter'
import { getSnapshot, setSnapshot } from '@/lib/cache/recommendation.cache'
import { scorePlace } from '@/lib/scoring'
import type { RecommendationInput } from '@/lib/types/recommendation'
import type { ApiResponse } from '@/lib/types/api'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)

  const input: RecommendationInput = {
    district: searchParams.get('district') ?? undefined,
    category: searchParams.get('category') ?? undefined,
    isFreeOnly: searchParams.get('freeOnly') === 'true',
    maxTravelMinutes: Number(searchParams.get('maxMinutes') ?? 30),
  }

  // 실 API 모드일 때만 DB 캐시 조회 (mock 결과는 캐시하지 않음)
  if (featureFlags.cultureEventsApi) {
    const cached = await getSnapshot(input.district, input.category, input.isFreeOnly)
    if (cached) {
      const body: ApiResponse<typeof cached> = { data: cached, isMock: false }
      return NextResponse.json(body)
    }
  }

  // Places 소스 결정
  let places = MOCK_PLACES
  let isMock = true

  if (featureFlags.cultureEventsApi) {
    const apiPlaces = await fetchSeoulCultureEvents()
    if (apiPlaces.length > 0) {
      places = apiPlaces
      isMock = false
    }
  }

  // Realtime 소스 결정
  let realtime = input.district ? getMockRealtime(input.district) : null

  if (featureFlags.realtimeCityData && input.district) {
    const liveSignal = await fetchSeoulCongestion(input.district)
    if (liveSignal) realtime = liveSignal
  }

  const filtered = places.filter((p) => {
    if (input.isFreeOnly && !p.isFree) return false
    return true
  })

  const results = filtered
    .map((place) => ({
      place,
      score: scorePlace(place, input, realtime),
      isMock,
    }))
    .sort((a, b) => b.score.total - a.score.total)
    .slice(0, 10)

  // 실 API 결과만 DB에 캐시
  if (!isMock) {
    await setSnapshot(results, input.district, input.category, input.isFreeOnly)
  }

  const body: ApiResponse<typeof results> = { data: results, isMock }
  return NextResponse.json(body)
}
