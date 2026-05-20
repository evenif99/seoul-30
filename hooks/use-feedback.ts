'use client'

import { useCallback, useEffect, useState } from 'react'

type Vote = 'UP' | 'DOWN' | null

interface FeedbackState {
  up: number
  down: number
  myVote: Vote
  loading: boolean
  submit: (vote: Vote) => Promise<void>
}

function getSessionId(): string {
  const key = 'seoul30_session_id'
  let id = localStorage.getItem(key)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(key, id)
  }
  return id
}

export function useFeedback(placeId: string): FeedbackState {
  const [up, setUp] = useState(0)
  const [down, setDown] = useState(0)
  const [myVote, setMyVote] = useState<Vote>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const sessionId = getSessionId()
    const storedVote = localStorage.getItem(`seoul30_vote_${placeId}`) as Vote
    setMyVote(storedVote)

    fetch(`/api/places/${placeId}/feedback`)
      .then((r) => r.json())
      .then(({ up: u, down: d }) => { setUp(u); setDown(d) })
      .catch(() => {})
      .finally(() => setLoading(false))

    void sessionId
  }, [placeId])

  const submit = useCallback(async (vote: Vote) => {
    if (!vote) return
    const sessionId = getSessionId()

    const prev = myVote
    // 같은 투표 재클릭 시 취소 (토글) — 서버는 upsert이므로 반대 방향으로 덮어씀
    const next: Vote = prev === vote ? null : vote

    setMyVote(next)
    localStorage.setItem(`seoul30_vote_${placeId}`, next ?? '')

    try {
      const res = await fetch(`/api/places/${placeId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vote: next ?? vote, sessionId }),
      })
      const { up: u, down: d } = await res.json()
      setUp(u)
      setDown(d)
    } catch {
      // 실패 시 롤백
      setMyVote(prev)
      localStorage.setItem(`seoul30_vote_${placeId}`, prev ?? '')
    }
  }, [placeId, myVote])

  return { up, down, myVote, loading, submit }
}
