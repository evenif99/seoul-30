'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Train, Bus, Footprints, MapPin, Clock, ChevronRight } from 'lucide-react'
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

const CATEGORY_LABEL: Record<string, string> = {
  culture: '문화/전시',
  library: '도서관',
  park: '공원',
  sports: '스포츠',
  welfare: '복지시설',
}

const PLACEHOLDER = 'https://images.unsplash.com/photo-1519331379826-f10be5486c6f?w=400&h=280&fit=crop&auto=format'

export function PlaceCard({ place, score, priority = false }: PlaceCardProps) {
  const categoryLabel = CATEGORY_LABEL[place.category] ?? place.category

  return (
    <Link
      href={`/place/${place.id}`}
      className="block bg-card rounded-2xl shadow-sm border border-border overflow-hidden hover:shadow-md transition-shadow"
      aria-label={`${place.name} 상세 보기`}
    >
      <article>
        <div className="flex gap-0">
          {/* 이미지 */}
          <div className="relative w-[130px] shrink-0 self-stretch min-h-[130px]">
            <Image
              src={place.imageUrl ?? PLACEHOLDER}
              alt={place.name}
              fill
              className="object-cover"
              sizes="130px"
              priority={priority}
              loading={priority ? 'eager' : 'lazy'}
            />
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
                {place.isFree ? '무료' : (place.feeText ?? '유료')}
              </span>
              {score && (
                <ScoreBadge score={score} />
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
            상세 보기
            <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
          </span>
        </div>
      </article>
    </Link>
  )
}
