import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST /api/push/subscribe — 구독 저장 (endpoint 기준 upsert)
export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { endpoint, keys } = body as {
    endpoint?: unknown
    keys?: { p256dh?: unknown; auth?: unknown }
  }

  if (
    typeof endpoint !== 'string' ||
    typeof keys?.p256dh !== 'string' ||
    typeof keys?.auth !== 'string'
  ) {
    return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 })
  }

  try {
    await prisma.webPushSubscription.upsert({
      where: { endpoint },
      create: { endpoint, p256dh: keys.p256dh, auth: keys.auth },
      update: { p256dh: keys.p256dh, auth: keys.auth },
    })
  } catch {
    return NextResponse.json({ error: 'DB error' }, { status: 503 })
  }

  return NextResponse.json({ ok: true })
}

// DELETE /api/push/subscribe — 구독 해제
export async function DELETE(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { endpoint } = body as { endpoint?: unknown }
  if (typeof endpoint !== 'string') {
    return NextResponse.json({ error: 'Invalid endpoint' }, { status: 400 })
  }

  try {
    await prisma.webPushSubscription.deleteMany({ where: { endpoint } })
  } catch {
    return NextResponse.json({ error: 'DB error' }, { status: 503 })
  }

  return NextResponse.json({ ok: true })
}
