import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { FilterBar, type ActiveFilters } from '@/components/seoul30/FilterBar'

const baseFilters: ActiveFilters = {
  category: 'all',
  time: '30',
  freeOnly: false,
  search: '',
  openNow: false,
  tags: [],
}

describe('FilterBar', () => {
  it('emits search changes', async () => {
    const onFiltersChange = vi.fn()

    render(
      <FilterBar
        filters={baseFilters}
        onFiltersChange={onFiltersChange}
        activeFilterCount={0}
        showResetButton={false}
        onResetFilters={vi.fn()}
      />,
    )

    fireEvent.change(screen.getByTestId('place-search-input'), {
      target: { value: 'park' },
    })

    expect(onFiltersChange).toHaveBeenCalledWith({
      ...baseFilters,
      search: 'park',
    })
  })

  it('toggles free-only filtering', async () => {
    const user = userEvent.setup()
    const onFiltersChange = vi.fn()

    render(
      <FilterBar
        filters={baseFilters}
        onFiltersChange={onFiltersChange}
        activeFilterCount={0}
        showResetButton={false}
        onResetFilters={vi.fn()}
      />,
    )

    await user.click(screen.getByTestId('free-only-filter'))

    expect(onFiltersChange).toHaveBeenCalledWith({
      ...baseFilters,
      freeOnly: true,
    })
  })

  it('shows active filter count and emits reset', async () => {
    const user = userEvent.setup()
    const onResetFilters = vi.fn()

    render(
      <FilterBar
        filters={{ ...baseFilters, category: 'park', freeOnly: true }}
        onFiltersChange={vi.fn()}
        activeFilterCount={2}
        showResetButton={true}
        onResetFilters={onResetFilters}
      />,
    )

    expect(screen.getByTestId('active-filter-count')).toHaveTextContent('activeFiltersCount')

    await user.click(screen.getByTestId('reset-filters-button'))

    expect(onResetFilters).toHaveBeenCalledOnce()
  })
})
