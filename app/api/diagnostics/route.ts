import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { env } from '@/lib/config/env'

export const dynamic = 'force-dynamic'

// GET /api/diagnostics — 운영 상태 요약 (비용 0: 기존 DB 조회만 사용)
export async function GET() {
  const timestamp = new Date().toISOString()
  try {
    const [lastSnapshot, snapshotCount, feedbackCount, pushSubscriberCount, ratedPlacesRaw] = await Promise.all([
      prisma.recommendationSnapshot.findFirst({
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true },
      }),
      prisma.recommendationSnapshot.count(),
      prisma.placeFeedback.count(),
      prisma.webPushSubscription.count(),
      prisma.placeFeedback.findMany({
        distinct: ['placeId'],
        select: { placeId: true },
      }),
    ])

    return NextResponse.json({
      lastSnapshotAt: lastSnapshot?.createdAt ?? null,
      snapshotCount,
      feedbackCount,
      ratedPlacesCount: ratedPlacesRaw.length,
      pushSubscriberCount,
      seoulApiEnabled: env.ENABLE_CULTURE_EVENTS_API,
      realtimeCityDataEnabled: env.ENABLE_REALTIME_CITY_DATA,
      timestamp,
    })
  } catch {
    return NextResponse.json({ error: 'db_error', timestamp }, { status: 503 })
  }
}
