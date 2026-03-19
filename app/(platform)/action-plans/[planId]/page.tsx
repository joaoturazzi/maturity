import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getPlanWithTasks } from '@/lib/db/queries'
import { KanbanBoard } from '@/components/action-plans/KanbanBoard/KanbanBoard'
import Link from 'next/link'
import styles from './page.module.css'

const PRIORITY_STYLES: Record<string, { bg: string; color: string }> = {
  Critical: { bg: '#fdf2f2', color: '#c0392b' },
  High:     { bg: '#fef9e7', color: '#d68910' },
  Medium:   { bg: '#eaf2fb', color: '#1a5276' },
  Low:      { bg: '#f4f4f3', color: '#555' },
}

export default async function ActionPlanDetailPage({ params }: { params: Promise<{ planId: string }> }) {
  const { planId } = await params
  const { userId, sessionClaims } = await auth()
  if (!userId) redirect('/login')

  const companyId = (sessionClaims?.metadata as Record<string, string>)?.companyId as string
  const plan = await getPlanWithTasks(planId, companyId)
  if (!plan) redirect('/action-plans')

  const totalTasks = plan.tasks.length
  const doneTasks = plan.tasks.filter(t => t.status === 'Done').length
  const pct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0
  const priority = plan.priority ?? 'Low'
  const pStyle = PRIORITY_STYLES[priority] ?? PRIORITY_STYLES.Low

  return (
    <div className={styles.page}>
      <div className={styles.breadcrumb}>
        <Link href="/action-plans" className={styles.breadcrumbLink}>Action Plans</Link>
        <span className={styles.breadcrumbSep}>›</span>
        <span>{plan.title}</span>
      </div>

      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>{plan.title}</h1>
          {plan.description && <p className={styles.desc}>{plan.description}</p>}
        </div>
        <div className={styles.badges}>
          {plan.dimension && (
            <span
              className={styles.dimBadge}
              style={{
                color: plan.dimension.color ?? '#555',
                background: (plan.dimension.colorBg ?? '#f4f4f3'),
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
        <div className={styles.progressTrack}>
          <div
            className={styles.progressFill}
            style={{
              width: `${pct}%`,
              background: pct === 100 ? '#1e8449' : pct >= 60 ? '#d68910' : '#1a1a1a',
            }}
          />
        </div>
        <span className={styles.pctLabel}>{pct}% — {doneTasks}/{totalTasks} tasks</span>
      </div>

      <KanbanBoard planId={plan.id} tasks={plan.tasks} />
    </div>
  )
}
