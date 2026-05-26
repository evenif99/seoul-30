'use client'

import { Bookmark } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useBookmark } from '@/hooks/use-bookmark'
import { cn } from '@/lib/utils'
import type { NormalizedPlace } from '@/lib/types/place'

interface BookmarkButtonProps {
  placeId: string
  place?: NormalizedPlace
  className?: string
}

export function BookmarkButton({ placeId, place, className }: BookmarkButtonProps) {
  const t = useTranslations('bookmark')
  const { isBookmarked, toggle } = useBookmark()
  const active = isBookmarked(placeId)

  return (
    <button
      data-testid={`bookmark-button-${placeId}`}
      onClick={(e) => {
        e.preventDefault()
        toggle(placeId, place)
      }}
      aria-label={active ? t('remove') : t('save')}
      aria-pressed={active}
      className={cn(
        'w-7 h-7 flex items-center justify-center rounded-lg hover:bg-muted transition-colors shrink-0',
        className,
      )}
    >
      <Bookmark
        className={cn(
          'w-4 h-4 transition-colors',
          active ? 'fill-primary text-primary' : 'text-muted-foreground',
        )}
        aria-hidden="true"
      />
    </button>
  )
}
