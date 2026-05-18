'use client'

import { useState, useEffect, useCallback } from 'react'

const KEY = 'seoul30:bookmarks'
const LIMIT = 100

export function useBookmark() {
  const [bookmarks, setBookmarks] = useState<string[]>([])

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY)
      if (raw) setBookmarks(JSON.parse(raw))
    } catch {
      // localStorage 접근 불가 환경 무시
    }
  }, [])

  const save = useCallback((ids: string[]) => {
    try {
      localStorage.setItem(KEY, JSON.stringify(ids))
    } catch {}
    setBookmarks(ids)
  }, [])

  const toggle = useCallback((id: string) => {
    setBookmarks((prev) => {
      const next = prev.includes(id)
        ? prev.filter((v) => v !== id)
        : [id, ...prev].slice(0, LIMIT)
      try {
        localStorage.setItem(KEY, JSON.stringify(next))
      } catch {}
      return next
    })
  }, [])

  const isBookmarked = useCallback(
    (id: string) => bookmarks.includes(id),
    [bookmarks],
  )

  return { bookmarks, toggle, isBookmarked, save }
}
