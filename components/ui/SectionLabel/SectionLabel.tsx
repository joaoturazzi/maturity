import styles from './SectionLabel.module.css'

export function SectionLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={`${styles.label} ${className ?? ''}`}>{children}</span>
}
