import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function buildDatasourceUrl(): string {
  const base = process.env.DATABASE_URL ?? ''
  if (!base) return base
  try {
    const url = new URL(base)
    // Neon 슬립 후 TCP 연결이 끊겨도 재연결되도록 서버리스 전용 파라미터 설정
    // connection_limit=1: 단일 연결 풀 — 죽은 연결 재사용 방지
    // connect_timeout=15: Neon 슬립 해제 대기 최대 15초
    // pool_timeout=15: 연결 풀 대기 최대 15초
    if (!url.searchParams.has('connection_limit')) url.searchParams.set('connection_limit', '1')
    if (!url.searchParams.has('connect_timeout')) url.searchParams.set('connect_timeout', '15')
    if (!url.searchParams.has('pool_timeout')) url.searchParams.set('pool_timeout', '15')
    return url.toString()
  } catch {
    return base
  }
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    datasources: { db: { url: buildDatasourceUrl() } },
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
