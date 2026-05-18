import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, MapPin, Clock, Phone, Globe, ExternalLink } from 'lucide-react'
import { MOCK_PLACES } from '@/lib/mock/places'
import { BookmarkButton } from '@/components/seoul30/BookmarkButton'
import { RecentTracker } from '@/components/seoul30/RecentTracker'
import { ShareButton } from '@/components/seoul30/ShareButton'
import { notFound } from 'next/navigation'

interface PageProps {
  params: Promise<{ id: string }>
}

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://seoul-30.vercel.app'

function getPlace(id: string) {
  return MOCK_PLACES.find((p) => p.id === id) ?? null
}

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

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const place = getPlace(id)
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
  const place = getPlace(id)

  if (!place) notFound()

  const kakaoUrl = buildKakaoMapUrl(place)
  const categoryLabel = CATEGORY_LABEL[place.category] ?? place.category
  const placeUrl = `${BASE_URL}/place/${id}`

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'TouristAttraction',
    name: place.name,
    description: place.description,
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
    ...(place.latitude && place.longitude && {
      geo: {
        '@type': 'GeoCoordinates',
        latitude: place.latitude,
        longitude: place.longitude,
      },
    }),
  }

  return (
    <div className="min-h-screen bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <RecentTracker placeId={place.id} />

      <div className="max-w-2xl mx-auto px-4 py-4">
        {/* 뒤로 가기 */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          목록으로
        </Link>

        {/* 헤더 */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h1 className="text-xl font-bold text-foreground leading-tight">{place.name}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {categoryLabel}{place.district ? ` · ${place.district}` : ''}
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <ShareButton
              title={place.name}
              text={`${place.name} — Seoul 30에서 확인한 30분 생활권 장소`}
              url={placeUrl}
            />
            <BookmarkButton placeId={place.id} />
          </div>
        </div>

        {/* 무료 여부 */}
        <span className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full mb-5 ${
          place.isFree ? 'bg-accent text-accent-foreground' : 'bg-secondary text-secondary-foreground'
        }`}>
          {place.isFree ? '무료 이용' : (place.feeText ?? '유료')}
        </span>

        {/* 설명 */}
        {place.description && (
          <p className="text-sm text-foreground leading-relaxed mb-6">{place.description}</p>
        )}

        {/* 상세 정보 */}
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
                홈페이지 방문
              </a>
            </div>
          )}
        </div>

        {/* 길찾기 버튼 */}
        {kakaoUrl && (
          <a
            href={kakaoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full bg-primary text-primary-foreground rounded-xl py-3 text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            카카오맵으로 길찾기
            <ExternalLink className="w-4 h-4" aria-hidden="true" />
          </a>
        )}
      </div>
    </div>
  )
}
