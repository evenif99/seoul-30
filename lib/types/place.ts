export type PlaceSourceType = 'CULTURE_EVENT' | 'CULTURE_SPACE' | 'LIBRARY' | 'PARK' | 'SPORTS' | 'MOCK'
export type PlaceTag = 'indoor' | 'outdoor' | 'wheelchair' | 'family' | 'pet' | 'parking' | 'wifi'

export interface NormalizedPlace {
  id: string
  slug: string
  sourceType: PlaceSourceType
  name: string
  category: string       // culture | library | park | sports | welfare
  district: string       // 서울 자치구
  address?: string
  latitude?: number
  longitude?: number
  isFree: boolean
  feeText?: string
  openTimeText?: string  // "09:00"
  closeTimeText?: string // "18:00"
  homepageUrl?: string
  phone?: string
  description?: string
  imageUrl?: string
  tags?: PlaceTag[]
  nearestStation?: string
  eventStartDate?: string  // "YYYY-MM-DD" — freshness scoring용 (CULTURE_EVENT 전용)
}
