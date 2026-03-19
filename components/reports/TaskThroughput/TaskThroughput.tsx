import styles from './TaskThroughput.module.css'

type Props = {
  throughput: { completed: number; active: number; blocked: number }
}

export function TaskThroughput({ throughput }: Props) {
  const stats = [
    { label: 'Concluídas', value: throughput.completed, color: '#1e8449', icon: '✓' },
    { label: 'Ativas',     value: throughput.active,    color: '#1a5276', icon: '⏳' },
    { label: 'Bloqueadas', value: throughput.blocked,   color: '#c0392b', icon: '✗' },
  ]

  return (
    <div className={styles.card}>
      <span className={styles.label}>Task Throughput</span>
      <div className={styles.stats}>
        {stats.map(s => (
          <div key={s.label} className={styles.statItem}>
            <span className={styles.statIcon}>{s.icon}</span>
            <span className={styles.statValue} style={{ color: s.color }}>{s.value}</span>
            <span className={styles.statLabel}>{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
