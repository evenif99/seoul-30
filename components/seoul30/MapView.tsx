'use client'

import Script from 'next/script'
import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import type { RecommendationResult } from '@/lib/types/recommendation'
import { MapViewInner } from './MapViewInner'

const CLIENT_ID = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID ?? ''

interface MapViewProps {
  results: RecommendationResult[]
}

export function MapView({ results }: MapViewProps) {
  const t = useTranslations('common')
  const [mounted, setMounted] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className="relative">
      {mounted && (
        <Script
          src={`https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${CLIENT_ID}`}
          strategy="afterInteractive"
          onLoad={() => setReady(true)}
          onError={() => console.error('[NaverMaps] script load failed')}
        />
      )}
      {mounted && ready ? (
        <MapViewInner results={results} />
      ) : (
        <div className="flex items-center justify-center h-[60vh] text-sm text-muted-foreground px-4">
          {t('mapLoading')}
        </div>
      )}
    </div>
  )
}
