import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { PlaceCardSkeleton } from '@/components/seoul30/PlaceCardSkeleton'

describe('PlaceCardSkeleton', () => {
  it('renders without crashing', () => {
    const { container } = render(<PlaceCardSkeleton />)
    expect(container.firstChild).toBeTruthy()
  })

  it('is hidden from assistive technology', () => {
    const { container } = render(<PlaceCardSkeleton />)
    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true')
  })

  it('renders multiple skeleton elements', () => {
    const { container } = render(<PlaceCardSkeleton />)
    const skeletons = container.querySelectorAll('[data-slot="skeleton"]')
    expect(skeletons.length).toBeGreaterThanOrEqual(4)
  })
})
