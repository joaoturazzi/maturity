import styles from './Badge.module.css'

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info'

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  style?: React.CSSProperties
  className?: string
}

export function Badge({ children, variant = 'default', style, className }: BadgeProps) {
  return (
    <span className={`${styles.badge} ${styles[variant]} ${className ?? ''}`} style={style}>
      {children}
    </span>
  )
}
