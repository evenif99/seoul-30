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

export const TODAY_CONDITIONS = [
  { label: '야외 적합', icon: 'sun' as const },
  { label: '무료 행사 3개', icon: 'ticket' as const },
  { label: '혼잡 낮음', icon: 'users' as const },
]
