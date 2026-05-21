import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchTourImageForPlace, mergeTourImages } from '@/lib/data/tourImages'
import type { NormalizedPlace } from '@/lib/types/place'

afterEach(() => {
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
})

const place: NormalizedPlace = {
  id: 'lib-1',
  slug: 'library-1',
  sourceType: 'LIBRARY',
  name: 'Seoul Library',
  category: 'library',
  district: 'Jung-gu',
  isFree: true,
}

describe('tour image integration', () => {
  it('skips external calls when TOUR_API_KEY is missing', async () => {
    vi.stubEnv('TOUR_API_KEY', '')
    const fetchMock = vi.spyOn(globalThis, 'fetch')

    await expect(fetchTourImageForPlace(place)).resolves.toBeUndefined()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('returns existing imageUrl without calling TourAPI', async () => {
    vi.stubEnv('TOUR_API_KEY', 'tour_test')
    const fetchMock = vi.spyOn(globalThis, 'fetch')

    await expect(fetchTourImageForPlace({ ...place, imageUrl: 'https://example.com/a.jpg' })).resolves.toBe(
      'https://example.com/a.jpg'
    )
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('looks up content and detail image for places without imageUrl', async () => {
    vi.stubEnv('TOUR_API_KEY', 'tour_test')
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .mockResolvedValueOnce(jsonResponse({ response: { body: { items: { item: { contentid: '123', title: 'Seoul Library', addr1: 'Seoul Jung-gu' } } } } }) as any)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .mockResolvedValueOnce(jsonResponse({ response: { body: { items: { item: { originimgurl: 'https://example.com/tour.jpg' } } } } }) as any)

    await expect(fetchTourImageForPlace(place)).resolves.toBe('https://example.com/tour.jpg')
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(String(fetchMock.mock.calls[0][0])).toContain('/searchKeyword2')
    expect(String(fetchMock.mock.calls[1][0])).toContain('/detailImage2')
  })

  it('merges fetched imageUrl into recommendation results', async () => {
    vi.stubEnv('TOUR_API_KEY', 'tour_test')
    vi
      .spyOn(globalThis, 'fetch')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .mockResolvedValueOnce(jsonResponse({ response: { body: { items: { item: { contentid: '123', title: 'Seoul Library', addr1: 'Seoul Jung-gu' } } } } }) as any)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .mockResolvedValueOnce(jsonResponse({ response: { body: { items: { item: { originimgurl: 'https://example.com/tour.jpg' } } } } }) as any)

    const results = await mergeTourImages([{ place, score: { total: 90 }, isMock: false }])
    expect(results[0].place.imageUrl).toBe('https://example.com/tour.jpg')
  })
})

function jsonResponse(body: unknown) {
  return {
    ok: true,
    json: async () => body,
  }
}
