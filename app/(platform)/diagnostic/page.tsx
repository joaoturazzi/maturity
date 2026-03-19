import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { diagnosticCycles } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import Link from 'next/link'
import { StartDiagnosticButton } from './StartDiagnosticButton'
import styles from './page.module.css'

function statusBadgeClass(status: string | null) {
  switch (status) {
    case 'Submitted':
      return styles.badgeSubmitted
    case 'In Progress':
      return styles.badgeInProgress
    default:
      return styles.badgeDraft
  }
}

function statusLabel(status: string | null) {
  switch (status) {
    case 'Submitted':
      return 'Concluído'
    case 'In Progress':
      return 'Em andamento'
    default:
      return 'Rascunho'
  }
}

export default async function DiagnosticPage() {
  const { userId, sessionClaims } = await auth()
  if (!userId) redirect('/login')

  const companyId = (sessionClaims?.metadata as Record<string, string>)?.companyId as string

  const cycles = await db.query.diagnosticCycles.findMany({
    where: eq(diagnosticCycles.companyId, companyId),
    orderBy: desc(diagnosticCycles.createdAt),
  })

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <span className={styles.sectionLabel}>Avaliação</span>
          <h1 className={styles.title}>Diagnóstico</h1>
        </div>
        <StartDiagnosticButton />
      </div>

      {cycles.length === 0 ? (
        <p className={styles.empty}>
          Nenhum diagnóstico realizado ainda. Clique em &quot;Novo
          Diagnóstico&quot; para começar.
        </p>
      ) : (
        <div className={styles.grid}>
          {cycles.map((cycle) => {
            const href =
              cycle.status === 'Submitted'
                ? `/diagnostic/${cycle.id}/result`
                : `/diagnostic/${cycle.id}`

            return (
              <Link
                key={cycle.id}
                href={href}
                className={styles.cycleCard}
              >
                <div className={styles.cycleLeft}>
                  <span
                    className={`${styles.badge} ${statusBadgeClass(cycle.status)}`}
                  >
                    {statusLabel(cycle.status)}
                  </span>
                  <div className={styles.cycleInfo}>
                    <span className={styles.cycleTitle}>
                      Diagnóstico
                    </span>
                    <span className={styles.cycleDate}>
                      {cycle.createdAt
                        ? new Date(cycle.createdAt).toLocaleDateString('pt-BR')
                        : '—'}
                    </span>
                  </div>
                </div>
                <div className={styles.cycleRight}>
                  {cycle.overallImeScore && (
                    <span className={styles.imeScore}>
                      {Number(cycle.overallImeScore).toFixed(1)}
                      <span className={styles.imeLabel}>/5.0</span>
                    </span>
                  )}
                  <span className={styles.arrow}>&rarr;</span>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
