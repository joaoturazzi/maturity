'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import styles from './AccelerationBoard.module.css'

type AccelerationEvent = {
  id: string
  eventType: string | null
  title: string | null
  scheduledFor: Date | null
  status: string | null
  notes: string | null
}

const EVENT_COLORS: Record<string, { color: string; bg: string }> = {
  'Building Day':   { color: '#1e8449', bg: '#eafaf1' },
  'Expert Session': { color: '#8e44ad', bg: '#f5eef8' },
  'Board Meeting':  { color: '#1a5276', bg: '#eaf2fb' },
}

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  Scheduled: { bg: '#f4f4f3', color: '#555' },
  Completed: { bg: '#eafaf1', color: '#1e8449' },
  Cancelled: { bg: '#fdf2f2', color: '#c0392b' },
}

function getMonthLabel(date: Date): string {
  return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
}

export function AccelerationBoard({ events, userRole }: { events: AccelerationEvent[]; userRole: string }) {
  const router = useRouter()
  const [showNew, setShowNew] = useState(false)
  const canManage = userRole === 'SuperUser' || userRole === 'Admin'

  const types = ['Building Day', 'Expert Session', 'Board Meeting'] as const
  const stats = types.map(type => {
    const ofType = events.filter(e => e.eventType === type)
    return {
      type,
      completed: ofType.filter(e => e.status === 'Completed').length,
      total: ofType.length,
      color: EVENT_COLORS[type].color,
    }
  })

  const totalCompleted = events.filter(e => e.status === 'Completed').length
  const totalEvents = events.length
  const overallPct = totalEvents > 0 ? Math.round((totalCompleted / totalEvents) * 100) : 0

  // Group events by month
  let lastMonth = ''

  async function handleCreate(formData: FormData) {
    const res = await fetch('/api/acceleration', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventType: formData.get('eventType'),
        title: formData.get('title'),
        scheduledFor: formData.get('scheduledFor'),
        notes: formData.get('notes') || undefined,
      }),
    })
    if (res.ok) { setShowNew(false); router.refresh() }
  }

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/acceleration/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    router.refresh()
  }

  return (
    <div>
      {/* Summary stats */}
      <div className={styles.statsRow}>
        {stats.map(s => (
          <div key={s.type} className={styles.statCard}>
            <span className={styles.statLabel} style={{ color: s.color }}>{s.type}</span>
            <span className={styles.statValue}>{s.completed}/{s.total}</span>
          </div>
        ))}
      </div>

      {/* Overall progress */}
      <div className={styles.overallProgress}>
        <div className={styles.progressTrack}>
          <div className={styles.progressFill} style={{ width: `${overallPct}%` }} />
        </div>
        <span className={styles.progressLabel}>{totalCompleted} de {totalEvents} rituais concluídos</span>
      </div>

      {/* Actions */}
      {canManage && (
        <div className={styles.toolbar}>
          <button className={styles.newBtn} onClick={() => setShowNew(true)}>
            + Novo Evento
          </button>
        </div>
      )}

      {/* New event modal */}
      {showNew && (
        <div className={styles.overlay} onClick={() => setShowNew(false)}>
          <form className={styles.modal} onClick={e => e.stopPropagation()} action={handleCreate}>
            <h3 className={styles.modalTitle}>Novo Evento</h3>
            <label className={styles.fieldLabel}>
              Tipo
              <select name="eventType" className={styles.select} required>
                <option value="Building Day">Building Day</option>
                <option value="Expert Session">Expert Session</option>
                <option value="Board Meeting">Board Meeting</option>
              </select>
            </label>
            <label className={styles.fieldLabel}>
              Título
              <input name="title" required className={styles.input} />
            </label>
            <label className={styles.fieldLabel}>
              Data
              <input name="scheduledFor" type="datetime-local" required className={styles.input} />
            </label>
            <label className={styles.fieldLabel}>
              Notas
              <textarea name="notes" className={styles.textarea} rows={2} />
            </label>
            <div className={styles.modalActions}>
              <button type="button" className={styles.ghostBtn} onClick={() => setShowNew(false)}>Cancelar</button>
              <button type="submit" className={styles.submitBtn}>Criar evento</button>
            </div>
          </form>
        </div>
      )}

      {/* Timeline */}
      {events.length === 0 ? (
        <p className={styles.empty}>Nenhum evento agendado.</p>
      ) : (
        <div className={styles.timeline}>
          {events.map(event => {
            const date = event.scheduledFor ? new Date(event.scheduledFor) : null
            const monthLabel = date ? getMonthLabel(date) : ''
            const showSeparator = monthLabel !== lastMonth
            if (showSeparator) lastMonth = monthLabel

            const typeColors = EVENT_COLORS[event.eventType ?? ''] ?? EVENT_COLORS['Building Day']
            const statusStyle = STATUS_STYLES[event.status ?? 'Scheduled'] ?? STATUS_STYLES.Scheduled
            const isCancelled = event.status === 'Cancelled'

            return (
              <div key={event.id}>
                {showSeparator && (
                  <div className={styles.monthSep}>
                    <span className={styles.monthLabel}>{monthLabel}</span>
                  </div>
                )}
                <div className={styles.eventCard} style={{ opacity: isCancelled ? 0.6 : 1 }}>
                  <div className={styles.typeLine} style={{ background: typeColors.color }} />
                  <div className={styles.eventContent}>
                    <div className={styles.eventHeader}>
                      <span className={styles.typeBadge} style={{ background: typeColors.bg, color: typeColors.color }}>
                        {event.eventType}
                      </span>
                      <span className={styles.statusBadge} style={{ background: statusStyle.bg, color: statusStyle.color }}>
                        {event.status}
                      </span>
                    </div>
                    <span className={styles.eventTitle} style={{ textDecoration: isCancelled ? 'line-through' : 'none' }}>
                      {event.title}
                    </span>
                    {date && (
                      <span className={styles.eventDate}>
                        {date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                      </span>
                    )}
                    {event.notes && <p className={styles.eventNotes}>{event.notes}</p>}
                    {canManage && event.status === 'Scheduled' && (
                      <div className={styles.eventActions}>
                        <button className={styles.completeBtn} onClick={() => updateStatus(event.id, 'Completed')}>
                          Marcar concluído
                        </button>
                        <button className={styles.cancelBtn} onClick={() => updateStatus(event.id, 'Cancelled')}>
                          Cancelar
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
