export const dynamic = 'force-dynamic'

import { db } from '@/lib/db'
import { actionPlans, tasks, dimensionScores } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

const TASKS_BY_DIMENSION: Record<string, string[]> = {
  'Estratégia': [
    'Revisar e atualizar o plano de negócios',
    'Definir OKRs para o próximo trimestre',
    'Mapear diferenciais competitivos e validar com clientes',
    'Criar roadmap estratégico de 12 meses',
    'Alinhar equipe com visão e metas da empresa',
  ],
  'Produto': [
    'Mapear jornada do usuário e identificar pontos de fricção',
    'Revisar roadmap de produto com base no feedback de clientes',
    'Implementar processo de coleta sistemática de feedback',
    'Avaliar performance e estabilidade técnica da solução',
    'Definir métricas de produto (NPS, retenção, ativação)',
  ],
  'Mercado': [
    'Revisar personas e validar com clientes reais',
    'Criar ou atualizar proposta de valor clara e diferenciada',
    'Estruturar processo de geração de leads recorrente',
    'Implementar CRM e processo de follow-up de prospecções',
    'Definir estratégia de conteúdo para os próximos 90 dias',
  ],
  'Finanças': [
    'Implementar controle de fluxo de caixa semanal',
    'Calcular e monitorar LTV e CAC por canal de aquisição',
    'Revisar precificação com base em margem de contribuição',
    'Criar dashboard financeiro com KPIs essenciais',
    'Definir plano de captação de recursos se necessário',
  ],
  'Branding': [
    'Definir ou revisar identidade visual e manual de marca',
    'Documentar tom de voz e aplicar em todos os canais',
    'Criar calendário editorial de conteúdo para 30 dias',
    'Coletar 3 depoimentos e 1 case de sucesso de clientes',
    'Auditar presença digital e corrigir inconsistências',
  ],
}

export async function POST(req: Request) {
  try {
    const { cycleId, companyId } = await req.json()
    if (!cycleId || !companyId) {
      return Response.json({ error: 'Missing params' }, { status: 400 })
    }

    // Check for existing plans for this cycle
    const existing = await db.query.actionPlans.findFirst({
      where: and(eq(actionPlans.companyId, companyId), eq(actionPlans.cycleId, cycleId)),
    })
    if (existing) return Response.json({ ok: true, alreadyExists: true })

    const scores = await db.query.dimensionScores.findMany({
      where: eq(dimensionScores.cycleId, cycleId),
      with: { dimension: true },
    })

    const created = []
    const d30 = new Date(); d30.setDate(d30.getDate() + 30)
    const d60 = new Date(); d60.setDate(d60.getDate() + 60)
    const d90 = new Date(); d90.setDate(d90.getDate() + 90)
    const dueDates = [d30, d30, d60, d60, d90]

    for (const score of scores) {
      const gap = Number(score.maturityGap)
      if (gap < 1.0) continue

      const dimName = score.dimension?.name ?? ''
      const taskTitles = TASKS_BY_DIMENSION[dimName] ?? TASKS_BY_DIMENSION['Estratégia']

      const [plan] = await db.insert(actionPlans).values({
        title: `Plano de Evolução — ${dimName}`,
        description: `Plano de 90 dias: ${dimName} de ${Number(score.weightedScore).toFixed(1)} para ${Number(score.desiredScore ?? 5).toFixed(1)}. Gap: ${gap.toFixed(1)}.`,
        dimensionId: score.dimensionId,
        companyId,
        cycleId,
        priority: score.priorityLevel ?? 'Medium',
        status: 'Active',
      }).returning()

      for (let i = 0; i < taskTitles.length; i++) {
        await db.insert(tasks).values({
          title: taskTitles[i],
          description: `Task para evolução de ${dimName}.`,
          actionPlanId: plan.id,
          dimensionId: score.dimensionId,
          companyId,
          status: 'To Do',
          dueDate: dueDates[i].toISOString().split('T')[0],
          requiresWeeklyCheckin: true,
        })
      }
      created.push(plan)
    }

    return Response.json({ ok: true, created: created.length })
  } catch (err) {
    console.error('[action-plans/generate]', err)
    return Response.json({ error: 'Erro ao gerar plano' }, { status: 500 })
  }
}
