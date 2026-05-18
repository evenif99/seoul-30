import { prisma } from '@/lib/prisma'
import type { RecommendationResult } from '@/lib/types/recommendation'

const TTL_MS = 60 * 60 * 1000  // 1시간

function buildQueryKey(district?: string, category?: string, freeOnly?: boolean): string {
  return [district ?? '_', category ?? 'all', freeOnly ? '1' : '0'].join('|')
}

export async function getSnapshot(
  district?: string,
  category?: string,
  freeOnly?: boolean,
): Promise<RecommendationResult[] | null> {
  try {
    const snapshot = await prisma.recommendationSnapshot.findUnique({
      where: { queryKey: buildQueryKey(district, category, freeOnly) },
    })
    if (!snapshot || snapshot.expiresAt < new Date()) return null
    return snapshot.resultJson as unknown as RecommendationResult[]
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
    const expiresAt = new Date(Date.now() + TTL_MS)
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
