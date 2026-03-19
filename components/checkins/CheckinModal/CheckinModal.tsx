'use client'

import { useState } from 'react'
import styles from './CheckinModal.module.css'

type Task = {
  id: string
  title: string
  status: string | null
  actionPlan: { title: string } | null
}

const CONFIDENCE_LABELS = ['', 'Muito baixa', 'Baixa', 'Média', 'Alta', 'Muito alta']

function getConfidenceColor(value: number): string {
  if (value <= 2) return '#c0392b'
  if (value === 3) return '#d68910'
  return '#1e8449'
}

export function CheckinModal({
  task,
  onClose,
  onComplete,
}: {
  task: Task
  onClose: () => void
  onComplete: () => void
}) {
  const [progressNotes, setProgressNotes] = useState('')
  const [blockerNotes, setBlockerNotes] = useState('')
  const [confidenceRating, setConfidenceRating] = useState(3)
  const [newStatus, setNewStatus] = useState(task.status ?? 'In Progress')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!progressNotes.trim()) return
    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/checkins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: task.id,
          progressNotes,
          blockerNotes: blockerNotes || undefined,
          confidenceRating,
          newStatus,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Erro ao enviar check-in')
        return
      }

      onComplete()
    } catch {
      setError('Erro de conexão')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <form className={styles.modal} onClick={e => e.stopPropagation()} onSubmit={handleSubmit}>
        <h3 className={styles.title}>Check-in: {task.title}</h3>
        {task.actionPlan && (
          <p className={styles.planName}>{task.actionPlan.title}</p>
        )}

        <label className={styles.fieldLabel}>
          O que você avançou esta semana? *
          <textarea
            className={styles.textarea}
            rows={3}
            value={progressNotes}
            onChange={e => setProgressNotes(e.target.value)}
            required
          />
        </label>

        <label className={styles.fieldLabel}>
          Algum bloqueio ou impedimento?
          <textarea
            className={styles.textarea}
            rows={2}
            value={blockerNotes}
            onChange={e => setBlockerNotes(e.target.value)}
          />
        </label>

        <div className={styles.fieldLabel}>
          Confiança na entrega no prazo
          <div className={styles.sliderRow}>
            <input
              type="range"
              min={1}
              max={5}
              value={confidenceRating}
              onChange={e => setConfidenceRating(Number(e.target.value))}
              className={styles.slider}
              style={{ accentColor: getConfidenceColor(confidenceRating) }}
            />
            <span
              className={styles.confidenceLabel}
              style={{ color: getConfidenceColor(confidenceRating) }}
            >
              {confidenceRating} — {CONFIDENCE_LABELS[confidenceRating]}
            </span>
          </div>
        </div>

        <label className={styles.fieldLabel}>
          Atualizar status da task
          <select
            className={styles.select}
            value={newStatus}
            onChange={e => setNewStatus(e.target.value)}
          >
            <option value="To Do">To Do</option>
            <option value="In Progress">In Progress</option>
            <option value="In Review">In Review</option>
            <option value="Done">Done</option>
            <option value="Blocked">Blocked</option>
          </select>
        </label>

        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.actions}>
          <button type="button" className={styles.ghostBtn} onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className={styles.submitBtn} disabled={submitting}>
            {submitting ? 'Enviando...' : 'Enviar check-in'}
          </button>
        </div>
      </form>
    </div>
  )
}
