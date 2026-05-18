export interface ApiResponse<T> {
  data: T
  isMock: boolean
  error?: string
}
