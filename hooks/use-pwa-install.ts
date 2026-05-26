'use client'

import { useCallback, useEffect, useState } from 'react'

const DISMISSED_KEY = 'seoul30:pwa_install_dismissed'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

function isStandaloneDisplay(): boolean {
  if (typeof window === 'undefined') return false
  const navigatorWithStandalone = window.navigator as Navigator & { standalone?: boolean }
  const displayModeStandalone = window.matchMedia?.('(display-mode: standalone)').matches ?? false
  return displayModeStandalone || navigatorWithStandalone.standalone === true
}

export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [dismissed, setDismissed] = useState(true)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    setDismissed(localStorage.getItem(DISMISSED_KEY) === 'true')
    setIsStandalone(isStandaloneDisplay())

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault()
      setDeferredPrompt(event as BeforeInstallPromptEvent)
    }

    const handleAppInstalled = () => {
      localStorage.setItem(DISMISSED_KEY, 'true')
      setDeferredPrompt(null)
      setDismissed(true)
      setIsStandalone(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) return

    await deferredPrompt.prompt()
    const choice = await deferredPrompt.userChoice
    if (choice.outcome === 'accepted') {
      localStorage.setItem(DISMISSED_KEY, 'true')
      setDismissed(true)
    }
    setDeferredPrompt(null)
  }, [deferredPrompt])

  const dismissInstall = useCallback(() => {
    localStorage.setItem(DISMISSED_KEY, 'true')
    setDismissed(true)
    setDeferredPrompt(null)
  }, [])

  return {
    canInstall: Boolean(deferredPrompt) && !dismissed && !isStandalone,
    promptInstall,
    dismissInstall,
    isStandalone,
  }
}
