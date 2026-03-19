'use client'

import { useState } from 'react'
import styles from './ExportButton.module.css'

export function ExportButton({ period }: { period: string }) {
  const [loading, setLoading] = useState(false)

  async function handleExport() {
    setLoading(true)
    try {
      const res = await fetch(`/api/reports/export?period=${encodeURIComponent(period)}`)
      if (!res.ok) throw new Error('Falha na exportação')

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `maturityiq-${period.replace('/', '-')}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button className={styles.btn} onClick={handleExport} disabled={loading}>
      {loading ? 'Exportando...' : '↓ Exportar CSV'}
    </button>
  )
}
