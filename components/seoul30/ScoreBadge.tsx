'use client'

import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import type { ScoreBreakdown } from '@/lib/types/recommendation'

interface ScoreBadgeProps {
  score: ScoreBreakdown
  className?: string
}

const SCORE_REASONS: Array<{
  key: keyof Omit<ScoreBreakdown, 'total' | 'transitMinutes' | 'transitMode'>
  threshold: number
}> = [
  { key: 'access',     threshold: 20 },
  { key: 'relevance',  threshold: 20 },
  { key: 'cost',       threshold: 15 },
  { key: 'congestion', threshold: 10 },
  { key: 'timefit',    threshold: 10 },
  { key: 'freshness',  threshold: 3  },
]

function scoreColor(total: number) {
  if (total >= 75) return 'bg-emerald-100 text-emerald-700'
  if (total >= 55) return 'bg-blue-100 text-blue-700'
  return 'bg-secondary text-secondary-foreground'
}

export function ScoreBadge({ score, className }: ScoreBadgeProps) {
  const t = useTranslations('score')

  const topReasons = SCORE_REASONS
    .filter(({ key, threshold }) => score[key] >= threshold)
    .map(({ key }) => key)

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <span
        className={cn(
          'self-start text-[11px] font-semibold px-2 py-0.5 rounded-full',
          scoreColor(score.total)
        )}
        aria-label={`${t('label')} ${score.total}`}
      >
        {score.total}점
      </span>

      {topReasons.length > 0 && (
        <div className="flex flex-wrap gap-1" role="list" aria-label={t('label')}>
          {topReasons.map((key) => (
            <span
              key={key}
              role="listitem"
              className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground"
            >
              {t(key)}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
