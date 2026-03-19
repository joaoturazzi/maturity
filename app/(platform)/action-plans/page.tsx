import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { actionPlans } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { getActiveDimensions } from '@/lib/db/queries'
import { ActionPlanList } from '@/components/action-plans/ActionPlanList/ActionPlanList'
import styles from './page.module.css'

export default async function ActionPlansPage() {
  const { userId, sessionClaims } = await auth()
  if (!userId) redirect('/login')
  const companyId = (sessionClaims?.metadata as Record<string, string> | undefined)?.companyId ?? ''
  if (!companyId) redirect('/onboarding')

  const [plans, activeDimensions] = await Promise.all([
    db.query.actionPlans.findMany({
      where: eq(actionPlans.companyId, companyId),
      with: {
        dimension: true,
        tasks: true,
      },
      orderBy: actionPlans.createdAt,
    }),
    getActiveDimensions(),
  ])

  const activePlans = plans.filter(p => p.status === 'Active')
  const totalTasks = plans.flatMap(p => p.tasks)
  const overdue = totalTasks.filter(t =>
    t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'Done'
  )
  const done = totalTasks.filter(t => t.status === 'Done')
  const active = totalTasks.filter(t => !['Done', 'Blocked'].includes(t.status ?? ''))

  const stats = [
    { label: 'Planos ativos', value: activePlans.length, color: '#1a1a1a' },
    { label: 'Tasks ativas',  value: active.length,       color: '#1a5276' },
    { label: 'Atrasadas',     value: overdue.length,       color: '#c0392b' },
    { label: 'Concluídas',    value: done.length,          color: '#1e8449' },
  ]

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <span className={styles.sectionLabel}>Execução</span>
          <h1 className={styles.title}>Action Plans</h1>
        </div>
      </div>

      <div className={styles.stats}>
        {stats.map(stat => (
          <div key={stat.label} className={styles.statCard}>
            <span className={styles.statLabel}>{stat.label}</span>
            <span className={styles.statValue} style={{ color: stat.color }}>
              {stat.value}
            </span>
          </div>
        ))}
      </div>

      <ActionPlanList plans={activePlans} dimensions={activeDimensions} />
    </div>
  )
}
