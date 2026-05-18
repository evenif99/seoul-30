'use client'

import 'leaflet/dist/leaflet.css'
import { useEffect, useState, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet'
import L from 'leaflet'
import Link from 'next/link'
import { X } from 'lucide-react'
import type { NormalizedPlace } from '@/lib/types/place'
import type { RecommendationResult } from '@/lib/types/recommendation'

// Seoul 30 브랜드 컬러 원형 마커 (PNG 경로 문제 회피)
const brandMarker = L.divIcon({
  className: '',
  html: '<div style="width:14px;height:14px;background:#1A6B5A;border:2.5px solid white;border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,0.35)"></div>',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
})

const selectedMarker = L.divIcon({
  className: '',
  html: '<div style="width:18px;height:18px;background:#0F4035;border:2.5px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.4)"></div>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
})

type PlaceWithCoords = NormalizedPlace & { latitude: number; longitude: number }

interface Props {
  results: RecommendationResult[]
}

function BoundsController({ places }: { places: PlaceWithCoords[] }) {
  const map = useMap()

  useEffect(() => {
    if (places.length === 0) return
    if (places.length === 1) {
      map.setView([places[0].latitude, places[0].longitude], 14)
      return
    }
    const bounds = L.latLngBounds(
      places.map((p) => [p.latitude, p.longitude] as [number, number])
    )
    map.fitBounds(bounds, { padding: [50, 50] })
  }, [places, map])

  return null
}

export default function MapViewInner({ results }: Props) {
  const [selected, setSelected] = useState<NormalizedPlace | null>(null)

  const places = useMemo<PlaceWithCoords[]>(
    () =>
      results
        .map((r) => r.place)
        .filter((p): p is PlaceWithCoords => p.latitude != null && p.longitude != null),
    [results]
  )

  const center: [number, number] = useMemo(() => {
    if (places.length === 0) return [37.5665, 126.978]
    const lat = places.reduce((s, p) => s + p.latitude, 0) / places.length
    const lng = places.reduce((s, p) => s + p.longitude, 0) / places.length
    return [lat, lng]
  }, [places])

  const noCoordCount = results.filter((r) => r.place.latitude == null).length

  return (
    <div className="relative px-4">
      <MapContainer
        center={center}
        zoom={11}
        style={{
          height: '60vh',
          borderRadius: '0.75rem',
          border: '1px solid var(--border)',
        }}
        className="w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {places.map((place) => (
          <Marker
            key={place.id}
            position={[place.latitude, place.longitude]}
            icon={selected?.id === place.id ? selectedMarker : brandMarker}
            eventHandlers={{ click: () => setSelected(place) }}
          />
        ))}

        <BoundsController places={places} />
      </MapContainer>

      {/* 장소 선택 팝업 */}
      {selected && (
        <div
          className="absolute bottom-6 left-8 right-8 bg-card border border-border rounded-2xl shadow-xl p-4 flex items-center gap-3"
          style={{ zIndex: 9999 }}
        >
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm text-foreground truncate">{selected.name}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {selected.district}
              {selected.isFree
                ? ' · 무료'
                : selected.feeText
                ? ` · ${selected.feeText}`
                : ' · 유료'}
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

      {noCoordCount > 0 && (
        <p className="mt-2 text-[11px] text-muted-foreground text-center">
          일부 장소는 좌표 정보가 없어 지도에 표시되지 않습니다
        </p>
      )}
    </div>
  )
}
