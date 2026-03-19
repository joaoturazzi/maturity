'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function SubmitButton({
  cycleId, allAnswered, totalAnswered, total,
}: {
  cycleId: string
  allAnswered: boolean
  totalAnswered: number
  total: number
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/diagnostic/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cycleId }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Erro ao submeter.')
        return
      }
      router.push(`/diagnostic/${cycleId}/result`)
    } catch {
      setError('Erro inesperado. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  if (!allAnswered) {
    return (
      <div style={{ textAlign: 'right' }}>
        <button disabled style={{
          background: '#f0efec', color: '#bbb', border: 'none',
          borderRadius: 6, padding: '8px 20px', fontSize: 13,
          fontWeight: 600, cursor: 'not-allowed', fontFamily: 'inherit',
        }}>Submeter diagnóstico</button>
        <p style={{ fontSize: 11, color: '#bbb', marginTop: 4 }}>
          {totalAnswered}/{total} respondidas
        </p>
      </div>
    )
  }

  return (
    <div style={{ textAlign: 'right' }}>
      <button onClick={handleSubmit} disabled={loading} style={{
        background: loading ? '#888' : '#1e8449', color: '#fff',
        border: 'none', borderRadius: 6, padding: '10px 24px',
        fontSize: 13, fontWeight: 700, fontFamily: 'inherit',
        cursor: loading ? 'not-allowed' : 'pointer',
      }}>{loading ? 'Calculando...' : '✓ Submeter diagnóstico'}</button>
      {error && <p style={{ fontSize: 11, color: '#c0392b', marginTop: 4 }}>{error}</p>}
    </div>
  )
}
