import { auth } from '@/auth'
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

export default async function DashboardPage() {
  const session = await auth()
  if (!session) redirect('/login')

  const companyId = session.user.companyId

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
