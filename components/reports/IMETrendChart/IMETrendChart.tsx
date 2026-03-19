'use client'

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, ResponsiveContainer,
} from 'recharts'
import styles from './IMETrendChart.module.css'

type Cycle = {
  period: string
  imeScore: number
  maturityLevel: string | null
}

const MATURITY_REFS = [
  { y: 2.0, label: 'Developing', color: '#d68910' },
  { y: 3.0, label: 'Defined',    color: '#555' },
  { y: 3.5, label: 'Managed',    color: '#1a5276' },
  { y: 4.5, label: 'Optimized',  color: '#1e8449' },
]

const TICK_STYLE = { fontSize: 11, fill: '#888', fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' }

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ color: string; name: string; value: number }>; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className={styles.tooltip}>
      <span className={styles.tooltipLabel}>{label}</span>
      {payload.map((p, i: number) => (
        <span key={i} className={styles.tooltipValue} style={{ color: p.color }}>
          {p.name}: {typeof p.value === 'number' ? p.value.toFixed(1) : p.value}
        </span>
      ))}
    </div>
  )
}

export function IMETrendChart({ cycles }: { cycles: Cycle[] }) {
  const data = [...cycles].reverse()

  if (data.length < 2) {
    return (
      <div className={styles.card}>
        <span className={styles.label}>IME Score Trend</span>
        <p className={styles.empty}>Complete mais um diagnóstico para ver a tendência.</p>
      </div>
    )
  }

  const latest = data[data.length - 1]
  const prev = data[data.length - 2]
  const delta = latest.imeScore - prev.imeScore
  const maxScore = Math.max(...data.map(d => d.imeScore))

  return (
    <div className={styles.card}>
      <div className={styles.headerRow}>
        <span className={styles.label}>IME Score Trend</span>
        <div className={styles.metrics}>
          <span className={delta >= 0 ? styles.deltaUp : styles.deltaDown}>
            {delta >= 0 ? '+' : ''}{delta.toFixed(1)} vs último mês
          </span>
          <span className={styles.metric}>{maxScore.toFixed(1)} — maior score</span>
          <span className={styles.metricMuted}>{data.length} ciclos registrados</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={data} margin={{ top: 10, right: 20, bottom: 5, left: 0 }}>
          <CartesianGrid stroke="#eceae5" strokeDasharray="4 4" vertical={false} />
          <XAxis dataKey="period" tick={TICK_STYLE} axisLine={{ stroke: '#eceae5' }} tickLine={false} />
          <YAxis domain={[0, 5]} tick={TICK_STYLE} axisLine={{ stroke: '#eceae5' }} tickLine={false} />
          {MATURITY_REFS.map(ref => (
            <ReferenceLine
              key={ref.y}
              y={ref.y}
              stroke={ref.color}
              strokeDasharray="3 3"
              strokeOpacity={0.4}
            />
          ))}
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="imeScore"
            name="IME Score"
            stroke="#1a1a1a"
            strokeWidth={2}
            dot={{ r: 4, fill: '#1a1a1a' }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
