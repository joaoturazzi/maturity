import styles from './IMEScoreCard.module.css'
import Link from 'next/link'

const MATURITY_COLORS: Record<string, string> = {
  'Initial': '#c0392b',
  'Developing': '#d68910',
  'Defined': '#555555',
  'Managed': '#1a5276',
  'Optimized': '#1e8449',
}

type Cycle = {
  overallImeScore: string | null
  maturityLevel: string | null
  submittedAt: Date | null
  dimensionScores: unknown[]
} | null

export function IMEScoreCard({ cycle }: { cycle: Cycle }) {
  if (!cycle) {
    return (
      <div className={styles.card}>
        <span className={styles.label}>IME Score</span>
        <p className={styles.empty}>Nenhum diagnóstico ainda.</p>
        <Link href="/diagnostic" className={styles.startBtn}>
          Iniciar diagnóstico
        </Link>
      </div>
    )
  }

  const score = Number(cycle.overallImeScore ?? 0)
  const level = cycle.maturityLevel ?? 'Initial'
  const color = MATURITY_COLORS[level] ?? '#555'
  const pct = (score / 5) * 100

  return (
    <div className={styles.card}>
      <span className={styles.label}>IME Score</span>
      <div className={styles.scoreRow}>
        <span className={styles.score} style={{ color }}>{score.toFixed(1)}</span>
        <span className={styles.scoreSuffix}>/5.0</span>
      </div>
      <span className={styles.badge} style={{ background: color + '18', color }}>
        {level}
      </span>
      <div className={styles.progressTrack}>
        <div className={styles.progressFill} style={{ width: `${pct}%`, background: color }} />
      </div>
      {cycle.submittedAt && (
        <span className={styles.date}>
          Último diagnóstico: {new Date(cycle.submittedAt).toLocaleDateString('pt-BR')}
        </span>
      )}
    </div>
  )
}
