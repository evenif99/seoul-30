'use client'

import { useState, useRef, useEffect } from 'react'
import { Bell, BellOff, ChevronDown } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { usePush } from '@/hooks/use-push'

const CATEGORIES = ['culture', 'library', 'park', 'sports', 'welfare'] as const
type Category = (typeof CATEGORIES)[number]

export function PushSubscribeButton() {
  const { state, subscribe, unsubscribe, updateTags, currentTags } = usePush()
  const t = useTranslations('push')

  // 미구독 상태: 카테고리 선택 패널
  const [selecting, setSelecting] = useState(false)
  // 구독 중 상태: 카테고리 편집 패널
  const [editing, setEditing] = useState(false)
  // 패널 내 선택 상태 (selecting/editing 양쪽 공용)
  const [selected, setSelected] = useState<Set<Category>>(new Set(CATEGORIES))

  const panelRef = useRef<HTMLDivElement>(null)

  // 패널 외부 클릭 / ESC 키 시 닫기
  useEffect(() => {
    if (!selecting && !editing) return
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setSelecting(false)
        setEditing(false)
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setSelecting(false)
        setEditing(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [selecting, editing])

  function toggleCategory(cat: Category) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(cat)) next.delete(cat)
      else next.add(cat)
      return next
    })
  }

  // 미구독 → 구독 확인
  async function handleConfirm() {
    setSelecting(false)
    const tags = selected.size === CATEGORIES.length ? [] : Array.from(selected)
    await subscribe(tags)
  }

  // 구독 중 → 편집 패널 열기 (현재 태그로 초기화)
  function handleOpenEdit() {
    const initial =
      currentTags.length === 0
        ? new Set(CATEGORIES)
        : new Set(currentTags as Category[])
    setSelected(initial)
    setEditing(true)
  }

  // 구독 중 → 태그 저장
  async function handleSave() {
    setEditing(false)
    const tags = selected.size === CATEGORIES.length ? [] : Array.from(selected)
    await updateTags(tags)
  }

  // 현재 구독 태그 요약 문자열
  function getTagSummary(): string {
    if (currentTags.length === 0) return t('subscribedAll')
    const labels = currentTags
      .slice(0, 2)
      .map((c) => t(`categories.${c}` as Parameters<typeof t>[0]))
    const suffix = currentTags.length > 2 ? ` +${currentTags.length - 2}` : ''
    return labels.join(', ') + suffix
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

  // ── 구독 중 ──────────────────────────────────────────────────────────────
  if (state === 'subscribed') {
    return (
      <div className="relative" ref={panelRef}>
        {/* 구독 중 버튼 — 클릭 시 편집 패널 */}
        <button
          onClick={handleOpenEdit}
          aria-expanded={editing}
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Bell className="w-3.5 h-3.5 shrink-0" />
          <span className="max-w-[120px] truncate">{t('subscribed')} · {getTagSummary()}</span>
          <ChevronDown className={cn('w-3 h-3 shrink-0 transition-transform', editing && 'rotate-180')} />
        </button>

        {/* 카테고리 편집 패널 */}
        {editing && (
          <div
            role="dialog"
            aria-modal="false"
            aria-label={t('editTitle')}
            className="absolute right-0 top-full mt-2 z-50 w-72 bg-card border border-border rounded-2xl shadow-lg p-4"
          >
            <p className="text-xs font-semibold text-foreground mb-3" aria-hidden="true">{t('editTitle')}</p>

            <div className="flex flex-wrap gap-1.5 mb-4" role="group" aria-label={t('editTitle')}>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => toggleCategory(cat)}
                  aria-pressed={selected.has(cat)}
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

            <div className="flex gap-2 mb-2">
              <button
                type="button"
                onClick={handleSave}
                disabled={selected.size === 0}
                className="flex-1 text-xs font-medium py-1.5 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {t('save')}
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="flex-1 text-xs font-medium py-1.5 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
              >
                {t('cancel')}
              </button>
            </div>

            {/* 구독 취소 */}
            <button
              type="button"
              onClick={() => { setEditing(false); unsubscribe() }}
              className="w-full text-xs text-muted-foreground hover:text-destructive transition-colors py-1"
            >
              {t('unsubscribeAction')}
            </button>
          </div>
        )}
      </div>
    )
  }

  // ── 미구독 — 카테고리 선택 UI ─────────────────────────────────────────────
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
        <div
          role="dialog"
          aria-modal="false"
          aria-label={t('selectTitle')}
          className="absolute right-0 top-full mt-2 z-50 w-64 bg-card border border-border rounded-2xl shadow-lg p-4"
        >
          <p className="text-xs font-semibold text-foreground mb-3" aria-hidden="true">{t('selectTitle')}</p>

          <div className="flex flex-wrap gap-1.5 mb-4" role="group" aria-label={t('selectTitle')}>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => toggleCategory(cat)}
                aria-pressed={selected.has(cat)}
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
              onClick={() => { setSelecting(false); setSelected(new Set(CATEGORIES)) }}
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
