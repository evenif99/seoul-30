import { NextResponse } from 'next/server'
import { featureFlags } from '@/lib/config/feature-flags'
import { MOCK_PLACES } from '@/lib/mock/places'
import { getMockRealtime } from '@/lib/mock/realtime'
import { fetchSeoulCultureEvents } from '@/lib/adapters/seoul-culture.adapter'
import { fetchSeoulCongestion } from '@/lib/adapters/seoul-citydata.adapter'
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

  // Places: 실 API 우선, 실패 시 mock fallback
  let places = MOCK_PLACES
  let isMock = true

  if (featureFlags.cultureEventsApi) {
    const apiPlaces = await fetchSeoulCultureEvents()
    if (apiPlaces.length > 0) {
      places = apiPlaces
      isMock = false
    }
  }

  // Realtime: 실 API 우선, 실패 시 mock fallback
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

  const body: ApiResponse<typeof results> = {
    data: results,
    isMock,
  }

  return NextResponse.json(body)
}
