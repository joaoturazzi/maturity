import { db } from '../index'
import { eq, and, desc, isNull } from 'drizzle-orm'
import {
  diagnosticCycles, diagnosticResponses,
  indicators, dimensions, tasks, checkins, alerts, actionPlans,
} from '../schema'

// ─── DIAGNOSTIC ──────────────────────────────────────────────────────────────

export async function getLatestCycle(companyId: string) {
  return db.query.diagnosticCycles.findFirst({
    where: and(
      eq(diagnosticCycles.companyId, companyId),
      eq(diagnosticCycles.status, 'Submitted')
    ),
    orderBy: desc(diagnosticCycles.submittedAt),
    with: {
      dimensionScores: { with: { dimension: true } },
    },
  })
}

export async function getLatestCycleById(cycleId: string) {
  return db.query.diagnosticCycles.findFirst({
    where: eq(diagnosticCycles.id, cycleId),
    with: {
      dimensionScores: { with: { dimension: true } },
    },
  })
}

export async function getCycleResponses(cycleId: string) {
  return db.query.diagnosticResponses.findMany({
    where: eq(diagnosticResponses.cycleId, cycleId),
    with: { indicator: true, dimension: true },
  })
}

export async function getIndicatorsWithDimensions() {
  return db.query.dimensions.findMany({
    where: eq(dimensions.isActive, true),
    orderBy: dimensions.orderIndex,
    with: {
      indicators: {
        orderBy: indicators.orderIndex,
      },
    },
  })
}

export async function getCyclesByCompany(companyId: string) {
  return db.query.diagnosticCycles.findMany({
    where: eq(diagnosticCycles.companyId, companyId),
    orderBy: desc(diagnosticCycles.createdAt),
  })
}

// ─── DASHBOARD ───────────────────────────────────────────────────────────────

export async function getActiveTasksSummary(companyId: string) {
  const allTasks = await db.query.tasks.findMany({
    where: eq(tasks.companyId, companyId),
  })
  return {
    total:      allTasks.length,
    todo:       allTasks.filter(t => t.status === 'To Do').length,
    inProgress: allTasks.filter(t => t.status === 'In Progress').length,
    inReview:   allTasks.filter(t => t.status === 'In Review').length,
    done:       allTasks.filter(t => t.status === 'Done').length,
    blocked:    allTasks.filter(t => t.status === 'Blocked').length,
  }
}

export async function getUnreadAlerts(companyId: string) {
  return db.query.alerts.findMany({
    where: and(
      eq(alerts.companyId, companyId),
      eq(alerts.isRead, false)
    ),
    orderBy: desc(alerts.createdAt),
    limit: 10,
  })
}

function getWeekStartDate(): string {
  const now = new Date()
  const day = now.getDay()
  const diff = now.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(now)
  monday.setDate(diff)
  monday.setHours(0, 0, 0, 0)
  return monday.toISOString().split('T')[0]
}

export async function getUpcomingCheckins(companyId: string) {
  const weekStartStr = getWeekStartDate()

  const activeTasks = await db.query.tasks.findMany({
    where: and(
      eq(tasks.companyId, companyId),
      eq(tasks.requiresWeeklyCheckin, true),
    ),
    with: {
      actionPlan: { with: { dimension: true } },
      assignedUser: true,
    },
  })

  const thisWeekCheckins = await db.query.checkins.findMany({
    where: and(
      eq(checkins.companyId, companyId),
      eq(checkins.weekStartDate, weekStartStr),
    ),
  })

  const checkedInIds = new Set(thisWeekCheckins.map(c => c.taskId))

  return activeTasks.filter(t =>
    !checkedInIds.has(t.id) &&
    t.status !== 'Done' &&
    t.status !== 'Blocked'
  )
}

// ─── ACTION PLANS ────────────────────────────────────────────────────────────

export async function getActiveDimensions() {
  return db.query.dimensions.findMany({
    where: isNull(dimensions.companyId),
    orderBy: dimensions.orderIndex,
  })
}

export async function getPlanWithTasks(planId: string, companyId: string) {
  return db.query.actionPlans.findFirst({
    where: and(
      eq(actionPlans.id, planId),
      eq(actionPlans.companyId, companyId),
    ),
    with: {
      dimension: true,
      tasks: {
        with: { assignedUser: true },
        orderBy: tasks.createdAt,
      },
    },
  })
}

// ─── CHECKINS ────────────────────────────────────────────────────────────────

export async function getMyActiveTasks(userId: string, companyId: string) {
  return db.query.tasks.findMany({
    where: and(
      eq(tasks.assignedTo, userId),
      eq(tasks.companyId, companyId),
    ),
    with: {
      actionPlan: { with: { dimension: true } },
    },
    orderBy: tasks.dueDate,
  })
}

export async function getThisWeekCheckins(userId: string, companyId: string) {
  const weekStartStr = getWeekStartDate()

  return db.query.checkins.findMany({
    where: and(
      eq(checkins.submittedBy, userId),
      eq(checkins.companyId, companyId),
      eq(checkins.weekStartDate, weekStartStr),
    ),
  })
}

export async function getCheckinHistory(taskId: string, companyId: string) {
  return db.query.checkins.findMany({
    where: and(
      eq(checkins.taskId, taskId),
      eq(checkins.companyId, companyId),
    ),
    orderBy: desc(checkins.weekStartDate),
  })
}
