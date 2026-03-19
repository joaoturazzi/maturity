import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { actionPlans, tasks } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { getCompanyId } from '@/lib/getCompanyId'
import { ActionPlanKanban } from '@/components/action-plans/ActionPlanKanban'

export default async function ActionPlansPage() {
  const { userId } = await auth()
  if (!userId) redirect('/login')

  const companyId = await getCompanyId()
  if (!companyId) redirect('/onboarding')

  const plans = await db.query.actionPlans.findMany({
    where: and(eq(actionPlans.companyId, companyId), eq(actionPlans.status, 'Active')),
    with: { dimension: true, tasks: { orderBy: tasks.dueDate } },
    orderBy: actionPlans.createdAt,
  })

  const allTasks = plans.flatMap(p => p.tasks)
  const stats = {
    totalTasks: allTasks.length,
    doneTasks: allTasks.filter(t => t.status === 'Done').length,
    lateTasks: allTasks.filter(t =>
      t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'Done' && t.status !== 'Blocked'
    ).length,
  }

  return <ActionPlanKanban plans={plans} stats={stats} />
}
