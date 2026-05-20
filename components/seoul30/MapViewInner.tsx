'use client'

import { useEffect, useRef, useState, useMemo } from 'react'
import Link from 'next/link'
import { X, Layers, LocateFixed } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { NormalizedPlace } from '@/lib/types/place'
import type { RecommendationResult } from '@/lib/types/recommendation'

type PlaceWithCoords = NormalizedPlace & { latitude: number; longitude: number }

interface Props {
  results: RecommendationResult[]
}

interface Cluster {
  places: PlaceWithCoords[]
  lat: number
  lng: number
}

function buildClusters(places: PlaceWithCoords[], zoom: number): Cluster[] {
  const step = zoom < 12 ? 0.025 : zoom < 14 ? 0.01 : 0
  if (step === 0) {
    return places.map((p) => ({ places: [p], lat: p.latitude, lng: p.longitude }))
  }
  const grid = new Map<string, PlaceWithCoords[]>()
  for (const p of places) {
    const key = `${Math.floor(p.latitude / step)},${Math.floor(p.longitude / step)}`
    const bucket = grid.get(key) ?? []
    bucket.push(p)
    grid.set(key, bucket)
  }
  return Array.from(grid.values()).map((group) => ({
    places: group,
    lat: group.reduce((s, p) => s + p.latitude, 0) / group.length,
    lng: group.reduce((s, p) => s + p.longitude, 0) / group.length,
  }))
}

function clusterIcon(count: number): naver.maps.MarkerIcon {
  const isGroup = count > 1
  const size = isGroup ? 36 : 14
  const html = isGroup
    ? `<div style="width:36px;height:36px;background:#1A6B5A;border:2.5px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;color:white;font-size:12px;font-weight:700;cursor:pointer;">${count}</div>`
    : `<div style="width:14px;height:14px;background:#1A6B5A;border:2.5px solid white;border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,0.35);cursor:pointer;"></div>`
  return {
    content: html,
    size: new naver.maps.Size(size, size),
    anchor: new naver.maps.Point(size / 2, size / 2),
  }
}

function selectedIcon(): naver.maps.MarkerIcon {
  return {
    content: `<div style="width:18px;height:18px;background:#0F4035;border:2.5px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.4);cursor:pointer;"></div>`,
    size: new naver.maps.Size(18, 18),
    anchor: new naver.maps.Point(9, 9),
  }
}

export function MapViewInner({ results }: Props) {
  const t = useTranslations('common')
  const mapDivRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<naver.maps.Map | null>(null)
  const markersRef = useRef<naver.maps.Marker[]>([])
  const placesRef = useRef<PlaceWithCoords[]>([])
  const selectedRef = useRef<NormalizedPlace | null>(null)
  const [selected, setSelected] = useState<NormalizedPlace | null>(null)
  const [isHybrid, setIsHybrid] = useState(false)

  const places = useMemo<PlaceWithCoords[]>(
    () =>
      results
        .map((r) => r.place)
        .filter((p): p is PlaceWithCoords => p.latitude != null && p.longitude != null),
    [results],
  )

  const noCoordCount = results.filter((r) => r.place.latitude == null).length

  function rebuildMarkers(map: naver.maps.Map, currentPlaces: PlaceWithCoords[]) {
    markersRef.current.forEach((m) => { try { m.setMap(null) } catch {} })
    markersRef.current = []

    const zoom = map.getZoom()
    const clusters = buildClusters(currentPlaces, zoom)

    clusters.forEach((cluster) => {
      const isGroup = cluster.places.length > 1
      const marker = new naver.maps.Marker({
        position: new naver.maps.LatLng(cluster.lat, cluster.lng),
        map,
        icon: clusterIcon(cluster.places.length),
        zIndex: isGroup ? 100 : 50,
      })

      marker.addListener('click', () => {
        if (isGroup) {
          map.setCenter(new naver.maps.LatLng(cluster.lat, cluster.lng))
          map.setZoom(map.getZoom() + 2, true)
        } else {
          const place = cluster.places[0]
          selectedRef.current = place
          setSelected(place)
          // Highlight selected marker
          marker.setIcon(selectedIcon())
          // Reset others
          markersRef.current.forEach((m) => {
            if (m !== marker) m.setIcon(clusterIcon(1))
          })
        }
      })

      markersRef.current.push(marker)
    })
  }

  // Initialize map on mount
  useEffect(() => {
    if (!mapDivRef.current || !window.naver?.maps) return

    const initialCenter = placesRef.current.length > 0
      ? { lat: placesRef.current.reduce((s, p) => s + p.latitude, 0) / placesRef.current.length, lng: placesRef.current.reduce((s, p) => s + p.longitude, 0) / placesRef.current.length }
      : { lat: 37.5665, lng: 126.978 }

    const map = new naver.maps.Map(mapDivRef.current, {
      center: new naver.maps.LatLng(initialCenter.lat, initialCenter.lng),
      zoom: 11,
      scaleControl: false,
      logoControl: true,
      mapDataControl: false,
      zoomControl: true,
    })
    mapRef.current = map

    naver.maps.Event.addListener(map, 'zoom_changed', () => {
      rebuildMarkers(map, placesRef.current)
    })

    return () => {
      map.destroy()
      mapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Update markers when places change
  useEffect(() => {
    placesRef.current = places
    const map = mapRef.current
    if (!map) return

    rebuildMarkers(map, places)

    if (places.length === 1) {
      map.setCenter(new naver.maps.LatLng(places[0].latitude, places[0].longitude))
      map.setZoom(14, true)
    } else if (places.length > 1) {
      const lats = places.map((p) => p.latitude)
      const lngs = places.map((p) => p.longitude)
      map.fitBounds(
        new naver.maps.LatLngBounds(
          new naver.maps.LatLng(Math.min(...lats), Math.min(...lngs)),
          new naver.maps.LatLng(Math.max(...lats), Math.max(...lngs)),
        ),
        { top: 60, right: 60, bottom: 60, left: 60 },
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [places])

  // Satellite / hybrid toggle
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    map.setMapTypeId(isHybrid ? naver.maps.MapTypeId.HYBRID : naver.maps.MapTypeId.NORMAL)
  }, [isHybrid])

  function handleCurrentLocation() {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition((pos) => {
      const map = mapRef.current
      if (!map) return
      map.setCenter(new naver.maps.LatLng(pos.coords.latitude, pos.coords.longitude))
      map.setZoom(15, true)
    })
  }

  return (
    <div className="relative px-4">
      <div
        ref={mapDivRef}
        style={{ height: '60vh', borderRadius: '0.75rem', border: '1px solid var(--border)' }}
        className="w-full"
      />

      {/* Satellite toggle + current location */}
      <div className="absolute top-3 right-7 flex flex-col gap-2" style={{ zIndex: 200 }}>
        <button
          onClick={() => setIsHybrid((h) => !h)}
          className={`w-9 h-9 rounded-full flex items-center justify-center shadow-md border transition-colors ${
            isHybrid
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-card text-foreground border-border hover:bg-accent'
          }`}
          aria-label={isHybrid ? t('mapNormal') : t('mapSatellite')}
          title={isHybrid ? t('mapNormal') : t('mapSatellite')}
        >
          <Layers className="w-4 h-4" />
        </button>
        <button
          onClick={handleCurrentLocation}
          className="w-9 h-9 rounded-full flex items-center justify-center shadow-md border bg-card text-foreground border-border hover:bg-accent transition-colors"
          aria-label={t('mapMyLocation')}
          title={t('mapMyLocation')}
        >
          <LocateFixed className="w-4 h-4" />
        </button>
      </div>

      {/* Selected place popup */}
      {selected && (
        <div
          className="absolute bottom-6 left-8 right-8 bg-card border border-border rounded-2xl shadow-xl p-4 flex items-center gap-3"
          style={{ zIndex: 200 }}
        >
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm text-foreground truncate">{selected.name}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {selected.district}
              {selected.isFree
                ? ` · ${t('free')}`
                : selected.feeText
                  ? ` · ${selected.feeText}`
                  : ` · ${t('paid')}`}
            </p>
          </div>
          <Link
            href={`/place/${selected.id}`}
            className="shrink-0 text-xs font-medium text-primary-foreground bg-primary px-3 py-1.5 rounded-full hover:bg-primary/90 transition-colors"
          >
            {t('viewDetail')}
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
        <p className="mt-2 text-[11px] text-muted-foreground text-center">{t('noCoords')}</p>
      )}
    </div>
  )
}
