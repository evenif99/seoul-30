import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET /api/diagnostics — 운영 상태 요약 (비용 0: 기존 DB 조회만 사용)
export async function GET() {
  const timestamp = new Date().toISOString()
  try {
    const [lastSnapshot, feedbackCount, pushSubscriberCount] = await Promise.all([
      prisma.recommendationSnapshot.findFirst({
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true },
      }),
      prisma.placeFeedback.count(),
      prisma.webPushSubscription.count(),
    ])

    return NextResponse.json({
      lastSnapshotAt: lastSnapshot?.createdAt ?? null,
      feedbackCount,
      pushSubscriberCount,
      timestamp,
    })
  } catch {
    return NextResponse.json({ error: 'db_error', timestamp }, { status: 503 })
  }
}
