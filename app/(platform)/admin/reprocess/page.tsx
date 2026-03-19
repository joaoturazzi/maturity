'use client'

import { useState, useEffect } from 'react'

export default function ReprocessPage() {
  const [cycles, setCycles] = useState<Array<{ id: string; score: string; level: string; date: string }>>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const [results, setResults] = useState<Record<string, string>>({})
  const [generating, setGenerating] = useState(false)
  const [generateResult, setGenerateResult] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/reprocess/list')
      .then(r => r.json())
      .then(d => setCycles(d.cycles ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function handleReprocess(cycleId: string) {
    setProcessing(cycleId)
    setResults(prev => ({ ...prev, [cycleId]: 'Processando...' }))

    try {
      const res = await fetch('/api/admin/reprocess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cycleId }),
      })
      const data = await res.json()

      if (data.ok) {
        setResults(prev => ({
          ...prev,
          [cycleId]: `OK — IME: ${data.results?.imeScore ?? '?'}, Narrativas: ${data.results?.narrativesGenerated ?? 0}, Plano: ${data.results?.planGenerated ? 'Sim' : data.results?.planSkipped ? 'Já existia' : 'Não'}`,
        }))
      } else {
        setResults(prev => ({ ...prev, [cycleId]: `Erro: ${data.error ?? 'desconhecido'}` }))
      }
    } catch {
      setResults(prev => ({ ...prev, [cycleId]: 'Erro de conexão' }))
    } finally {
      setProcessing(null)
    }
  }

  async function handleGenerateAllPlans() {
    setGenerating(true)
    setGenerateResult('Gerando planos para ciclos sem plano...')

    try {
      const res = await fetch('/api/action-plans/generate-existing', { method: 'POST' })
      const data = await res.json()

      if (data.ok) {
        const details = (data.results ?? [])
          .map((r: { cycleId: string; status: string; plans?: number }) =>
            r.status === 'skipped' ? null : `${r.cycleId.slice(0, 8)}: ${r.plans ?? 0} planos`
          )
          .filter(Boolean)

        setGenerateResult(
          data.generated > 0
            ? `OK — ${data.generated} planos gerados. ${details.join(', ')}`
            : 'Nenhum plano novo necessário — todos os ciclos já têm planos.'
        )
      } else {
        setGenerateResult(`Erro: ${data.error ?? 'desconhecido'}`)
      }
    } catch {
      setGenerateResult('Erro de conexão')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Reprocessar Diagnósticos</h1>
      <p style={{ fontSize: 13, color: '#888', marginBottom: 24 }}>
        Recalcular scores, gerar narrativas e regenerar planos de ação.
      </p>

      {/* Generate all missing plans */}
      <div style={{
        background: '#f0efec', border: '1px solid #e5e4e0', borderRadius: 8,
        padding: '16px 20px', marginBottom: 24,
      }}>
        <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>
          Gerar planos de ação faltantes
        </p>
        <p style={{ fontSize: 12, color: '#888', marginBottom: 12 }}>
          Verifica todos os diagnósticos concluídos e gera planos para os que ainda não têm.
        </p>
        <button
          onClick={handleGenerateAllPlans}
          disabled={generating}
          style={{
            background: generating ? '#888' : '#1e8449',
            color: '#fff', border: 'none', borderRadius: 6,
            padding: '8px 16px', fontSize: 13, fontWeight: 600,
            cursor: generating ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit',
          }}
        >
          {generating ? 'Gerando...' : 'Gerar planos faltantes'}
        </button>
        {generateResult && (
          <p style={{
            fontSize: 12, marginTop: 10,
            color: generateResult.startsWith('OK') || generateResult.startsWith('Nenhum') ? '#1e8449' : '#c0392b',
            background: generateResult.startsWith('OK') || generateResult.startsWith('Nenhum') ? '#eafaf1' : '#fdf2f2',
            padding: '6px 10px', borderRadius: 4,
          }}>
            {generateResult}
          </p>
        )}
      </div>

      {/* Individual cycle reprocess */}
      <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Diagnósticos individuais</h2>

      {loading && <p style={{ color: '#bbb' }}>Carregando diagnósticos...</p>}

      {!loading && cycles.length === 0 && (
        <p style={{ color: '#bbb' }}>Nenhum diagnóstico submetido encontrado.</p>
      )}

      {cycles.map(cycle => (
        <div key={cycle.id} style={{
          background: '#fff', border: '1px solid #eceae5', borderRadius: 8,
          padding: '16px 20px', marginBottom: 12,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: 14, fontWeight: 600 }}>
                IME Score: {cycle.score} — {cycle.level}
              </p>
              <p style={{ fontSize: 11, color: '#888' }}>
                {cycle.date} · ID: {cycle.id.slice(0, 8)}...
              </p>
            </div>
            <button
              onClick={() => handleReprocess(cycle.id)}
              disabled={processing !== null}
              style={{
                background: processing === cycle.id ? '#888' : '#1a1a1a',
                color: '#fff', border: 'none', borderRadius: 6,
                padding: '8px 16px', fontSize: 13, fontWeight: 600,
                cursor: processing !== null ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
              }}
            >
              {processing === cycle.id ? 'Processando...' : 'Reprocessar'}
            </button>
          </div>
          {results[cycle.id] && (
            <p style={{
              fontSize: 12, marginTop: 10,
              color: results[cycle.id].startsWith('OK') ? '#1e8449' : '#c0392b',
              background: results[cycle.id].startsWith('OK') ? '#eafaf1' : '#fdf2f2',
              padding: '6px 10px', borderRadius: 4,
            }}>
              {results[cycle.id]}
            </p>
          )}
        </div>
      ))}
    </div>
  )
}
