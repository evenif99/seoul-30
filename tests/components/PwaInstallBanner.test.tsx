import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PwaInstallBanner } from '@/components/seoul30/PwaInstallBanner'

function dispatchInstallPrompt() {
  const event = new Event('beforeinstallprompt', { cancelable: true }) as Event & {
    prompt: ReturnType<typeof vi.fn>
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
  }
  event.prompt = vi.fn().mockResolvedValue(undefined)
  event.userChoice = Promise.resolve({ outcome: 'accepted', platform: 'web' })
  window.dispatchEvent(event)
  return event
}

describe('PwaInstallBanner', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('stays hidden until the browser exposes an install prompt', () => {
    render(<PwaInstallBanner />)
    expect(screen.queryByTestId('pwa-install-banner')).toBeNull()
  })

  it('shows the prompt and calls browser install flow', async () => {
    const user = userEvent.setup()
    render(<PwaInstallBanner />)

    const event = dispatchInstallPrompt()

    expect(await screen.findByTestId('pwa-install-banner')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'install' }))

    await waitFor(() => expect(event.prompt).toHaveBeenCalledTimes(1))
    expect(localStorage.getItem('seoul30:pwa_install_dismissed')).toBe('true')
  })

  it('remembers the later choice', async () => {
    const user = userEvent.setup()
    render(<PwaInstallBanner />)

    dispatchInstallPrompt()

    expect(await screen.findByTestId('pwa-install-banner')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'later' }))

    expect(screen.queryByTestId('pwa-install-banner')).toBeNull()
    expect(localStorage.getItem('seoul30:pwa_install_dismissed')).toBe('true')
  })
})
