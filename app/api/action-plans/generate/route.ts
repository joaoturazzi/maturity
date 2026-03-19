import { auth } from '@clerk/nextjs/server'
import { getCompanyId } from '@/lib/getCompanyId'
import { db } from '@/lib/db'
import { actionPlans, tasks, dimensionScores, diagnosticCycles } from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { determinePriority } from '@/lib/scoring'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const { userId, sessionClaims } = await auth()
    if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const companyId = await getCompanyId()
    if (!companyId) return Response.json({ error: 'Onboarding incomplete' }, { status: 403 })

    const body = await req.json().catch(() => ({}))
    const cycleId = body.cycleId

    // Find cycle — use provided cycleId or latest
    let cycle
    if (cycleId) {
      cycle = await db.query.diagnosticCycles.findFirst({
        where: and(eq(diagnosticCycles.id, cycleId), eq(diagnosticCycles.companyId, companyId)),
      })
    } else {
      cycle = await db.query.diagnosticCycles.findFirst({
        where: and(eq(diagnosticCycles.companyId, companyId), eq(diagnosticCycles.status, 'Submitted')),
        orderBy: desc(diagnosticCycles.submittedAt),
      })
    }

    if (!cycle) {
      return Response.json({ error: 'Nenhum diagnóstico finalizado encontrado.' }, { status: 400 })
    }

    // Get dimension scores with gaps >= 1.0 (Medium or higher)
    const scores = await db.query.dimensionScores.findMany({
      where: eq(dimensionScores.cycleId, cycle.id),
      with: { dimension: true },
    })

    const gapDimensions = scores
      .filter(s => Number(s.maturityGap) >= 1.0)
      .sort((a, b) => Number(b.maturityGap) - Number(a.maturityGap))

    if (gapDimensions.length === 0) {
      return Response.json({ message: 'Nenhum gap significativo identificado — parabéns!', created: 0, plans: [] })
    }

    const createdPlans = []

    for (const dimScore of gapDimensions) {
      const priority = dimScore.priorityLevel ?? determinePriority(Number(dimScore.maturityGap))
      const dimName = dimScore.dimension?.name ?? 'Dimensão'
      const currentScore = Number(dimScore.weightedScore).toFixed(1)
      const targetScore = Number(dimScore.desiredScore ?? 5).toFixed(1)
      const gap = Number(dimScore.maturityGap).toFixed(1)

      const [plan] = await db.insert(actionPlans).values({
        title: `Plano de Evolução — ${dimName}`,
        description: `Plano de 90 dias para evoluir ${dimName} do nível ${currentScore} para ${targetScore}. Gap: ${gap}.`,
        dimensionId: dimScore.dimensionId,
        companyId,
        createdBy: userId,
        priority,
        status: 'Active',
      }).returning()

      // Create 5 tasks with 30/60/90 day deadlines
      const dueDate30 = new Date(); dueDate30.setDate(dueDate30.getDate() + 30)
      const dueDate60 = new Date(); dueDate60.setDate(dueDate60.getDate() + 60)
      const dueDate90 = new Date(); dueDate90.setDate(dueDate90.getDate() + 90)

      const taskDefs = [
        {
          title: `Diagnóstico detalhado de ${dimName}`,
          description: `Mapear os indicadores com menor score em ${dimName} e identificar causas raiz. Revisar o relatório de deficiências (Comportamental/Ferramental/Técnica).`,
          dueDate: dueDate30.toISOString().split('T')[0],
        },
        {
          title: `Plano de ação 30 dias — ${dimName}`,
          description: `Definir as 3 iniciativas prioritárias para evoluir ${dimName} no primeiro mês. Cada iniciativa deve ter responsável e métrica de sucesso.`,
          dueDate: dueDate30.toISOString().split('T')[0],
        },
        {
          title: `Execução e acompanhamento semanal — ${dimName}`,
          description: `Executar as iniciativas definidas. Registrar check-in semanal com progresso, bloqueios e confiança na entrega.`,
          dueDate: dueDate60.toISOString().split('T')[0],
        },
        {
          title: `Revisão de meio ciclo (45 dias) — ${dimName}`,
          description: `Avaliar o progresso das iniciativas. Ajustar o plano se necessário. Preparar pauta para a próxima Board Meeting com resultados parciais.`,
          dueDate: dueDate60.toISOString().split('T')[0],
        },
        {
          title: `Entrega final 90 dias — ${dimName}`,
          description: `Consolidar os resultados do ciclo de 90 dias em ${dimName}. Realizar novo diagnóstico parcial para medir a evolução do score. Documentar aprendizados.`,
          dueDate: dueDate90.toISOString().split('T')[0],
        },
      ]

      await db.insert(tasks).values(
        taskDefs.map(t => ({
          ...t,
          actionPlanId: plan.id,
          dimensionId: dimScore.dimensionId,
          companyId,
          status: 'To Do' as const,
          requiresWeeklyCheckin: true,
        }))
      )

      createdPlans.push(plan)
    }

    return Response.json({ created: createdPlans.length, plans: createdPlans })
  } catch (error) {
    console.error('[action-plans/generate]', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
