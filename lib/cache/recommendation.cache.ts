import { prisma } from '@/lib/prisma'
import { env } from '@/lib/config/env'
import type { RecommendationResult } from '@/lib/types/recommendation'

// SNAPSHOT_TTL_SECONDS 환경변수로 조정 가능 (기본 2시간)
// Seoul Open API 쿼터 최적화: 호출 빈도를 줄여 일 쿼터 보호
function getTTLMs(): number {
  const ttl = env.SNAPSHOT_TTL_SECONDS
  return (Number.isFinite(ttl) && ttl > 0 ? ttl : 7200) * 1000
}

function buildQueryKey(district?: string, category?: string, freeOnly?: boolean): string {
  return [district ?? '_', category ?? 'all', freeOnly ? '1' : '0'].join('|')
}

export interface SnapshotResult {
  results: RecommendationResult[]
  snapshotAt: Date
}

export async function getSnapshot(
  district?: string,
  category?: string,
  freeOnly?: boolean,
): Promise<SnapshotResult | null> {
  try {
    const snapshot = await prisma.recommendationSnapshot.findUnique({
      where: { queryKey: buildQueryKey(district, category, freeOnly) },
    })
    if (!snapshot || snapshot.expiresAt < new Date()) return null
    return { results: snapshot.resultJson as unknown as RecommendationResult[], snapshotAt: snapshot.createdAt }
  } catch {
    return null
  }
}

// TTL 무시하고 만료된 스냅샷도 반환 — Seoul API 장애 시 stale fallback용
export async function getStaleSnapshot(
  district?: string,
  category?: string,
  freeOnly?: boolean,
): Promise<SnapshotResult | null> {
  try {
    const snapshot = await prisma.recommendationSnapshot.findUnique({
      where: { queryKey: buildQueryKey(district, category, freeOnly) },
    })
    if (!snapshot) return null
    return { results: snapshot.resultJson as unknown as RecommendationResult[], snapshotAt: snapshot.createdAt }
  } catch {
    return null
  }
}

export async function setSnapshot(
  results: RecommendationResult[],
  district?: string,
  category?: string,
  freeOnly?: boolean,
): Promise<void> {
  try {
    const queryKey = buildQueryKey(district, category, freeOnly)
    const expiresAt = new Date(Date.now() + getTTLMs())
    const resultJson = JSON.parse(JSON.stringify(results))

    await prisma.recommendationSnapshot.upsert({
      where: { queryKey },
      create: {
        queryKey,
        district: district ?? null,
        category: category ?? null,
        maxTravelMinutes: 30,
        resultJson,
        expiresAt,
      },
      update: { resultJson, expiresAt },
    })
  } catch {
    // 캐시 쓰기 실패는 non-fatal — 다음 요청에서 재시도
  }
}
