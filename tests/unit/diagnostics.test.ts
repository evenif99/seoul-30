import { describe, it, expect, vi, afterEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    recommendationSnapshot: {
      findFirst: vi.fn(),
      count: vi.fn(),
    },
    placeFeedback: {
      count: vi.fn(),
      findMany: vi.fn(),
      groupBy: vi.fn(),
    },
    webPushSubscription: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
  },
}))

vi.mock('@/lib/config/env', () => ({
  env: {
    ENABLE_CULTURE_EVENTS_API: false,
    ENABLE_REALTIME_CITY_DATA: false,
    SEOUL_OPEN_API_KEY: '',
    DATABASE_URL: '',
    USE_MOCK_DATA: true,
  },
}))

afterEach(() => vi.clearAllMocks())

async function callDiagnostics() {
  const { GET } = await import('@/app/api/diagnostics/route')
  const res = await GET()
  return { status: res.status, body: await res.json() }
}

describe('GET /api/diagnostics', () => {
  it('returns counts and lastSnapshotAt when DB is healthy', async () => {
    const { prisma } = await import('@/lib/prisma')
    const snapshotDate = new Date('2026-05-20T00:00:00Z')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(prisma.recommendationSnapshot.findFirst).mockResolvedValue({ createdAt: snapshotDate } as any)
    vi.mocked(prisma.recommendationSnapshot.count).mockResolvedValue(5)
    vi.mocked(prisma.placeFeedback.count).mockResolvedValue(42)
    vi.mocked(prisma.placeFeedback.findMany).mockResolvedValue([
      { placeId: 'mock-1' }, { placeId: 'mock-2' }, { placeId: 'mock-3' },
    ] as never)
    vi.mocked(prisma.placeFeedback.groupBy).mockResolvedValue([] as never)
    vi.mocked(prisma.webPushSubscription.count).mockResolvedValue(7)
    vi.mocked(prisma.webPushSubscription.findMany).mockResolvedValue([] as never)

    const { status, body } = await callDiagnostics()

    expect(status).toBe(200)
    expect(body.feedbackCount).toBe(42)
    expect(body.ratedPlacesCount).toBe(3)
    expect(body.pushSubscriberCount).toBe(7)
    expect(body.lastSnapshotAt).toBe(snapshotDate.toISOString())
    expect(body.timestamp).toBeDefined()
  })

  it('returns null lastSnapshotAt when no snapshot exists', async () => {
    const { prisma } = await import('@/lib/prisma')
    vi.mocked(prisma.recommendationSnapshot.findFirst).mockResolvedValue(null)
    vi.mocked(prisma.recommendationSnapshot.count).mockResolvedValue(0)
    vi.mocked(prisma.placeFeedback.count).mockResolvedValue(0)
    vi.mocked(prisma.placeFeedback.findMany).mockResolvedValue([] as never)
    vi.mocked(prisma.placeFeedback.groupBy).mockResolvedValue([] as never)
    vi.mocked(prisma.webPushSubscription.count).mockResolvedValue(0)
    vi.mocked(prisma.webPushSubscription.findMany).mockResolvedValue([] as never)

    const { status, body } = await callDiagnostics()

    expect(status).toBe(200)
    expect(body.lastSnapshotAt).toBeNull()
    expect(body.feedbackCount).toBe(0)
    expect(body.ratedPlacesCount).toBe(0)
  })

  it('returns 503 when DB throws', async () => {
    const { prisma } = await import('@/lib/prisma')
    vi.mocked(prisma.recommendationSnapshot.findFirst).mockRejectedValue(new Error('db down'))
    vi.mocked(prisma.recommendationSnapshot.count).mockResolvedValue(0)
    vi.mocked(prisma.placeFeedback.count).mockResolvedValue(0)
    vi.mocked(prisma.placeFeedback.findMany).mockResolvedValue([] as never)
    vi.mocked(prisma.placeFeedback.groupBy).mockResolvedValue([] as never)
    vi.mocked(prisma.webPushSubscription.count).mockResolvedValue(0)
    vi.mocked(prisma.webPushSubscription.findMany).mockResolvedValue([] as never)

    const { status, body } = await callDiagnostics()

    expect(status).toBe(503)
    expect(body.error).toBe('db_error')
  })

  it('includes dataQuality with mock source when no snapshot', async () => {
    const { prisma } = await import('@/lib/prisma')
    vi.mocked(prisma.recommendationSnapshot.findFirst).mockResolvedValue(null)
    vi.mocked(prisma.recommendationSnapshot.count).mockResolvedValue(0)
    vi.mocked(prisma.placeFeedback.count).mockResolvedValue(0)
    vi.mocked(prisma.placeFeedback.findMany).mockResolvedValue([] as never)
    vi.mocked(prisma.placeFeedback.groupBy).mockResolvedValue([] as never)
    vi.mocked(prisma.webPushSubscription.count).mockResolvedValue(0)
    vi.mocked(prisma.webPushSubscription.findMany).mockResolvedValue([] as never)

    const { status, body } = await callDiagnostics()

    expect(status).toBe(200)
    expect(body.dataQuality).toBeDefined()
    expect(body.dataQuality.source).toBe('mock')
    expect(body.dataQuality.total).toBeGreaterThan(0)
    expect(body.dataQuality.withCoords).toBeDefined()
    expect(typeof body.dataQuality.withCoords.pct).toBe('number')
  })

  it('includes snapshotsLast24h count', async () => {
    const { prisma } = await import('@/lib/prisma')
    vi.mocked(prisma.recommendationSnapshot.findFirst).mockResolvedValue(null)
    // count is called twice: once for total, once for last24h
    vi.mocked(prisma.recommendationSnapshot.count).mockResolvedValueOnce(10).mockResolvedValueOnce(3)
    vi.mocked(prisma.placeFeedback.count).mockResolvedValue(0)
    vi.mocked(prisma.placeFeedback.findMany).mockResolvedValue([] as never)
    vi.mocked(prisma.placeFeedback.groupBy).mockResolvedValue([] as never)
    vi.mocked(prisma.webPushSubscription.count).mockResolvedValue(0)
    vi.mocked(prisma.webPushSubscription.findMany).mockResolvedValue([] as never)

    const { status, body } = await callDiagnostics()

    expect(status).toBe(200)
    expect(body.snapshotsLast24h).toBeDefined()
    expect(typeof body.snapshotsLast24h).toBe('number')
  })

  it('includes pushCategoryStats with perCategory counts', async () => {
    const { prisma } = await import('@/lib/prisma')
    vi.mocked(prisma.recommendationSnapshot.findFirst).mockResolvedValue(null)
    vi.mocked(prisma.recommendationSnapshot.count).mockResolvedValue(0)
    vi.mocked(prisma.placeFeedback.count).mockResolvedValue(0)
    vi.mocked(prisma.placeFeedback.findMany).mockResolvedValue([] as never)
    vi.mocked(prisma.placeFeedback.groupBy).mockResolvedValue([] as never)
    vi.mocked(prisma.webPushSubscription.count).mockResolvedValue(3)
    // 2 subscribers with all categories (empty tags), 1 with only culture
    vi.mocked(prisma.webPushSubscription.findMany).mockResolvedValue([
      { tags: [] },
      { tags: [] },
      { tags: ['culture'] },
    ] as never)

    const { status, body } = await callDiagnostics()

    expect(status).toBe(200)
    expect(body.pushCategoryStats).toBeDefined()
    expect(body.pushCategoryStats.total).toBe(3)
    expect(body.pushCategoryStats.allCategoriesCount).toBe(2)
    // culture: 2 (from all-category subs) + 1 (explicit) = 3
    expect(body.pushCategoryStats.perCategory.culture).toBe(3)
  })

  it('includes topPlaces with upPct', async () => {
    const { prisma } = await import('@/lib/prisma')
    vi.mocked(prisma.recommendationSnapshot.findFirst).mockResolvedValue(null)
    vi.mocked(prisma.recommendationSnapshot.count).mockResolvedValue(0)
    vi.mocked(prisma.placeFeedback.count).mockResolvedValue(10)
    vi.mocked(prisma.placeFeedback.findMany).mockResolvedValue([{ placeId: 'place-1' }] as never)
    // groupBy by placeId → top result
    vi.mocked(prisma.placeFeedback.groupBy)
      .mockResolvedValueOnce([{ placeId: 'place-1', _count: { id: 4 } }] as never)
      // groupBy by placeId+vote → UP/DOWN breakdown
      .mockResolvedValueOnce([
        { placeId: 'place-1', vote: 'UP', _count: { id: 3 } },
        { placeId: 'place-1', vote: 'DOWN', _count: { id: 1 } },
      ] as never)
    vi.mocked(prisma.webPushSubscription.count).mockResolvedValue(0)
    vi.mocked(prisma.webPushSubscription.findMany).mockResolvedValue([] as never)

    const { status, body } = await callDiagnostics()

    expect(status).toBe(200)
    expect(body.topPlaces).toBeDefined()
    expect(body.topPlaces.length).toBeGreaterThanOrEqual(1)
    const top = body.topPlaces[0]
    expect(top.placeId).toBe('place-1')
    expect(top.total).toBe(4)
    expect(top.upCount).toBe(3)
    expect(top.downCount).toBe(1)
    expect(top.upPct).toBe(75)
  })
})
