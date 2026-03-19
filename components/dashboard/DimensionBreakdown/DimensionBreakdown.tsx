import styles from './DimensionBreakdown.module.css'

const PRIORITY_STYLES: Record<string, { bg: string; color: string }> = {
  Critical: { bg: '#fdf2f2', color: '#c0392b' },
  High:     { bg: '#fef9e7', color: '#d68910' },
  Medium:   { bg: '#eaf2fb', color: '#1a5276' },
  Low:      { bg: '#f4f4f3', color: '#555' },
}

type Score = {
  weightedScore: string | null
  priorityLevel: string | null
  dimension: { name: string; color: string | null } | null
}

export function DimensionBreakdown({ scores }: { scores: Score[] }) {
  const sorted = [...scores].sort(
    (a, b) => Number(a.weightedScore ?? 0) - Number(b.weightedScore ?? 0)
  )

  return (
    <div className={styles.card}>
      <span className={styles.label}>Dimensões</span>
      <div className={styles.list}>
        {sorted.map((s, i) => {
          const score = Number(s.weightedScore ?? 0)
          const pct = (score / 5) * 100
          const dimColor = s.dimension?.color ?? '#555'
          const priority = s.priorityLevel ?? 'Low'
          const pStyle = PRIORITY_STYLES[priority] ?? PRIORITY_STYLES.Low

          return (
            <div key={i} className={styles.row}>
              <span className={styles.dimName} style={{ color: dimColor }}>
                {s.dimension?.name ?? '—'}
              </span>
              <div className={styles.barTrack}>
                <div
                  className={styles.barFill}
                  style={{ width: `${pct}%`, background: dimColor }}
                />
              </div>
              <span className={styles.scoreVal}>{score.toFixed(1)}/5</span>
              <span
                className={styles.priorityBadge}
                style={{ background: pStyle.bg, color: pStyle.color }}
              >
                {priority}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
