'use client'

import { useState, useEffect, useCallback } from 'react'
import type { NormalizedPlace } from '@/lib/types/place'

const KEY = 'seoul30:bookmarks'
const DATA_KEY = 'seoul30:bookmark_data'
const LIMIT = 100

// BUG-03: 실 API 장소 ID가 콘텐츠 해시 기반으로 변경됨 (스키마 v2).
// 기존 index 기반 ID(ce-0-xxx, lib-1-xxx 등)로 저장된 북마크는 새 ID와 매핑 불가.
// 구형 ID 패턴이 감지된 경우에만 초기화해 테스트 환경의 임의 ID와 충돌하지 않도록 한다.
const SCHEMA_VERSION = '2'
const SCHEMA_KEY = 'seoul30:schema_v'

// 구형 index 기반 ID 패턴: ce-0-xxx, lib-1-xxx, park-2-xxx 등
const OLD_ID_PATTERN = /^(ce|cs|lib|park|sport)-\d+-/

function migrateIfNeeded() {
  try {
    if (localStorage.getItem(SCHEMA_KEY) === SCHEMA_VERSION) return

    // 구형 ID가 실제로 존재할 때만 초기화 (테스트 임의 ID 보호)
    const raw = localStorage.getItem('seoul30:bookmarks')
    const ids: string[] = raw ? JSON.parse(raw) : []
    const hasOldIds = ids.some((id) => OLD_ID_PATTERN.test(id))

    if (hasOldIds) {
      localStorage.removeItem('seoul30:bookmarks')
      localStorage.removeItem('seoul30:bookmark_data')
      localStorage.removeItem('seoul30:recent')
      localStorage.removeItem('seoul30:recent_data')
      localStorage.removeItem('seoul30:recent_timestamps')
    }

    localStorage.setItem(SCHEMA_KEY, SCHEMA_VERSION)
  } catch {}
}

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
    migrateIfNeeded() // 스키마 버전 확인 → 필요 시 초기화
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
