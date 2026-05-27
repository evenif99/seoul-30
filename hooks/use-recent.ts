'use client'

import { useState, useEffect, useCallback } from 'react'
import type { NormalizedPlace } from '@/lib/types/place'

const KEY = 'seoul30:recent'
const DATA_KEY = 'seoul30:recent_data'
const TIMESTAMPS_KEY = 'seoul30:recent_timestamps'
const LIMIT = 20

/** 최근 본 장소의 전체 데이터를 localStorage에 저장 — 실 API 장소도 최근 본 탭에 표시 가능 */
function savePlaceData(place: NormalizedPlace) {
  try {
    const data: Record<string, NormalizedPlace> = JSON.parse(localStorage.getItem(DATA_KEY) ?? '{}')
    data[place.id] = place
    // 최대 30개 항목만 유지
    const keys = Object.keys(data)
    if (keys.length > 30) delete data[keys[0]]
    localStorage.setItem(DATA_KEY, JSON.stringify(data))
  } catch {}
}

export function useRecent() {
  const [recent, setRecent] = useState<string[]>([])
  const [timestamps, setTimestamps] = useState<Record<string, number>>({})

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY)
      if (raw) setRecent(JSON.parse(raw))
    } catch {}
    try {
      const rawTs = localStorage.getItem(TIMESTAMPS_KEY)
      if (rawTs) setTimestamps(JSON.parse(rawTs))
    } catch {}
  }, [])

  const push = useCallback((id: string, place?: NormalizedPlace) => {
    const now = Date.now()
    setRecent((prev) => {
      const next = [id, ...prev.filter((v) => v !== id)].slice(0, LIMIT)
      try {
        localStorage.setItem(KEY, JSON.stringify(next))
      } catch {}
      return next
    })
    setTimestamps((prev) => {
      const next = { ...prev, [id]: now }
      try {
        localStorage.setItem(TIMESTAMPS_KEY, JSON.stringify(next))
      } catch {}
      return next
    })
    if (place) savePlaceData(place)
  }, [])

  return { recent, push, timestamps }
}
