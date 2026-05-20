export interface ApiResponse<T> {
  data: T
  isMock: boolean
  isStale?: boolean
  error?: string
}
