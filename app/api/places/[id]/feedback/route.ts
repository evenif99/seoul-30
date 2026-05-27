import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface RouteContext {
  params: Promise<{ id: string }>
}

// GET /api/places/[id]/feedback — 집계 반환
export async function GET(_req: NextRequest, { params }: RouteContext) {
  const { id: placeId } = await params

  try {
    const [up, down] = await Promise.all([
      prisma.placeFeedback.count({ where: { placeId, vote: 'UP' } }),
      prisma.placeFeedback.count({ where: { placeId, vote: 'DOWN' } }),
    ])
    return NextResponse.json({ up, down })
  } catch {
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }
}

// POST /api/places/[id]/feedback — 투표 (upsert)
export async function POST(req: NextRequest, { params }: RouteContext) {
  const { id: placeId } = await params

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { vote, sessionId } = body as { vote?: unknown; sessionId?: unknown }

  if (vote !== 'UP' && vote !== 'DOWN') {
    return NextResponse.json({ error: 'vote must be UP or DOWN' }, { status: 400 })
  }
  if (typeof sessionId !== 'string' || sessionId.length < 8 || sessionId.length > 128) {
    return NextResponse.json({ error: 'Invalid sessionId' }, { status: 400 })
  }

  try {
    await prisma.placeFeedback.upsert({
      where: { placeId_sessionId: { placeId, sessionId } },
      create: { placeId, sessionId, vote },
      update: { vote },
    })

    const [up, down] = await Promise.all([
      prisma.placeFeedback.count({ where: { placeId, vote: 'UP' } }),
      prisma.placeFeedback.count({ where: { placeId, vote: 'DOWN' } }),
    ])

    return NextResponse.json({ up, down })
  } catch {
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }
}
