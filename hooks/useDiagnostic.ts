'use client'

import { useCallback, useState } from 'react'

interface DiagnosticResponse {
  indicatorId: string
  dimensionId: string
  score: number
  desiredScore?: number
  deficiencyType?: string
  feedbackShown: string
}

export function useDiagnostic(cycleId?: string) {
  const [responses, setResponses] = useState<Record<string, DiagnosticResponse>>({})
  const [loading, setLoading] = useState(false)

  const saveResponse = useCallback(async (response: DiagnosticResponse) => {
    if (!cycleId) return

    setResponses(prev => ({
      ...prev,
      [response.indicatorId]: response,
    }))

    try {
      await fetch('/api/diagnostic/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cycleId, ...response }),
      })
    } catch (error) {
      console.error('Failed to save response:', error)
    }
  }, [cycleId])

  const submitDiagnostic = useCallback(async () => {
    if (!cycleId) return null
    setLoading(true)

    try {
      const res = await fetch('/api/diagnostic/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cycleId }),
      })
      return await res.json()
    } catch (error) {
      console.error('Failed to submit diagnostic:', error)
      return null
    } finally {
      setLoading(false)
    }
  }, [cycleId])

  const startNewCycle = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/diagnostic/start', { method: 'POST' })
      const data = await res.json()
      return data.cycleId as string
    } catch (error) {
      console.error('Failed to start cycle:', error)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  return { responses, loading, saveResponse, submitDiagnostic, startNewCycle }
}
