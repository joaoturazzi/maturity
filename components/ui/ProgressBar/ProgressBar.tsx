import styles from './ProgressBar.module.css'

interface ProgressBarProps {
  value: number
  max?: number
  className?: string
}

function getFillColor(pct: number): string {
  if (pct >= 100) return '#1e8449'
  if (pct >= 60) return '#d68910'
  return '#1a1a1a'
}

export function ProgressBar({ value, max = 100, className }: ProgressBarProps) {
  const pct = Math.min(Math.max((value / max) * 100, 0), 100)

  return (
    <div className={`${styles.track} ${className ?? ''}`}>
      <div
        className={styles.fill}
        style={{ width: `${pct}%`, background: getFillColor(pct) }}
      />
    </div>
  )
}
