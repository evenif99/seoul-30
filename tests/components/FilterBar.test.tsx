import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { FilterBar, type ActiveFilters } from '@/components/seoul30/FilterBar'

const baseFilters: ActiveFilters = {
  category: 'all',
  crowd: 'all',
  time: '30',
  freeOnly: false,
  search: '',
  openNow: false,
}

describe('FilterBar', () => {
  it('emits search changes', async () => {
    const onFiltersChange = vi.fn()

    render(<FilterBar filters={baseFilters} onFiltersChange={onFiltersChange} />)

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

    render(<FilterBar filters={baseFilters} onFiltersChange={onFiltersChange} />)

    await user.click(screen.getByTestId('free-only-filter'))

    expect(onFiltersChange).toHaveBeenCalledWith({
      ...baseFilters,
      freeOnly: true,
    })
  })
})
