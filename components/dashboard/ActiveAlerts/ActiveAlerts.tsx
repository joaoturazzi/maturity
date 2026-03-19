'use client'

import { useState } from 'react'
import styles from './ActiveAlerts.module.css'

type Alert = {
  id: string
  alertType: string | null
  severity: string | null
  message: string | null
  createdAt: Date | null
}

const ALERT_COLORS: Record<string, string> = {
  'Overdue Task':      '#c0392b',
  'Missing Check-in':  '#d68910',
  'Stalled Dimension': '#d68910',
  'Diagnostic Due':    '#555',
}

export function ActiveAlerts({ alerts: initialAlerts }: { alerts: Alert[] }) {
  const [alerts, setAlerts] = useState(initialAlerts)

  async function markAsRead(id: string) {
    await fetch(`/api/alerts/${id}/read`, { method: 'PATCH' })
    setAlerts(prev => prev.filter(a => a.id !== id))
  }

  return (
    <div className={styles.card}>
      <span className={styles.label}>Alertas</span>
      {alerts.length === 0 ? (
        <p className={styles.empty}>Nenhum alerta pendente.</p>
      ) : (
        <div className={styles.list}>
          {alerts.map(alert => {
            const dotColor = ALERT_COLORS[alert.alertType ?? ''] ?? '#555'
            return (
              <div key={alert.id} className={styles.item}>
                <span className={styles.dot} style={{ background: dotColor }} />
                <span className={styles.message}>{alert.message}</span>
                <button
                  className={styles.readBtn}
                  onClick={() => markAsRead(alert.id)}
                  title="Marcar como lido"
                >
                  ✓
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
