import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { PlaceCard } from '@/components/seoul30/PlaceCard'
import type { NormalizedPlace } from '@/lib/types/place'

const place: NormalizedPlace = {
  id: 'mock-1',
  slug: 'sample-place',
  sourceType: 'MOCK',
  name: 'Sample Place',
  category: 'park',
  district: 'Seongdong-gu',
  address: '123 Test Road',
  isFree: true,
  openTimeText: '09:00',
  closeTimeText: '18:00',
  imageUrl: 'https://example.com/place.jpg',
}

describe('PlaceCard', () => {
  it('links to the place detail page', () => {
    render(<PlaceCard place={place} />)

    expect(screen.getByRole('link')).toHaveAttribute('href', '/place/mock-1')
    expect(screen.getByText('Sample Place')).toBeInTheDocument()
  })

  it('renders a bookmark control for the place', () => {
    render(<PlaceCard place={place} />)

    expect(screen.getByTestId('bookmark-button-mock-1')).toBeInTheDocument()
  })
})
