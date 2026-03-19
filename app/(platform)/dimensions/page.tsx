import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getActiveDimensions, getLatestCycle } from '@/lib/db/queries'
import styles from './page.module.css'

function priorityClass(level: string | null) {
  switch (level) {
    case 'High':
      return styles.priorityHigh
    case 'Medium':
      return styles.priorityMedium
    case 'Low':
      return styles.priorityLow
    default:
      return ''
  }
}

function priorityLabel(level: string | null) {
  switch (level) {
    case 'High':
      return 'Alta'
    case 'Medium':
      return 'Média'
    case 'Low':
      return 'Baixa'
    default:
      return ''
  }
}

export default async function DimensionsPage() {
  const { userId, sessionClaims } = await auth()
  if (!userId) redirect('/login')

  const companyId = (sessionClaims?.metadata as Record<string, string> | undefined)?.companyId ?? ''
  if (!companyId) redirect('/onboarding')

  const [dimensions, latestCycle] = await Promise.all([
    getActiveDimensions(),
    getLatestCycle(companyId),
  ])

  const scoresByDimensionId = new Map(
    (latestCycle?.dimensionScores ?? []).map((ds) => [ds.dimensionId, ds])
  )

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <span className={styles.sectionLabel}>Maturidade</span>
          <h1 className={styles.title}>Dimensões</h1>
        </div>
      </div>

      {dimensions.length === 0 ? (
        <p className={styles.empty}>Nenhuma dimensão configurada.</p>
      ) : (
        <div className={styles.grid}>
          {dimensions.map((dim) => {
            const score = scoresByDimensionId.get(dim.id)
            return (
              <div key={dim.id} className={styles.card}>
                <div
                  className={styles.colorAccent}
                  style={{ backgroundColor: dim.color ?? '#ddd' }}
                />
                <div className={styles.cardHeader}>
                  <span className={styles.cardName}>{dim.name}</span>
                  {score?.priorityLevel && (
                    <span
                      className={`${styles.priorityBadge} ${priorityClass(score.priorityLevel)}`}
                    >
                      {priorityLabel(score.priorityLevel)}
                    </span>
                  )}
                </div>
                {dim.description && (
                  <p className={styles.cardDescription}>{dim.description}</p>
                )}
                {score ? (
                  <div className={styles.scoreSection}>
                    <span className={styles.scoreValue}>
                      {Number(score.weightedScore).toFixed(1)}
                    </span>
                    <span className={styles.scoreMax}>/5.0</span>
                    <span className={styles.scoreLabel}>Score</span>
                  </div>
                ) : (
                  <p className={styles.noScore}>
                    Sem avaliação disponível
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
