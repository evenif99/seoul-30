import { NextResponse } from 'next/server'
import { validateEnv } from '@/lib/config/env'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

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

  try {
    await prisma.$queryRaw`SELECT 1`
    return NextResponse.json({ status: 'ok', db: 'ok', timestamp })
  } catch {
    return NextResponse.json(
      { status: 'degraded', db: 'error', timestamp },
      { status: 503 }
    )
  }
}
