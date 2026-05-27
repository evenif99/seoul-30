import { describe, expect, it, vi, beforeEach } from 'vitest'

const mockGetSnapshotPlaces = vi.fn()

vi.mock('@/lib/data/place-detail', () => ({
  getSnapshotPlaces: mockGetSnapshotPlaces,
}))

beforeEach(() => {
  vi.clearAllMocks()
})

describe('SEO metadata routes', () => {
  it('sitemap includes snapshot place URLs when cached places exist', async () => {
    mockGetSnapshotPlaces.mockResolvedValue([
      { id: 'lib-1-library', name: 'Library' },
      { id: 'park-2-park', name: 'Park' },
    ])

    const { default: sitemap } = await import('@/app/sitemap')
    const entries = await sitemap()
    const urls = entries.map((entry) => entry.url)

    expect(urls).toContain('https://seoul-30-webapp.vercel.app/place/lib-1-library')
    expect(urls).toContain('https://seoul-30-webapp.vercel.app/place/park-2-park')
  })

  it('sitemap does not fall back to mock place URLs when snapshots are empty', async () => {
    mockGetSnapshotPlaces.mockResolvedValue([])

    const { default: sitemap } = await import('@/app/sitemap')
    const entries = await sitemap()
    const urls = entries.map((entry) => entry.url)

    expect(urls.some((url) => url.includes('/place/mock-'))).toBe(false)
  })

  it('robots blocks admin and API crawling while exposing sitemap', async () => {
    const { default: robots } = await import('@/app/robots')
    const config = robots()

    expect(config.sitemap).toBe('https://seoul-30-webapp.vercel.app/sitemap.xml')
    expect(config.rules).toMatchObject({
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/api/'],
    })
  })
})
