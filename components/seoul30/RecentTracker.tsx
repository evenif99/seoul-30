'use client'

import { useEffect } from 'react'
import { useRecent } from '@/hooks/use-recent'

export function RecentTracker({ placeId }: { placeId: string }) {
  const { push } = useRecent()
  useEffect(() => { push(placeId) }, [placeId, push])
  return null
}
