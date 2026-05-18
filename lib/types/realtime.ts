export type CongestionLevel = '여유' | '보통' | '약간붐빔' | '붐빔'

export interface RealtimeSignal {
  areaCode: string
  areaName: string
  congestionLevel: CongestionLevel | null
  congestionMessage?: string
  // TODO(P1): 실시간 도시데이터 실제 샘플 확보 후 transportSummary, weatherSummary 필드 경로 확정
  transportSummary?: string
  weatherSummary?: string
  updatedAt: string
  isMock: boolean
}
