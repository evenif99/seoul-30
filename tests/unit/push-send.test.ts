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

function makeSub(overrides: Partial<{ id: string; endpoint: string; tags: string[] }> = {}) {
  return {
    id: overrides.id ?? '1',
    endpoint: overrides.endpoint ?? 'https://push.example.com/1',
    p256dh: 'key1',
    auth: 'auth1',
    tags: overrides.tags ?? [],
    createdAt: new Date(),
  }
}

function makeRequest(authHeader?: string, method = 'GET', url = 'http://localhost/api/push/send') {
  return new Request(url, {
    method,
    headers: authHeader ? { authorization: authHeader } : {},
  })
}

async function callGet(authHeader?: string, category?: string, campaign?: string) {
  vi.resetModules()
  process.env.CRON_SECRET = mockEnv.CRON_SECRET
  process.env.VAPID_PUBLIC_KEY = mockEnv.VAPID_PUBLIC_KEY
  process.env.VAPID_PRIVATE_KEY = mockEnv.VAPID_PRIVATE_KEY
  process.env.VAPID_EMAIL = mockEnv.VAPID_EMAIL

  const params = new URLSearchParams()
  if (category) params.set('category', category)
  if (campaign) params.set('campaign', campaign)
  const query = params.toString()
  const url = `http://localhost/api/push/send${query ? `?${query}` : ''}`
  const { GET } = await import('@/app/api/push/send/route')
  const res = await GET(makeRequest(authHeader, 'GET', url) as any)
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

describe('GET /api/push/send — 전체 발송', () => {
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
      makeSub({ id: '1', endpoint: 'https://push.example.com/1', tags: [] }),
      makeSub({ id: '2', endpoint: 'https://push.example.com/2', tags: ['culture'] }),
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
      makeSub({ endpoint: 'https://push.example.com/gone', tags: [] }),
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

describe('GET /api/push/send — 카테고리 필터', () => {
  it('category 파라미터 전달 시 응답에 category 포함', async () => {
    const { prisma } = await import('@/lib/prisma')
    vi.mocked(prisma.webPushSubscription.findMany).mockResolvedValue([])

    const { body } = await callGet('Bearer test-secret', 'culture')
    expect(body.category).toBe('culture')
  })

  it('잘못된 category 값은 무시하고 전체 발송', async () => {
    const { prisma } = await import('@/lib/prisma')
    vi.mocked(prisma.webPushSubscription.findMany).mockResolvedValue([])

    const { body } = await callGet('Bearer test-secret', 'invalid')
    expect(body.category).toBeUndefined()
  })

  it('category 지정 시 prisma.findMany에 OR 조건 전달', async () => {
    const { prisma } = await import('@/lib/prisma')
    vi.mocked(prisma.webPushSubscription.findMany).mockResolvedValue([])

    await callGet('Bearer test-secret', 'library')
    expect(prisma.webPushSubscription.findMany).toHaveBeenCalledWith({
      where: {
        OR: [{ tags: { isEmpty: true } }, { tags: { has: 'library' } }],
      },
    })
  })

  it('category 미지정 시 where 없이 전체 조회', async () => {
    const { prisma } = await import('@/lib/prisma')
    vi.mocked(prisma.webPushSubscription.findMany).mockResolvedValue([])

    await callGet('Bearer test-secret')
    expect(prisma.webPushSubscription.findMany).toHaveBeenCalledWith({ where: undefined })
  })

  it('푸시 payload 딥링크에 기본 UTM 파라미터 포함', async () => {
    const { prisma } = await import('@/lib/prisma')
    const webpush = (await import('web-push')).default

    vi.mocked(prisma.webPushSubscription.findMany).mockResolvedValue([
      makeSub({ endpoint: 'https://push.example.com/culture', tags: ['culture'] }),
    ] as any)
    vi.mocked(webpush.sendNotification).mockResolvedValue({} as any)

    await callGet('Bearer test-secret', 'culture')

    const payload = JSON.parse(vi.mocked(webpush.sendNotification).mock.calls[0][1] as string)
    expect(payload.url).toBe(
      '/?category=culture&utm_source=push&utm_medium=notification&utm_campaign=daily',
    )
  })

  it('campaign 쿼리 파라미터를 utm_campaign 값으로 사용', async () => {
    const { prisma } = await import('@/lib/prisma')
    const webpush = (await import('web-push')).default

    vi.mocked(prisma.webPushSubscription.findMany).mockResolvedValue([
      makeSub({ endpoint: 'https://push.example.com/library', tags: ['library'] }),
    ] as any)
    vi.mocked(webpush.sendNotification).mockResolvedValue({} as any)

    await callGet('Bearer test-secret', 'library', 'weekly_digest')

    const payload = JSON.parse(vi.mocked(webpush.sendNotification).mock.calls[0][1] as string)
    expect(payload.url).toContain('category=library')
    expect(payload.url).toContain('utm_source=push')
    expect(payload.url).toContain('utm_medium=notification')
    expect(payload.url).toContain('utm_campaign=weekly_digest')
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
