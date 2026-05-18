import { NextResponse } from 'next/server'
import { featureFlags } from '@/lib/config/feature-flags'
import { MOCK_PLACES } from '@/lib/mock/places'
import { getMockRealtime } from '@/lib/mock/realtime'
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

  // TODO(P5): featureFlags.cultureEventsApi === true 시 서울 문화행사 API 호출로 교체
  const places = MOCK_PLACES

  const filtered = places.filter((p) => {
    if (input.isFreeOnly && !p.isFree) return false
    return true
  })

  const realtime = input.district ? getMockRealtime(input.district) : null

  const results = filtered
    .map((place) => ({
      place,
      score: scorePlace(place, input, realtime),
      isMock: featureFlags.useMockData,
    }))
    .sort((a, b) => b.score.total - a.score.total)
    .slice(0, 10)

  const body: ApiResponse<typeof results> = {
    data: results,
    isMock: featureFlags.useMockData,
  }

  return NextResponse.json(body)
}
