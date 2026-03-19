import { forwardRef } from 'react'
import styles from './Select.module.css'

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, children, className, ...props }, ref) => {
    return (
      <div className={styles.wrapper}>
        {label && <label className={styles.label}>{label}</label>}
        <select ref={ref} className={`${styles.select} ${className ?? ''}`} {...props}>
          {children}
        </select>
      </div>
    )
  }
)

Select.displayName = 'Select'
