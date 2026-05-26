'use client'

import { Download, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { usePwaInstall } from '@/hooks/use-pwa-install'

export function PwaInstallBanner() {
  const t = useTranslations('pwaInstall')
  const { canInstall, promptInstall, dismissInstall } = usePwaInstall()

  if (!canInstall) return null

  return (
    <div className="max-w-2xl mx-auto px-4 mb-3" data-testid="pwa-install-banner">
      <div className="flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Download className="h-4 w-4" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">{t('title')}</p>
          <p className="text-xs text-muted-foreground">{t('body')}</p>
        </div>
        <button
          type="button"
          onClick={promptInstall}
          className="shrink-0 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          {t('install')}
        </button>
        <button
          type="button"
          onClick={dismissInstall}
          className="shrink-0 rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label={t('later')}
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}
