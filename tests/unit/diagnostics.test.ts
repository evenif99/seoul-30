import { describe, it, expect, vi, afterEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    recommendationSnapshot: {
      findFirst: vi.fn(),
      count: vi.fn(),
    },
    placeFeedback: {
      count: vi.fn(),
    },
    webPushSubscription: {
      count: vi.fn(),
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
    vi.mocked(prisma.webPushSubscription.count).mockResolvedValue(7)

    const { status, body } = await callDiagnostics()

    expect(status).toBe(200)
    expect(body.feedbackCount).toBe(42)
    expect(body.pushSubscriberCount).toBe(7)
    expect(body.lastSnapshotAt).toBe(snapshotDate.toISOString())
    expect(body.timestamp).toBeDefined()
  })

  it('returns null lastSnapshotAt when no snapshot exists', async () => {
    const { prisma } = await import('@/lib/prisma')
    vi.mocked(prisma.recommendationSnapshot.findFirst).mockResolvedValue(null)
    vi.mocked(prisma.recommendationSnapshot.count).mockResolvedValue(0)
    vi.mocked(prisma.placeFeedback.count).mockResolvedValue(0)
    vi.mocked(prisma.webPushSubscription.count).mockResolvedValue(0)

    const { status, body } = await callDiagnostics()

    expect(status).toBe(200)
    expect(body.lastSnapshotAt).toBeNull()
    expect(body.feedbackCount).toBe(0)
  })

  it('returns 503 when DB throws', async () => {
    const { prisma } = await import('@/lib/prisma')
    vi.mocked(prisma.recommendationSnapshot.findFirst).mockRejectedValue(new Error('db down'))
    vi.mocked(prisma.recommendationSnapshot.count).mockResolvedValue(0)
    vi.mocked(prisma.placeFeedback.count).mockResolvedValue(0)
    vi.mocked(prisma.webPushSubscription.count).mockResolvedValue(0)

    const { status, body } = await callDiagnostics()

    expect(status).toBe(503)
    expect(body.error).toBe('db_error')
  })
})
