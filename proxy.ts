import { NextRequest, NextResponse } from 'next/server'

// In-memory store — per edge instance, resets on cold start.
// Sufficient for Vercel Hobby (low traffic). Not shared across instances.
const hits = new Map<string, { count: number; windowStart: number }>()

const WINDOW_MS = 60_000 // 1 minute
const MAX_REQUESTS = 60  // per IP per window

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  )
}

export function proxy(req: NextRequest) {
  if (!req.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  const ip = getClientIp(req)
  const now = Date.now()
  const entry = hits.get(ip)

  if (!entry || now - entry.windowStart > WINDOW_MS) {
    hits.set(ip, { count: 1, windowStart: now })
    return NextResponse.next()
  }

  entry.count += 1

  if (entry.count > MAX_REQUESTS) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again in a minute.' },
      { status: 429, headers: { 'Retry-After': '60' } }
    )
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/api/:path*',
}
