// Naver Maps JavaScript API v3 — minimal type declarations for Seoul 30
declare namespace naver {
  namespace maps {
    class Map {
      constructor(element: HTMLElement | string, options?: MapOptions)
      setMapTypeId(type: string): void
      setZoom(zoom: number, animate?: boolean): void
      getZoom(): number
      setCenter(latlng: LatLng): void
      fitBounds(bounds: LatLngBounds, options?: FitBoundsOptions): void
      panTo(latlng: LatLng): void
      destroy(): void
    }
    class LatLng {
      constructor(lat: number, lng: number)
      lat(): number
      lng(): number
    }
    class LatLngBounds {
      constructor(sw: LatLng, ne: LatLng)
      extend(latlng: LatLng): LatLngBounds
    }
    class Marker {
      constructor(options: MarkerOptions)
      setMap(map: Map | null): void
      setIcon(icon: MarkerIcon): void
      addListener(event: string, handler: (...args: unknown[]) => void): void
      getPosition(): LatLng
    }
    class Size {
      constructor(width: number, height: number)
    }
    class Point {
      constructor(x: number, y: number)
    }
    namespace Event {
      function addListener(
        target: object,
        event: string,
        handler: (...args: unknown[]) => void,
      ): unknown
      function removeListener(listener: unknown): void
    }
    namespace MapTypeId {
      const NORMAL: string
      const SATELLITE: string
      const HYBRID: string
      const TERRAIN: string
    }
    interface MapOptions {
      center?: LatLng
      zoom?: number
      mapTypeId?: string
      scaleControl?: boolean
      logoControl?: boolean
      mapDataControl?: boolean
      zoomControl?: boolean
      minZoom?: number
      maxZoom?: number
    }
    interface MarkerIcon {
      content: string
      size: Size
      anchor: Point
    }
    interface MarkerOptions {
      position: LatLng
      map?: Map
      icon?: MarkerIcon
      title?: string
      zIndex?: number
    }
    interface FitBoundsOptions {
      top?: number
      right?: number
      bottom?: number
      left?: number
    }
  }
}
