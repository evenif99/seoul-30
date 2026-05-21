import { NextResponse } from 'next/server'
import { validateEnv, env } from '@/lib/config/env'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

async function pingSeoulApi(): Promise<'ok' | 'error' | 'skipped'> {
  if (!env.SEOUL_OPEN_API_KEY) return 'skipped'
  try {
    const url = `http://openapi.seoul.go.kr:8088/${env.SEOUL_OPEN_API_KEY}/json/culturalEventInfo/1/1/`
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) })
    return res.ok ? 'ok' : 'error'
  } catch {
    return 'error'
  }
}

// GET /api/health — 배포 후 헬스 체크 및 런북 진단용
export async function GET() {
  const timestamp = new Date().toISOString()

  try {
    validateEnv()
  } catch (err) {
    return NextResponse.json(
      { status: 'error', error: String(err), timestamp },
      { status: 503 }
    )
  }

  const [dbResult, seoulApi] = await Promise.allSettled([
    prisma.$queryRaw`SELECT 1`,
    pingSeoulApi(),
  ])

  const db = dbResult.status === 'fulfilled' ? 'ok' : 'error'
  const seoulApiStatus = seoulApi.status === 'fulfilled' ? seoulApi.value : 'error'
  const isHealthy = db === 'ok'

  return NextResponse.json(
    { status: isHealthy ? 'ok' : 'degraded', db, seoulApi: seoulApiStatus, timestamp },
    { status: isHealthy ? 200 : 503 },
  )
}
