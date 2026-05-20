// 외부 라이브러리 없이 KST 기준 상대 시간 표시
export function relativeTime(isoString: string, locale: 'ko' | 'en'): string {
  const diffMs = Date.now() - new Date(isoString).getTime()
  const diffMin = Math.floor(diffMs / 60_000)

  if (diffMin < 1) return locale === 'ko' ? '방금 전' : 'just now'
  if (diffMin < 60) return locale === 'ko' ? `${diffMin}분 전` : `${diffMin}m ago`

  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return locale === 'ko' ? `${diffHr}시간 전` : `${diffHr}h ago`

  const diffDay = Math.floor(diffHr / 24)
  return locale === 'ko' ? `${diffDay}일 전` : `${diffDay}d ago`
}
