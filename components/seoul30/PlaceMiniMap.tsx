'use client'

import Script from 'next/script'
import { useEffect, useRef, useState } from 'react'

const CLIENT_ID = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID ?? ''

interface PlaceMiniMapProps {
  lat: number
  lng: number
  name: string
}

function markerIcon(): naver.maps.MarkerIcon {
  return {
    content: `<div style="width:14px;height:14px;background:#1A6B5A;border:2.5px solid white;border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,0.35);"></div>`,
    size: new naver.maps.Size(14, 14),
    anchor: new naver.maps.Point(7, 7),
  }
}

export function PlaceMiniMap({ lat, lng, name }: PlaceMiniMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<naver.maps.Map | null>(null)
  const markerRef = useRef<naver.maps.Marker | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (window.naver?.maps) setReady(true)
  }, [])

  useEffect(() => {
    if (!ready || !containerRef.current || !window.naver?.maps) return

    const center = new naver.maps.LatLng(lat, lng)
    const map = mapRef.current

    if (map) {
      map.setCenter(center)
      markerRef.current?.setMap(null)
      markerRef.current = new naver.maps.Marker({
        position: center,
        map,
        title: name,
        icon: markerIcon(),
      })
      return
    }

    const newMap = new naver.maps.Map(containerRef.current, {
      center,
      zoom: 15,
      scaleControl: false,
      mapDataControl: false,
    })

    markerRef.current = new naver.maps.Marker({
      position: center,
      map: newMap,
      title: name,
      icon: markerIcon(),
    })

    mapRef.current = newMap
  }, [ready, lat, lng, name])

  useEffect(() => {
    return () => {
      try {
        markerRef.current?.setMap(null)
        mapRef.current?.destroy()
      } catch {}
      markerRef.current = null
      mapRef.current = null
    }
  }, [])

  return (
    <div className="rounded-2xl overflow-hidden border border-border mb-6">
      <Script
        src={`https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${CLIENT_ID}`}
        strategy="afterInteractive"
        onLoad={() => setReady(true)}
        onReady={() => setReady(true)}
      />
      <div ref={containerRef} className="w-full h-48" aria-label={`${name} location map`} />
    </div>
  )
}
