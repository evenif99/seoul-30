import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── 모듈 모킹 ────────────────────────────────────────────────────────────────

vi.mock('web-push', () => ({
  default: {
    setVapidDetails: vi.fn(),
    sendNotification: vi.fn().mockResolvedValue({}),
  },
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    webPushSubscription: {
      findMany: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}))

const mockEnv = vi.hoisted(() => ({
  CRON_SECRET: 'test-secret',
  VAPID_PUBLIC_KEY: 'public-key',
  VAPID_PRIVATE_KEY: 'private-key',
  VAPID_EMAIL: 'test@example.com',
}))

vi.mock('@/lib/config/env', () => ({ env: mockEnv }))

// ── 헬퍼 ─────────────────────────────────────────────────────────────────────

function makeRequest(authHeader?: string, method = 'GET') {
  return new Request(`http://localhost/api/push/send`, {
    method,
    headers: authHeader ? { authorization: authHeader } : {},
  })
}

async function callGet(authHeader?: string) {
  vi.resetModules()
  // process.env를 route가 직접 읽으므로 여기서 설정
  process.env.CRON_SECRET = mockEnv.CRON_SECRET
  process.env.VAPID_PUBLIC_KEY = mockEnv.VAPID_PUBLIC_KEY
  process.env.VAPID_PRIVATE_KEY = mockEnv.VAPID_PRIVATE_KEY
  process.env.VAPID_EMAIL = mockEnv.VAPID_EMAIL

  const { GET } = await import('@/app/api/push/send/route')
  const res = await GET(makeRequest(authHeader) as any)
  return { status: res.status, body: await res.json() }
}

async function callPost(authHeader?: string) {
  const { POST } = await import('@/app/api/push/send/route')
  const res = await POST(makeRequest(authHeader, 'POST') as any)
  return { status: res.status, body: await res.json() }
}

// ── 테스트 ───────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
})

describe('GET /api/push/send — 인증', () => {
  it('올바른 Bearer 토큰이면 200 반환', async () => {
    const { prisma } = await import('@/lib/prisma')
    vi.mocked(prisma.webPushSubscription.findMany).mockResolvedValue([])

    const { status } = await callGet('Bearer test-secret')
    expect(status).toBe(200)
  })

  it('토큰 불일치 시 401 반환', async () => {
    const { status, body } = await callGet('Bearer wrong-secret')
    expect(status).toBe(401)
    expect(body.error).toBe('Unauthorized')
  })

  it('Authorization 헤더 없으면 401 반환', async () => {
    const { status } = await callGet()
    expect(status).toBe(401)
  })
})

describe('GET /api/push/send — 발송 로직', () => {
  it('구독자 없으면 sent:0, total:0 반환', async () => {
    const { prisma } = await import('@/lib/prisma')
    vi.mocked(prisma.webPushSubscription.findMany).mockResolvedValue([])

    const { status, body } = await callGet('Bearer test-secret')
    expect(status).toBe(200)
    expect(body.sent).toBe(0)
    expect(body.total).toBe(0)
  })

  it('구독자 있으면 sendNotification 호출 후 결과 반환', async () => {
    const { prisma } = await import('@/lib/prisma')
    const webpush = (await import('web-push')).default

    vi.mocked(prisma.webPushSubscription.findMany).mockResolvedValue([
      { id: '1', endpoint: 'https://push.example.com/1', p256dh: 'key1', auth: 'auth1', createdAt: new Date() },
      { id: '2', endpoint: 'https://push.example.com/2', p256dh: 'key2', auth: 'auth2', createdAt: new Date() },
    ] as any)
    vi.mocked(webpush.sendNotification).mockResolvedValue({} as any)

    const { status, body } = await callGet('Bearer test-secret')
    expect(status).toBe(200)
    expect(body.total).toBe(2)
    expect(body.sent).toBe(2)
  })

  it('만료된 구독(410)은 DB에서 삭제', async () => {
    const { prisma } = await import('@/lib/prisma')
    const webpush = (await import('web-push')).default

    vi.mocked(prisma.webPushSubscription.findMany).mockResolvedValue([
      { id: '1', endpoint: 'https://push.example.com/gone', p256dh: 'key1', auth: 'auth1', createdAt: new Date() },
    ] as any)
    const err = Object.assign(new Error('Gone'), { statusCode: 410 })
    vi.mocked(webpush.sendNotification).mockRejectedValue(err)
    vi.mocked(prisma.webPushSubscription.deleteMany).mockResolvedValue({ count: 1 })

    const { status, body } = await callGet('Bearer test-secret')
    expect(status).toBe(200)
    expect(body.sent).toBe(0)
    expect(body.total).toBe(1)
    expect(prisma.webPushSubscription.deleteMany).toHaveBeenCalledWith({
      where: { endpoint: 'https://push.example.com/gone' },
    })
  })
})

describe('POST /api/push/send — 수동 트리거', () => {
  it('올바른 토큰으로 POST 가능', async () => {
    const { prisma } = await import('@/lib/prisma')
    vi.mocked(prisma.webPushSubscription.findMany).mockResolvedValue([])

    const { status } = await callPost('Bearer test-secret')
    expect(status).toBe(200)
  })
})

describe('vercel.json cron 스케줄', () => {
  it('0 0 * * * 스케줄 설정 확인 (UTC 00:00 = KST 09:00)', async () => {
    const fs = await import('fs')
    const config = JSON.parse(fs.readFileSync('./vercel.json', 'utf-8'))
    const cron = config.crons?.find((c: { path: string }) => c.path === '/api/push/send')
    expect(cron).toBeDefined()
    expect(cron.schedule).toBe('0 0 * * *')
  })
})
