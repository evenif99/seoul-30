'use client'

import dynamic from 'next/dynamic'
import type { RecommendationResult } from '@/lib/types/recommendation'

// SSR 비활성화 — Leaflet은 window 객체 필요
const MapViewInner = dynamic(() => import('./MapViewInner'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-[60vh] text-sm text-muted-foreground px-4">
      지도 불러오는 중...
    </div>
  ),
})

interface MapViewProps {
  results: RecommendationResult[]
}

export function MapView({ results }: MapViewProps) {
  return <MapViewInner results={results} />
}
