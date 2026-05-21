import { getRequestConfig } from 'next-intl/server'
import { cookies } from 'next/headers'

const LOCALES = ['ko', 'en'] as const
type Locale = (typeof LOCALES)[number]

function isValidLocale(v: string | undefined): v is Locale {
  return LOCALES.includes(v as Locale)
}

export default getRequestConfig(async () => {
  const cookieStore = await cookies()
  const raw = cookieStore.get('NEXT_LOCALE')?.value
  const locale: Locale = isValidLocale(raw) ? raw : 'ko'

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
    onError(error) {
      if (error.code === 'MISSING_MESSAGE') {
        console.warn('[next-intl] missing key:', error.message)
      } else {
        throw error
      }
    },
    getMessageFallback({ key }: { namespace?: string; key: string; error: unknown }) {
      return key.split('.').pop() ?? key
    },
  }
})
