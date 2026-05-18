'use client'

import { useState, useEffect } from 'react'
import { Header } from '@/components/seoul30/Header'
import { Hero } from '@/components/seoul30/Hero'
import { FilterBar, type ActiveFilters } from '@/components/seoul30/FilterBar'
import { PlaceCard } from '@/components/seoul30/PlaceCard'
import { BottomTabBar, type TabId } from '@/components/seoul30/BottomTabBar'
import { DesktopNav } from '@/components/seoul30/DesktopNav'
import { EmptyState } from '@/components/seoul30/EmptyState'
import { DistrictSelector } from '@/components/seoul30/DistrictSelector'
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

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<TabId>('home')
  const [district, setDistrict] = useState<string>('')
  const [filters, setFilters] = useState<ActiveFilters>(DEFAULT_FILTERS)
  const [results, setResults] = useState<RecommendationResult[]>([])
  const [isMock, setIsMock] = useState(false)
  const [loading, setLoading] = useState(true)

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
        <DesktopNav activeTab={activeTab} onTabChange={setActiveTab} />
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <div className="md:hidden">
          <Header />
        </div>

        <div className="hidden md:flex items-center justify-between px-6 pt-5 pb-2 border-b border-border">
          <div>
            <h2 className="text-lg font-bold text-foreground">지금 출발 추천</h2>
            <p className="text-xs text-muted-foreground">서울 기준 · 실시간 업데이트</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className={`inline-block w-1.5 h-1.5 rounded-full ${isMock ? 'bg-yellow-400' : 'bg-green-500'}`} aria-hidden="true" />
            <span>{isMock ? 'mock 데이터' : '공공데이터 연동 중'}</span>
          </div>
        </div>

        <main id="main-content" className="flex-1 overflow-y-auto pb-24 md:pb-8">
          <Hero />

          <DistrictSelector value={district} onChange={handleDistrictChange} />

          <FilterBar filters={filters} onFiltersChange={handleFiltersChange} />

          <div className="max-w-2xl mx-auto px-4 mb-3 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {loading ? (
                <span>불러오는 중...</span>
              ) : (
                <>
                  <span className="font-semibold text-foreground">{displayResults.length}개</span>의 장소를 추천드려요
                </>
              )}
            </p>
            {isFiltered && (
              <button
                onClick={() => {
                  setDistrict('')
                  setFilters(DEFAULT_FILTERS)
                  window.history.replaceState(null, '', '/')
                }}
                className="text-xs text-primary hover:underline"
              >
                필터 초기화
              </button>
            )}
          </div>

          <section
            aria-label="추천 장소 목록"
            className="max-w-2xl mx-auto px-4 flex flex-col gap-3"
          >
            {loading ? null : displayResults.length === 0 ? (
              <EmptyState />
            ) : (
              displayResults.map(({ place }) => (
                <PlaceCard key={place.id} place={place} />
              ))
            )}
          </section>

          {!loading && displayResults.length > 0 && (
            <p className="max-w-2xl mx-auto px-4 pt-6 text-center text-[11px] text-muted-foreground">
              {isMock ? 'mock 데이터 기반' : '서울시 공공데이터 기반'} · scoring 기준 정렬
            </p>
          )}
        </main>
      </div>

      <BottomTabBar activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  )
}
