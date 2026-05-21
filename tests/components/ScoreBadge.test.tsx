import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ScoreBadge } from '@/components/seoul30/ScoreBadge'
import type { ScoreBreakdown } from '@/lib/types/recommendation'

const highScore: ScoreBreakdown = {
  access: 30,
  relevance: 25,
  cost: 15,
  congestion: 15,
  timefit: 10,
  freshness: 5,
  feedbackBonus: 0,
  total: 100,
}

const lowScore: ScoreBreakdown = {
  access: 10,
  relevance: 0,
  cost: 5,
  congestion: 8,
  timefit: 0,
  freshness: 0,
  feedbackBonus: 0,
  total: 23,
}

describe('ScoreBadge', () => {
  it('displays total score', () => {
    render(<ScoreBadge score={highScore} />)
    expect(screen.getByText('100점')).toBeInTheDocument()
  })

  it('shows reasons that exceed threshold', () => {
    render(<ScoreBadge score={highScore} />)
    expect(screen.getByText('access')).toBeInTheDocument()
    expect(screen.getByText('relevance')).toBeInTheDocument()
    expect(screen.getByText('cost')).toBeInTheDocument()
    expect(screen.getByText('congestion')).toBeInTheDocument()
    expect(screen.getByText('timefit')).toBeInTheDocument()
    expect(screen.getByText('freshness')).toBeInTheDocument()
  })

  it('hides reasons below threshold', () => {
    render(<ScoreBadge score={lowScore} />)
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
  })

  it('shows low total score', () => {
    render(<ScoreBadge score={lowScore} />)
    expect(screen.getByText('23점')).toBeInTheDocument()
  })
})
