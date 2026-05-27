import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const nextConfig = readFileSync(join(process.cwd(), 'next.config.mjs'), 'utf8')

describe('Next.js image config', () => {
  it('image optimization is enabled (no unoptimized: true)', () => {
    expect(nextConfig).not.toContain('unoptimized: true')
  })

  it('remotePatterns covers Unsplash (mock place images)', () => {
    expect(nextConfig).toContain('images.unsplash.com')
  })

  it('remotePatterns covers Seoul culture API', () => {
    expect(nextConfig).toContain('culture.seoul.go.kr')
  })

  it('remotePatterns covers Seoul subdomains', () => {
    expect(nextConfig).toContain('*.seoul.go.kr')
  })

  it('remotePatterns covers TourAPI (visitkorea)', () => {
    expect(nextConfig).toContain('*.visitkorea.or.kr')
  })

  it('remotePatterns covers Naver pstatic CDN', () => {
    expect(nextConfig).toContain('*.pstatic.net')
  })
})
