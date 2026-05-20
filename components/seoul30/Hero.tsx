'use client'

import { Sun, Ticket, Users } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { TODAY_CONDITIONS } from '@/lib/data'

type IconName = 'sun' | 'ticket' | 'users'

const ICON_MAP: Record<IconName, React.ElementType> = {
  sun: Sun,
  ticket: Ticket,
  users: Users,
}

type GreetingKey = 'dawn' | 'morning' | 'lunch' | 'afternoon' | 'evening' | 'night'

function getGreetingKey(): GreetingKey {
  const hour = new Date().getHours()
  if (hour < 6) return 'dawn'
  if (hour < 11) return 'morning'
  if (hour < 14) return 'lunch'
  if (hour < 18) return 'afternoon'
  if (hour < 21) return 'evening'
  return 'night'
}

export function Hero() {
  const t = useTranslations('hero')
  const greetingKey = getGreetingKey()

  return (
    <section className="px-4 pt-6 pb-4 max-w-2xl mx-auto">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-foreground leading-snug text-balance">
          <span className="text-primary">{t('headingPart1')}</span>{t('headingPart2')}
          <br />
          {t('headingLine2')}
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {t(`greetings.${greetingKey}`)}{t('greetingSuffix')}
        </p>
        <p className="mt-1 text-xs text-muted-foreground/70">
          {t('byline')}
        </p>
      </div>

      <div className="flex items-center gap-2 flex-wrap" role="list" aria-label={t('conditionsLabel')}>
        {TODAY_CONDITIONS.map((cond) => {
          const Icon = ICON_MAP[cond.icon as IconName]
          return (
            <div
              key={cond.label}
              role="listitem"
              className="flex items-center gap-1.5 bg-accent text-accent-foreground text-xs font-medium px-3 py-1.5 rounded-full"
            >
              <Icon className="w-3 h-3" aria-hidden="true" />
              <span>{cond.label}</span>
            </div>
          )
        })}
      </div>
    </section>
  )
}
