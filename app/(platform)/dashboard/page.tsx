import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getLatestCycle, getActiveTasksSummary, getUnreadAlerts, getUpcomingCheckins } from '@/lib/db/queries'
import { IMEScoreCard } from '@/components/dashboard/IMEScoreCard/IMEScoreCard'
import { DimensionBreakdown } from '@/components/dashboard/DimensionBreakdown/DimensionBreakdown'
import { TaskStatusCard } from '@/components/dashboard/TaskStatusCard/TaskStatusCard'
import { UpcomingCheckins } from '@/components/dashboard/UpcomingCheckins/UpcomingCheckins'
import { ActiveAlerts } from '@/components/dashboard/ActiveAlerts/ActiveAlerts'
import { TopGaps } from '@/components/dashboard/TopGaps/TopGaps'
import Link from 'next/link'
import styles from './page.module.css'

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ onboarding?: string }>
}) {
  const { userId, sessionClaims } = await auth()
  if (!userId) redirect('/login')

  const companyId = (sessionClaims?.metadata as Record<string, string> | undefined)?.companyId ?? ''

  // If coming from onboarding but JWT not refreshed yet, wait and retry
  const params = await searchParams
  if (!companyId && params.onboarding === 'complete') {
    await new Promise(r => setTimeout(r, 1500))
    redirect('/dashboard')
  }

  if (!companyId) redirect('/onboarding')

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
