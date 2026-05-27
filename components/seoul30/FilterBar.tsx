'use client'

import { Search } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { CATEGORY_FILTERS, TIME_FILTERS } from '@/lib/data'
import type { PlaceTag } from '@/lib/types/place'

export interface ActiveFilters {
  category: string
  time: string
  freeOnly: boolean
  search: string
  openNow: boolean
  tags: PlaceTag[]
}

const TAG_OPTIONS: PlaceTag[] = ['indoor', 'outdoor', 'wheelchair', 'family', 'pet', 'parking', 'wifi']

interface FilterBarProps {
  filters: ActiveFilters
  onFiltersChange: (filters: ActiveFilters) => void
  activeFilterCount: number
  showResetButton: boolean
  onResetFilters: () => void
}

export function FilterBar({ filters, onFiltersChange, activeFilterCount, showResetButton, onResetFilters }: FilterBarProps) {
  const t = useTranslations('filter')
  const commonT = useTranslations('common')
  const set = (patch: Partial<ActiveFilters>) => onFiltersChange({ ...filters, ...patch })

  return (
    <div className="max-w-2xl mx-auto">
      {/* 검색 */}
      <div className="px-4 pt-3 pb-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" aria-hidden="true" />
          <input
            type="search"
            data-testid="place-search-input"
            placeholder={t('searchPlaceholder')}
            value={filters.search}
            onChange={(e) => set({ search: e.target.value })}
            className="w-full pl-9 pr-4 py-2 text-sm bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary placeholder:text-muted-foreground/60"
            aria-label={t('searchLabel')}
          />
        </div>
      </div>

      {showResetButton && (
        <div className="flex items-center justify-between gap-3 px-4 pb-2">
          {activeFilterCount > 0 ? (
            <span
              data-testid="active-filter-count"
              className="inline-flex min-h-7 items-center rounded-full border border-primary/20 bg-primary/10 px-3 text-xs font-medium text-primary"
              aria-live="polite"
              aria-atomic="true"
            >
              {commonT('activeFiltersCount', { count: activeFilterCount })}
            </span>
          ) : (
            <span aria-hidden="true" />
          )}
          <button
            type="button"
            data-testid="reset-filters-button"
            onClick={onResetFilters}
            className="shrink-0 text-xs font-medium text-primary underline-offset-4 hover:underline focus:outline-none focus:ring-2 focus:ring-primary/30 rounded"
          >
            {commonT('resetFilters')}
          </button>
        </div>
      )}

      {/* 카테고리 */}
      <div
        className="flex gap-2 overflow-x-auto px-4 pb-2 scrollbar-hide"
        role="group"
        aria-label={t('categoryLabel')}
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
            {t(`categories.${f.id}`)}
          </button>
        ))}
      </div>

      {/* 세부 필터 */}
      <div
        className="flex items-center gap-2 overflow-x-auto px-4 pb-3 scrollbar-hide"
        role="group"
        aria-label={t('detailLabel')}
      >
        <button
          data-testid="free-only-filter"
          onClick={() => set({ freeOnly: !filters.freeOnly })}
          aria-pressed={filters.freeOnly}
          className={`shrink-0 text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${
            filters.freeOnly
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-card text-muted-foreground border-border hover:border-primary/40'
          }`}
        >
          {t('freeOnly')}
        </button>

        <button
          data-testid="open-now-filter"
          onClick={() => set({ openNow: !filters.openNow })}
          aria-pressed={filters.openNow}
          className={`shrink-0 text-xs px-3 py-1.5 rounded-full border font-medium transition-colors whitespace-nowrap ${
            filters.openNow
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-card text-muted-foreground border-border hover:border-primary/40'
          }`}
        >
          {t('openNow')}
        </button>

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
            {t(`time.${f.id}`)}
          </button>
        ))}

      </div>

      {/* 태그 필터 */}
      <div
        className="flex items-center gap-2 overflow-x-auto px-4 pb-3 scrollbar-hide"
        role="group"
        aria-label={t('tags.label')}
      >
        {TAG_OPTIONS.map((tag) => {
          const active = filters.tags.includes(tag)
          return (
            <button
              key={tag}
              data-testid={`tag-filter-${tag}`}
              onClick={() => {
                const next = active
                  ? filters.tags.filter((existing) => existing !== tag)
                  : [...filters.tags, tag]
                set({ tags: next })
              }}
              aria-pressed={active}
              className={`shrink-0 text-xs px-3 py-1.5 rounded-full border font-medium transition-colors whitespace-nowrap ${
                active
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-card text-muted-foreground border-border hover:border-emerald-400/60'
              }`}
            >
              {t(`tags.${tag}`)}
            </button>
          )
        })}
      </div>
    </div>
  )
}
