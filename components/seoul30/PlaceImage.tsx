'use client'

import { useState } from 'react'
import Image from 'next/image'
import { BookOpen, Dumbbell, Heart, Landmark, Trees } from 'lucide-react'
import { cn } from '@/lib/utils'

const CATEGORY_PLACEHOLDER: Record<string, { bg: string; icon: React.ReactNode }> = {
  culture: { bg: 'bg-purple-100', icon: <Landmark className="h-10 w-10 text-purple-400" /> },
  library: { bg: 'bg-amber-100', icon: <BookOpen className="h-10 w-10 text-amber-400" /> },
  park: { bg: 'bg-green-100', icon: <Trees className="h-10 w-10 text-green-400" /> },
  sports: { bg: 'bg-blue-100', icon: <Dumbbell className="h-10 w-10 text-blue-400" /> },
  welfare: { bg: 'bg-rose-100', icon: <Heart className="h-10 w-10 text-rose-400" /> },
}

interface PlaceImageProps {
  src?: string
  alt: string
  category: string
  sizes: string
  priority?: boolean
  iconSize?: 'card' | 'hero'
}

export function PlaceImage({ src, alt, category, sizes, priority = false, iconSize = 'card' }: PlaceImageProps) {
  const [failed, setFailed] = useState(false)
  const placeholder = CATEGORY_PLACEHOLDER[category]

  if (src && !failed) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover"
        sizes={sizes}
        priority={priority}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : undefined}
        onError={() => setFailed(true)}
      />
    )
  }

  return (
    <div
      aria-hidden="true"
      data-testid="place-image-fallback"
      className={cn(
        'flex h-full w-full items-center justify-center',
        placeholder?.bg ?? 'bg-muted',
        iconSize === 'hero' && '[&>svg]:h-16 [&>svg]:w-16 [&>svg]:opacity-80',
      )}
    >
      {placeholder?.icon}
    </div>
  )
}
