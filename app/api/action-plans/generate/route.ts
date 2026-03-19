import { auth } from '@/auth'
import { db } from '@/lib/db'
import { actionPlans, tasks, dimensionScores, diagnosticCycles } from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { determinePriority } from '@/lib/scoring'

export async function POST() {
  const session = await auth()
  if (!session) return new Response('Unauthorized', { status: 401 })

  const companyId = session.user.companyId

  // Get latest submitted cycle
  const latestCycle = await db.query.diagnosticCycles.findFirst({
    where: and(
      eq(diagnosticCycles.companyId, companyId),
      eq(diagnosticCycles.status, 'Submitted'),
    ),
    orderBy: desc(diagnosticCycles.submittedAt),
  })

  if (!latestCycle) {
    return Response.json(
      { error: 'Nenhum diagnóstico finalizado encontrado. Complete um diagnóstico primeiro.' },
      { status: 400 }
    )
  }

  // Get dimension scores with gaps
  const scores = await db.query.dimensionScores.findMany({
    where: eq(dimensionScores.cycleId, latestCycle.id),
    with: { dimension: true },
  })

  const gaps = scores
    .map(s => ({
      dimensionId: s.dimensionId,
      dimensionName: s.dimension?.name ?? '',
      gap: Number(s.maturityGap ?? 0),
      priority: s.priorityLevel ?? determinePriority(Number(s.maturityGap ?? 0)),
      weightedScore: Number(s.weightedScore ?? 0),
    }))
    .filter(g => g.gap > 0)
    .sort((a, b) => b.gap - a.gap)

  if (gaps.length === 0) {
    return Response.json({ message: 'Nenhum gap identificado — parabéns!', plans: [] })
  }

  // Generate one action plan per dimension with gap > 0
  const createdPlans = []

  for (const gap of gaps) {
    const [plan] = await db.insert(actionPlans).values({
      title: `Plano de melhoria: ${gap.dimensionName}`,
      description: `Gap de ${gap.gap.toFixed(1)} pontos identificado na dimensão ${gap.dimensionName}. Score atual: ${gap.weightedScore.toFixed(1)}/5.0.`,
      dimensionId: gap.dimensionId,
      companyId,
      createdBy: session.user.id,
      priority: gap.priority,
      status: 'Active',
    }).returning()

    // Create 3 default tasks per plan
    const defaultTasks = [
      {
        title: `Diagnóstico detalhado de ${gap.dimensionName}`,
        description: `Analisar os indicadores específicos da dimensão ${gap.dimensionName} e identificar as causas raiz do gap.`,
      },
      {
        title: `Definir iniciativas para ${gap.dimensionName}`,
        description: `Com base no diagnóstico, definir 3-5 iniciativas concretas para reduzir o gap de ${gap.gap.toFixed(1)} pontos.`,
      },
      {
        title: `Implementar quick wins em ${gap.dimensionName}`,
        description: `Identificar e executar ações de impacto rápido para melhorar o score de ${gap.weightedScore.toFixed(1)} para pelo menos ${(gap.weightedScore + gap.gap * 0.3).toFixed(1)}.`,
      },
    ]

    await db.insert(tasks).values(
      defaultTasks.map(t => ({
        ...t,
        actionPlanId: plan.id,
        dimensionId: gap.dimensionId,
        companyId,
        status: 'To Do',
        requiresWeeklyCheckin: true,
      }))
    )

    createdPlans.push(plan)
  }

  return Response.json({
    message: `${createdPlans.length} planos de ação gerados com sucesso.`,
    plans: createdPlans,
  })
}
