'use client'

import { useState, useEffect, useCallback } from 'react'

const KEY = 'seoul30:recent'
const LIMIT = 20

export function useRecent() {
  const [recent, setRecent] = useState<string[]>([])

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY)
      if (raw) setRecent(JSON.parse(raw))
    } catch {}
  }, [])

  const push = useCallback((id: string) => {
    setRecent((prev) => {
      const next = [id, ...prev.filter((v) => v !== id)].slice(0, LIMIT)
      try {
        localStorage.setItem(KEY, JSON.stringify(next))
      } catch {}
      return next
    })
  }, [])

  return { recent, push }
}
