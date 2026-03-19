import { db } from '../index'
import { diagnosticCycles, dimensionScores, actionPlans, tasks, alerts } from '../schema'
import { eq, and, desc } from 'drizzle-orm'

export async function getAvailablePeriods(companyId: string) {
  const cycles = await db.query.diagnosticCycles.findMany({
    where: and(
      eq(diagnosticCycles.companyId, companyId),
      eq(diagnosticCycles.status, 'Submitted'),
    ),
    orderBy: desc(diagnosticCycles.submittedAt),
    columns: { id: true, submittedAt: true, overallImeScore: true, maturityLevel: true },
  })

  return cycles.map(c => ({
    period: toPeriod(c.submittedAt!),
    cycleId: c.id,
    imeScore: Number(c.overallImeScore),
    maturityLevel: c.maturityLevel,
    submittedAt: c.submittedAt,
  }))
}

export async function getReportData(companyId: string, period: string) {
  const allCycles = await getAvailablePeriods(companyId)
  const currentIdx = allCycles.findIndex(c => c.period === period)
  if (currentIdx === -1) return null

  const current = allCycles[currentIdx]
  const previous = allCycles[currentIdx + 1] ?? null

  const dimScores = await db.query.dimensionScores.findMany({
    where: eq(dimensionScores.cycleId, current.cycleId),
    with: { dimension: true },
    orderBy: dimensionScores.weightedScore,
  })

  const prevDimScores = previous
    ? await db.query.dimensionScores.findMany({
        where: eq(dimensionScores.cycleId, previous.cycleId),
        with: { dimension: true },
      })
    : []

  const prevScoreByDim: Record<string, number> = {}
  for (const d of prevDimScores) {
    prevScoreByDim[d.dimensionId] = Number(d.weightedScore)
  }

  const plans = await db.query.actionPlans.findMany({
    where: and(
      eq(actionPlans.companyId, companyId),
      eq(actionPlans.status, 'Active'),
    ),
    with: { dimension: true, tasks: true },
  })

  const periodStart = fromPeriod(period)
  const periodEnd = endOfMonth(periodStart)

  const periodTasks = await db.query.tasks.findMany({
    where: eq(tasks.companyId, companyId),
  })

  const completed = periodTasks.filter(
    t => t.completedAt && t.completedAt >= periodStart && t.completedAt <= periodEnd
  )
  const blocked = periodTasks.filter(t => t.status === 'Blocked')
  const active = periodTasks.filter(t => !['Done', 'Blocked'].includes(t.status ?? ''))

  const alertHistory = await db.query.alerts.findMany({
    where: eq(alerts.companyId, companyId),
    orderBy: desc(alerts.createdAt),
    limit: 100,
  })

  return {
    period,
    currentCycle: current,
    previousCycle: previous,
    allCycles,
    dimensionScores: dimScores.map(d => ({
      ...d,
      prevScore: prevScoreByDim[d.dimensionId] ?? null,
      delta: prevScoreByDim[d.dimensionId] != null
        ? Number(d.weightedScore) - prevScoreByDim[d.dimensionId]
        : null,
    })),
    actionPlans: plans.map(p => ({
      ...p,
      completionPct: p.tasks.length
        ? Math.round(p.tasks.filter(t => t.status === 'Done').length / p.tasks.length * 100)
        : 0,
      doneTasks: p.tasks.filter(t => t.status === 'Done').length,
      pendingTasks: p.tasks.filter(t => t.status !== 'Done' && t.status !== 'Blocked').length,
      blockedTasks: p.tasks.filter(t => t.status === 'Blocked').length,
    })),
    throughput: {
      completed: completed.length,
      active: active.length,
      blocked: blocked.length,
    },
    alertHistory,
  }
}

function toPeriod(date: Date): string {
  return `${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`
}

function fromPeriod(period: string): Date {
  const [month, year] = period.split('/')
  return new Date(Number(year), Number(month) - 1, 1)
}

function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59)
}
