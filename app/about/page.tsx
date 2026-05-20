import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getTranslations, getLocale } from 'next-intl/server'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('about')
  return { title: `${t('title')} — Seoul 30` }
}

const SCORING_DIMENSIONS = [
  { key: 'access',     maxKo: '30점', maxEn: '30 pts', ko: '지역 근접도 — 선택한 자치구와 일치하면 최대 점수', en: 'Location match — max score when district matches your selection' },
  { key: 'relevance',  maxKo: '25점', maxEn: '25 pts', ko: '카테고리 일치도 — 선택한 카테고리에 맞을수록 높음', en: 'Category match — higher when place fits your selected category' },
  { key: 'cost',       maxKo: '15점', maxEn: '15 pts', ko: '비용 — 무료 시설에 가산점', en: 'Cost — bonus for free admission' },
  { key: 'congestion', maxKo: '15점', maxEn: '15 pts', ko: '혼잡도 — 실시간 도시데이터 기준, 한산할수록 높음', en: 'Congestion — based on live city data, lower crowd = higher score' },
  { key: 'timefit',    maxKo: '10점', maxEn: '10 pts', ko: '운영 시간 적합도 — 현재 시각 기준 운영 중이면 최대', en: 'Time fit — max when currently open (KST)' },
  { key: 'freshness',  maxKo:  '5점', maxEn:  '5 pts', ko: '행사 임박도 — 개막 7일 이내 행사에 가산점', en: 'Freshness — bonus for events opening within 7 days' },
]

export default async function AboutPage() {
  const t = await getTranslations('about')
  const locale = await getLocale()
  const isKo = locale === 'ko'

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          {t('backHome')}
        </Link>

        <h1 className="text-2xl font-bold text-foreground mb-2">{t('title')}</h1>
        <p className="text-sm text-muted-foreground mb-8">{t('intro')}</p>

        {/* 추천 점수 기준 */}
        <section className="mb-8">
          <h2 className="text-base font-semibold text-foreground mb-3">{t('scoringTitle')}</h2>
          <p className="text-sm text-muted-foreground mb-4">{t('scoringNote')}</p>
          <div className="bg-card border border-border rounded-2xl divide-y divide-border">
            {SCORING_DIMENSIONS.map((d) => (
              <div key={d.key} className="flex items-start gap-3 px-4 py-3">
                <span className="text-xs font-semibold text-primary shrink-0 w-10 pt-0.5">
                  {isKo ? d.maxKo : d.maxEn}
                </span>
                <p className="text-sm text-foreground">{isKo ? d.ko : d.en}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 데이터 출처 */}
        <section className="mb-8">
          <h2 className="text-base font-semibold text-foreground mb-3">{t('dataTitle')}</h2>
          <div className="bg-card border border-border rounded-2xl divide-y divide-border">
            {[
              {
                name: isKo ? '서울 열린데이터광장' : 'Seoul Open Data Plaza',
                desc: isKo ? '문화행사 정보, 실시간 인구 혼잡도' : 'Cultural event listings, real-time congestion',
              },
              {
                name: 'OpenStreetMap',
                desc: isKo ? '지도 배경 타일' : 'Map background tiles',
              },
              {
                name: 'Neon (PostgreSQL)',
                desc: isKo ? 'API 응답 캐싱 (1시간 TTL)' : 'API response caching (1-hour TTL)',
              },
            ].map((src) => (
              <div key={src.name} className="px-4 py-3">
                <p className="text-sm font-medium text-foreground">{src.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{src.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <p className="text-xs text-muted-foreground text-center">
          {isKo ? '오픈소스 프로젝트 · ' : 'Open source · '}
          <a
            href="https://github.com/evenif99/seoul-30"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            GitHub
          </a>
        </p>
      </div>
    </div>
  )
}
