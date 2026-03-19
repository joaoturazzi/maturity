import styles from './TaskStatusCard.module.css'

type Summary = {
  total: number
  todo: number
  inProgress: number
  inReview: number
  done: number
  blocked: number
}

const STATUS_CONFIG = [
  { key: 'todo',       label: 'To Do',       color: '#555' },
  { key: 'inProgress', label: 'In Progress',  color: '#1a5276' },
  { key: 'inReview',   label: 'In Review',    color: '#8e44ad' },
  { key: 'done',       label: 'Done',         color: '#1e8449' },
  { key: 'blocked',    label: 'Blocked',      color: '#c0392b' },
] as const

export function TaskStatusCard({ summary }: { summary: Summary }) {
  return (
    <div className={styles.card}>
      <span className={styles.label}>Tasks</span>
      <div className={styles.total}>
        <span className={styles.totalNum}>{summary.total}</span>
        <span className={styles.totalSuffix}>total</span>
      </div>
      <div className={styles.statuses}>
        {STATUS_CONFIG.map(s => (
          <div key={s.key} className={styles.statusItem}>
            <span className={styles.dot} style={{ background: s.color }} />
            <span className={styles.statusLabel}>{s.label}</span>
            <span className={styles.statusCount}>{summary[s.key]}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
