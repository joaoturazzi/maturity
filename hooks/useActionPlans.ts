'use client'

import { useCallback, useState } from 'react'

interface ActionPlanWithTasks {
  id: string
  title: string
  description: string | null
  priority: string | null
  status: string
  totalTasks: number
  completedTasks: number
  completionPercentage: number
}

export function useActionPlans() {
  const [plans, setPlans] = useState<ActionPlanWithTasks[]>([])
  const [loading, setLoading] = useState(false)

  const fetchPlans = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/action-plans')
      const data = await res.json()
      setPlans(data.plans ?? [])
    } catch (error) {
      console.error('Failed to fetch plans:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  return { plans, loading, fetchPlans }
}
