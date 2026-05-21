import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { env } from '@/lib/config/env'
import { MOCK_PLACES } from '@/lib/mock/places'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Admin — Seoul 30',
  robots: 'noindex, nofollow',
}

interface DiagData {
  lastSnapshotAt: string | null
  snapshotCount: number
  feedbackCount: number
  ratedPlacesCount: number
  pushSubscriberCount: number
  error?: string
}

async function fetchDiag(): Promise<DiagData> {
  try {
    const [lastSnapshot, snapshotCount, feedbackCount, pushSubscriberCount, ratedPlacesRaw] =
      await Promise.all([
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

    return {
      lastSnapshotAt: lastSnapshot?.createdAt?.toISOString() ?? null,
      snapshotCount,
      feedbackCount,
      ratedPlacesCount: ratedPlacesRaw.length,
      pushSubscriberCount,
    }
  } catch {
    return {
      lastSnapshotAt: null,
      snapshotCount: 0,
      feedbackCount: 0,
      ratedPlacesCount: 0,
      pushSubscriberCount: 0,
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

export default async function AdminPage() {
  const diag = await fetchDiag()
  const now = new Date().toISOString()

  const dbOk = !diag.error
  const seoulApiOn = env.ENABLE_CULTURE_EVENTS_API
  const realtimeOn = env.ENABLE_REALTIME_CITY_DATA
  const mockMode = env.USE_MOCK_DATA

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

      {/* 장소 데이터 */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
          장소 데이터
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
