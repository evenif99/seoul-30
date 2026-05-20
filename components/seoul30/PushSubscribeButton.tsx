'use client'

import { Bell, BellOff } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { usePush } from '@/hooks/use-push'

export function PushSubscribeButton() {
  const { state, subscribe, unsubscribe } = usePush()
  const t = useTranslations('push')

  if (state === 'unsupported' || state === 'loading') return null

  if (state === 'denied') {
    return (
      <button
        disabled
        className="flex items-center gap-1.5 text-xs text-muted-foreground px-3 py-1.5 rounded-full bg-secondary cursor-not-allowed"
        title={t('deniedTitle')}
      >
        <BellOff className="w-3.5 h-3.5" />
        {t('denied')}
      </button>
    )
  }

  if (state === 'subscribed') {
    return (
      <button
        onClick={unsubscribe}
        className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        <Bell className="w-3.5 h-3.5" />
        {t('subscribed')}
      </button>
    )
  }

  return (
    <button
      onClick={subscribe}
      className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
    >
      <Bell className="w-3.5 h-3.5" />
      {t('subscribe')}
    </button>
  )
}
