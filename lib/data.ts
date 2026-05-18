export type CrowdLevel = '여유로움' | '보통' | '혼잡'
export type TrafficStatus = '원활' | '서행' | '정체'
export type AirQuality = '좋음' | '보통' | '나쁨'
export type TransportMode = 'subway' | 'bus' | 'walk'

export interface Place {
  id: string
  name: string
  category: string
  subcategory: string
  imageUrl: string
  crowd: CrowdLevel
  isFree: boolean
  transitMinutes: number
  transitBreakdown: string
  transitMode: TransportMode
  tempCelsius: number
  weatherIcon: 'sun' | 'cloud-sun' | 'cloud' | 'rain'
  traffic: TrafficStatus
  airQuality: AirQuality
  airQualityColor: 'green' | 'yellow' | 'red'
  isBookmarked: boolean
}

export interface FilterOption {
  id: string
  label: string
}

export const CATEGORY_FILTERS: FilterOption[] = [
  { id: 'all', label: '전체' },
  { id: 'culture', label: '문화/전시' },
  { id: 'library', label: '도서관' },
  { id: 'park', label: '공원' },
  { id: 'sports', label: '스포츠' },
  { id: 'welfare', label: '복지시설' },
]

export const CROWD_FILTERS: FilterOption[] = [
  { id: 'all', label: '전체' },
  { id: '여유로움', label: '여유로움' },
  { id: '보통', label: '보통' },
  { id: '혼잡', label: '혼잡 제외' },
]

export const TIME_FILTERS: FilterOption[] = [
  { id: '30', label: '30분 이내' },
  { id: '20', label: '20분 이내' },
  { id: '15', label: '15분 이내' },
]

export const PLACES: Place[] = [
  {
    id: '1',
    name: '성수문화예술마당',
    category: '공공문화',
    subcategory: '전시/공연',
    imageUrl: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/generated-image-mYG9nMrkfNofjcdvk164x9ipejXfoT.png',
    crowd: '여유로움',
    isFree: true,
    transitMinutes: 18,
    transitBreakdown: '도보 6분 + 지하철 12분',
    transitMode: 'subway',
    tempCelsius: 23,
    weatherIcon: 'cloud-sun',
    traffic: '원활',
    airQuality: '보통',
    airQualityColor: 'yellow',
    isBookmarked: false,
  },
  {
    id: '2',
    name: '서울숲 도서관',
    category: '도서관',
    subcategory: '공부/열람',
    imageUrl: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=400&h=280&fit=crop&auto=format',
    crowd: '보통',
    isFree: true,
    transitMinutes: 24,
    transitBreakdown: '도보 8분 + 지하철 16분',
    transitMode: 'subway',
    tempCelsius: 24,
    weatherIcon: 'sun',
    traffic: '서행',
    airQuality: '보통',
    airQualityColor: 'yellow',
    isBookmarked: true,
  },
  {
    id: '3',
    name: '응봉산 근린공원',
    category: '공원',
    subcategory: '산책/자연',
    imageUrl: 'https://images.unsplash.com/photo-1519331379826-f10be5486c6f?w=400&h=280&fit=crop&auto=format',
    crowd: '여유로움',
    isFree: true,
    transitMinutes: 29,
    transitBreakdown: '도보 10분 + 버스 19분',
    transitMode: 'bus',
    tempCelsius: 25,
    weatherIcon: 'cloud-sun',
    traffic: '원활',
    airQuality: '좋음',
    airQualityColor: 'green',
    isBookmarked: false,
  },
  {
    id: '4',
    name: '뚝섬 한강공원',
    category: '공원',
    subcategory: '한강/레저',
    imageUrl: 'https://images.unsplash.com/photo-1601628828688-632f38a5a7d0?w=400&h=280&fit=crop&auto=format',
    crowd: '보통',
    isFree: true,
    transitMinutes: 22,
    transitBreakdown: '도보 5분 + 지하철 17분',
    transitMode: 'subway',
    tempCelsius: 25,
    weatherIcon: 'sun',
    traffic: '원활',
    airQuality: '좋음',
    airQualityColor: 'green',
    isBookmarked: false,
  },
  {
    id: '5',
    name: '성동구 문화복지센터',
    category: '복지시설',
    subcategory: '강좌/프로그램',
    imageUrl: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?w=400&h=280&fit=crop&auto=format',
    crowd: '여유로움',
    isFree: false,
    transitMinutes: 14,
    transitBreakdown: '도보 14분',
    transitMode: 'walk',
    tempCelsius: 23,
    weatherIcon: 'cloud',
    traffic: '원활',
    airQuality: '보통',
    airQualityColor: 'yellow',
    isBookmarked: false,
  },
]

export const TODAY_CONDITIONS = [
  { label: '야외 적합', icon: 'sun' as const },
  { label: '무료 행사 3개', icon: 'ticket' as const },
  { label: '혼잡 낮음', icon: 'users' as const },
]
