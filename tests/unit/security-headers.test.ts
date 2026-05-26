import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const nextConfig = readFileSync(join(process.cwd(), 'next.config.mjs'), 'utf8')

describe('security headers', () => {
  it('defines production security headers', () => {
    expect(nextConfig).toContain('Content-Security-Policy')
    expect(nextConfig).toContain('X-Frame-Options')
    expect(nextConfig).toContain('X-Content-Type-Options')
    expect(nextConfig).toContain('Referrer-Policy')
    expect(nextConfig).toContain('Permissions-Policy')
  })

  it('allows Naver Maps assets in CSP', () => {
    expect(nextConfig).toContain('https://oapi.map.naver.com')
    expect(nextConfig).toContain('https://openapi.map.naver.com')
    expect(nextConfig).toContain('https://*.map.naver.com')
    expect(nextConfig).toContain('https://*.ssl.naver.com')
    expect(nextConfig).toContain('https://*.pstatic.net')
  })

  it('allows real place image providers in CSP', () => {
    expect(nextConfig).toContain('https://culture.seoul.go.kr')
    expect(nextConfig).toContain('https://*.seoul.go.kr')
    expect(nextConfig).toContain('https://*.visitkorea.or.kr')
  })
})
