'use client'

import Script from 'next/script'
import { useState, useEffect } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import type { RecommendationResult } from '@/lib/types/recommendation'
import type { NormalizedPlace } from '@/lib/types/place'
import { MapViewInner } from './MapViewInner'

const CLIENT_ID = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID ?? ''

interface MapViewProps {
  results: RecommendationResult[]
  onSelectPlace?: (place: NormalizedPlace) => void
}

export function MapView({ results, onSelectPlace }: MapViewProps) {
  const t = useTranslations('common')
  const [mounted, setMounted] = useState(false)
  const [ready, setReady] = useState(false)
  const [loadFailed, setLoadFailed] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted || !CLIENT_ID) return
    if (window.naver?.maps) {
      setReady(true)
      return
    }

    const timeout = window.setTimeout(() => {
      if (!window.naver?.maps) setLoadFailed(true)
    }, 12000)

    return () => window.clearTimeout(timeout)
  }, [mounted])

  if (!CLIENT_ID) {
    return <MapFallback title={t('mapUnavailable')} body={t('mapMissingKey')} />
  }

  if (loadFailed) {
    return <MapFallback title={t('mapUnavailable')} body={t('mapLoadFailed')} canRetry />
  }

  return (
    <div className="relative">
      {mounted && (
        <Script
          id="naver-maps-sdk"
          src={`https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${CLIENT_ID}`}
          strategy="afterInteractive"
          onReady={() => {
            if (window.naver?.maps) {
              setReady(true)
              return
            }
            setLoadFailed(true)
          }}
          onLoad={() => {
            if (window.naver?.maps) setReady(true)
          }}
          onError={() => setLoadFailed(true)}
        />
      )}
      {mounted && ready ? (
        <ErrorBoundary fallback={<MapFallback title={t('mapUnavailable')} body={t('mapLoadFailed')} canRetry />}>
          <MapViewInner
            results={results}
            onSelectPlace={onSelectPlace}
            onMapError={() => setLoadFailed(true)}
          />
        </ErrorBoundary>
      ) : (
        <div className="flex items-center justify-center h-[60vh] text-sm text-muted-foreground px-4">
          {t('mapLoading')}
        </div>
      )}
    </div>
  )
}

function MapFallback({
  title,
  body,
  canRetry = false,
}: {
  title: string
  body: string
  canRetry?: boolean
}) {
  const t = useTranslations('common')

  return (
    <div
      className="mx-4 flex h-[60vh] flex-col items-center justify-center gap-3 rounded-lg border border-border bg-muted/30 px-6 text-center"
      role="status"
      data-testid="map-fallback"
    >
      <AlertTriangle className="h-6 w-6 text-amber-600" aria-hidden="true" />
      <div className="space-y-1">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{body}</p>
      </div>
      {canRetry && (
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-1 inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-muted"
        >
          <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
          {t('mapRetry')}
        </button>
      )}
    </div>
  )
}
