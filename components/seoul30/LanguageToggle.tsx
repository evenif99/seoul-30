'use client'

import { useTranslations } from 'next-intl'

export function LanguageToggle() {
  const t = useTranslations('lang')

  function toggle() {
    const current = document.cookie
      .split('; ')
      .find((c) => c.startsWith('NEXT_LOCALE='))
      ?.split('=')[1] ?? 'ko'

    const next = current === 'ko' ? 'en' : 'ko'
    document.cookie = `NEXT_LOCALE=${next}; path=/; max-age=31536000; SameSite=Lax`
    window.location.reload()
  }

  return (
    <button
      onClick={toggle}
      className="text-xs font-medium px-2.5 py-1 rounded-full border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
      aria-label="Switch language"
    >
      {t('toggle')}
    </button>
  )
}
