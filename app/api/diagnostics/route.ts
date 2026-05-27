import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { env } from '@/lib/config/env'
import { MOCK_PLACES } from '@/lib/mock/places'
import { calcDataQuality } from '@/lib/utils/data-quality'
import type { RecommendationResult } from '@/lib/types/recommendation'

export const dynamic = 'force-dynamic'

const PUSH_CATS = ['culture', 'library', 'park', 'sports', 'welfare'] as const

// GET /api/diagnostics — 운영 상태 요약 (비용 0: 기존 DB 조회만 사용)
export async function GET() {
  const timestamp = new Date().toISOString()
  try {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)

    const [
      lastSnapshot,
      snapshotCount,
      snapshotsLast24h,
      feedbackCount,
      pushSubscriberCount,
      ratedPlacesRaw,
      pushSubTags,
      topByTotal,
    ] = await Promise.all([
      prisma.recommendationSnapshot.findFirst({
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true, resultJson: true },
      }),
      prisma.recommendationSnapshot.count(),
      prisma.recommendationSnapshot.count({ where: { createdAt: { gte: yesterday } } }),
      prisma.placeFeedback.count(),
      prisma.webPushSubscription.count(),
      prisma.placeFeedback.findMany({
        distinct: ['placeId'],
        select: { placeId: true },
      }),
      prisma.webPushSubscription.findMany({ select: { tags: true } }),
      prisma.placeFeedback.groupBy({
        by: ['placeId'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      }),
    ])

    // ── Push 카테고리 분포 집계 ────────────────────────────────────────────
    const perCategory: Record<string, number> = {}
    let allCategoriesCount = 0
    for (const sub of pushSubTags) {
      if (!sub.tags || sub.tags.length === 0) {
        allCategoriesCount++
        for (const cat of PUSH_CATS) perCategory[cat] = (perCategory[cat] ?? 0) + 1
      } else {
        for (const cat of sub.tags) {
          perCategory[cat] = (perCategory[cat] ?? 0) + 1
        }
      }
    }
    const pushCategoryStats = {
      total: pushSubTags.length,
      allCategoriesCount,
      perCategory,
    }

    // ── 장소 참여도 Top 5 ─────────────────────────────────────────────────
    const topPlaceIds = topByTotal.map((r) => r.placeId)
    const voteBreakdown = topPlaceIds.length > 0
      ? await prisma.placeFeedback.groupBy({
          by: ['placeId', 'vote'],
          _count: { id: true },
          where: { placeId: { in: topPlaceIds } },
        })
      : []

    const topPlaces = topByTotal.slice(0, 5).map((r) => {
      const rows = voteBreakdown.filter((v) => v.placeId === r.placeId)
      const upCount = rows.find((v) => v.vote === 'UP')?._count.id ?? 0
      const downCount = rows.find((v) => v.vote === 'DOWN')?._count.id ?? 0
      const total = r._count.id
      return {
        placeId: r.placeId,
        total,
        upCount,
        downCount,
        upPct: total === 0 ? 0 : Math.round((upCount / total) * 100),
      }
    })

    // ── 데이터 품질: 스냅샷 우선, 없으면 mock ────────────────────────────
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
      snapshotsLast24h,
      feedbackCount,
      ratedPlacesCount: ratedPlacesRaw.length,
      pushSubscriberCount,
      pushCategoryStats,
      topPlaces,
      seoulApiEnabled: env.ENABLE_CULTURE_EVENTS_API,
      realtimeCityDataEnabled: env.ENABLE_REALTIME_CITY_DATA,
      dataQuality,
      timestamp,
    })
  } catch {
    return NextResponse.json({ error: 'db_error', timestamp }, { status: 503 })
  }
}
