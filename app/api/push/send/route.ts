import { NextRequest, NextResponse } from 'next/server'
import webpush from 'web-push'
import { prisma } from '@/lib/prisma'

webpush.setVapidDetails(
  `mailto:${process.env.VAPID_EMAIL ?? 'admin@example.com'}`,
  process.env.VAPID_PUBLIC_KEY ?? '',
  process.env.VAPID_PRIVATE_KEY ?? '',
)

function checkAuth(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return true
  return req.headers.get('authorization') === `Bearer ${secret}`
}

async function sendPushToAll() {
  const subscriptions = await prisma.webPushSubscription.findMany()
  if (subscriptions.length === 0) return { sent: 0, total: 0 }

  const payload = JSON.stringify({
    title: 'Seoul 30 · 오늘의 추천',
    body: '지금 주변 30분 이내 장소를 확인해보세요.',
    url: '/',
  })

  const results = await Promise.allSettled(
    subscriptions.map((sub) =>
      webpush
        .sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload,
        )
        .catch(async (err: { statusCode?: number }) => {
          if (err.statusCode === 410 || err.statusCode === 404) {
            await prisma.webPushSubscription.deleteMany({ where: { endpoint: sub.endpoint } })
          }
          throw err
        }),
    ),
  )

  return {
    sent: results.filter((r) => r.status === 'fulfilled').length,
    total: subscriptions.length,
  }
}

// GET /api/push/send — Vercel Cron (매일 09:00 KST)
export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return NextResponse.json(await sendPushToAll())
}

// POST /api/push/send — 수동 트리거
export async function POST(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return NextResponse.json(await sendPushToAll())
}
