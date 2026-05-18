'use client'

import Script from 'next/script'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import type { NormalizedPlace } from '@/lib/types/place'
import type { RecommendationResult } from '@/lib/types/recommendation'

// Kakao Maps SDK attaches to window.kakao — no @types package available
declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    kakao: any
  }
}

interface MapViewProps {
  results: RecommendationResult[]
}

const SEOUL_CENTER = { lat: 37.5665, lng: 126.9780 }

export function MapView({ results }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInstanceRef = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markersRef = useRef<any[]>([])
  const [sdkReady, setSdkReady] = useState(false)
  const [selected, setSelected] = useState<NormalizedPlace | null>(null)

  const apiKey = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY

  // Handle case where SDK is already loaded (component remount / HMR)
  useEffect(() => {
    if (window.kakao?.maps?.Map) setSdkReady(true)
  }, [])

  // Initialize map + markers whenever SDK is ready or results change
  useEffect(() => {
    if (!sdkReady || !mapRef.current) return

    const { kakao } = window
    const places = results
      .map((r) => r.place)
      .filter((p): p is NormalizedPlace & { latitude: number; longitude: number } =>
        p.latitude != null && p.longitude != null
      )

    if (!mapInstanceRef.current) {
      mapInstanceRef.current = new kakao.maps.Map(mapRef.current, {
        center: new kakao.maps.LatLng(SEOUL_CENTER.lat, SEOUL_CENTER.lng),
        level: 8,
      })
    }

    const map = mapInstanceRef.current

    // Clear previous markers
    markersRef.current.forEach((m) => m.setMap(null))
    markersRef.current = []

    if (places.length === 0) return

    const bounds = new kakao.maps.LatLngBounds()

    places.forEach((place) => {
      const position = new kakao.maps.LatLng(place.latitude, place.longitude)
      bounds.extend(position)

      const marker = new kakao.maps.Marker({ map, position, title: place.name })
      kakao.maps.event.addListener(marker, 'click', () => setSelected(place))
      markersRef.current.push(marker)
    })

    if (places.length > 1) {
      map.setBounds(bounds, 60)
    } else {
      map.setCenter(new kakao.maps.LatLng(places[0].latitude, places[0].longitude))
      map.setLevel(5)
    }
  }, [sdkReady, results])

  if (!apiKey) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 h-[60vh] text-center px-8">
        <p className="text-sm font-medium text-foreground">지도를 표시하려면 Kakao Maps 키가 필요합니다</p>
        <p className="text-xs text-muted-foreground">
          <code className="bg-muted px-1.5 py-0.5 rounded">NEXT_PUBLIC_KAKAO_MAP_KEY</code> 환경변수를 설정해 주세요
        </p>
      </div>
    )
  }

  return (
    <div className="relative px-4">
      <Script
        src={`//dapi.kakao.com/v2/maps/sdk.js?appkey=${apiKey}&autoload=false`}
        strategy="afterInteractive"
        onLoad={() => window.kakao.maps.load(() => setSdkReady(true))}
      />

      <div
        ref={mapRef}
        className="w-full rounded-xl overflow-hidden border border-border"
        style={{ height: '60vh' }}
      />

      {/* 장소 선택 팝업 */}
      {selected && (
        <div className="absolute bottom-6 left-8 right-8 bg-card border border-border rounded-2xl shadow-xl p-4 flex items-center gap-3 z-10">
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm text-foreground truncate">{selected.name}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {selected.district}
              {selected.isFree ? ' · 무료' : selected.feeText ? ` · ${selected.feeText}` : ' · 유료'}
            </p>
          </div>
          <Link
            href={`/place/${selected.id}`}
            className="shrink-0 text-xs font-medium text-primary-foreground bg-primary px-3 py-1.5 rounded-full hover:bg-primary/90 transition-colors"
          >
            상세 보기
          </Link>
          <button
            onClick={() => setSelected(null)}
            className="shrink-0 text-muted-foreground hover:text-foreground"
            aria-label="닫기"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 좌표 없는 장소 안내 */}
      {sdkReady && results.filter((r) => r.place.latitude == null).length > 0 && (
        <p className="mt-2 text-[11px] text-muted-foreground text-center">
          일부 장소는 좌표 정보가 없어 지도에 표시되지 않습니다
        </p>
      )}
    </div>
  )
}
