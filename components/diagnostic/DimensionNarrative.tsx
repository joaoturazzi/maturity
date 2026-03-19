'use client'

import { useState, useEffect } from 'react'

export function DimensionNarrative({ cycleId, dimensionId, existingNarrative, dimColor }: {
  cycleId: string; dimensionId: string; existingNarrative: string | null; dimColor: string
}) {
  const [narrative, setNarrative] = useState(existingNarrative)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!narrative && !loading) {
      setLoading(true)
      fetch('/api/diagnostic/narrative', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cycleId, dimensionId }),
      })
        .then(r => r.json())
        .then(d => { if (d.narrative) setNarrative(d.narrative) })
        .catch(() => {})
        .finally(() => setLoading(false))
    }
  }, [cycleId, dimensionId, narrative, loading])

  if (loading) return (
    <div style={{ padding: '12px 0', color: '#bbb', fontSize: 12, animation: 'pulse 1.5s infinite' }}>
      Gerando análise...
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
    </div>
  )

  if (!narrative) return null

  return (
    <p style={{ fontSize: 13, color: '#555', lineHeight: 1.6, borderLeft: `3px solid ${dimColor}`, paddingLeft: 12, margin: '8px 0' }}>
      {narrative}
    </p>
  )
}
