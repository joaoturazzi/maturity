'use client'

import { useState } from 'react'
import { SubmitButton } from '../SubmitButton/SubmitButton'

const COLORS: Record<string, { color: string; bg: string }> = {
  'Estratégia': { color: '#1a5276', bg: '#eaf2fb' },
  'Produto':    { color: '#8e44ad', bg: '#f5eef8' },
  'Mercado':    { color: '#1e8449', bg: '#eafaf1' },
  'Finanças':   { color: '#d68910', bg: '#fef9e7' },
  'Branding':   { color: '#c0392b', bg: '#fdedec' },
}

type Indicator = {
  id: string
  title: string
  description: string
  hasNaOption: boolean
  responseOptions: { level: number; text: string }[]
  feedbackPerLevel: { level: number; feedback: string }[]
}

type Dimension = {
  id: string
  name: string
  orderIndex: number
  indicators: Indicator[]
}

type Props = {
  cycleId: string
  dimensions: Dimension[]
  existingResponses: Record<string, number>
}

export function DiagnosticFlow({ cycleId, dimensions, existingResponses }: Props) {
  const [dimIndex, setDimIndex] = useState(0)
  const [indIndex, setIndIndex] = useState(0)
  const [responses, setResponses] = useState<Record<string, number>>(existingResponses)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [transitioning, setTransitioning] = useState(false)

  const dim = dimensions[dimIndex]
  const ind = dim?.indicators[indIndex]
  const colors = COLORS[dim?.name] ?? { color: '#1a1a1a', bg: '#f7f6f3' }

  const totalInd = dimensions.reduce((s, d) => s + d.indicators.length, 0)
  const answered = Object.keys(responses).length
  const dimAnswered = dim?.indicators.filter(i => responses[i.id] !== undefined).length ?? 0
  const dimTotal = dim?.indicators.length ?? 0
  const currentAnswer = ind ? responses[ind.id] : undefined
  const hasAnswer = currentAnswer !== undefined
  const allAnswered = answered === totalInd
  const isLast = dimIndex === dimensions.length - 1 && indIndex === dimTotal - 1

  async function handleSelect(level: number) {
    if (saving || !ind) return
    setSaving(true)

    const fb = ind.feedbackPerLevel.find(f => f.level === level)
    setFeedback(fb?.feedback ?? null)
    setResponses(prev => ({ ...prev, [ind.id]: level }))

    await fetch('/api/diagnostic/answer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cycleId,
        indicatorId: ind.id,
        dimensionId: dim.id,
        score: level,
        feedbackShown: fb?.feedback ?? '',
      }),
    }).catch(() => {})

    setSaving(false)
  }

  async function handleNext() {
    setFeedback(null)
    setTransitioning(true)
    await new Promise(r => setTimeout(r, 150))

    if (indIndex < dimTotal - 1) {
      setIndIndex(i => i + 1)
    } else if (dimIndex < dimensions.length - 1) {
      setDimIndex(d => d + 1)
      setIndIndex(0)
    }
    setTransitioning(false)
  }

  function handleBack() {
    setFeedback(null)
    if (indIndex > 0) {
      setIndIndex(i => i - 1)
    } else if (dimIndex > 0) {
      const prev = dimensions[dimIndex - 1]
      setDimIndex(d => d - 1)
      setIndIndex(prev.indicators.length - 1)
    }
  }

  if (!dim || !ind) return null

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif', padding: '0 16px' }}>

      {/* Stepper */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 20 }}>
        {dimensions.map((d, i) => {
          const dc = COLORS[d.name] ?? { color: '#bbb', bg: '#f4f4f3' }
          const ans = d.indicators.filter(x => responses[x.id] !== undefined).length
          const tot = d.indicators.length
          const done = ans === tot
          const active = i === dimIndex
          return (
            <div key={d.id} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
              <div style={{ flex: 1 }}>
                <p style={{
                  fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                  letterSpacing: '0.06em', textAlign: 'center', marginBottom: 4,
                  color: active ? dc.color : done ? '#1e8449' : '#bbb',
                }}>{done ? '✓ ' : ''}{d.name}</p>
                <div style={{ height: 4, background: '#eceae5', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: 2, transition: 'width 0.3s',
                    width: `${tot > 0 ? (ans / tot) * 100 : 0}%`,
                    background: done ? '#1e8449' : active ? dc.color : '#bbb',
                  }} />
                </div>
              </div>
              {i < dimensions.length - 1 && <div style={{ width: 8, height: 1, background: '#eceae5', flexShrink: 0 }} />}
            </div>
          )
        })}
      </div>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
            background: colors.bg, color: colors.color,
            textTransform: 'uppercase', letterSpacing: '0.06em',
          }}>{dim.name}</span>
          <span style={{ fontSize: 12, color: '#aaa' }}>Etapa {dimIndex + 1} de {dimensions.length}</span>
        </div>
        <span style={{ fontSize: 12, color: '#aaa' }}>{indIndex + 1} de {dimTotal} perguntas</span>
      </div>

      {/* Question card */}
      <div style={{
        background: '#fff', border: '1px solid #eceae5', borderRadius: 10,
        padding: '28px 32px', marginBottom: 16,
        opacity: transitioning ? 0.4 : 1, transition: 'opacity 0.15s',
      }}>
        <p style={{
          fontSize: 11, fontWeight: 700, color: colors.color,
          textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 8,
        }}>{ind.title}</p>
        <h2 style={{ fontSize: 17, fontWeight: 600, color: '#1a1a1a', lineHeight: 1.5, marginBottom: 24, letterSpacing: '-0.2px' }}>
          {ind.description}
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {ind.responseOptions.map(opt => {
            const sel = currentAnswer === opt.level
            return (
              <button key={opt.level} onClick={() => handleSelect(opt.level)} disabled={saving}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 14, padding: '14px 16px',
                  background: sel ? colors.bg : '#fff',
                  border: `1.5px solid ${sel ? colors.color : '#e5e4e0'}`,
                  borderRadius: 8, cursor: saving ? 'not-allowed' : 'pointer',
                  textAlign: 'left', transition: 'all 0.12s', fontFamily: 'inherit',
                }}>
                <span style={{
                  width: 26, height: 26, borderRadius: '50%',
                  background: sel ? colors.color : '#f0efec',
                  color: sel ? '#fff' : '#888',
                  fontSize: 11, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, marginTop: 1,
                }}>{opt.level === 0 ? 'N/A' : opt.level}</span>
                <span style={{
                  fontSize: 13, color: sel ? '#1a1a1a' : '#555',
                  lineHeight: 1.6, fontWeight: sel ? 600 : 400,
                }}>{opt.text}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Feedback */}
      {feedback && (
        <div style={{
          background: colors.bg, border: `1px solid ${colors.color}30`,
          borderLeft: `3px solid ${colors.color}`,
          borderRadius: 8, padding: '12px 16px', marginBottom: 16,
        }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: colors.color, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
            Feedback do consultor
          </p>
          <p style={{ fontSize: 13, color: '#1a1a1a', lineHeight: 1.6 }}>{feedback}</p>
        </div>
      )}

      {/* Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
        <button onClick={handleBack} disabled={dimIndex === 0 && indIndex === 0}
          style={{
            background: 'transparent', border: '1px solid #e5e4e0', borderRadius: 6,
            padding: '8px 20px', fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
            cursor: dimIndex === 0 && indIndex === 0 ? 'not-allowed' : 'pointer',
            color: dimIndex === 0 && indIndex === 0 ? '#bbb' : '#555',
          }}>← Voltar</button>

        <span style={{ fontSize: 12, color: '#aaa' }}>{answered}/{totalInd} respondidas</span>

        {!isLast ? (
          <button onClick={handleNext} disabled={!hasAnswer}
            style={{
              background: hasAnswer ? '#1a1a1a' : '#f0efec',
              color: hasAnswer ? '#fff' : '#bbb',
              border: 'none', borderRadius: 6, padding: '8px 20px',
              fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
              cursor: hasAnswer ? 'pointer' : 'not-allowed', transition: 'all 0.12s',
            }}>Próxima →</button>
        ) : (
          <SubmitButton cycleId={cycleId} allAnswered={allAnswered} totalAnswered={answered} total={totalInd} />
        )}
      </div>
    </div>
  )
}
