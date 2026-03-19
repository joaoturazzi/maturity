import { db } from '@/lib/db'
import { diagnosticCycles, actionPlans } from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { AGENT_CONFIG, type AgentType } from './config'

export type AgentContext = {
  companyName: string
  imeScore: string
  maturityLevel: string
  lastDiagnosticDate: string
  dimensionContext: string
  actionPlanContext: string
}

export async function buildAgentContext(
  companyId: string,
  companyName: string,
  agentType: AgentType
): Promise<AgentContext> {
  const latestCycle = await db.query.diagnosticCycles.findFirst({
    where: and(
      eq(diagnosticCycles.companyId, companyId),
      eq(diagnosticCycles.status, 'Submitted'),
    ),
    orderBy: desc(diagnosticCycles.submittedAt),
    with: {
      dimensionScores: {
        with: { dimension: true },
      },
    },
  })

  if (!latestCycle) {
    return {
      companyName,
      imeScore: 'Não disponível',
      maturityLevel: 'Não avaliado',
      lastDiagnosticDate: 'Nenhum diagnóstico realizado',
      dimensionContext: 'Nenhum diagnóstico disponível. Oriente o usuário a realizar o diagnóstico primeiro.',
      actionPlanContext: 'Sem dados de plano de ação.',
    }
  }

  const config = AGENT_CONFIG[agentType]
  const isOrchestrator = agentType === 'Orquestrador'

  // Dimension context
  let dimensionContext = ''
  if (isOrchestrator) {
    dimensionContext = '### Scores de todas as dimensões\n'
    dimensionContext += latestCycle.dimensionScores.map(d =>
      `- ${d.dimension?.name}: ${Number(d.weightedScore).toFixed(1)}/5.0 ` +
      `(Gap: ${Number(d.maturityGap).toFixed(1)}, Priority: ${d.priorityLevel})`
    ).join('\n')
  } else {
    const myDimScore = latestCycle.dimensionScores.find(
      d => d.dimension?.name === config.dimensionName
    )
    if (myDimScore) {
      dimensionContext = `### Sua dimensão: ${config.dimensionName}\n`
      dimensionContext += `Score atual: ${Number(myDimScore.weightedScore).toFixed(1)}/5.0\n`
      dimensionContext += `Score desejado: ${Number(myDimScore.desiredScore).toFixed(1)}/5.0\n`
      dimensionContext += `Gap: ${Number(myDimScore.maturityGap).toFixed(1)}\n`
      dimensionContext += `Priority: ${myDimScore.priorityLevel}\n`
    }
  }

  // Action plan context
  const activePlans = await db.query.actionPlans.findMany({
    where: and(
      eq(actionPlans.companyId, companyId),
      eq(actionPlans.status, 'Active'),
    ),
    with: { dimension: true, tasks: true },
    limit: isOrchestrator ? 10 : 3,
  })

  const relevantPlans = isOrchestrator
    ? activePlans
    : activePlans.filter(p => p.dimension?.name === config.dimensionName)

  let actionPlanContext = ''
  if (!relevantPlans.length) {
    actionPlanContext = 'Nenhum plano de ação ativo para esta dimensão ainda.'
  } else {
    actionPlanContext = relevantPlans.map(p => {
      const pending = p.tasks.filter(t => t.status !== 'Done').slice(0, 3)
      return `Plano: ${p.title} (${p.priority})\n` +
        `Tasks pendentes: ${pending.map(t => `"${t.title}"`).join(', ') || 'Nenhuma'}`
    }).join('\n\n')
  }

  return {
    companyName,
    imeScore: Number(latestCycle.overallImeScore).toFixed(1),
    maturityLevel: latestCycle.maturityLevel ?? 'Não calculado',
    lastDiagnosticDate: latestCycle.submittedAt
      ? new Date(latestCycle.submittedAt).toLocaleDateString('pt-BR')
      : 'Desconhecida',
    dimensionContext,
    actionPlanContext,
  }
}

export function buildSystemPrompt(agentType: AgentType, context: AgentContext): string {
  const config = AGENT_CONFIG[agentType]

  return `Você é o ${config.title} da plataforma MaturityIQ, atuando como ${config.role} para a empresa ${context.companyName}.

## Seu perfil
${config.personality}

## Contexto da empresa — DIAGNÓSTICO ATUAL
Empresa: ${context.companyName}
IME Score geral: ${context.imeScore}/5.0
Nível de maturidade: ${context.maturityLevel}
Data do último diagnóstico: ${context.lastDiagnosticDate}

${context.dimensionContext}

## Plano de ação ativo
${context.actionPlanContext}

## Regras de comportamento
- Responda sempre em português brasileiro
- Seja direto e objetivo. Sem floreios ou elogios genéricos.
- Quando der uma recomendação, explique o porquê com base nos dados do diagnóstico
- Se o usuário perguntar algo fora da sua área de especialidade, diga qual agente seria mais adequado
- Nunca invente dados. Se não tiver informação suficiente, pergunte ao usuário.
- Quando sugerir uma ação, sempre especifique: O QUÊ fazer + POR QUÊ é prioritário + COMO começar
- Limite respostas a no máximo 4 parágrafos. Se precisar de mais, use bullet points concisos.`
}
