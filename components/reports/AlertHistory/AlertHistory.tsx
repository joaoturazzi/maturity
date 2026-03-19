'use client'

import { useState } from 'react'
import styles from './AlertHistory.module.css'

type Alert = {
  id: string
  alertType: string | null
  severity: string | null
  message: string | null
  isRead: boolean | null
  createdAt: Date | null
}

const SEVERITY_STYLES: Record<string, { bg: string; color: string }> = {
  Critical: { bg: '#fdf2f2', color: '#c0392b' },
  High:     { bg: '#fef9e7', color: '#d68910' },
  Medium:   { bg: '#eaf2fb', color: '#1a5276' },
  Low:      { bg: '#f4f4f3', color: '#555' },
}

const PAGE_SIZE = 20

export function AlertHistory({ alerts }: { alerts: Alert[] }) {
  const [page, setPage] = useState(0)

  const totalPages = Math.ceil(alerts.length / PAGE_SIZE)
  const pageAlerts = alerts.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  return (
    <div className={styles.card}>
      <span className={styles.label}>Histórico de Alertas</span>

      {alerts.length === 0 ? (
        <p className={styles.empty}>Nenhum alerta registrado.</p>
      ) : (
        <>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Tipo</th>
                <th className={styles.th}>Severidade</th>
                <th className={styles.th}>Mensagem</th>
                <th className={styles.th}>Data</th>
              </tr>
            </thead>
            <tbody>
              {pageAlerts.map(alert => {
                const severity = alert.severity ?? 'Low'
                const sStyle = SEVERITY_STYLES[severity] ?? SEVERITY_STYLES.Low

                return (
                  <tr key={alert.id} className={styles.row}>
                    <td className={styles.td}>{alert.alertType ?? '—'}</td>
                    <td className={styles.td}>
                      <span className={styles.severityBadge} style={{ background: sStyle.bg, color: sStyle.color }}>
                        {severity}
                      </span>
                    </td>
                    <td className={styles.td}>{alert.message ?? '—'}</td>
                    <td className={styles.td}>
                      {alert.createdAt
                        ? new Date(alert.createdAt).toLocaleDateString('pt-BR')
                        : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                className={styles.pageBtn}
                disabled={page === 0}
                onClick={() => setPage(p => p - 1)}
              >
                ← Anterior
              </button>
              <span className={styles.pageInfo}>
                Página {page + 1} de {totalPages}
              </span>
              <button
                className={styles.pageBtn}
                disabled={page >= totalPages - 1}
                onClick={() => setPage(p => p + 1)}
              >
                Próximo →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
