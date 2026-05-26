'use client'

import { useState, useEffect, useCallback } from 'react'
import type { NormalizedPlace } from '@/lib/types/place'

const KEY = 'seoul30:bookmarks'
const DATA_KEY = 'seoul30:bookmark_data'
const LIMIT = 100

/** 북마크된 장소의 전체 데이터를 localStorage에 저장 — 실 API 장소도 저장함에 표시 가능 */
function savePlaceData(place: NormalizedPlace) {
  try {
    const data: Record<string, NormalizedPlace> = JSON.parse(localStorage.getItem(DATA_KEY) ?? '{}')
    data[place.id] = place
    localStorage.setItem(DATA_KEY, JSON.stringify(data))
  } catch {}
}

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

  const toggle = useCallback((id: string, place?: NormalizedPlace) => {
    setBookmarks((prev) => {
      const next = prev.includes(id)
        ? prev.filter((v) => v !== id)
        : [id, ...prev].slice(0, LIMIT)
      try {
        localStorage.setItem(KEY, JSON.stringify(next))
      } catch {}
      return next
    })
    // 북마크 추가 시 장소 데이터 저장 (삭제 시는 데이터 유지 — 최근 본 탭과 공유)
    if (place) savePlaceData(place)
  }, [])

  const isBookmarked = useCallback(
    (id: string) => bookmarks.includes(id),
    [bookmarks],
  )

  return { bookmarks, toggle, isBookmarked, save }
}
