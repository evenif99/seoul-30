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

interface DiagData {
  lastSnapshotAt: string | null
  snapshotCount: number
  feedbackCount: number
  ratedPlacesCount: number
  pushSubscriberCount: number
  quality: PlaceDataQuality
  qualitySource: 'snapshot' | 'mock'
  error?: string
}

async function fetchDiag(): Promise<DiagData> {
  try {
    const [lastSnapshot, snapshotCount, feedbackCount, pushSubscriberCount, ratedPlacesRaw] =
      await Promise.all([
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

    // 데이터 품질: 스냅샷 우선, 없으면 mock
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
      feedbackCount,
      ratedPlacesCount: ratedPlacesRaw.length,
      pushSubscriberCount,
      quality: calcDataQuality(qualityPlaces),
      qualitySource,
    }
  } catch {
    return {
      lastSnapshotAt: null,
      snapshotCount: 0,
      feedbackCount: 0,
      ratedPlacesCount: 0,
      pushSubscriberCount: 0,
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
