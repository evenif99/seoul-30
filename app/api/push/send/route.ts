import { NextRequest, NextResponse } from 'next/server'
import webpush from 'web-push'
import { prisma } from '@/lib/prisma'

const VALID_CATEGORIES = new Set(['culture', 'library', 'park', 'sports', 'welfare'])

const CATEGORY_LABEL: Record<string, string> = {
  culture: '문화/전시',
  library: '도서관',
  park: '공원',
  sports: '스포츠',
  welfare: '복지시설',
}

function checkAuth(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return process.env.NODE_ENV === 'development'
  return req.headers.get('authorization') === `Bearer ${secret}`
}

async function sendPush(category?: string) {
  const vapidPublic = process.env.VAPID_PUBLIC_KEY
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY
  if (!vapidPublic || !vapidPrivate) return { sent: 0, total: 0 }

  webpush.setVapidDetails(
    `mailto:${process.env.VAPID_EMAIL ?? 'admin@example.com'}`,
    vapidPublic,
    vapidPrivate,
  )

  // category 지정 시 → 빈 tags(전체) 또는 해당 category 포함 구독자만 조회
  const subscriptions = await prisma.webPushSubscription.findMany({
    where: category
      ? { OR: [{ tags: { isEmpty: true } }, { tags: { has: category } }] }
      : undefined,
  }).catch(() => [])

  if (subscriptions.length === 0) return { sent: 0, total: 0, ...(category && { category }) }

  const label = category ? CATEGORY_LABEL[category] : undefined
  const payload = JSON.stringify({
    title: label ? `Seoul 30 · ${label} 추천` : 'Seoul 30 · 오늘의 추천',
    body: '지금 주변 30분 이내 장소를 확인해보세요.',
    url: category ? `/?category=${category}` : '/',
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
    ...(category && { category }),
  }
}

// GET /api/push/send — Vercel Cron (매일 09:00 KST) 또는 ?category=xxx 타겟 발송
export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const category = new URL(req.url).searchParams.get('category') ?? undefined
  const validCategory = category && VALID_CATEGORIES.has(category) ? category : undefined
  try {
    return NextResponse.json(await sendPush(validCategory))
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

// POST /api/push/send — 수동 트리거
export async function POST(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const category = new URL(req.url).searchParams.get('category') ?? undefined
  const validCategory = category && VALID_CATEGORIES.has(category) ? category : undefined
  try {
    return NextResponse.json(await sendPush(validCategory))
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
