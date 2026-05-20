import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { BookmarkButton } from '@/components/seoul30/BookmarkButton'

describe('BookmarkButton', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('toggles a place id in localStorage', async () => {
    const user = userEvent.setup()

    render(<BookmarkButton placeId="mock-1" />)

    const button = screen.getByTestId('bookmark-button-mock-1')
    expect(button).toHaveAttribute('aria-pressed', 'false')

    await user.click(button)

    await waitFor(() => {
      expect(button).toHaveAttribute('aria-pressed', 'true')
    })
    expect(JSON.parse(localStorage.getItem('seoul30:bookmarks') ?? '[]')).toEqual(['mock-1'])
  })
})
