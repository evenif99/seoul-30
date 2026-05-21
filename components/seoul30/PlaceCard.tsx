'use client'

import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Clock, ChevronRight, BookOpen, Trees, Dumbbell, Heart, Landmark } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { BookmarkButton } from '@/components/seoul30/BookmarkButton'
import { ScoreBadge } from '@/components/seoul30/ScoreBadge'
import type { NormalizedPlace } from '@/lib/types/place'
import type { ScoreBreakdown } from '@/lib/types/recommendation'
import { cn } from '@/lib/utils'

interface PlaceCardProps {
  place: NormalizedPlace
  score?: ScoreBreakdown
  priority?: boolean
}

const KNOWN_CATEGORIES = new Set(['culture', 'library', 'park', 'sports', 'welfare'])

const CATEGORY_PLACEHOLDER: Record<string, { bg: string; icon: React.ReactNode }> = {
  culture:  { bg: 'bg-purple-100',  icon: <Landmark className="w-10 h-10 text-purple-400" /> },
  library:  { bg: 'bg-amber-100',   icon: <BookOpen  className="w-10 h-10 text-amber-400" /> },
  park:     { bg: 'bg-green-100',   icon: <Trees     className="w-10 h-10 text-green-400" /> },
  sports:   { bg: 'bg-blue-100',    icon: <Dumbbell  className="w-10 h-10 text-blue-400" /> },
  welfare:  { bg: 'bg-rose-100',    icon: <Heart     className="w-10 h-10 text-rose-400" /> },
}
const TRANSIT_MODE_KEYS: Record<NonNullable<ScoreBreakdown['transitMode']>, string> = {
  도보: 'walk',
  따릉이: 'bike',
  버스: 'bus',
  지하철: 'subway',
}

export function PlaceCard({ place, score, priority = false }: PlaceCardProps) {
  const t = useTranslations('place')
  const tCommon = useTranslations('common')
  const tTransit = useTranslations('transit')

  const categoryLabel = KNOWN_CATEGORIES.has(place.category)
    ? t(`category.${place.category}` as Parameters<typeof t>[0])
    : place.category

  return (
    <Link
      href={`/place/${place.id}`}
      data-testid="place-card-link"
      className="block bg-card rounded-2xl shadow-sm border border-border overflow-hidden hover:shadow-md transition-shadow"
      aria-label={t('ariaLabel', { name: place.name })}
    >
      <article>
        <div className="flex gap-0">
          {/* 이미지 */}
          <div className="relative w-[130px] shrink-0 self-stretch min-h-[130px]">
            {place.imageUrl ? (
              <Image
                src={place.imageUrl}
                alt={place.name}
                fill
                className="object-cover"
                sizes="130px"
                priority={priority}
                loading={priority ? 'eager' : 'lazy'}
              />
            ) : (
              <div
                aria-hidden="true"
                className={cn(
                  'w-full h-full flex items-center justify-center',
                  CATEGORY_PLACEHOLDER[place.category]?.bg ?? 'bg-muted',
                )}
              >
                {CATEGORY_PLACEHOLDER[place.category]?.icon}
              </div>
            )}
          </div>

          {/* 콘텐츠 */}
          <div className="flex-1 p-3.5 flex flex-col gap-2 min-w-0">
            {/* 제목 + 북마크 */}
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h2 className="text-[15px] font-bold text-foreground leading-tight truncate">
                  {place.name}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {categoryLabel}
                  {place.district ? ` · ${place.district}` : ''}
                </p>
              </div>
              <BookmarkButton placeId={place.id} />
            </div>

            {/* 뱃지: 무료 여부 + 추천 점수 */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className={cn(
                'text-[11px] font-medium px-2 py-1 rounded-full',
                place.isFree
                  ? 'bg-accent text-accent-foreground'
                  : 'bg-secondary text-secondary-foreground'
              )}>
                {place.isFree ? tCommon('free') : (place.feeText ?? tCommon('paid'))}
              </span>
              {score && (
                <ScoreBadge score={score} />
              )}
              {score?.transitMinutes != null && score.transitMode && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
                  {tTransit(TRANSIT_MODE_KEYS[score.transitMode] as Parameters<typeof tTransit>[0])} · {score.transitMinutes}분
                </span>
              )}
            </div>

            {/* 운영 시간 */}
            {(place.openTimeText || place.closeTimeText) && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="w-3 h-3 shrink-0" aria-hidden="true" />
                <span>
                  {place.openTimeText ?? '?'} – {place.closeTimeText ?? '?'}
                </span>
              </div>
            )}

            {/* 위치 */}
            {place.address && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <MapPin className="w-3 h-3 shrink-0" aria-hidden="true" />
                <span className="truncate">{place.address}</span>
              </div>
            )}
          </div>
        </div>

        {/* CTA */}
        <div className="border-t border-border px-4 py-2.5">
          <span className="w-full flex items-center justify-center gap-1 text-xs font-medium text-primary">
            {t('viewDetail')}
            <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
          </span>
        </div>
      </article>
    </Link>
  )
}
