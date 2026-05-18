'use client'

import { useState } from 'react'
import Image from 'next/image'
import {
  Bookmark,
  Train,
  Bus,
  Footprints,
  Sun,
  CloudSun,
  Cloud,
  CloudRain,
  Car,
  Wind,
  ChevronRight,
  Users,
  Diamond,
} from 'lucide-react'
import type { Place } from '@/lib/data'
import { cn } from '@/lib/utils'

interface PlaceCardProps {
  place: Place
}

const CROWD_STYLES: Record<Place['crowd'], string> = {
  여유로움: 'bg-accent text-accent-foreground',
  보통: 'bg-[oklch(0.93_0.06_80)] text-[oklch(0.55_0.12_60)]',
  혼잡: 'bg-red-50 text-red-600',
}

const WEATHER_ICON: Record<Place['weatherIcon'], React.ElementType> = {
  sun: Sun,
  'cloud-sun': CloudSun,
  cloud: Cloud,
  rain: CloudRain,
}

const TRANSPORT_ICON: Record<Place['transitMode'], React.ElementType> = {
  subway: Train,
  bus: Bus,
  walk: Footprints,
}

const TRAFFIC_COLOR: Record<Place['traffic'], string> = {
  원활: 'text-[oklch(0.42_0.1_172)]',
  서행: 'text-[oklch(0.55_0.12_60)]',
  정체: 'text-red-500',
}

const AIR_DOT: Record<Place['airQualityColor'], string> = {
  green: 'bg-[oklch(0.55_0.12_172)]',
  yellow: 'bg-yellow-400',
  red: 'bg-red-400',
}

export function PlaceCard({ place }: PlaceCardProps) {
  const [bookmarked, setBookmarked] = useState(place.isBookmarked)
  const WeatherIcon = WEATHER_ICON[place.weatherIcon]
  const TransportIcon = TRANSPORT_ICON[place.transitMode]

  return (
    <article className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden hover:shadow-md transition-shadow">
      <div className="flex gap-0">
        {/* Image */}
        <div className="relative w-[130px] shrink-0 self-stretch min-h-[130px]">
          <Image
            src={place.imageUrl}
            alt={place.name}
            fill
            className="object-cover"
            sizes="130px"
          />
        </div>

        {/* Content */}
        <div className="flex-1 p-3.5 flex flex-col gap-2.5 min-w-0">
          {/* Top row: title + bookmark */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h2 className="text-[15px] font-bold text-foreground leading-tight truncate">
                {place.name}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {place.category} &middot; {place.subcategory}
              </p>
            </div>
            <button
              onClick={() => setBookmarked((v) => !v)}
              aria-label={bookmarked ? '저장 취소' : '저장'}
              aria-pressed={bookmarked}
              className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg hover:bg-muted transition-colors"
            >
              <Bookmark
                className={cn('w-4 h-4 transition-colors', bookmarked ? 'fill-primary text-primary' : 'text-muted-foreground')}
                aria-hidden="true"
              />
            </button>
          </div>

          {/* Badges: crowd + free */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={cn('flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-full', CROWD_STYLES[place.crowd])}>
              <Users className="w-3 h-3" aria-hidden="true" />
              {place.crowd}
            </span>
            <span className={cn(
              'flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-full',
              place.isFree ? 'bg-accent text-accent-foreground' : 'bg-secondary text-secondary-foreground'
            )}>
              <Diamond className="w-3 h-3" aria-hidden="true" />
              {place.isFree ? '무료 이용' : '유료'}
            </span>
          </div>

          {/* Transit time */}
          <div className="flex items-center gap-1.5">
            <TransportIcon className="w-3.5 h-3.5 text-primary shrink-0" aria-hidden="true" />
            <span className="text-sm font-bold text-foreground">{place.transitMinutes}분</span>
            <span className="text-xs text-muted-foreground truncate">{place.transitBreakdown}</span>
          </div>

          {/* Weather / traffic / air quality */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1">
              <WeatherIcon className="w-3.5 h-3.5 text-yellow-500" aria-hidden="true" />
              <span>{place.tempCelsius}°C</span>
            </span>
            <span className="text-border" aria-hidden="true">|</span>
            <span className="flex items-center gap-1">
              <Car className="w-3.5 h-3.5" aria-hidden="true" />
              <span className={cn('font-medium', TRAFFIC_COLOR[place.traffic])}>{place.traffic}</span>
            </span>
            <span className="text-border" aria-hidden="true">|</span>
            <span className="flex items-center gap-1.5">
              <span className={cn('inline-block w-2 h-2 rounded-full', AIR_DOT[place.airQualityColor])} aria-hidden="true" />
              <span>미세먼지 {place.airQuality}</span>
            </span>
          </div>
        </div>
      </div>

      {/* CTA footer */}
      <div className="border-t border-border px-4 py-2.5">
        <button
          className="w-full flex items-center justify-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
          aria-label={`${place.name} 상세 보기`}
        >
          상세 보기
          <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
        </button>
      </div>
    </article>
  )
}
