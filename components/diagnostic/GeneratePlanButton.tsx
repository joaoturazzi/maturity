'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function GeneratePlanButton({
  cycleId, companyId, hasExistingPlan,
}: {
  cycleId: string
  companyId: string
  hasExistingPlan: boolean
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleClick() {
    if (hasExistingPlan) {
      router.push('/action-plans')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/action-plans/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cycleId }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Erro ao gerar plano.')
        return
      }
      router.push('/action-plans')
    } catch {
      setError('Erro inesperado.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button onClick={handleClick} disabled={loading} style={{
        background: loading ? '#888' : '#1a1a1a', color: '#fff', border: 'none',
        borderRadius: 6, padding: '10px 24px', fontSize: 13, fontWeight: 700,
        cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
      }}>
        {loading ? 'Gerando plano...' : hasExistingPlan ? 'Ver Plano de Ação →' : 'Gerar Plano de Ação →'}
      </button>
      {error && <p style={{ fontSize: 11, color: '#c0392b', marginTop: 6 }}>{error}</p>}
    </div>
  )
}
