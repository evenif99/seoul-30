'use client'

import { Bell, BellOff } from 'lucide-react'
import { usePush } from '@/hooks/use-push'

export function PushSubscribeButton() {
  const { state, subscribe, unsubscribe } = usePush()

  if (state === 'unsupported' || state === 'loading') return null

  if (state === 'denied') {
    return (
      <button
        disabled
        className="flex items-center gap-1.5 text-xs text-muted-foreground px-3 py-1.5 rounded-full bg-secondary cursor-not-allowed"
        title="브라우저에서 알림이 차단되어 있습니다"
      >
        <BellOff className="w-3.5 h-3.5" />
        알림 차단됨
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
        알림 구독 중
      </button>
    )
  }

  return (
    <button
      onClick={subscribe}
      className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
    >
      <Bell className="w-3.5 h-3.5" />
      추천 알림 받기
    </button>
  )
}
