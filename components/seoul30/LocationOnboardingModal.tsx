'use client'

import { MapPin, Navigation } from 'lucide-react'
import { useTranslations } from 'next-intl'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'

interface LocationOnboardingModalProps {
  open: boolean
  denied: boolean
  onAllow: () => void
  onDismiss: () => void
}

export function LocationOnboardingModal({
  open,
  denied,
  onAllow,
  onDismiss,
}: LocationOnboardingModalProps) {
  const t = useTranslations('locationModal')

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onDismiss() }}>
      <DialogContent className="max-w-sm rounded-2xl p-6" aria-describedby="location-modal-desc">
        <DialogHeader className="items-center text-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-50">
            <Navigation className="h-7 w-7 text-blue-500" aria-hidden="true" />
          </div>
          <DialogTitle className="text-base font-semibold leading-snug">
            {t('title')}
          </DialogTitle>
          <DialogDescription id="location-modal-desc" className="text-sm text-muted-foreground leading-relaxed">
            {t('description')}
          </DialogDescription>
        </DialogHeader>

        {/* 이동수단 예시 */}
        <div className="mt-1 grid grid-cols-4 gap-2 rounded-xl bg-muted/50 px-3 py-3">
          {(['subway', 'bus', 'bike', 'walk'] as const).map((mode) => (
            <div key={mode} className="flex flex-col items-center gap-1">
              <span className="text-lg" aria-hidden="true">
                {mode === 'subway' ? '🚇' : mode === 'bus' ? '🚌' : mode === 'bike' ? '🚲' : '🚶'}
              </span>
              <span className="text-[10px] text-muted-foreground">{t(`mode.${mode}`)}</span>
            </div>
          ))}
        </div>

        {/* GPS 거부 시 에러 안내 */}
        {denied && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-[11px] text-red-600 text-center">
            {t('denied')}
          </p>
        )}

        <div className="mt-2 flex flex-col gap-2">
          <button
            type="button"
            onClick={onAllow}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <MapPin className="h-4 w-4" aria-hidden="true" />
            {t('allow')}
          </button>
          <button
            type="button"
            onClick={onDismiss}
            className="w-full rounded-xl px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted"
          >
            {t('dismiss')}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
