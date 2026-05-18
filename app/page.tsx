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

const DEFAULT_FILTERS: ActiveFilters = {
  category: 'all',
  crowd: 'all',
  time: '30',
  freeOnly: false,
}

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<TabId>('home')
  const [district, setDistrict] = useState<string>('')
  const [filters, setFilters] = useState<ActiveFilters>(DEFAULT_FILTERS)
  const [results, setResults] = useState<RecommendationResult[]>([])
  const [isMock, setIsMock] = useState(false)
  const [loading, setLoading] = useState(true)

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
  }, [district, filters])

  const isFiltered =
    filters.freeOnly ||
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

          <DistrictSelector value={district} onChange={setDistrict} />

          <FilterBar filters={filters} onFiltersChange={setFilters} />

          <div className="max-w-2xl mx-auto px-4 mb-3 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {loading ? (
                <span>불러오는 중...</span>
              ) : (
                <>
                  <span className="font-semibold text-foreground">{results.length}개</span>의 장소를 추천드려요
                </>
              )}
            </p>
            {isFiltered && (
              <button
                onClick={() => {
                  setDistrict('')
                  setFilters(DEFAULT_FILTERS)
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
            {loading ? null : results.length === 0 ? (
              <EmptyState />
            ) : (
              results.map(({ place }) => (
                <PlaceCard key={place.id} place={place} />
              ))
            )}
          </section>

          {!loading && results.length > 0 && (
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
