import type { NormalizedPlace } from './place'

export interface RecommendationInput {
  district?: string
  category?: string
  isFreeOnly?: boolean
  maxTravelMinutes?: number
  userLat?: number
  userLng?: number
}

export interface ScoreBreakdown {
  access: number     // 0–30: 지역 일치도
  relevance: number  // 0–25: 카테고리 일치도
  cost: number       // 0–15: 무료 여부
  congestion: number // 0–15: 혼잡도
  timefit: number    // 0–10: 현재 운영 중 여부
  freshness: number  // 0–5:  행사 임박/오늘 진행 여부
  feedbackBonus: number // -3–+2: 사용자 평가 반영 (3표 이상 집계 시)
  total: number
  transitMinutes?: number
  transitMode?: import('@/lib/utils/transit-time').TransitMode
}

export interface RecommendationResult {
  place: NormalizedPlace
  score: ScoreBreakdown
  isMock: boolean
}
