'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import styles from './page.module.css'

export function StartDiagnosticButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    setLoading(true)
    try {
      const res = await fetch('/api/diagnostic/start', { method: 'POST' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? 'Erro ao iniciar diagnóstico')
      }
      const data = await res.json()
      router.push(`/diagnostic/${data.cycleId}`)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao iniciar diagnóstico')
      setLoading(false)
    }
  }

  return (
    <button
      className={styles.primaryBtn}
      onClick={handleClick}
      disabled={loading}
    >
      {loading ? 'Iniciando...' : '+ Novo Diagnóstico'}
    </button>
  )
}
