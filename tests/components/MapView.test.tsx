import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/components/seoul30/MapViewInner', () => ({
  MapViewInner: () => <div data-testid="map-inner" />,
}))

afterEach(() => {
  vi.unstubAllEnvs()
  vi.resetModules()
  ;(window as unknown as { naver?: unknown }).naver = undefined
})

describe('MapView', () => {
  it('shows a fallback when the Naver Maps key is not configured', async () => {
    vi.stubEnv('NEXT_PUBLIC_NAVER_MAP_CLIENT_ID', '')
    const { MapView } = await import('@/components/seoul30/MapView')

    render(<MapView results={[]} />)

    expect(screen.getByTestId('map-fallback')).toBeInTheDocument()
    expect(screen.getByText('mapUnavailable')).toBeInTheDocument()
    expect(screen.getByText('mapMissingKey')).toBeInTheDocument()
  })

  it('renders the map immediately when the Naver Maps SDK is already loaded', async () => {
    vi.stubEnv('NEXT_PUBLIC_NAVER_MAP_CLIENT_ID', 'test-key')
    ;(window as unknown as { naver?: unknown }).naver = { maps: {} }
    const { MapView } = await import('@/components/seoul30/MapView')

    render(<MapView results={[]} />)

    expect(await screen.findByTestId('map-inner')).toBeInTheDocument()
  })
})
