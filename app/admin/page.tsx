import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { env } from '@/lib/config/env'
import { MOCK_PLACES } from '@/lib/mock/places'
import { isAdminAuthorized } from '@/lib/utils/admin-auth'
import { calcDataQuality, type PlaceDataQuality } from '@/lib/utils/data-quality'
import type { RecommendationResult } from '@/lib/types/recommendation'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Admin — Seoul 30',
  robots: 'noindex, nofollow',
}

const PUSH_CATS = ['culture', 'library', 'park', 'sports', 'welfare'] as const

interface TopFeedbackPlace {
  placeId: string
  total: number
  upCount: number
  downCount: number
  upPct: number
}

interface PushCategoryStats {
  total: number
  allCategoriesCount: number
  perCategory: Record<string, number>
}

interface DiagData {
  lastSnapshotAt: string | null
  snapshotCount: number
  snapshotsLast24h: number
  feedbackCount: number
  ratedPlacesCount: number
  pushSubscriberCount: number
  pushCategoryStats: PushCategoryStats
  topPlaces: TopFeedbackPlace[]
  quality: PlaceDataQuality
  qualitySource: 'snapshot' | 'mock'
  error?: string
}

async function fetchDiag(): Promise<DiagData> {
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

    // ── Push 카테고리 분포 집계 ───────────────────────────────────────────
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
    const pushCategoryStats: PushCategoryStats = {
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

    const topPlaces: TopFeedbackPlace[] = topByTotal.slice(0, 5).map((r) => {
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

    return {
      lastSnapshotAt: lastSnapshot?.createdAt?.toISOString() ?? null,
      snapshotCount,
      snapshotsLast24h,
      feedbackCount,
      ratedPlacesCount: ratedPlacesRaw.length,
      pushSubscriberCount,
      pushCategoryStats,
      topPlaces,
      quality: calcDataQuality(qualityPlaces),
      qualitySource,
    }
  } catch {
    return {
      lastSnapshotAt: null,
      snapshotCount: 0,
      snapshotsLast24h: 0,
      feedbackCount: 0,
      ratedPlacesCount: 0,
      pushSubscriberCount: 0,
      pushCategoryStats: { total: 0, allCategoriesCount: 0, perCategory: {} },
      topPlaces: [],
      quality: calcDataQuality(MOCK_PLACES),
      qualitySource: 'mock',
      error: 'db_error',
    }
  }
}

function StatusDot({ ok }: { ok: boolean }) {
  return (
    <span
      className={`inline-block w-2 h-2 rounded-full ${ok ? 'bg-emerald-500' : 'bg-slate-300'}`}
      aria-hidden="true"
    />
  )
}

function Row({ label, value, sub }: { label: string; value: React.ReactNode; sub?: string }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground tabular-nums">
        {value}
        {sub && <span className="ml-1 text-xs text-muted-foreground font-normal">{sub}</span>}
      </span>
    </div>
  )
}

function PctBar({ pct, warn }: { pct: number; warn?: boolean }) {
  const color = warn && pct < 70 ? 'bg-amber-400' : pct < 50 ? 'bg-red-400' : 'bg-emerald-400'
  return (
    <div className="flex items-center gap-2 min-w-[100px]">
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs tabular-nums w-10 text-right">{pct}%</span>
    </div>
  )
}

// 카테고리 한글 레이블
const CAT_LABEL: Record<string, string> = {
  culture: '문화',
  library: '도서관',
  park: '공원',
  sports: '체육',
  welfare: '복지',
}

type Props = { searchParams: Promise<{ secret?: string }> }

export default async function AdminPage({ searchParams }: Props) {
  const { secret } = await searchParams
  if (!isAdminAuthorized(secret)) notFound()

  const diag = await fetchDiag()
  const now = new Date().toISOString()
  const { quality } = diag

  const dbOk = !diag.error
  const seoulApiOn = env.ENABLE_CULTURE_EVENTS_API
  const realtimeOn = env.ENABLE_REALTIME_CITY_DATA
  const mockMode = env.USE_MOCK_DATA

  // sourceType 레이블 맵
  const SRC_LABEL: Record<string, string> = {
    CULTURE_EVENT: '문화행사',
    CULTURE_SPACE: '문화공간',
    LIBRARY: '도서관',
    PARK: '공원',
    SPORTS: '체육',
    MOCK: 'Mock',
  }

  // 스냅샷 신선도 — 마지막 스냅샷 경과 시간
  const snapshotAgeHours = diag.lastSnapshotAt
    ? Math.floor((Date.now() - new Date(diag.lastSnapshotAt).getTime()) / (1000 * 60 * 60))
    : null

  return (
    <main className="min-h-screen bg-background px-4 py-10 max-w-lg mx-auto">
      <h1 className="text-lg font-bold text-foreground mb-1">Seoul 30 · 운영 현황</h1>
      <p className="text-xs text-muted-foreground mb-8">조회 시각: {now}</p>

      {/* DB 상태 */}
      <section className="mb-6">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-1.5">
          <StatusDot ok={dbOk} />
          데이터베이스
        </h2>
        <div className="bg-card border border-border rounded-xl px-4">
          {diag.error ? (
            <div className="py-4 text-sm text-destructive">DB 연결 오류 — {diag.error}</div>
          ) : (
            <>
              <Row
                label="마지막 스냅샷"
                value={
                  diag.lastSnapshotAt
                    ? new Date(diag.lastSnapshotAt).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })
                    : '없음'
                }
              />
              <Row label="스냅샷 수" value={diag.snapshotCount} sub="건" />
              <Row label="피드백 수" value={diag.feedbackCount} sub="건" />
              <Row
                label="평가된 장소"
                value={`${diag.ratedPlacesCount} / ${MOCK_PLACES.length}`}
                sub="개소"
              />
              <Row label="Push 구독자" value={diag.pushSubscriberCount} sub="명" />
            </>
          )}
        </div>
      </section>

      {/* 스냅샷 신선도 */}
      <section className="mb-6">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
          스냅샷 신선도
        </h2>
        <div className="bg-card border border-border rounded-xl px-4">
          <Row
            label="최근 24시간 생성"
            value={
              <span className={diag.snapshotsLast24h === 0 ? 'text-amber-600' : 'text-foreground'}>
                {diag.snapshotsLast24h}
              </span>
            }
            sub="건"
          />
          <Row
            label="마지막 스냅샷 경과"
            value={
              snapshotAgeHours === null
                ? <span className="text-muted-foreground">없음</span>
                : snapshotAgeHours < 1
                  ? <span className="text-emerald-600">1시간 미만</span>
                  : snapshotAgeHours < 24
                    ? <span className="text-foreground">{snapshotAgeHours}시간</span>
                    : <span className="text-amber-600">{snapshotAgeHours}시간 (stale)</span>
            }
          />
        </div>
      </section>

      {/* Push 구독 현황 */}
      <section className="mb-6">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
          Push 구독 현황
          <span className="ml-2 normal-case font-normal text-muted-foreground/60">
            (전체 구독자 {diag.pushCategoryStats.total}명)
          </span>
        </h2>
        <div className="bg-card border border-border rounded-xl px-4">
          {diag.pushCategoryStats.total === 0 ? (
            <div className="py-4 text-sm text-muted-foreground">구독자 없음</div>
          ) : (
            <>
              <Row
                label="전체 카테고리 구독"
                value={diag.pushCategoryStats.allCategoriesCount}
                sub={`명 (${diag.pushCategoryStats.total === 0 ? 0 : Math.round((diag.pushCategoryStats.allCategoriesCount / diag.pushCategoryStats.total) * 100)}%)`}
              />
              {PUSH_CATS.map((cat) => {
                const count = diag.pushCategoryStats.perCategory[cat] ?? 0
                const pct = diag.pushCategoryStats.total === 0
                  ? 0
                  : Math.round((count / diag.pushCategoryStats.total) * 100)
                return (
                  <div key={cat} className="flex items-center justify-between py-3 border-t border-border">
                    <span className="text-sm text-muted-foreground">{CAT_LABEL[cat] ?? cat}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground tabular-nums">{count}명</span>
                      <PctBar pct={pct} />
                    </div>
                  </div>
                )
              })}
            </>
          )}
        </div>
      </section>

      {/* 장소 참여도 Top 5 */}
      <section className="mb-6">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
          장소 참여도 Top 5
        </h2>
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          {diag.topPlaces.length === 0 ? (
            <div className="px-4 py-4 text-sm text-muted-foreground">피드백 없음</div>
          ) : (
            <>
              <div className="grid grid-cols-[1fr_auto_auto] px-4 py-2 bg-muted/40 text-[11px] font-semibold text-muted-foreground gap-3">
                <span>장소 ID</span>
                <span className="text-center">피드백</span>
                <span className="text-right">👍 비율</span>
              </div>
              {diag.topPlaces.map((p, i) => (
                <div
                  key={p.placeId}
                  className="grid grid-cols-[1fr_auto_auto] px-4 py-2.5 border-t border-border text-sm gap-3"
                >
                  <span className="text-muted-foreground truncate text-xs" title={p.placeId}>
                    <span className="text-foreground font-medium mr-1">{i + 1}.</span>
                    {p.placeId.length > 20 ? p.placeId.slice(0, 20) + '…' : p.placeId}
                  </span>
                  <span className="text-center tabular-nums font-medium">{p.total}</span>
                  <span className={`text-right tabular-nums font-medium ${p.upPct >= 70 ? 'text-emerald-600' : p.upPct < 40 ? 'text-red-500' : 'text-foreground'}`}>
                    {p.upPct}%
                  </span>
                </div>
              ))}
            </>
          )}
        </div>
      </section>

      {/* 피처 플래그 */}
      <section className="mb-6">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
          피처 플래그
        </h2>
        <div className="bg-card border border-border rounded-xl px-4">
          <Row
            label="서울 문화행사 API"
            value={
              <span className="flex items-center gap-1.5">
                <StatusDot ok={seoulApiOn} />
                {seoulApiOn ? '활성' : '비활성'}
              </span>
            }
          />
          <Row
            label="실시간 혼잡도"
            value={
              <span className="flex items-center gap-1.5">
                <StatusDot ok={realtimeOn} />
                {realtimeOn ? '활성' : '비활성'}
              </span>
            }
          />
          <Row
            label="Mock 데이터 모드"
            value={
              <span className="flex items-center gap-1.5">
                <StatusDot ok={mockMode} />
                {mockMode ? '활성' : '비활성'}
              </span>
            }
          />
        </div>
      </section>

      {/* 데이터 품질 */}
      <section className="mb-6">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
          데이터 품질
          <span className="ml-2 normal-case font-normal text-muted-foreground/60">
            ({diag.qualitySource === 'snapshot' ? '스냅샷 기반' : 'Mock 기반'} · {quality.total}개소)
          </span>
        </h2>
        <div className="bg-card border border-border rounded-xl px-4 mb-3">
          {[
            { label: '좌표 보유', cov: quality.withCoords, warn: true },
            { label: '이미지 보유', cov: quality.withImage, warn: false },
            { label: '주소 보유', cov: quality.withAddress, warn: false },
            { label: '운영시간 보유', cov: quality.withOpenHours, warn: false },
            { label: '태그 보유', cov: quality.withTags, warn: false },
            { label: '전화번호 보유', cov: quality.withPhone, warn: false },
          ].map(({ label, cov, warn }) => (
            <div key={label} className="flex items-center justify-between py-3 border-b border-border last:border-0">
              <span className="text-sm text-muted-foreground">{label}</span>
              <PctBar pct={cov.pct} warn={warn} />
            </div>
          ))}
          {quality.suspiciousCoords > 0 && (
            <div className="flex items-center justify-between py-3 border-t border-border">
              <span className="text-sm text-amber-600">의심 좌표 (정밀도 3자리 미만)</span>
              <span className="text-sm font-medium text-amber-600 tabular-nums">
                {quality.suspiciousCoords}건
              </span>
            </div>
          )}
        </div>

        {/* sourceType별 좌표/이미지 보유율 */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="grid grid-cols-3 px-4 py-2 bg-muted/40 text-[11px] font-semibold text-muted-foreground">
            <span>소스</span>
            <span className="text-center">좌표</span>
            <span className="text-right">이미지</span>
          </div>
          {Object.entries(quality.bySource)
            .sort((a, b) => b[1].total - a[1].total)
            .map(([src, s]) => {
              const coordPct = s.total === 0 ? 0 : Math.round((s.withCoords / s.total) * 100)
              const imgPct = s.total === 0 ? 0 : Math.round((s.withImage / s.total) * 100)
              return (
                <div
                  key={src}
                  className="grid grid-cols-3 px-4 py-2.5 border-t border-border text-sm"
                >
                  <span className="text-muted-foreground">
                    {SRC_LABEL[src] ?? src}
                    <span className="ml-1 text-[11px]">({s.total})</span>
                  </span>
                  <span className={`text-center tabular-nums font-medium ${coordPct < 70 ? 'text-amber-600' : 'text-foreground'}`}>
                    {coordPct}%
                  </span>
                  <span className={`text-right tabular-nums font-medium ${imgPct < 50 ? 'text-muted-foreground' : 'text-foreground'}`}>
                    {imgPct}%
                  </span>
                </div>
              )
            })}
        </div>
      </section>

      {/* 장소 데이터 */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
          장소 데이터 (Mock)
        </h2>
        <div className="bg-card border border-border rounded-xl px-4">
          <Row label="등록 장소 수" value={MOCK_PLACES.length} sub="개소" />
          <Row
            label="태그 보유 장소"
            value={MOCK_PLACES.filter((p) => p.tags && p.tags.length > 0).length}
            sub="개소"
          />
          <Row
            label="무료 장소"
            value={MOCK_PLACES.filter((p) => p.isFree).length}
            sub="개소"
          />
        </div>
      </section>
    </main>
  )
}
