'use client'

import { useState, useEffect } from 'react'
import styles from './CheckinHistory.module.css'

type Checkin = {
  id: string
  weekStartDate: string | null
  progressNotes: string | null
  blockerNotes: string | null
  confidenceRating: number | null
  newStatus: string | null
  submittedAt: Date | null
}

const CONFIDENCE_LABELS = ['', 'Muito baixa', 'Baixa', 'Média', 'Alta', 'Muito alta']

export function CheckinHistoryModal({
  taskId,
  onClose,
}: {
  taskId: string
  onClose: () => void
}) {
  const [checkins, setCheckins] = useState<Checkin[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/checkins/history/${taskId}`)
      .then(r => r.json())
      .then(data => {
        setCheckins(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [taskId])

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <h3 className={styles.title}>Histórico de check-ins</h3>

        {loading ? (
          <p className={styles.loading}>Carregando...</p>
        ) : checkins.length === 0 ? (
          <p className={styles.empty}>Nenhum check-in registrado.</p>
        ) : (
          <div className={styles.list}>
            {checkins.map(c => (
              <div key={c.id} className={styles.item}>
                <div className={styles.itemHeader}>
                  <span className={styles.week}>
                    Semana de {c.weekStartDate ? new Date(c.weekStartDate + 'T00:00:00').toLocaleDateString('pt-BR') : '—'}
                  </span>
                  {c.confidenceRating && (
                    <span className={styles.confidence}>
                      Confiança: {c.confidenceRating}/5 ({CONFIDENCE_LABELS[c.confidenceRating]})
                    </span>
                  )}
                </div>
                {c.progressNotes && (
                  <p className={styles.notes}>{c.progressNotes}</p>
                )}
                {c.blockerNotes && (
                  <p className={styles.blockers}>
                    <strong>Bloqueios:</strong> {c.blockerNotes}
                  </p>
                )}
                {c.newStatus && (
                  <span className={styles.statusNote}>Status atualizado para: {c.newStatus}</span>
                )}
              </div>
            ))}
          </div>
        )}

        <div className={styles.actions}>
          <button className={styles.closeBtn} onClick={onClose}>Fechar</button>
        </div>
      </div>
    </div>
  )
}
