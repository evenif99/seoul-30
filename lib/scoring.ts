import type { NormalizedPlace } from './types/place'
import type { RealtimeSignal } from './types/realtime'
import type { RecommendationInput, ScoreBreakdown } from './types/recommendation'
import { estimateTransit, haversineKm, transitAccessScore } from './utils/transit-time'

export interface FeedbackStats {
  upCount: number
  totalCount: number
}

export function scorePlace(
  place: NormalizedPlace,
  input: RecommendationInput,
  realtime: RealtimeSignal | null,
  ddareungiNearUser = true,
  ddareungiNearDest = true,
  feedbackStats?: FeedbackStats,
): ScoreBreakdown {
  const access = calcAccess(place, input, ddareungiNearUser, ddareungiNearDest)
  const relevance = calcRelevance(place, input)
  const cost = calcCost(place, input)
  const congestion = calcCongestion(realtime)
  const timefit = calcTimefit(place)
  const freshness = calcFreshness(place)
  const feedbackBonus = calcFeedbackBonus(feedbackStats)

  return {
    access: access.score,
    relevance,
    cost,
    congestion,
    timefit,
    freshness,
    feedbackBonus,
    total: access.score + relevance + cost + congestion + timefit + freshness + feedbackBonus,
    transitMinutes: access.transitMinutes,
    transitMode: access.transitMode,
  }
}

// 지역 일치도 (0–30)
function calcAccess(
  place: NormalizedPlace,
  input: RecommendationInput,
  ddareungiNearUser: boolean,
  ddareungiNearDest: boolean,
): { score: number; transitMinutes?: number; transitMode?: ScoreBreakdown['transitMode'] } {
  if (
    input.userLat != null &&
    input.userLng != null &&
    place.latitude != null &&
    place.longitude != null
  ) {
    const distKm = haversineKm(input.userLat, input.userLng, place.latitude, place.longitude)
    const transit = estimateTransit(distKm, ddareungiNearUser, ddareungiNearDest)

    return {
      score: transitAccessScore(transit.minutes),
      transitMinutes: transit.minutes,
      transitMode: transit.mode,
    }
  }

  if (!input.district) return { score: 10 }
  if (place.district === input.district) return { score: 30 }
  return { score: 10 }
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

// 행사 시작 임박 여부 (0–5) — eventStartDate 없으면 0
function calcFreshness(place: NormalizedPlace): number {
  if (!place.eventStartDate) return 0
  const now = new Date()
  const start = new Date(place.eventStartDate)
  const daysUntil = Math.floor((start.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  if (daysUntil < 0) return 0    // 이미 시작됨
  if (daysUntil <= 7) return 5   // 7일 이내 개막
  if (daysUntil <= 30) return 3  // 30일 이내 개막
  return 0
}

// 사용자 평가 반영 (-3–+2) — 3표 미만이면 중립 0점
export function calcFeedbackBonus(stats?: FeedbackStats): number {
  if (!stats || stats.totalCount < 3) return 0
  const ratio = stats.upCount / stats.totalCount
  if (ratio >= 0.75) return 2
  if (ratio <= 0.25) return -3
  return 0
}

// 현재 운영 중 여부 (0–10) — 서울 서비스이므로 KST(UTC+9) 기준으로 계산
function calcTimefit(place: NormalizedPlace): number {
  if (!place.openTimeText || !place.closeTimeText) {
    // 서울 공원은 시간 정보 없음 — 대부분 24시간 개방이므로 최고점 10점
    if (place.sourceType === 'PARK') return 10
    return 5
  }

  const now = new Date()
  const kstMinutes = (now.getUTCHours() * 60 + now.getUTCMinutes() + 9 * 60) % (24 * 60)

  const [oh, om] = place.openTimeText.split(':').map(Number)
  const [ch, cm] = place.closeTimeText.split(':').map(Number)

  // 자정 운영(00:00–23:59)은 항상 운영 중
  if (oh === 0 && om === 0 && ch === 23 && cm === 59) return 10

  return kstMinutes >= oh * 60 + om && kstMinutes < ch * 60 + cm ? 10 : 0
}
