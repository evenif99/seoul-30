import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { env } from '@/lib/config/env'
import { MOCK_PLACES } from '@/lib/mock/places'
import { calcDataQuality } from '@/lib/utils/data-quality'
import type { RecommendationResult } from '@/lib/types/recommendation'

export const dynamic = 'force-dynamic'

// GET /api/diagnostics — 운영 상태 요약 (비용 0: 기존 DB 조회만 사용)
export async function GET() {
  const timestamp = new Date().toISOString()
  try {
    const [lastSnapshot, snapshotCount, feedbackCount, pushSubscriberCount, ratedPlacesRaw] = await Promise.all([
      prisma.recommendationSnapshot.findFirst({
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true, resultJson: true },
      }),
      prisma.recommendationSnapshot.count(),
      prisma.placeFeedback.count(),
      prisma.webPushSubscription.count(),
      prisma.placeFeedback.findMany({
        distinct: ['placeId'],
        select: { placeId: true },
      }),
    ])

    // 데이터 품질: 스냅샷 있으면 실 API 장소 기반, 없으면 MOCK_PLACES 기반
    let qualitySource: 'snapshot' | 'mock' = 'mock'
    let qualityPlaces = MOCK_PLACES
    if (lastSnapshot?.resultJson) {
      try {
        const results = lastSnapshot.resultJson as unknown as RecommendationResult[]
        if (results.length > 0) {
          qualityPlaces = results.map((r) => r.place)
          qualitySource = 'snapshot'
        }
      } catch { /* 파싱 실패 시 mock 유지 */ }
    }
    const dataQuality = { ...calcDataQuality(qualityPlaces), source: qualitySource }

    return NextResponse.json({
      lastSnapshotAt: lastSnapshot?.createdAt ?? null,
      snapshotCount,
      feedbackCount,
      ratedPlacesCount: ratedPlacesRaw.length,
      pushSubscriberCount,
      seoulApiEnabled: env.ENABLE_CULTURE_EVENTS_API,
      realtimeCityDataEnabled: env.ENABLE_REALTIME_CITY_DATA,
      dataQuality,
      timestamp,
    })
  } catch {
    return NextResponse.json({ error: 'db_error', timestamp }, { status: 503 })
  }
}
