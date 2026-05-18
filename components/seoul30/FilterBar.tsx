'use client'

import { useState } from 'react'
import { SlidersHorizontal } from 'lucide-react'
import { CATEGORY_FILTERS, CROWD_FILTERS, TIME_FILTERS } from '@/lib/data'

export interface ActiveFilters {
  category: string
  crowd: string
  time: string
  freeOnly: boolean
}

interface FilterBarProps {
  filters: ActiveFilters
  onFiltersChange: (filters: ActiveFilters) => void
}

export function FilterBar({ filters, onFiltersChange }: FilterBarProps) {
  const [showMore, setShowMore] = useState(false)

  const setCategory = (id: string) => onFiltersChange({ ...filters, category: id })
  const setCrowd = (id: string) => onFiltersChange({ ...filters, crowd: id })
  const setTime = (id: string) => onFiltersChange({ ...filters, time: id })
  const toggleFree = () => onFiltersChange({ ...filters, freeOnly: !filters.freeOnly })

  return (
    <div className="max-w-2xl mx-auto">
      {/* Category scroll row */}
      <div className="relative">
        <div
          className="flex gap-2 overflow-x-auto px-4 py-2 scrollbar-hide"
          role="group"
          aria-label="카테고리 필터"
        >
          {CATEGORY_FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setCategory(f.id)}
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
      </div>

      {/* Secondary filters row */}
      <div className="flex items-center gap-2 overflow-x-auto px-4 pb-3 scrollbar-hide" role="group" aria-label="세부 필터">
        {/* Free only toggle */}
        <button
          onClick={toggleFree}
          aria-pressed={filters.freeOnly}
          className={`shrink-0 flex items-center gap-1 text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${
            filters.freeOnly
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-card text-muted-foreground border-border hover:border-primary/40'
          }`}
        >
          무료만
        </button>

        {/* Time filter */}
        {TIME_FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setTime(f.id)}
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

        {/* Crowd filter */}
        {CROWD_FILTERS.filter((f) => f.id !== 'all').map((f) => (
          <button
            key={f.id}
            onClick={() => setCrowd(f.id === filters.crowd ? 'all' : f.id)}
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
