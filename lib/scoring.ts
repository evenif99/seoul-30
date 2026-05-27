import type { NormalizedPlace } from './types/place'
import type { RealtimeSignal } from './types/realtime'
import type { RecommendationInput, RecommendReason, ScoreBreakdown } from './types/recommendation'
import { estimateTransit, haversineKm, transitAccessScore } from './utils/transit-time'
import { isCurrentlyOpen } from './utils/time'

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
// KST 기준 날짜 차이 계산: "YYYY-MM-DD"는 UTC 자정으로 파싱되므로
// KST 오프셋(+9h)을 더해 KST 날짜 기준 일수를 산출한다.
function calcFreshness(place: NormalizedPlace): number {
  if (!place.eventStartDate) return 0
  const KST = 9 * 60 * 60 * 1000
  const nowKstDay = Math.floor((Date.now() + KST) / 86400000)
  const startKstDay = Math.floor((new Date(place.eventStartDate).getTime() + KST) / 86400000)
  const daysUntil = startKstDay - nowKstDay
  if (daysUntil < 0) return 0    // 이미 시작됨
  if (daysUntil <= 7) return 5   // 7일 이내 개막
  if (daysUntil <= 30) return 3  // 30일 이내 개막
  return 0
}

/**
 * 스코어 결과에서 추천 이유 칩을 생성한다 (Phase 69).
 * scorePlace() 의 계산 로직은 변경하지 않고, 결과값을 읽어 reasons 배열만 반환.
 *
 * 우선순위: nearby > free > open_now > high_rated > low_crowd > new_event
 * 최대 3개 반환.
 */
export function buildReasons(place: NormalizedPlace, score: ScoreBreakdown): RecommendReason[] {
  const reasons: RecommendReason[] = []

  // GPS 활성 + 10분 이내 이동 가능
  if (score.transitMinutes != null && score.transitMinutes <= 10) {
    reasons.push('nearby')
  }
  // 무료 입장
  if (place.isFree) {
    reasons.push('free')
  }
  // 지금 운영 중 (timefit 8점 이상 = 운영 시간 내)
  if (score.timefit >= 8) {
    reasons.push('open_now')
  }
  // 이용자 호평 (feedbackBonus 2점 = 긍정 투표 75% 이상)
  if (score.feedbackBonus >= 2) {
    reasons.push('high_rated')
  }
  // 혼잡도 낮음 (congestion 12점 이상 = 여유 상태)
  if (score.congestion >= 12) {
    reasons.push('low_crowd')
  }
  // 최근 행사 (freshness 3점 이상 = 30일 이내 행사 시작)
  if (score.freshness >= 3) {
    reasons.push('new_event')
  }

  return reasons.slice(0, 3)
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
// isCurrentlyOpen()을 사용해 비표준 시간 형식·자정 넘김을 안전하게 처리한다.
function calcTimefit(place: NormalizedPlace): number {
  if (!place.openTimeText || !place.closeTimeText) {
    // 서울 공원은 시간 정보 없음 — 대부분 24시간 개방이므로 최고점 10점
    if (place.sourceType === 'PARK') return 10
    return 5
  }

  return isCurrentlyOpen(place.openTimeText, place.closeTimeText) ? 10 : 0
}
