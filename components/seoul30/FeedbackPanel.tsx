'use client'

import { ThumbsUp, ThumbsDown } from 'lucide-react'
import { useFeedback } from '@/hooks/use-feedback'

interface Props {
  placeId: string
}

export function FeedbackPanel({ placeId }: Props) {
  const { up, down, myVote, loading, submit } = useFeedback(placeId)

  return (
    <div className="bg-card border border-border rounded-2xl px-4 py-4 mb-6">
      <p className="text-xs text-muted-foreground mb-3">이 장소가 도움이 됐나요?</p>
      <div className="flex items-center gap-3">
        <button
          onClick={() => submit('UP')}
          disabled={loading}
          aria-label="도움됨"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            myVote === 'UP'
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
          }`}
        >
          <ThumbsUp className="w-3.5 h-3.5" />
          <span>{up}</span>
        </button>
        <button
          onClick={() => submit('DOWN')}
          disabled={loading}
          aria-label="도움안됨"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            myVote === 'DOWN'
              ? 'bg-destructive text-destructive-foreground'
              : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
          }`}
        >
          <ThumbsDown className="w-3.5 h-3.5" />
          <span>{down}</span>
        </button>
      </div>
    </div>
  )
}
