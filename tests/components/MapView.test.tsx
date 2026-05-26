import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { MapView } from '@/components/seoul30/MapView'

describe('MapView', () => {
  it('shows a fallback when the Naver Maps key is not configured', () => {
    render(<MapView results={[]} />)

    expect(screen.getByTestId('map-fallback')).toBeInTheDocument()
    expect(screen.getByText('mapUnavailable')).toBeInTheDocument()
    expect(screen.getByText('mapMissingKey')).toBeInTheDocument()
  })
})
