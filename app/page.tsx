'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { List, LocateFixed, Map, MapPin } from 'lucide-react'
import { Header } from '@/components/seoul30/Header'
import { Hero } from '@/components/seoul30/Hero'
import { FilterBar, type ActiveFilters } from '@/components/seoul30/FilterBar'
import { PlaceCard } from '@/components/seoul30/PlaceCard'
import { MapView } from '@/components/seoul30/MapView'
import { LocationOnboardingModal } from '@/components/seoul30/LocationOnboardingModal'
import { BottomTabBar } from '@/components/seoul30/BottomTabBar'
import { DesktopNav } from '@/components/seoul30/DesktopNav'
import { EmptyState } from '@/components/seoul30/EmptyState'
import { PlaceCardSkeleton } from '@/components/seoul30/PlaceCardSkeleton'
import { DistrictSelector } from '@/components/seoul30/DistrictSelector'
import { PushSubscribeButton } from '@/components/seoul30/PushSubscribeButton'
import { LanguageToggle } from '@/components/seoul30/LanguageToggle'
import { useTranslations, useLocale } from 'next-intl'
import { relativeTime } from '@/lib/utils/relative-time'
import { cn } from '@/lib/utils'
import type { RecommendationResult } from '@/lib/types/recommendation'
import type { NormalizedPlace } from '@/lib/types/place'

const DEFAULT_FILTERS: ActiveFilters = {
  category: 'all',
  crowd: 'all',
  time: '30',
  freeOnly: false,
  search: '',
  openNow: false,
}

function isOpenNow(place: NormalizedPlace): boolean {
  if (!place.openTimeText || !place.closeTimeText) return true
  const now = new Date()
  // scoring.ts의 calcTimefit과 동일하게 KST(UTC+9) 고정 오프셋 사용
  const cur = (now.getUTCHours() * 60 + now.getUTCMinutes() + 9 * 60) % (24 * 60)
  const [oh, om] = place.openTimeText.split(':').map(Number)
  const [ch, cm] = place.closeTimeText.split(':').map(Number)
  if (oh === 0 && om === 0 && ch === 23 && cm === 59) return true
  return cur >= oh * 60 + om && cur < ch * 60 + cm
}

function syncUrl(district: string, filters: ActiveFilters) {
  const params = new URLSearchParams()
  if (district) params.set('district', district)
  if (filters.category !== 'all') params.set('category', filters.category)
  if (filters.freeOnly) params.set('freeOnly', 'true')
  if (filters.openNow) params.set('openNow', 'true')
  if (filters.search.trim()) params.set('search', filters.search.trim())
  const qs = params.toString()
  window.history.replaceState(null, '', qs ? `/?${qs}` : '/')
}

type ViewMode = 'list' | 'map'

export default function HomePage() {
  const t = useTranslations()
  const locale = useLocale() as 'ko' | 'en'
  const [district, setDistrict] = useState<string>('')
  const [filters, setFilters] = useState<ActiveFilters>(DEFAULT_FILTERS)
  const [results, setResults] = useState<RecommendationResult[]>([])
  const [isMock, setIsMock] = useState(false)
  const [isStale, setIsStale] = useState(false)
  const [snapshotAt, setSnapshotAt] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [sortByDistance, setSortByDistance] = useState(false)
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [locating, setLocating] = useState(false)
  const [showLocationModal, setShowLocationModal] = useState(false)
  const [locationDenied, setLocationDenied] = useState(false)

  // URL에서 초기 필터 복원 (클라이언트 마운트 후)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const initialDistrict = params.get('district') ?? ''
    const initialFilters: ActiveFilters = {
      category: params.get('category') ?? 'all',
      crowd: 'all',
      time: '30',
      freeOnly: params.get('freeOnly') === 'true',
      openNow: params.get('openNow') === 'true',
      search: params.get('search') ?? '',
    }
    setDistrict(initialDistrict)
    setFilters(initialFilters)
  }, [])

  // 첫 방문 시 위치 온보딩 모달 표시
  useEffect(() => {
    const shown = localStorage.getItem('seoul30_gps_onboarding')
    if (!shown) setShowLocationModal(true)
  }, [])

  // API 호출: district, category, freeOnly 변경 시
  useEffect(() => {
    const params = new URLSearchParams()
    if (district) params.set('district', district)
    if (filters.category !== 'all') params.set('category', filters.category)
    if (filters.freeOnly) params.set('freeOnly', 'true')
    if (userCoords) {
      params.set('lat', String(userCoords.lat))
      params.set('lng', String(userCoords.lng))
    }

    setLoading(true)
    fetch(`/api/places?${params.toString()}`)
      .then((r) => r.json())
      .then((body) => {
        setResults(body.data ?? [])
        setIsMock(body.isMock ?? false)
        setIsStale(body.isStale ?? false)
        setSnapshotAt(body.snapshotAt ?? null)
      })
      .catch(() => setResults([]))
      .finally(() => setLoading(false))
  }, [district, filters.category, filters.freeOnly, userCoords])

  function requestLocation() {
    if (!navigator.geolocation) {
      setLocationDenied(true)
      return
    }
    setLocating(true)
    setLocationDenied(false)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setLocating(false)
        setShowLocationModal(false)
      },
      () => {
        setLocating(false)
        setLocationDenied(true)
      },
      { timeout: 8000 },
    )
  }

  function handleModalAllow() {
    localStorage.setItem('seoul30_gps_onboarding', 'shown')
    requestLocation()
  }

  function handleModalDismiss() {
    localStorage.setItem('seoul30_gps_onboarding', 'shown')
    setShowLocationModal(false)
  }

  function handleDistrictChange(next: string) {
    setDistrict(next)
    syncUrl(next, filters)
  }

  function handleFiltersChange(next: ActiveFilters) {
    setFilters(next)
    syncUrl(district, next)
  }

  // 클라이언트 사이드 필터링 (search, openNow, 시간 필터)
  const maxMinutes = parseInt(filters.time) || 30
  const displayResults = results
    .filter(({ place, score }) => {
      if (filters.search.trim()) {
        const q = filters.search.trim().toLowerCase()
        const nameMatch = place.name.toLowerCase().includes(q)
        const addrMatch = place.address?.toLowerCase().includes(q) ?? false
        if (!nameMatch && !addrMatch) return false
      }
      if (filters.openNow && !isOpenNow(place)) return false
      // GPS 활성 시에만 시간 필터 적용
      if (userCoords && score?.transitMinutes != null && score.transitMinutes > maxMinutes) return false
      return true
    })
    .sort((a, b) => {
      // GPS + 거리순 정렬
      if (sortByDistance && userCoords) {
        const tA = a.score?.transitMinutes ?? 999
        const tB = b.score?.transitMinutes ?? 999
        return tA - tB
      }
      return b.score.total - a.score.total
    })

  const isFiltered =
    filters.freeOnly ||
    filters.openNow ||
    filters.search.trim() !== '' ||
    filters.crowd !== 'all' ||
    filters.time !== '30' ||
    filters.category !== 'all' ||
    !!district ||
    !!userCoords

  return (
    <div className="min-h-screen bg-background flex">
      <LocationOnboardingModal
        open={showLocationModal}
        denied={locationDenied}
        onAllow={handleModalAllow}
        onDismiss={handleModalDismiss}
      />
      <aside className="hidden md:block sticky top-0 h-screen pl-6 pt-2">
        <DesktopNav />
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <div className="md:hidden">
          <Header />
        </div>

        <div className="hidden md:flex items-center justify-between px-6 pt-5 pb-2 border-b border-border">
          <div>
            <h2 className="text-lg font-bold text-foreground">{t('desktop.title')}</h2>
            <p className="text-xs text-muted-foreground">{t('desktop.subtitle')}</p>
          </div>
          <div className="flex items-center gap-3">
            <LanguageToggle />
            <PushSubscribeButton />
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className={`inline-block w-1.5 h-1.5 rounded-full ${isMock ? 'bg-yellow-400' : 'bg-green-500'}`} aria-hidden="true" />
              <span>{isMock ? t('common.mockData') : t('common.liveData')}</span>
            </div>
          </div>
        </div>

        <main id="main-content" className="flex-1 overflow-y-auto pb-24 md:pb-8">
          <Hero />

          {/* GPS 거부 안내 배너 */}
          {locationDenied && (
            <div className="max-w-2xl mx-auto px-4 mb-2">
              <p className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-[11px] text-amber-700 text-center">
                {t('locationModal.deniedBanner')}
              </p>
            </div>
          )}

          <div className="max-w-2xl mx-auto px-4 mb-3 flex items-center gap-2">
            <button
              type="button"
              onClick={requestLocation}
              disabled={locating}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
            >
              <LocateFixed className="h-3.5 w-3.5" aria-hidden="true" />
              {locating ? t('common.locating') : t('common.useMyLocation')}
            </button>
            {userCoords && (
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-1 text-[11px] font-medium text-blue-600 border border-blue-100">
                <MapPin className="h-3 w-3" aria-hidden="true" />
                {t('common.locationActive')}
              </span>
            )}
          </div>

          <DistrictSelector value={district} onChange={handleDistrictChange} />

          <FilterBar filters={filters} onFiltersChange={handleFiltersChange} />

          {/* Stale cache 배너 */}
          {isStale && (
            <div className="max-w-2xl mx-auto px-4 mb-1">
              <p className="text-[11px] text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-center">
                {t('common.staleData', {
                  age: snapshotAt ? relativeTime(snapshotAt, locale) : '—',
                })}
              </p>
            </div>
          )}

          {/* 캐시 히트 시 데이터 기준 시각 */}
          {!isMock && !isStale && snapshotAt && (
            <div className="max-w-2xl mx-auto px-4 mb-1">
              <p className="text-[10px] text-muted-foreground text-center">
                {t('common.cachedData', { age: relativeTime(snapshotAt, locale) })}
              </p>
            </div>
          )}

          {/* 결과 카운트 + 정렬 토글 + 뷰 토글 */}
          <div className="max-w-2xl mx-auto px-4 mb-3 flex items-center justify-between">
            <p
              className="text-xs text-muted-foreground"
              aria-live="polite"
              aria-atomic="true"
            >
              {loading ? (
                <span>{t('common.loading')}</span>
              ) : (
                <span>
                  {t('common.results', { count: displayResults.length })}
                </span>
              )}
            </p>

            <div className="flex items-center gap-1">
              {/* GPS 활성 시 정렬 토글 */}
              {userCoords && (
                <div className="flex rounded-lg border border-border overflow-hidden mr-1">
                  <button
                    onClick={() => setSortByDistance(false)}
                    className={cn(
                      'px-2 py-1 text-[11px] transition-colors',
                      !sortByDistance ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground hover:bg-muted'
                    )}
                  >
                    {t('common.sortByScore')}
                  </button>
                  <button
                    onClick={() => setSortByDistance(true)}
                    className={cn(
                      'px-2 py-1 text-[11px] border-l border-border transition-colors',
                      sortByDistance ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground hover:bg-muted'
                    )}
                  >
                    {t('common.sortByDistance')}
                  </button>
                </div>
              )}
              {isFiltered && (
                <button
                  onClick={() => {
                    setDistrict('')
                    setFilters(DEFAULT_FILTERS)
                    setUserCoords(null)
                    setSortByDistance(false)
                    window.history.replaceState(null, '', '/')
                  }}
                  className="text-xs text-primary hover:underline mr-2"
                >
                  {t('filter.resetFilters')}
                </button>
              )}
              {/* 리스트 / 지도 토글 */}
              <div className="flex rounded-lg border border-border overflow-hidden">
                <button
                  onClick={() => setViewMode('list')}
                  aria-label={t('common.listViewLabel')}
                  className={cn(
                    'flex items-center gap-1 px-2.5 py-1.5 text-xs transition-colors',
                    viewMode === 'list'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-background text-muted-foreground hover:bg-muted'
                  )}
                >
                  <List className="w-3.5 h-3.5" />
                  <span>{t('common.listView')}</span>
                </button>
                <button
                  onClick={() => setViewMode('map')}
                  aria-label={t('common.mapViewLabel')}
                  className={cn(
                    'flex items-center gap-1 px-2.5 py-1.5 text-xs transition-colors border-l border-border',
                    viewMode === 'map'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-background text-muted-foreground hover:bg-muted'
                  )}
                >
                  <Map className="w-3.5 h-3.5" />
                  <span>{t('common.mapView')}</span>
                </button>
              </div>
            </div>
          </div>

          {/* 리스트 뷰 */}
          {viewMode === 'list' && (
            <section
              aria-label="추천 장소 목록"
              aria-busy={loading}
              className="max-w-2xl mx-auto px-4 flex flex-col gap-3"
            >
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => <PlaceCardSkeleton key={i} />)
              ) : displayResults.length === 0 ? (
                <EmptyState suggestions={results.slice(0, 2).map((r) => r.place)} />
              ) : (
                displayResults.map(({ place, score }, i) => (
                  <div key={place.id} id={`place-card-${place.id}`}>
                    <PlaceCard place={place} score={score} priority={i === 0} />
                  </div>
                ))
              )}
            </section>
          )}

          {/* 지도 뷰 */}
          {viewMode === 'map' && !loading && (
            <div className="max-w-2xl mx-auto w-full">
              {displayResults.length === 0 ? (
                <EmptyState suggestions={results.slice(0, 2).map((r) => r.place)} />
              ) : (
                <MapView
                  results={displayResults}
                  onSelectPlace={(place) => {
                    setViewMode('list')
                    // 리스트 뷰 전환 후 해당 카드로 스크롤
                    setTimeout(() => {
                      document.getElementById(`place-card-${place.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                    }, 100)
                  }}
                />
              )}
            </div>
          )}

          {!loading && displayResults.length > 0 && viewMode === 'list' && (
            <p className="max-w-2xl mx-auto px-4 pt-6 text-center text-[11px] text-muted-foreground">
              {isMock ? 'mock 데이터 기반' : '서울시 공공데이터 기반'} · scoring 기준 정렬
            </p>
          )}

          {!loading && viewMode === 'list' && (
            <div className="max-w-2xl mx-auto px-4 pt-4 pb-2 flex justify-center gap-4">
              <Link href="/about" className="text-[11px] text-muted-foreground hover:text-foreground transition-colors">
                {t('about.footerLink')}
              </Link>
              <Link href="/privacy" className="text-[11px] text-muted-foreground hover:text-foreground transition-colors">
                {t('privacy.footerLink')}
              </Link>
            </div>
          )}
        </main>
      </div>

      <BottomTabBar />
    </div>
  )
}
