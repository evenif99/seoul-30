import { env } from '@/lib/config/env'
import type { NormalizedPlace } from '@/lib/types/place'

const TOUR_API_BASE = 'https://apis.data.go.kr/B551011/KorService2'
const MOBILE_APP = 'Seoul30'

interface TourSearchItem {
  contentid?: string | number
  title?: string
  addr1?: string
  firstimage?: string
  firstimage2?: string
}

interface TourImageItem {
  originimgurl?: string
  smallimageurl?: string
  cpyrhtDivCd?: string
}

export async function fetchTourImageForPlace(place: NormalizedPlace): Promise<string | undefined> {
  const key = getTourApiKey()
  if (!key || place.imageUrl) return place.imageUrl

  const matched = await searchTourContent(place, key)
  if (!matched?.contentid) return matched?.firstimage || matched?.firstimage2

  const detailImage = await fetchDetailImage(String(matched.contentid), key)
  return detailImage ?? matched.firstimage ?? matched.firstimage2
}

export async function mergeTourImages<T extends { place: NormalizedPlace }>(results: T[]): Promise<T[]> {
  if (!getTourApiKey()) return results

  const imageCache = new Map<string, Promise<string | undefined>>()

  return Promise.all(
    results.map(async (result) => {
      if (result.place.imageUrl) return result

      const cacheKey = `${result.place.name}|${result.place.district}`
      if (!imageCache.has(cacheKey)) {
        imageCache.set(cacheKey, fetchTourImageForPlace(result.place))
      }

      const imageUrl = await imageCache.get(cacheKey)
      if (!imageUrl) return result

      return {
        ...result,
        place: {
          ...result.place,
          imageUrl,
        },
      }
    })
  )
}

async function searchTourContent(place: NormalizedPlace, key: string): Promise<TourSearchItem | undefined> {
  try {
    const res = await fetch(tourApiUrl('/searchKeyword2', key, {
      numOfRows: '5',
      pageNo: '1',
      MobileOS: 'ETC',
      MobileApp: MOBILE_APP,
      _type: 'json',
      arrange: 'A',
      areaCode: '1',
      keyword: place.name,
    }), {
      next: { revalidate: 86400 },
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return undefined

    const data = await res.json()
    const items = normalizeItems<TourSearchItem>(data?.response?.body?.items?.item)
    return pickBestMatch(items, place)
  } catch {
    return undefined
  }
}

async function fetchDetailImage(contentId: string, key: string): Promise<string | undefined> {
  try {
    const res = await fetch(tourApiUrl('/detailImage2', key, {
      numOfRows: '3',
      pageNo: '1',
      MobileOS: 'ETC',
      MobileApp: MOBILE_APP,
      _type: 'json',
      contentId,
      imageYN: 'Y',
    }), {
      next: { revalidate: 86400 },
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return undefined

    const data = await res.json()
    const items = normalizeItems<TourImageItem>(data?.response?.body?.items?.item)
    const usable = items.find((item) => item.originimgurl || item.smallimageurl)
    return usable?.originimgurl ?? usable?.smallimageurl
  } catch {
    return undefined
  }
}

function tourApiUrl(path: string, serviceKey: string, params: Record<string, string>): string {
  const search = new URLSearchParams(params)
  return `${TOUR_API_BASE}${path}?serviceKey=${encodeServiceKey(serviceKey)}&${search.toString()}`
}

function encodeServiceKey(serviceKey: string): string {
  return serviceKey.includes('%') ? serviceKey : encodeURIComponent(serviceKey)
}

function normalizeItems<T>(items: T | T[] | undefined): T[] {
  if (!items) return []
  return Array.isArray(items) ? items : [items]
}

function pickBestMatch(items: TourSearchItem[], place: NormalizedPlace): TourSearchItem | undefined {
  if (items.length === 0) return undefined

  const normalizedName = normalizeText(place.name)
  const district = normalizeText(place.district)

  return (
    items.find((item) => {
      const title = normalizeText(item.title)
      const address = normalizeText(item.addr1)
      return title === normalizedName && (!district || address.includes(district))
    }) ??
    items.find((item) => normalizeText(item.addr1).includes(district)) ??
    items.find((item) => normalizeText(item.title).includes(normalizedName)) ??
    items[0]
  )
}

function normalizeText(value?: string): string {
  return (value ?? '').replace(/\s+/g, '').toLowerCase()
}

function getTourApiKey(): string {
  return process.env.TOUR_API_KEY ?? env.TOUR_API_KEY
}
