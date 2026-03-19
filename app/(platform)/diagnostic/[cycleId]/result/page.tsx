import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { diagnosticCycles, dimensionScores, actionPlans, diagnosticResponses } from '@/lib/db/schema'
import { eq, and, desc, asc } from 'drizzle-orm'
import { getCompanyId } from '@/lib/getCompanyId'
import { DiagnosticResult } from '@/components/diagnostic/DiagnosticResult'

export default async function ResultPage({ params }: { params: Promise<{ cycleId: string }> }) {
  const { cycleId } = await params
  const { userId } = await auth()
  if (!userId) redirect('/login')

  const companyId = await getCompanyId()
  if (!companyId) redirect('/onboarding')

  const cycle = await db.query.diagnosticCycles.findFirst({
    where: and(eq(diagnosticCycles.id, cycleId), eq(diagnosticCycles.companyId, companyId)),
  })
  if (!cycle || cycle.status !== 'Submitted') redirect('/diagnostic')

  const scores = await db.query.dimensionScores.findMany({
    where: eq(dimensionScores.cycleId, cycleId),
    with: { dimension: true },
  })

  const existingPlan = await db.query.actionPlans.findFirst({
    where: and(eq(actionPlans.companyId, companyId), eq(actionPlans.cycleId, cycleId)),
    columns: { id: true },
  })

  // Previous cycle for comparison
  const allCycles = await db.query.diagnosticCycles.findMany({
    where: and(eq(diagnosticCycles.companyId, companyId), eq(diagnosticCycles.status, 'Submitted')),
    orderBy: desc(diagnosticCycles.submittedAt),
    with: { dimensionScores: { with: { dimension: true } } },
    limit: 2,
  })
  const prevCycle = allCycles.length > 1 ? allCycles[1] : null
  const prevScores: Record<string, number> = {}
  if (prevCycle) {
    for (const s of prevCycle.dimensionScores) {
      if (s.dimension?.name) prevScores[s.dimension.name] = Number(s.weightedScore)
    }
  }

  // Critical indicators per dimension
  const allResponses = await db.query.diagnosticResponses.findMany({
    where: eq(diagnosticResponses.cycleId, cycleId),
    with: { indicator: true, dimension: true },
    orderBy: asc(diagnosticResponses.score),
  })

  const criticalByDim: Record<string, Array<{ title: string; score: number; chosenText: string }>> = {}
  for (const r of allResponses) {
    if (!r.score || r.score === 0 || !r.dimension?.name) continue
    const dimName = r.dimension.name
    if (!criticalByDim[dimName]) criticalByDim[dimName] = []
    if (criticalByDim[dimName].length < 3) {
      const opts = (r.indicator?.responseOptions as Array<{ level: number; text: string }>) ?? []
      const chosen = opts.find(o => o.level === r.score)
      criticalByDim[dimName].push({
        title: r.indicator?.title ?? '',
        score: r.score,
        chosenText: chosen?.text ?? '',
      })
    }
  }

  const sorted = [...scores].sort((a, b) => Number(b.maturityGap) - Number(a.maturityGap))

  const radarData = sorted.map(s => ({
    dimension: s.dimension?.name ?? '',
    atual: Number(s.weightedScore ?? 0),
    desejado: Number(s.desiredScore ?? 5),
    recomendado: Number(s.recommendedMinScore ?? 3.5),
  }))

  const deficiencyData = sorted.map(s => ({
    dimension: s.dimension?.name ?? '',
    comportamental: Math.round(Number(s.pctComportamental ?? 0) * 100),
    ferramental: Math.round(Number(s.pctFerramental ?? 0) * 100),
    tecnica: Math.round(Number(s.pctTecnica ?? 0) * 100),
  }))

  const tableData = sorted.map(s => ({
    dimension: s.dimension?.name ?? '',
    dimensionId: s.dimensionId,
    color: s.dimension?.color ?? null,
    atual: Number(s.weightedScore ?? 0),
    desejado: Number(s.desiredScore ?? 5),
    recomendado: Number(s.recommendedMinScore ?? 3.5),
    gap: Number(s.maturityGap ?? 0),
    priority: s.priorityLevel,
    comportamental: Math.round(Number(s.pctComportamental ?? 0) * 100),
    ferramental: Math.round(Number(s.pctFerramental ?? 0) * 100),
    tecnica: Math.round(Number(s.pctTecnica ?? 0) * 100),
    narrative: s.narrative ?? null,
    prevScore: prevScores[s.dimension?.name ?? ''] ?? null,
    delta: prevScores[s.dimension?.name ?? ''] != null
      ? Number(s.weightedScore) - prevScores[s.dimension?.name ?? '']
      : null,
    criticals: criticalByDim[s.dimension?.name ?? ''] ?? [],
  }))

  return (
    <DiagnosticResult
      cycle={{ overallImeScore: cycle.overallImeScore, maturityLevel: cycle.maturityLevel, submittedAt: cycle.submittedAt }}
      radarData={radarData}
      deficiencyData={deficiencyData}
      tableData={tableData}
      cycleId={cycleId}
      companyId={companyId}
      hasExistingPlan={!!existingPlan}
      prevDiagnosticDate={prevCycle ? new Date(prevCycle.submittedAt!).toLocaleDateString('pt-BR') : null}
      prevImeScore={prevCycle ? Number(prevCycle.overallImeScore) : null}
    />
  )
}
