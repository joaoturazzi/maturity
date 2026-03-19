import styles from './DimensionTrends.module.css'

const PRIORITY_STYLES: Record<string, { bg: string; color: string }> = {
  Critical: { bg: '#fdf2f2', color: '#c0392b' },
  High:     { bg: '#fef9e7', color: '#d68910' },
  Medium:   { bg: '#eaf2fb', color: '#1a5276' },
  Low:      { bg: '#f4f4f3', color: '#555' },
}

const PRIORITY_ORDER = ['Critical', 'High', 'Medium', 'Low']

type DimScore = {
  weightedScore: string | null
  priorityLevel: string | null
  prevScore: number | null
  delta: number | null
  dimension: { name: string; color: string | null } | null
}

export function DimensionTrends({ scores }: { scores: DimScore[] }) {
  const sorted = [...scores].sort((a, b) => {
    const aIdx = PRIORITY_ORDER.indexOf(a.priorityLevel ?? 'Low')
    const bIdx = PRIORITY_ORDER.indexOf(b.priorityLevel ?? 'Low')
    return aIdx - bIdx
  })

  return (
    <div className={styles.card}>
      <span className={styles.label}>Tendência por Dimensão</span>
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.th}>Dimensão</th>
            <th className={styles.th}>Score Atual</th>
            <th className={styles.th}>Mês Anterior</th>
            <th className={styles.th}>Variação</th>
            <th className={styles.th}>Priority</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((s, i) => {
            const score = Number(s.weightedScore ?? 0)
            const priority = s.priorityLevel ?? 'Low'
            const pStyle = PRIORITY_STYLES[priority] ?? PRIORITY_STYLES.Low

            return (
              <tr key={i} className={styles.row}>
                <td className={styles.td}>
                  <span style={{ color: s.dimension?.color ?? '#555', fontWeight: 600 }}>
                    {s.dimension?.name ?? '—'}
                  </span>
                </td>
                <td className={styles.td}>
                  <strong style={{ color: s.dimension?.color ?? '#555' }}>
                    {score.toFixed(1)}
                  </strong>
                </td>
                <td className={styles.td}>
                  <span style={{ color: '#888' }}>
                    {s.prevScore != null ? s.prevScore.toFixed(1) : '—'}
                  </span>
                </td>
                <td className={styles.td}>
                  {s.delta != null ? (
                    <span style={{ color: s.delta >= 0 ? '#1e8449' : '#c0392b', fontWeight: 600 }}>
                      {s.delta >= 0 ? '↑' : '↓'} {s.delta >= 0 ? '+' : ''}{s.delta.toFixed(1)}
                    </span>
                  ) : (
                    <span style={{ color: '#bbb' }}>—</span>
                  )}
                </td>
                <td className={styles.td}>
                  <span className={styles.priorityBadge} style={{ background: pStyle.bg, color: pStyle.color }}>
                    {priority}
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
