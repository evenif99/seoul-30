import { fileURLToPath } from 'url'
import { dirname } from 'path'
import bundleAnalyzer from '@next/bundle-analyzer'
import createNextIntlPlugin from 'next-intl/plugin'

const __dirname = dirname(fileURLToPath(import.meta.url))
const withBundleAnalyzer = bundleAnalyzer({ enabled: process.env.ANALYZE === 'true' })
const withNextIntl = createNextIntlPlugin('./i18n/request.ts')

const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://oapi.map.naver.com https://openapi.map.naver.com https://*.map.naver.com https://*.ssl.naver.com https://va.vercel-scripts.com https://vercel.live",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://images.unsplash.com https://culture.seoul.go.kr https://*.seoul.go.kr https://*.visitkorea.or.kr https://*.kto.visitkorea.or.kr https://*.pstatic.net https://*.naver.net https://*.naver.com https://*.map.naver.com https://*.ssl.naver.com https://*.ntruss.com",
      "font-src 'self' data:",
      "connect-src 'self' https://*.map.naver.com https://*.ssl.naver.com https://oapi.map.naver.com https://openapi.map.naver.com https://map.naver.com https://*.pstatic.net https://*.naver.net https://*.naver.com https://*.ntruss.com https://*.vercel-insights.com https://vitals.vercel-insights.com",
      "worker-src 'self' blob:",
      "manifest-src 'self'",
      "media-src 'self' data: blob:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      'upgrade-insecure-requests',
    ].join('; '),
  },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), payment=(), usb=(), geolocation=(self)',
  },
]

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // remotePatterns으로 허용 도메인 명시 → Next.js 이미지 최적화(WebP/AVIF) 활성화
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'culture.seoul.go.kr' },
      { protocol: 'https', hostname: '*.seoul.go.kr' },
      { protocol: 'https', hostname: '*.visitkorea.or.kr' },
      { protocol: 'https', hostname: '*.kto.visitkorea.or.kr' },
      { protocol: 'https', hostname: '*.pstatic.net' },
    ],
  },
  turbopack: {
    root: __dirname,
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
      {
        source: '/manifest.json',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store' },
        ],
      },
      {
        source: '/(about|privacy)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=3600, stale-while-revalidate=86400' },
        ],
      },
    ]
  },
}

export default withBundleAnalyzer(withNextIntl(nextConfig))
