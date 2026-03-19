import styles from './ActionPlanCompletion.module.css'

type Plan = {
  title: string
  priority: string | null
  completionPct: number
  doneTasks: number
  pendingTasks: number
  blockedTasks: number
  dimension: { name: string; color: string | null; colorBg: string | null } | null
}

const PRIORITY_STYLES: Record<string, { bg: string; color: string }> = {
  Critical: { bg: '#fdf2f2', color: '#c0392b' },
  High:     { bg: '#fef9e7', color: '#d68910' },
  Medium:   { bg: '#eaf2fb', color: '#1a5276' },
  Low:      { bg: '#f4f4f3', color: '#555' },
}

export function ActionPlanCompletion({ plans }: { plans: Plan[] }) {
  if (!plans.length) {
    return (
      <div className={styles.card}>
        <span className={styles.label}>Action Plans</span>
        <p className={styles.empty}>Nenhum plano ativo.</p>
      </div>
    )
  }

  return (
    <div className={styles.card}>
      <span className={styles.label}>Action Plans</span>
      <div className={styles.grid}>
        {plans.map((plan, i) => {
          const priority = plan.priority ?? 'Low'
          const pStyle = PRIORITY_STYLES[priority] ?? PRIORITY_STYLES.Low
          const barColor = plan.completionPct === 100 ? '#1e8449' : plan.completionPct >= 60 ? '#d68910' : '#1a1a1a'

          return (
            <div key={i} className={styles.planCard}>
              <div className={styles.planHeader}>
                <span className={styles.planTitle}>{plan.title}</span>
                <div className={styles.badges}>
                  {plan.dimension && (
                    <span
                      className={styles.dimBadge}
                      style={{
                        color: plan.dimension.color ?? '#555',
                        background: plan.dimension.colorBg ?? '#f4f4f3',
                      }}
                    >
                      {plan.dimension.name}
                    </span>
                  )}
                  <span className={styles.priorityBadge} style={{ background: pStyle.bg, color: pStyle.color }}>
                    {priority}
                  </span>
                </div>
              </div>
              <div className={styles.progressRow}>
                <span className={styles.pctLabel}>{plan.completionPct}% concluído</span>
                <div className={styles.progressTrack}>
                  <div className={styles.progressFill} style={{ width: `${plan.completionPct}%`, background: barColor }} />
                </div>
              </div>
              <span className={styles.miniStats}>
                {plan.doneTasks} Done · {plan.pendingTasks} Pendentes · {plan.blockedTasks} Blocked
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
