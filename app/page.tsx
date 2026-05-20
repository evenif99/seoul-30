'use client'

import { useState, useEffect } from 'react'
import { List, Map } from 'lucide-react'
import { Header } from '@/components/seoul30/Header'
import { Hero } from '@/components/seoul30/Hero'
import { FilterBar, type ActiveFilters } from '@/components/seoul30/FilterBar'
import { PlaceCard } from '@/components/seoul30/PlaceCard'
import { MapView } from '@/components/seoul30/MapView'
import { BottomTabBar } from '@/components/seoul30/BottomTabBar'
import { DesktopNav } from '@/components/seoul30/DesktopNav'
import { EmptyState } from '@/components/seoul30/EmptyState'
import { DistrictSelector } from '@/components/seoul30/DistrictSelector'
import { PushSubscribeButton } from '@/components/seoul30/PushSubscribeButton'
import { LanguageToggle } from '@/components/seoul30/LanguageToggle'
import { useTranslations } from 'next-intl'
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
  const cur = now.getHours() * 60 + now.getMinutes()
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
  const [district, setDistrict] = useState<string>('')
  const [filters, setFilters] = useState<ActiveFilters>(DEFAULT_FILTERS)
  const [results, setResults] = useState<RecommendationResult[]>([])
  const [isMock, setIsMock] = useState(false)
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>('list')

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

  // API 호출: district, category, freeOnly 변경 시
  useEffect(() => {
    const params = new URLSearchParams()
    if (district) params.set('district', district)
    if (filters.category !== 'all') params.set('category', filters.category)
    if (filters.freeOnly) params.set('freeOnly', 'true')

    setLoading(true)
    fetch(`/api/places?${params.toString()}`)
      .then((r) => r.json())
      .then((body) => {
        setResults(body.data ?? [])
        setIsMock(body.isMock ?? false)
      })
      .catch(() => setResults([]))
      .finally(() => setLoading(false))
  }, [district, filters.category, filters.freeOnly])

  function handleDistrictChange(next: string) {
    setDistrict(next)
    syncUrl(next, filters)
  }

  function handleFiltersChange(next: ActiveFilters) {
    setFilters(next)
    syncUrl(district, next)
  }

  // 클라이언트 사이드 필터링 (search, openNow)
  const displayResults = results.filter(({ place }) => {
    if (filters.search.trim()) {
      const q = filters.search.trim().toLowerCase()
      const nameMatch = place.name.toLowerCase().includes(q)
      const addrMatch = place.address?.toLowerCase().includes(q) ?? false
      if (!nameMatch && !addrMatch) return false
    }
    if (filters.openNow && !isOpenNow(place)) return false
    return true
  })

  const isFiltered =
    filters.freeOnly ||
    filters.openNow ||
    filters.search.trim() !== '' ||
    filters.crowd !== 'all' ||
    filters.time !== '30' ||
    filters.category !== 'all' ||
    !!district

  return (
    <div className="min-h-screen bg-background flex">
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

          <DistrictSelector value={district} onChange={handleDistrictChange} />

          <FilterBar filters={filters} onFiltersChange={handleFiltersChange} />

          {/* 결과 카운트 + 뷰 토글 */}
          <div className="max-w-2xl mx-auto px-4 mb-3 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {loading ? (
                <span>{t('common.loading')}</span>
              ) : (
                <span>
                  {t('common.results', { count: displayResults.length })}
                </span>
              )}
            </p>

            <div className="flex items-center gap-1">
              {isFiltered && (
                <button
                  onClick={() => {
                    setDistrict('')
                    setFilters(DEFAULT_FILTERS)
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
              className="max-w-2xl mx-auto px-4 flex flex-col gap-3"
            >
              {loading ? null : displayResults.length === 0 ? (
                <EmptyState />
              ) : (
                displayResults.map(({ place, score }, i) => (
                  <PlaceCard key={place.id} place={place} score={score} priority={i === 0} />
                ))
              )}
            </section>
          )}

          {/* 지도 뷰 */}
          {viewMode === 'map' && !loading && (
            <div className="max-w-2xl mx-auto w-full">
              {displayResults.length === 0 ? (
                <EmptyState />
              ) : (
                <MapView results={displayResults} />
              )}
            </div>
          )}

          {!loading && displayResults.length > 0 && viewMode === 'list' && (
            <p className="max-w-2xl mx-auto px-4 pt-6 text-center text-[11px] text-muted-foreground">
              {isMock ? 'mock 데이터 기반' : '서울시 공공데이터 기반'} · scoring 기준 정렬
            </p>
          )}
        </main>
      </div>

      <BottomTabBar />
    </div>
  )
}
