import { auth } from '@clerk/nextjs/server'
import { parseClerkMeta } from '@/lib/clerkMeta'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { getLatestCycle, getActiveTasksSummary, getUnreadAlerts, getUpcomingCheckins } from '@/lib/db/queries'
import { IMEScoreCard } from '@/components/dashboard/IMEScoreCard/IMEScoreCard'
import { DimensionBreakdown } from '@/components/dashboard/DimensionBreakdown/DimensionBreakdown'
import { TaskStatusCard } from '@/components/dashboard/TaskStatusCard/TaskStatusCard'
import { UpcomingCheckins } from '@/components/dashboard/UpcomingCheckins/UpcomingCheckins'
import { ActiveAlerts } from '@/components/dashboard/ActiveAlerts/ActiveAlerts'
import { TopGaps } from '@/components/dashboard/TopGaps/TopGaps'
import Link from 'next/link'
import styles from './page.module.css'

export default async function DashboardPage() {
  const { userId, sessionClaims } = await auth()
  if (!userId) redirect('/login')

  // Try JWT first (fast path)
  let companyId = parseClerkMeta(sessionClaims).companyId ?? ''

  // If JWT doesn't have companyId yet, check the database directly
  // This handles the case where onboarding just completed but JWT hasn't propagated
  if (!companyId) {
    const userInDb = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { companyId: true },
    })

    if (userInDb?.companyId) {
      // User completed onboarding — JWT will catch up on next request
      companyId = userInDb.companyId
    } else {
      // User truly hasn't onboarded — redirect
      redirect('/onboarding')
    }
  }

  const [cycle, tasksSummary, alerts, upcomingCheckins] = await Promise.all([
    getLatestCycle(companyId),
    getActiveTasksSummary(companyId),
    getUnreadAlerts(companyId),
    getUpcomingCheckins(companyId),
  ])

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <span className={styles.sectionLabel}>Visão geral</span>
          <h1 className={styles.title}>Dashboard</h1>
        </div>
        <Link href="/diagnostic" className={styles.primaryBtn}>
          + Novo Diagnóstico
        </Link>
      </div>

      <div className={styles.row}>
        <IMEScoreCard cycle={cycle ?? null} />
        <TaskStatusCard summary={tasksSummary} />
      </div>

      {cycle && cycle.dimensionScores.length > 0 && (
        <DimensionBreakdown scores={cycle.dimensionScores} />
      )}

      <div className={styles.row}>
        <TopGaps scores={cycle?.dimensionScores ?? []} />
        <UpcomingCheckins tasks={upcomingCheckins} />
      </div>

      <ActiveAlerts alerts={alerts} />
    </div>
  )
}
