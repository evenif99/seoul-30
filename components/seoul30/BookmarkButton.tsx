'use client'

import { Bookmark } from 'lucide-react'
import { useBookmark } from '@/hooks/use-bookmark'
import { cn } from '@/lib/utils'

interface BookmarkButtonProps {
  placeId: string
  className?: string
}

export function BookmarkButton({ placeId, className }: BookmarkButtonProps) {
  const { isBookmarked, toggle } = useBookmark()
  const active = isBookmarked(placeId)

  return (
    <button
      onClick={(e) => {
        e.preventDefault()
        toggle(placeId)
      }}
      aria-label={active ? '북마크 취소' : '북마크 저장'}
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
