import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { BottomTabBar } from '@/components/seoul30/BottomTabBar'

vi.mock('next/navigation', () => ({
  usePathname: () => '/',
}))

describe('BottomTabBar', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('shows no badge when there are no bookmarks', () => {
    render(<BottomTabBar />)
    // badge element should not exist
    expect(screen.queryByText(/^\d+$/)).toBeNull()
  })

  it('shows count badge when bookmarks exist', () => {
    localStorage.setItem('seoul30:bookmarks', JSON.stringify(['place-1', 'place-2', 'place-3']))
    render(<BottomTabBar />)
    expect(screen.getByText('3')).toBeDefined()
  })

  it('shows 99+ when bookmark count exceeds 99', () => {
    const ids = Array.from({ length: 100 }, (_, i) => `place-${i}`)
    localStorage.setItem('seoul30:bookmarks', JSON.stringify(ids))
    render(<BottomTabBar />)
    expect(screen.getByText('99+')).toBeDefined()
  })
})
