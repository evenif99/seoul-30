'use client'

import { useCallback, useEffect, useState } from 'react'

type PushState = 'unsupported' | 'denied' | 'subscribed' | 'unsubscribed' | 'loading'

const PUSH_TAGS_KEY = 'seoul30:push:tags'

export function usePush() {
  const [state, setState] = useState<PushState>('loading')
  // 현재 구독 중인 카테고리 태그 (빈 배열 = 전체 카테고리)
  const [currentTags, setCurrentTags] = useState<string[]>([])

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setState('unsupported')
      return
    }
    if (Notification.permission === 'denied') {
      setState('denied')
      return
    }
    navigator.serviceWorker.ready.then(async (reg) => {
      const sub = await reg.pushManager.getSubscription()
      setState(sub ? 'subscribed' : 'unsubscribed')
    })
  }, [])

  // 구독 태그 localStorage 복원 (브라우저 마운트 후)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(PUSH_TAGS_KEY)
      if (raw) setCurrentTags(JSON.parse(raw) as string[])
    } catch {}
  }, [])

  // tags: 관심 카테고리 배열 (빈 배열 = 전체)
  const subscribe = useCallback(async (tags: string[] = []) => {
    setState('loading')
    try {
      const reg = await navigator.serviceWorker.ready
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        setState('denied')
        return
      }

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? '',
        ),
      })

      const subJson = sub.toJSON()
      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...subJson, tags }),
      })
      if (!res.ok) throw new Error('subscribe api failed')

      // 구독 태그 localStorage 저장
      localStorage.setItem(PUSH_TAGS_KEY, JSON.stringify(tags))
      setCurrentTags(tags)
      setState('subscribed')
    } catch {
      setState('unsubscribed')
    }
  }, [])

  /**
   * 이미 구독 중인 상태에서 카테고리 태그만 업데이트한다.
   * 브라우저 PushManager 구독은 유지하고 서버 DB tags 컬럼만 갱신.
   */
  const updateTags = useCallback(async (tags: string[]) => {
    setState('loading')
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (!sub) { setState('unsubscribed'); return }

      const subJson = sub.toJSON()
      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...subJson, tags }),
      })
      if (!res.ok) throw new Error('updateTags failed')

      localStorage.setItem(PUSH_TAGS_KEY, JSON.stringify(tags))
      setCurrentTags(tags)
      setState('subscribed')
    } catch {
      // 업데이트 실패해도 구독 상태는 유지
      setState('subscribed')
    }
  }, [])

  const unsubscribe = useCallback(async () => {
    setState('loading')
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (!sub) { setState('unsubscribed'); return }
      await fetch('/api/push/subscribe', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: sub.endpoint }),
      })
      await sub.unsubscribe()

      // 구독 태그 localStorage 삭제
      localStorage.removeItem(PUSH_TAGS_KEY)
      setCurrentTags([])
      setState('unsubscribed')
    } catch {
      setState('subscribed')
    }
  }, [])

  return { state, subscribe, unsubscribe, updateTags, currentTags }
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)))
}
