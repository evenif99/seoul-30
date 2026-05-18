'use client'

import { Search } from 'lucide-react'
import { CATEGORY_FILTERS, CROWD_FILTERS, TIME_FILTERS } from '@/lib/data'

export interface ActiveFilters {
  category: string
  crowd: string
  time: string
  freeOnly: boolean
  search: string
  openNow: boolean
}

interface FilterBarProps {
  filters: ActiveFilters
  onFiltersChange: (filters: ActiveFilters) => void
}

export function FilterBar({ filters, onFiltersChange }: FilterBarProps) {
  const set = (patch: Partial<ActiveFilters>) => onFiltersChange({ ...filters, ...patch })

  return (
    <div className="max-w-2xl mx-auto">
      {/* 검색 */}
      <div className="px-4 pt-3 pb-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" aria-hidden="true" />
          <input
            type="search"
            placeholder="장소 이름으로 검색"
            value={filters.search}
            onChange={(e) => set({ search: e.target.value })}
            className="w-full pl-9 pr-4 py-2 text-sm bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary placeholder:text-muted-foreground/60"
            aria-label="장소 검색"
          />
        </div>
      </div>

      {/* 카테고리 */}
      <div
        className="flex gap-2 overflow-x-auto px-4 pb-2 scrollbar-hide"
        role="group"
        aria-label="카테고리 필터"
      >
        {CATEGORY_FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => set({ category: f.id })}
            aria-pressed={filters.category === f.id}
            className={`shrink-0 text-sm px-4 py-1.5 rounded-full font-medium border transition-colors whitespace-nowrap ${
              filters.category === f.id
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-card text-foreground border-border hover:border-primary/40'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* 세부 필터 */}
      <div
        className="flex items-center gap-2 overflow-x-auto px-4 pb-3 scrollbar-hide"
        role="group"
        aria-label="세부 필터"
      >
        {/* 무료만 */}
        <button
          onClick={() => set({ freeOnly: !filters.freeOnly })}
          aria-pressed={filters.freeOnly}
          className={`shrink-0 text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${
            filters.freeOnly
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-card text-muted-foreground border-border hover:border-primary/40'
          }`}
        >
          무료만
        </button>

        {/* 지금 운영 중 */}
        <button
          onClick={() => set({ openNow: !filters.openNow })}
          aria-pressed={filters.openNow}
          className={`shrink-0 text-xs px-3 py-1.5 rounded-full border font-medium transition-colors whitespace-nowrap ${
            filters.openNow
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-card text-muted-foreground border-border hover:border-primary/40'
          }`}
        >
          지금 운영 중
        </button>

        {/* 이동시간 */}
        {TIME_FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => set({ time: f.id })}
            aria-pressed={filters.time === f.id}
            className={`shrink-0 text-xs px-3 py-1.5 rounded-full border font-medium transition-colors whitespace-nowrap ${
              filters.time === f.id
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-card text-muted-foreground border-border hover:border-primary/40'
            }`}
          >
            {f.label}
          </button>
        ))}

        {/* 혼잡도 */}
        {CROWD_FILTERS.filter((f) => f.id !== 'all').map((f) => (
          <button
            key={f.id}
            onClick={() => set({ crowd: f.id === filters.crowd ? 'all' : f.id })}
            aria-pressed={filters.crowd === f.id}
            className={`shrink-0 text-xs px-3 py-1.5 rounded-full border font-medium transition-colors whitespace-nowrap ${
              filters.crowd === f.id
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-card text-muted-foreground border-border hover:border-primary/40'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>
    </div>
  )
}
