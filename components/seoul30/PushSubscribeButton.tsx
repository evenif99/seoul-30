'use client'

import { useState, useRef, useEffect } from 'react'
import { Bell, BellOff } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { usePush } from '@/hooks/use-push'

const CATEGORIES = ['culture', 'library', 'park', 'sports', 'welfare'] as const
type Category = (typeof CATEGORIES)[number]

export function PushSubscribeButton() {
  const { state, subscribe, unsubscribe } = usePush()
  const t = useTranslations('push')
  const [selecting, setSelecting] = useState(false)
  const [selected, setSelected] = useState<Set<Category>>(new Set(CATEGORIES))
  const panelRef = useRef<HTMLDivElement>(null)

  // 패널 외부 클릭 시 닫기
  useEffect(() => {
    if (!selecting) return
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setSelecting(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [selecting])

  function toggleCategory(cat: Category) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(cat)) next.delete(cat)
      else next.add(cat)
      return next
    })
  }

  async function handleConfirm() {
    setSelecting(false)
    // 전체 선택 = 빈 배열(서버에서 전체 알림 대상으로 처리)
    const tags = selected.size === CATEGORIES.length ? [] : Array.from(selected)
    await subscribe(tags)
  }

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

  // unsubscribed — 카테고리 선택 UI
  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setSelecting((v) => !v)}
        className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
        aria-expanded={selecting}
      >
        <Bell className="w-3.5 h-3.5" />
        {t('subscribe')}
      </button>

      {selecting && (
        <div className="absolute right-0 top-full mt-2 z-50 w-64 bg-card border border-border rounded-2xl shadow-lg p-4">
          <p className="text-xs font-semibold text-foreground mb-3">{t('selectTitle')}</p>

          <div className="flex flex-wrap gap-1.5 mb-4">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => toggleCategory(cat)}
                className={cn(
                  'text-xs px-2.5 py-1 rounded-full border transition-colors',
                  selected.has(cat)
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-card text-muted-foreground border-border hover:border-primary/40',
                )}
              >
                {t(`categories.${cat}` as Parameters<typeof t>[0])}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleConfirm}
              disabled={selected.size === 0}
              className="flex-1 text-xs font-medium py-1.5 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {t('confirm')}
            </button>
            <button
              type="button"
              onClick={() => setSelecting(false)}
              className="flex-1 text-xs font-medium py-1.5 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
            >
              {t('cancel')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
