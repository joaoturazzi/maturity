'use client'

import { useRouter } from 'next/navigation'
import styles from './PeriodSelector.module.css'

type Period = { period: string }

export function PeriodSelector({ periods, selected }: { periods: Period[]; selected: string }) {
  const router = useRouter()

  return (
    <select
      className={styles.select}
      value={selected}
      onChange={e => router.push(`/reports?period=${encodeURIComponent(e.target.value)}`)}
    >
      {periods.map(p => (
        <option key={p.period} value={p.period}>{p.period}</option>
      ))}
    </select>
  )
}
