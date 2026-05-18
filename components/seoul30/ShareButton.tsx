'use client'

import { useState } from 'react'
import { Share2, Check } from 'lucide-react'

interface ShareButtonProps {
  title: string
  text: string
  url: string
}

export function ShareButton({ title, text, url }: ShareButtonProps) {
  const [copied, setCopied] = useState(false)

  async function handleShare() {
    const shareData = { title, text, url }

    try {
      if (navigator.share && navigator.canShare?.(shareData)) {
        await navigator.share(shareData)
        return
      }
    } catch {
      // 사용자 취소 또는 API 미지원 → clipboard fallback
    }

    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  return (
    <button
      onClick={handleShare}
      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
      aria-label="장소 링크 공유"
    >
      {copied ? (
        <>
          <Check className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
          <span className="text-primary font-medium">복사됨</span>
        </>
      ) : (
        <>
          <Share2 className="w-3.5 h-3.5" aria-hidden="true" />
          <span>공유</span>
        </>
      )}
    </button>
  )
}
