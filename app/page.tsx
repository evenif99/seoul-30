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
import { PwaInstallBanner } from '@/components/seoul30/PwaInstallBanner'
import { useTranslations, useLocale } from 'next-intl'
import { relativeTime } from '@/lib/utils/relative-time'
import { cn } from '@/lib/utils'
import type { RecommendationResult } from '@/lib/types/recommendation'
import type { NormalizedPlace, PlaceTag } from '@/lib/types/place'

const DEFAULT_FILTERS: ActiveFilters = {
  category: 'all',
  time: '30',
  freeOnly: false,
  search: '',
  openNow: false,
  tags: [],
}

const VALID_CATEGORIES = new Set(['all', 'culture', 'library', 'park', 'sports', 'welfare'])
const VALID_TIMES = new Set(['30', '20', '15'])
const VALID_TAGS = new Set<PlaceTag>(['indoor', 'outdoor', 'wheelchair', 'family', 'pet', 'parking', 'wifi'])

function parseUrlState(search: string): { district: string; filters: ActiveFilters } {
  const params = new URLSearchParams(search)
  const category = params.get('category') ?? DEFAULT_FILTERS.category
  const time = params.get('time') ?? DEFAULT_FILTERS.time
  const rawTags = params.get('tags') ?? ''
  const tags = Array.from(new Set(
    rawTags
      .split(',')
      .filter((tag): tag is PlaceTag => VALID_TAGS.has(tag as PlaceTag)),
  ))

  return {
    district: params.get('district') ?? '',
    filters: {
      category: VALID_CATEGORIES.has(category) ? category : DEFAULT_FILTERS.category,
      time: VALID_TIMES.has(time) ? time : DEFAULT_FILTERS.time,
      freeOnly: params.get('freeOnly') === 'true',
      openNow: params.get('openNow') === 'true',
      search: params.get('search') ?? DEFAULT_FILTERS.search,
      tags,
    },
  }
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
  if (filters.time !== '30') params.set('time', filters.time)
  if (filters.freeOnly) params.set('freeOnly', 'true')
  if (filters.openNow) params.set('openNow', 'true')
  if (filters.search.trim()) params.set('search', filters.search.trim())
  if (filters.tags.length > 0) params.set('tags', filters.tags.join(','))
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
  const [isOfflineCache, setIsOfflineCache] = useState(false)
  const [snapshotAt, setSnapshotAt] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [sortByDistance, setSortByDistance] = useState(false)
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [locating, setLocating] = useState(false)
  const [showLocationModal, setShowLocationModal] = useState(false)
  const [locationDenied, setLocationDenied] = useState(false)
  const [recentIds, setRecentIds] = useState<string[]>([])

  // URL에서 필터 복원 (클라이언트 마운트 및 브라우저 뒤/앞 이동)
  useEffect(() => {
    const applyUrlState = () => {
      const next = parseUrlState(window.location.search)
      setDistrict(next.district)
      setFilters(next.filters)
    }

    applyUrlState()
    window.addEventListener('popstate', applyUrlState)
    return () => window.removeEventListener('popstate', applyUrlState)
  }, [])

  // 첫 방문 시 위치 온보딩 모달 표시
  useEffect(() => {
    const shown = localStorage.getItem('seoul30_gps_onboarding')
    if (!shown) setShowLocationModal(true)
  }, [])

  // 최근 본 장소 목록 로드 (soft-dedup용)
  useEffect(() => {
    try {
      const raw = localStorage.getItem('seoul30:recent')
      if (raw) setRecentIds(JSON.parse(raw))
    } catch {}
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
        setIsOfflineCache(body.isOfflineCache ?? false)
        setSnapshotAt(body.snapshotAt ?? null)
      })
      .catch(() => {
        setResults([])
        setIsStale(true)
        setIsOfflineCache(true)
        setSnapshotAt(null)
      })
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

  function handleResetFilters() {
    setDistrict('')
    setFilters(DEFAULT_FILTERS)
    setUserCoords(null)
    setSortByDistance(false)
    window.history.replaceState(null, '', '/')
  }

  // 클라이언트 사이드 필터링 (search, openNow, 시간 필터, 카테고리, 자치구, 태그)
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
      // 카테고리 하드 필터: 선택된 카테고리 장소만 표시
      if (filters.category !== 'all' && place.category !== filters.category) return false
      // 자치구 하드 필터: GPS 미사용 + 자치구 선택 시 해당 구 장소만 표시
      if (district && !userCoords && place.district !== district) return false
      // 태그 필터: AND 교집합, tags 없는 장소는 제외 (Phase 46 enrichment 이후 일관성 유지)
      if (filters.tags.length > 0) {
        if (!place.tags || place.tags.length === 0) return false
        if (!filters.tags.every((tag) => place.tags!.includes(tag))) return false
      }
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

  // 최근 본 장소(최대 3개) soft-dedup: 결과가 4개 이상일 때만 뒤로 밀기
  const RECENT_WINDOW = recentIds.slice(0, 3)
  const sorted = displayResults
  const displayResultsDeduped =
    sorted.length >= 4 && RECENT_WINDOW.length > 0
      ? [
          ...sorted.filter(({ place }) => !RECENT_WINDOW.includes(place.id)),
          ...sorted.filter(({ place }) => RECENT_WINDOW.includes(place.id)),
        ]
      : sorted

  const activeFilterCount =
    (district ? 1 : 0) +
    (filters.category !== 'all' ? 1 : 0) +
    (filters.time !== '30' ? 1 : 0) +
    (filters.freeOnly ? 1 : 0) +
    (filters.openNow ? 1 : 0) +
    (filters.search.trim() ? 1 : 0) +
    filters.tags.length

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

          <PwaInstallBanner />

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

          <FilterBar
            filters={filters}
            onFiltersChange={handleFiltersChange}
            activeFilterCount={activeFilterCount}
            showResetButton={activeFilterCount > 0 || !!userCoords}
            onResetFilters={handleResetFilters}
          />

          {/* Stale cache 배너 */}
          {isStale && (
            <div className="max-w-2xl mx-auto px-4 mb-1">
              <p className="text-[11px] text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-center">
                {isOfflineCache
                  ? t('common.offlineCachedData', {
                      age: snapshotAt ? relativeTime(snapshotAt, locale) : t('common.unknownAge'),
                    })
                  : t('common.staleData', {
                      age: snapshotAt ? relativeTime(snapshotAt, locale) : t('common.unknownAge'),
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
                <div
                  className="flex rounded-lg border border-border overflow-hidden mr-1"
                  role="group"
                  aria-label={t('common.sortLabel')}
                >
                  <button
                    onClick={() => setSortByDistance(false)}
                    aria-pressed={!sortByDistance}
                    className={cn(
                      'px-2 py-1 text-[11px] transition-colors',
                      !sortByDistance ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground hover:bg-muted'
                    )}
                  >
                    {t('common.sortByScore')}
                  </button>
                  <button
                    onClick={() => setSortByDistance(true)}
                    aria-pressed={sortByDistance}
                    className={cn(
                      'px-2 py-1 text-[11px] border-l border-border transition-colors',
                      sortByDistance ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground hover:bg-muted'
                    )}
                  >
                    {t('common.sortByDistance')}
                  </button>
                </div>
              )}
              {/* 리스트 / 지도 토글 */}
              <div
                className="flex rounded-lg border border-border overflow-hidden"
                role="group"
                aria-label={t('common.viewModeLabel')}
              >
                <button
                  onClick={() => setViewMode('list')}
                  aria-pressed={viewMode === 'list'}
                  aria-label={t('common.listViewLabel')}
                  className={cn(
                    'flex items-center gap-1 px-2.5 py-1.5 text-xs transition-colors',
                    viewMode === 'list'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-background text-muted-foreground hover:bg-muted'
                  )}
                >
                  <List className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>{t('common.listView')}</span>
                </button>
                <button
                  onClick={() => setViewMode('map')}
                  aria-pressed={viewMode === 'map'}
                  aria-label={t('common.mapViewLabel')}
                  className={cn(
                    'flex items-center gap-1 px-2.5 py-1.5 text-xs transition-colors border-l border-border',
                    viewMode === 'map'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-background text-muted-foreground hover:bg-muted'
                  )}
                >
                  <Map className="w-3.5 h-3.5" aria-hidden="true" />
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
              ) : displayResultsDeduped.length === 0 ? (
                <EmptyState suggestions={results.slice(0, 2).map((r) => r.place)} />
              ) : (
                displayResultsDeduped.map(({ place, score }, i) => (
                  <div key={place.id} id={`place-card-${place.id}`}>
                    <PlaceCard place={place} score={score} priority={i < 3} />
                  </div>
                ))
              )}
            </section>
          )}

          {/* 지도 뷰 */}
          {viewMode === 'map' && !loading && (
            <div className="max-w-2xl mx-auto w-full">
              {displayResultsDeduped.length === 0 ? (
                <EmptyState suggestions={results.slice(0, 2).map((r) => r.place)} />
              ) : (
                <MapView
                  results={displayResultsDeduped}
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
