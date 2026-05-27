export const revalidate = 3600

import type { Metadata } from 'next'
import Link from 'next/link'
import {
  ArrowLeft, MapPin, Clock, Phone, Globe, ExternalLink, Train,
  Building2, Leaf, Users, Heart, Car, Wifi, ShieldCheck,
  BookOpen, Trees, Dumbbell, Landmark,
} from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { BookmarkButton } from '@/components/seoul30/BookmarkButton'
import { FeedbackPanel } from '@/components/seoul30/FeedbackPanel'
import { RecentTracker } from '@/components/seoul30/RecentTracker'
import { ShareButton } from '@/components/seoul30/ShareButton'
import { PlaceMiniMap } from '@/components/seoul30/PlaceMiniMap'
import { PlaceCard } from '@/components/seoul30/PlaceCard'
import { PlaceImage } from '@/components/seoul30/PlaceImage'
import { notFound } from 'next/navigation'
import { cn } from '@/lib/utils'
import { getPlaceDetailData } from '@/lib/data/place-detail'
import { nearbyPlacesFor } from '@/lib/utils/place-distance'
import type { PlaceTag } from '@/lib/types/place'

interface PageProps {
  params: Promise<{ id: string }>
}

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://seoul-30.vercel.app'

function buildKakaoMapUrl(place: { name: string; address?: string; latitude?: number; longitude?: number }) {
  if (place.latitude && place.longitude) {
    return `https://map.kakao.com/link/to/${encodeURIComponent(place.name)},${place.latitude},${place.longitude}`
  }
  if (place.address) {
    return `https://map.kakao.com/link/search/${encodeURIComponent(place.address)}`
  }
  return null
}

const CATEGORY_LABEL: Record<string, string> = {
  culture: '문화/전시',
  library: '도서관',
  park: '공원',
  sports: '스포츠',
  welfare: '복지시설',
}

const CATEGORY_HERO: Record<string, { bg: string; icon: React.ReactNode }> = {
  culture:  { bg: 'bg-purple-100',  icon: <Landmark className="w-16 h-16 text-purple-300" /> },
  library:  { bg: 'bg-amber-100',   icon: <BookOpen  className="w-16 h-16 text-amber-300" /> },
  park:     { bg: 'bg-green-100',   icon: <Trees     className="w-16 h-16 text-green-300" /> },
  sports:   { bg: 'bg-blue-100',    icon: <Dumbbell  className="w-16 h-16 text-blue-300" /> },
  welfare:  { bg: 'bg-rose-100',    icon: <Heart     className="w-16 h-16 text-rose-300" /> },
}

const TAG_CONFIG: Record<PlaceTag, { icon: React.ReactNode; className: string }> = {
  indoor:      { icon: <Building2   className="w-3 h-3" />, className: 'bg-blue-50   text-blue-700   border-blue-100' },
  outdoor:     { icon: <Leaf        className="w-3 h-3" />, className: 'bg-green-50  text-green-700  border-green-100' },
  wheelchair:  { icon: <ShieldCheck className="w-3 h-3" />, className: 'bg-purple-50 text-purple-700 border-purple-100' },
  family:      { icon: <Users       className="w-3 h-3" />, className: 'bg-amber-50  text-amber-700  border-amber-100' },
  pet:         { icon: <Heart       className="w-3 h-3" />, className: 'bg-rose-50   text-rose-700   border-rose-100' },
  parking:     { icon: <Car         className="w-3 h-3" />, className: 'bg-slate-50  text-slate-700  border-slate-100' },
  wifi:        { icon: <Wifi        className="w-3 h-3" />, className: 'bg-sky-50    text-sky-700    border-sky-100' },
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const { place } = await getPlaceDetailData(id)
  if (!place) return {}

  const categoryLabel = CATEGORY_LABEL[place.category] ?? place.category
  const description = place.description ?? `${categoryLabel} · ${place.district} · 30분 이내`
  const url = `${BASE_URL}/place/${id}`

  return {
    title: `${place.name} — Seoul 30`,
    description,
    openGraph: {
      title: place.name,
      description,
      url,
      siteName: 'Seoul 30',
      locale: 'ko_KR',
      type: 'website',
      ...(place.imageUrl && {
        images: [{ url: place.imageUrl, width: 800, height: 600, alt: place.name }],
      }),
    },
    twitter: {
      card: 'summary_large_image',
      title: place.name,
      description,
    },
  }
}

export default async function PlaceDetailPage({ params }: PageProps) {
  const { id } = await params
  const { place, places } = await getPlaceDetailData(id)

  if (!place) notFound()

  const t = await getTranslations('common')
  const tDetail = await getTranslations('detail')
  const kakaoUrl = buildKakaoMapUrl(place)
  const categoryLabel = CATEGORY_LABEL[place.category] ?? place.category
  const placeUrl = `${BASE_URL}/place/${id}`
  const heroPlaceholder = CATEGORY_HERO[place.category]
  const nearby = nearbyPlacesFor(place, places)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'TouristAttraction',
    name: place.name,
    description: place.description ?? undefined,
    isAccessibleForFree: place.isFree,
    ...(place.address && {
      address: {
        '@type': 'PostalAddress',
        streetAddress: place.address,
        addressLocality: place.district,
        addressCountry: 'KR',
      },
    }),
    ...(place.phone && { telephone: place.phone }),
    ...(place.homepageUrl && { url: place.homepageUrl }),
    ...(place.imageUrl && { image: place.imageUrl }),
    ...(place.latitude && place.longitude && {
      geo: {
        '@type': 'GeoCoordinates',
        latitude: place.latitude,
        longitude: place.longitude,
      },
    }),
  }

  return (
    <main id="main-content" className="min-h-screen bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <RecentTracker placeId={place.id} place={place} />

      <div className="max-w-2xl mx-auto">

        {/* 뒤로 가기 */}
        <div className="px-4 pt-4 pb-2">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('backToList')}
          </Link>
        </div>

        {/* 히어로 이미지 */}
        <div className="relative h-52 overflow-hidden">
          <PlaceImage
            src={place.imageUrl}
            alt={place.name}
            category={place.category}
            sizes="(max-width: 672px) 100vw, 672px"
            priority
            iconSize="hero"
          />
        </div>

        {/* 본문 */}
        <div className="px-4 py-4">

          {/* 헤더: 이름 + 공유/북마크 */}
          <div className="flex items-start justify-between gap-3 mb-2">
            <div>
              <h1 className="text-xl font-bold text-foreground leading-tight">{place.name}</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {categoryLabel}{place.district ? ` · ${place.district}` : ''}
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0 pt-0.5">
              <ShareButton
                title={place.name}
                text={`${place.name} — Seoul 30에서 확인한 30분 생활권 장소`}
                url={placeUrl}
              />
              <BookmarkButton placeId={place.id} place={place} />
            </div>
          </div>

          {/* 무료 여부 배지 */}
          <span className={cn(
            'inline-block text-xs font-medium px-2.5 py-1 rounded-full mb-4',
            place.isFree ? 'bg-accent text-accent-foreground' : 'bg-secondary text-secondary-foreground',
          )}>
            {place.isFree ? t('free') : (place.feeText ?? t('paid'))}
          </span>

          {/* 태그 칩 */}
          {place.tags && place.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {place.tags.map((tag) => {
                const cfg = TAG_CONFIG[tag]
                return (
                  <span
                    key={tag}
                    className={cn(
                      'inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border',
                      cfg.className,
                    )}
                  >
                    {cfg.icon}
                    {tDetail(`tags.${tag}` as Parameters<typeof tDetail>[0])}
                  </span>
                )
              })}
            </div>
          )}

          {/* 설명 */}
          {place.description && (
            <p className="text-sm text-foreground leading-relaxed mb-6">{place.description}</p>
          )}

          {/* 상세 정보 카드 */}
          <div className="bg-card border border-border rounded-2xl divide-y divide-border mb-6">
            {place.address && (
              <div className="flex items-start gap-3 px-4 py-3">
                <MapPin className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" aria-hidden="true" />
                <span className="text-sm text-foreground">{place.address}</span>
              </div>
            )}
            {(place.openTimeText || place.closeTimeText) && (
              <div className="flex items-center gap-3 px-4 py-3">
                <Clock className="w-4 h-4 text-muted-foreground shrink-0" aria-hidden="true" />
                <span className="text-sm text-foreground">
                  {place.openTimeText ?? '?'} – {place.closeTimeText ?? '?'}
                </span>
              </div>
            )}
            {place.nearestStation ? (
              <div className="flex items-center gap-3 px-4 py-3">
                <Train className="w-4 h-4 text-muted-foreground shrink-0" aria-hidden="true" />
                <div>
                  <p className="text-[10px] text-muted-foreground mb-0.5">{tDetail('nearestStation')}</p>
                  <p className="text-sm text-foreground">{place.nearestStation}</p>
                </div>
              </div>
            ) : place.latitude && place.longitude ? (
              <div className="flex items-center gap-3 px-4 py-3">
                <Train className="w-4 h-4 text-muted-foreground shrink-0" aria-hidden="true" />
                <span className="text-sm text-muted-foreground">{t('detailTransitAccess')}</span>
              </div>
            ) : null}
            {place.phone && (
              <div className="flex items-center gap-3 px-4 py-3">
                <Phone className="w-4 h-4 text-muted-foreground shrink-0" aria-hidden="true" />
                <a href={`tel:${place.phone}`} className="text-sm text-primary hover:underline">
                  {place.phone}
                </a>
              </div>
            )}
            {place.homepageUrl && (
              <div className="flex items-center gap-3 px-4 py-3">
                <Globe className="w-4 h-4 text-muted-foreground shrink-0" aria-hidden="true" />
                <a
                  href={place.homepageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline truncate"
                >
                  {t('detailHomepage')}
                </a>
              </div>
            )}
          </div>

          {/* 미니 지도 */}
          {place.latitude && place.longitude && (
            <PlaceMiniMap lat={place.latitude} lng={place.longitude} name={place.name} />
          )}

          {nearby.length > 0 && (
            <section className="mb-6" aria-labelledby="nearby-places-title">
              <div className="flex items-center justify-between gap-3 mb-3">
                <h2 id="nearby-places-title" className="text-sm font-bold text-foreground">
                  {tDetail('nearbyPlaces')}
                </h2>
                <p className="text-[11px] text-muted-foreground">{tDetail('nearbyPinNote')}</p>
              </div>
              <div className="flex flex-col gap-3">
                {nearby.map(({ place: nearbyPlace, distanceKm }) => (
                  <div key={nearbyPlace.id}>
                    <PlaceCard place={nearbyPlace} />
                    <p className="mt-1 text-[11px] text-muted-foreground text-right">
                      {tDetail('nearbyDistance', { distance: distanceKm.toFixed(1) })}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 평가 */}
          <FeedbackPanel placeId={place.id} />

          {/* 길찾기 버튼 */}
          {kakaoUrl && (
            <a
              href={kakaoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full bg-primary text-primary-foreground rounded-xl py-3 text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              {t('directions')}
              <ExternalLink className="w-4 h-4" aria-hidden="true" />
            </a>
          )}
        </div>
      </div>
    </main>
  )
}
