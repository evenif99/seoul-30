import type { Metadata, Viewport } from 'next'
import { Noto_Sans_KR, Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { ServiceWorkerRegistrar } from '@/components/ServiceWorkerRegistrar'
import './globals.css'

const notoSansKR = Noto_Sans_KR({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-sans',
})

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-body',
})

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://seoul-30-webapp.vercel.app'

export const metadata: Metadata = {
  title: 'Seoul 30 — 30분 안에 갈 수 있는 장소 추천',
  description: '서울 시민을 위한 30분 생활권 공공시설·문화공간 추천 서비스. 도서관, 공원, 문화공간, 스포츠시설을 무료 우선·혼잡도 반영으로 추천합니다.',
  keywords: ['서울', '공공시설', '도서관', '공원', '문화공간', '스포츠', '무료', '추천', 'Seoul', 'public space'],
  authors: [{ name: 'evenif99', url: 'https://github.com/evenif99' }],
  manifest: '/manifest.json',
  metadataBase: new URL(BASE_URL),
  openGraph: {
    title: 'Seoul 30 — 30분 안에 갈 수 있는 장소 추천',
    description: '서울 시민을 위한 30분 생활권 공공시설·문화공간 추천 서비스. 도서관, 공원, 문화공간, 스포츠시설을 무료 우선·혼잡도 반영으로 추천합니다.',
    url: BASE_URL,
    siteName: 'Seoul 30',
    locale: 'ko_KR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Seoul 30 — 30분 안에 갈 수 있는 장소 추천',
    description: '서울 시민을 위한 30분 생활권 공공시설·문화공간 추천 서비스',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Seoul 30',
  },
  icons: {
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#1A6B5A',
  width: 'device-width',
  initialScale: 1,
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const locale = await getLocale()
  const messages = await getMessages()

  return (
    <html lang={locale} className={`${notoSansKR.variable} ${inter.variable} bg-background`}>
      <head>
        <link rel="preconnect" href="https://images.unsplash.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
        <link rel="dns-prefetch" href="https://openapi.map.naver.com" />
      </head>
      <body className="font-sans antialiased">
        <NextIntlClientProvider messages={messages}>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground"
          >
            {locale === 'ko' ? '본문 바로가기' : 'Skip to content'}
          </a>
          <ErrorBoundary>
            <main id="main-content">{children}</main>
          </ErrorBoundary>
          <ServiceWorkerRegistrar />
          {process.env.NODE_ENV === 'production' && <Analytics />}
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
