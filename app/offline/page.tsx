import { getTranslations } from 'next-intl/server'

export default async function OfflinePage() {
  const t = await getTranslations('offline')

  return (
    <main id="main-content" className="min-h-screen bg-background flex flex-col items-center justify-center px-4 text-center">
      <div className="text-5xl mb-4" aria-hidden="true">📡</div>
      <h1 className="text-xl font-bold text-foreground mb-2">{t('title')}</h1>
      <p className="text-sm text-muted-foreground mb-6">{t('body')}</p>
      <a href="/" className="text-sm font-medium text-primary hover:underline">
        {t('backHome')}
      </a>
    </main>
  )
}
