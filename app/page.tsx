'use client'

import { useState, useMemo } from 'react'
import { Header } from '@/components/seoul30/Header'
import { Hero } from '@/components/seoul30/Hero'
import { FilterBar, type ActiveFilters } from '@/components/seoul30/FilterBar'
import { PlaceCard } from '@/components/seoul30/PlaceCard'
import { BottomTabBar, type TabId } from '@/components/seoul30/BottomTabBar'
import { DesktopNav } from '@/components/seoul30/DesktopNav'
import { EmptyState } from '@/components/seoul30/EmptyState'
import { PLACES } from '@/lib/data'

const DEFAULT_FILTERS: ActiveFilters = {
  category: 'all',
  crowd: 'all',
  time: '30',
  freeOnly: false,
}

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<TabId>('home')
  const [filters, setFilters] = useState<ActiveFilters>(DEFAULT_FILTERS)

  const filteredPlaces = useMemo(() => {
    return PLACES.filter((place) => {
      if (filters.freeOnly && !place.isFree) return false
      if (filters.crowd !== 'all' && place.crowd !== filters.crowd) return false
      if (filters.time !== '30' && place.transitMinutes > parseInt(filters.time)) return false
      if (filters.category !== 'all') {
        const map: Record<string, string[]> = {
          culture: ['공공문화'],
          library: ['도서관'],
          park: ['공원'],
          sports: ['스포츠'],
          welfare: ['복지시설'],
        }
        if (!map[filters.category]?.includes(place.category)) return false
      }
      return true
    })
  }, [filters])

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop sidebar */}
      <aside className="hidden md:block sticky top-0 h-screen pl-6 pt-2">
        <DesktopNav activeTab={activeTab} onTabChange={setActiveTab} />
      </aside>

      {/* Main content column */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile sticky header */}
        <div className="md:hidden">
          <Header />
        </div>

        {/* Desktop top bar */}
        <div className="hidden md:flex items-center justify-between px-6 pt-5 pb-2 border-b border-border">
          <div>
            <h2 className="text-lg font-bold text-foreground">지금 출발 추천</h2>
            <p className="text-xs text-muted-foreground">성수동, 서울 기준 · 실시간 업데이트</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500" aria-hidden="true" />
            <span>공공데이터 연동 중</span>
          </div>
        </div>

        {/* Scrollable page body */}
        <main
          id="main-content"
          className="flex-1 overflow-y-auto pb-24 md:pb-8"
        >
          <Hero />

          <FilterBar filters={filters} onFiltersChange={setFilters} />

          {/* Results header */}
          <div className="max-w-2xl mx-auto px-4 mb-3 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">{filteredPlaces.length}개</span>의 장소를 추천드려요
            </p>
            {(filters.freeOnly || filters.crowd !== 'all' || filters.time !== '30' || filters.category !== 'all') && (
              <button
                onClick={() => setFilters(DEFAULT_FILTERS)}
                className="text-xs text-primary hover:underline"
              >
                필터 초기화
              </button>
            )}
          </div>

          {/* Place cards */}
          <section
            aria-label="추천 장소 목록"
            className="max-w-2xl mx-auto px-4 flex flex-col gap-3 md:grid md:grid-cols-1 lg:grid-cols-1"
          >
            {filteredPlaces.length === 0 ? (
              <EmptyState />
            ) : (
              filteredPlaces.map((place) => (
                <PlaceCard key={place.id} place={place} />
              ))
            )}
          </section>

          {/* Footer note */}
          {filteredPlaces.length > 0 && (
            <p className="max-w-2xl mx-auto px-4 pt-6 text-center text-[11px] text-muted-foreground">
              서울시 공공데이터 기반 · 이동 시간은 실시간 교통 기준
            </p>
          )}
        </main>
      </div>

      {/* Mobile bottom tab bar */}
      <BottomTabBar activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  )
}
