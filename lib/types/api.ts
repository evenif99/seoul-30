export interface ApiResponse<T> {
  data: T
  isMock: boolean
  isStale?: boolean
  snapshotAt?: string | null  // ISO timestamp — 캐시/stale 응답 시 데이터 기준 시각
  error?: string
}
