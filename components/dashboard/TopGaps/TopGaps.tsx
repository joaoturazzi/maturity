import styles from './TopGaps.module.css'

type Score = {
  maturityGap: string | null
  priorityLevel: string | null
  weightedScore: string | null
  desiredScore: string | null
  dimension: { name: string; color: string | null } | null
}

const PRIORITY_STYLES: Record<string, { bg: string; color: string }> = {
  Critical: { bg: '#fdf2f2', color: '#c0392b' },
  High:     { bg: '#fef9e7', color: '#d68910' },
  Medium:   { bg: '#eaf2fb', color: '#1a5276' },
  Low:      { bg: '#f4f4f3', color: '#555' },
}

export function TopGaps({ scores }: { scores: Score[] }) {
  const sorted = [...scores]
    .filter(s => Number(s.maturityGap ?? 0) > 0)
    .sort((a, b) => Number(b.maturityGap ?? 0) - Number(a.maturityGap ?? 0))
    .slice(0, 5)

  return (
    <div className={styles.card}>
      <span className={styles.label}>Top Gaps</span>
      {sorted.length === 0 ? (
        <p className={styles.empty}>Nenhum gap identificado.</p>
      ) : (
        <div className={styles.list}>
          {sorted.map((s, i) => {
            const gap = Number(s.maturityGap ?? 0)
            const priority = s.priorityLevel ?? 'Low'
            const pStyle = PRIORITY_STYLES[priority] ?? PRIORITY_STYLES.Low

            return (
              <div key={i} className={styles.item}>
                <div className={styles.itemHeader}>
                  <span className={styles.dimName} style={{ color: s.dimension?.color ?? '#555' }}>
                    {s.dimension?.name ?? '—'}
                  </span>
                  <span className={styles.gapBadge} style={{ background: pStyle.bg, color: pStyle.color }}>
                    Gap: {gap.toFixed(1)}
                  </span>
                </div>
                <span className={styles.detail}>
                  Atual: {Number(s.weightedScore ?? 0).toFixed(1)} → Desejado: {Number(s.desiredScore ?? 0).toFixed(1)}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
