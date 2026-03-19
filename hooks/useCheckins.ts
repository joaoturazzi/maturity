'use client'

import { useCallback, useState } from 'react'

interface Checkin {
  id: string
  taskId: string
  progressNotes: string | null
  blockerNotes: string | null
  confidenceRating: number | null
  submittedAt: string
}

export function useCheckins() {
  const [checkins, setCheckins] = useState<Checkin[]>([])
  const [loading, setLoading] = useState(false)

  const fetchWeeklyCheckins = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/checkins?week=current')
      const data = await res.json()
      setCheckins(data.checkins ?? [])
    } catch (error) {
      console.error('Failed to fetch checkins:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const submitCheckin = useCallback(async (checkin: Partial<Checkin>) => {
    try {
      const res = await fetch('/api/checkins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(checkin),
      })
      const data = await res.json()
      if (data.checkin) {
        setCheckins(prev => [data.checkin, ...prev])
      }
      return data
    } catch (error) {
      console.error('Failed to submit checkin:', error)
      return null
    }
  }, [])

  return { checkins, loading, fetchWeeklyCheckins, submitCheckin }
}
