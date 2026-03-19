import type { AgentType, AgentConfig } from '@/lib/agents/config'
import { PRIORITY_COLORS } from '@/lib/scoring'
import styles from './AgentContextPanel.module.css'

type DimScore = {
  weightedScore: string | null
  desiredScore: string | null
  maturityGap: string | null
  priorityLevel: string | null
  dimension: { name: string; color: string | null } | null
}

type LatestCycle = {
  overallImeScore: string | null
  maturityLevel: string | null
  dimensionScores: DimScore[]
} | null | undefined

type Props = {
  agentType: AgentType
  agentConfig: AgentConfig
  latestCycle: LatestCycle
}

const MATURITY_COLORS: Record<string, string> = {
  Initial: '#c0392b', Developing: '#d68910', Defined: '#555',
  Managed: '#1a5276', Optimized: '#1e8449',
}

export function AgentContextPanel({ agentType, agentConfig, latestCycle }: Props) {
  if (!latestCycle) {
    return (
      <aside className={styles.panel}>
        <span className={styles.label}>Contexto</span>
        <p className={styles.empty}>
          Complete um diagnóstico para ativar o contexto do agente.
        </p>
      </aside>
    )
  }

  const isOrchestrator = agentType === 'Orquestrador'
  const relevantScores = isOrchestrator
    ? latestCycle.dimensionScores
    : latestCycle.dimensionScores.filter(
        d => d.dimension?.name === agentConfig.dimension
      )

  const imeScore = Number(latestCycle.overallImeScore ?? 0)
  const matLevel = latestCycle.maturityLevel ?? 'Initial'
  const matColor = MATURITY_COLORS[matLevel] ?? '#555'

  return (
    <aside className={styles.panel}>
      {/* IME Score */}
      <div className={styles.section}>
        <span className={styles.label}>IME Score</span>
        <div className={styles.scoreRow}>
          <span className={styles.score} style={{ color: matColor }}>
            {imeScore.toFixed(1)}
          </span>
          <span className={styles.scoreSuffix}>/5.0</span>
        </div>
        <span className={styles.matBadge} style={{ background: matColor + '18', color: matColor }}>
          {matLevel}
        </span>
      </div>

      {/* Relevant dimensions */}
      <div className={styles.section}>
        <span className={styles.label}>
          {isOrchestrator ? 'Todas as dimensões' : agentConfig.dimension}
        </span>
        <div className={styles.dimList}>
          {relevantScores.map((ds, i) => {
            const dimColor = ds.dimension?.color ?? '#555'
            const score = Number(ds.weightedScore ?? 0)
            const gap = Number(ds.maturityGap ?? 0)
            const priority = ds.priorityLevel ?? 'Low'
            const priColors = PRIORITY_COLORS[priority] ?? PRIORITY_COLORS.Low

            return (
              <div key={i} className={styles.dimItem}>
                <div className={styles.dimHeader}>
                  <span className={styles.dimName} style={{ color: dimColor }}>
                    {ds.dimension?.name ?? '—'}
                  </span>
                  <span
                    className={styles.priBadge}
                    style={{ background: priColors.bg, color: priColors.color }}
                  >
                    {priority}
                  </span>
                </div>
                <div className={styles.barTrack}>
                  <div
                    className={styles.barFill}
                    style={{ width: `${(score / 5) * 100}%`, background: dimColor }}
                  />
                </div>
                <div className={styles.dimMeta}>
                  <span>Atual: {score.toFixed(1)}</span>
                  <span>Gap: {gap.toFixed(1)}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </aside>
  )
}
