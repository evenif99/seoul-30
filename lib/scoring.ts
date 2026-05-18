import type { NormalizedPlace } from './types/place'
import type { RealtimeSignal } from './types/realtime'
import type { RecommendationInput, ScoreBreakdown } from './types/recommendation'

export function scorePlace(
  place: NormalizedPlace,
  input: RecommendationInput,
  realtime: RealtimeSignal | null,
): ScoreBreakdown {
  const access = calcAccess(place, input)
  const relevance = calcRelevance(place, input)
  const cost = calcCost(place, input)
  const congestion = calcCongestion(realtime)
  const timefit = calcTimefit(place)
  const freshness = 0 // TODO(P1): 문화행사 startDate 기반 freshness 계산 추가

  return {
    access,
    relevance,
    cost,
    congestion,
    timefit,
    freshness,
    total: access + relevance + cost + congestion + timefit + freshness,
  }
}

// 지역 일치도 (0–30)
function calcAccess(place: NormalizedPlace, input: RecommendationInput): number {
  if (!input.district) return 10
  if (place.district === input.district) return 30
  return 10
}

// 카테고리 일치도 (0–25)
function calcRelevance(place: NormalizedPlace, input: RecommendationInput): number {
  if (!input.category || input.category === 'all') return 12
  return place.category === input.category ? 25 : 0
}

// 무료 여부 (0–15)
function calcCost(place: NormalizedPlace, input: RecommendationInput): number {
  if (input.isFreeOnly && !place.isFree) return 0
  return place.isFree ? 15 : 5
}

// 혼잡도 (0–15) — realtime 없으면 중립 8점
function calcCongestion(realtime: RealtimeSignal | null): number {
  if (!realtime?.congestionLevel) return 8
  const map: Record<string, number> = {
    여유: 15,
    보통: 10,
    약간붐빔: 3,
    붐빔: 0,
  }
  return map[realtime.congestionLevel] ?? 8
}

// 현재 운영 중 여부 (0–10)
function calcTimefit(place: NormalizedPlace): number {
  if (!place.openTimeText || !place.closeTimeText) return 5

  const now = new Date()
  const cur = now.getHours() * 60 + now.getMinutes()

  const [oh, om] = place.openTimeText.split(':').map(Number)
  const [ch, cm] = place.closeTimeText.split(':').map(Number)

  // 자정 운영(00:00–23:59)은 항상 운영 중
  if (oh === 0 && om === 0 && ch === 23 && cm === 59) return 10

  return cur >= oh * 60 + om && cur < ch * 60 + cm ? 10 : 0
}
