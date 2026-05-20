import React from 'react'

export const useTranslations = () => (key: string) => key

export function NextIntlClientProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
