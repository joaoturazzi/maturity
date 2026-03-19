import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { getAvailablePeriods, getReportData } from '@/lib/db/queries/reports'
import { ReportsClient } from '@/components/reports/ReportsClient/ReportsClient'
import styles from './page.module.css'

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: { period?: string }
}) {
  const session = await auth()
  if (!session) redirect('/login')

  const companyId = session.user.companyId
  const periods = await getAvailablePeriods(companyId)

  if (!periods.length) {
    return (
      <div className={styles.page}>
        <span className={styles.sectionLabel}>Evolução</span>
        <h1 className={styles.title}>Monthly Reports</h1>
        <p className={styles.empty}>
          Nenhum diagnóstico submetido ainda. Complete um diagnóstico para ver seus relatórios.
        </p>
      </div>
    )
  }

  const selectedPeriod = searchParams.period ?? periods[0].period
  const reportData = await getReportData(companyId, selectedPeriod)

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <span className={styles.sectionLabel}>Evolução</span>
          <h1 className={styles.title}>Monthly Reports</h1>
        </div>
      </div>

      <ReportsClient
        periods={periods}
        selectedPeriod={selectedPeriod}
        data={reportData}
      />
    </div>
  )
}
