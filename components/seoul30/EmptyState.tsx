import Link from 'next/link'
import { MapPin, ChevronRight } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { NormalizedPlace } from '@/lib/types/place'

interface EmptyStateProps {
  suggestions?: NormalizedPlace[]
}

export function EmptyState({ suggestions }: EmptyStateProps) {
  const t = useTranslations('empty')

  return (
    <div className="flex flex-col items-center py-12 px-4 text-center">
      <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center mb-3">
        <MapPin className="w-5 h-5 text-primary" aria-hidden="true" />
      </div>
      <p className="text-sm font-medium text-foreground">{t('title')}</p>
      <p className="text-xs text-muted-foreground mt-1">{t('subtitle')}</p>

      {suggestions && suggestions.length > 0 && (
        <div className="w-full mt-6 text-left">
          <p className="text-xs font-medium text-muted-foreground mb-2 text-center">{t('suggestions')}</p>
          <div className="flex flex-col gap-2">
            {suggestions.map((place) => (
              <Link
                key={place.id}
                href={`/place/${place.id}`}
                className="flex items-center justify-between bg-card border border-border rounded-xl px-4 py-3 hover:shadow-sm transition-shadow"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{place.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{place.district}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 ml-2" aria-hidden="true" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
