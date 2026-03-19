import styles from './StatCard.module.css'

interface StatCardProps {
  label: string
  value: string | number
  sublabel?: string
  color?: string
}

export function StatCard({ label, value, sublabel, color }: StatCardProps) {
  return (
    <div className={styles.card}>
      <span className={styles.label}>{label}</span>
      <span className={styles.value} style={color ? { color } : undefined}>{value}</span>
      {sublabel && <span className={styles.sublabel}>{sublabel}</span>}
    </div>
  )
}
