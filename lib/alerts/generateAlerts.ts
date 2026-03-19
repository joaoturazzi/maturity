import { db } from '@/lib/db'
import { tasks, checkins, alerts } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

export async function generateAlertsForCompany(companyId: string) {
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]

  const day = today.getDay()
  const diff = today.getDate() - day + (day === 0 ? -6 : 1)
  const weekStart = new Date(today)
  weekStart.setDate(diff)
  const weekStartStr = weekStart.toISOString().split('T')[0]

  // 1. Overdue Tasks
  const allTasks = await db.query.tasks.findMany({
    where: eq(tasks.companyId, companyId),
  })

  const overdueTasks = allTasks.filter(
    t => t.dueDate && t.dueDate < todayStr && t.status !== 'Done' && t.status !== 'Blocked'
  )

  for (const task of overdueTasks) {
    await upsertAlert(companyId, {
      alertType: 'Overdue Task',
      severity: 'High',
      message: `Task "${task.title}" está atrasada.`,
      relatedTaskId: task.id,
    })
  }

  // 2. Missing Check-ins
  const activeCheckinTasks = allTasks.filter(
    t => t.requiresWeeklyCheckin && t.status !== 'Done' && t.status !== 'Blocked'
  )

  const thisWeekCheckins = await db.query.checkins.findMany({
    where: and(
      eq(checkins.companyId, companyId),
      eq(checkins.weekStartDate, weekStartStr),
    ),
  })
  const checkedTaskIds = new Set(thisWeekCheckins.map(c => c.taskId))

  const missingCheckin = activeCheckinTasks.filter(t => !checkedTaskIds.has(t.id))

  for (const task of missingCheckin) {
    await upsertAlert(companyId, {
      alertType: 'Missing Check-in',
      severity: 'Medium',
      message: `Task "${task.title}" sem check-in esta semana.`,
      relatedTaskId: task.id,
    })
  }
}

async function upsertAlert(
  companyId: string,
  data: {
    alertType: string
    severity: string
    message: string
    relatedTaskId?: string
    relatedDimensionId?: string
  }
) {
  const existing = await db.query.alerts.findFirst({
    where: and(
      eq(alerts.companyId, companyId),
      eq(alerts.alertType, data.alertType),
      eq(alerts.message, data.message),
      eq(alerts.isRead, false),
    ),
  })
  if (existing) return

  await db.insert(alerts).values({ ...data, companyId })
}
