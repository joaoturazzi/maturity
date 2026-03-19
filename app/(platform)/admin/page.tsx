import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { diagnosticCycles } from '@/lib/db/schema'
import { eq, desc, asc } from 'drizzle-orm'
import { companies } from '@/lib/db/schema'
import { AdminDashboard } from '@/components/admin/AdminDashboard/AdminDashboard'
import styles from './page.module.css'

export default async function AdminPage() {
  const { userId, sessionClaims } = await auth()
  if (!userId) redirect('/login')

  const role = (sessionClaims?.metadata as Record<string, string>)?.role
  if (!role || !['SuperUser', 'Admin'].includes(role)) {
    redirect('/dashboard')
  }

  const allCompanies = await db.query.companies.findMany({
    with: {
      users: { columns: { id: true, name: true, email: true, role: true } },
      diagnosticCycles: {
        where: eq(diagnosticCycles.status, 'Submitted'),
        orderBy: desc(diagnosticCycles.submittedAt),
        limit: 1,
        with: {
          dimensionScores: { with: { dimension: true } },
        },
      },
    },
    orderBy: asc(companies.name),
  })

  const companiesSummary = allCompanies.map(c => {
    const latestCycle = c.diagnosticCycles[0] ?? null
    return {
      id: c.id,
      name: c.name,
      industry: c.industry,
      userCount: c.users.length,
      imeScore: latestCycle ? Number(latestCycle.overallImeScore) : null,
      maturityLevel: latestCycle?.maturityLevel ?? null,
      criticalDimensions: latestCycle?.dimensionScores.filter(
        d => d.priorityLevel === 'Critical'
      ).length ?? 0,
      lastDiagnosticAt: latestCycle?.submittedAt ?? null,
      dimensionScores: latestCycle?.dimensionScores ?? [],
    }
  })

  return (
    <div className={styles.page}>
      <div>
        <span className={styles.sectionLabel}>Gestão</span>
        <h1 className={styles.title}>Admin — Visão do Consultor</h1>
        <p className={styles.subtitle}>{allCompanies.length} empresas monitoradas</p>
      </div>

      <AdminDashboard companies={companiesSummary} />
    </div>
  )
}
