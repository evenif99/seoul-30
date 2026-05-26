'use client'

import { useEffect } from 'react'
import { useRecent } from '@/hooks/use-recent'
import type { NormalizedPlace } from '@/lib/types/place'

interface Props {
  placeId: string
  place?: NormalizedPlace
}

export function RecentTracker({ placeId, place }: Props) {
  const { push } = useRecent()
  useEffect(() => { push(placeId, place) }, [placeId, place, push])
  return null
}
