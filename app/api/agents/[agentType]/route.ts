export const runtime = 'edge'
export const dynamic = 'force-dynamic'

import { streamText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { auth } from '@clerk/nextjs/server'
import { getCompanyIdEdge } from '@/lib/getCompanyIdEdge'
import { AGENT_CONFIGS } from '@/lib/agents/config'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ agentType: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) return new Response('Unauthorized', { status: 401 })

    const companyId = await getCompanyIdEdge(req)
    if (!companyId) return new Response('Forbidden', { status: 403 })

    const { agentType } = await params
    const agentConfig = AGENT_CONFIGS[agentType]
    if (!agentConfig) return new Response('Agent not found', { status: 404 })

    const { messages, context } = await req.json()

    // Montar system prompt com contexto passado pelo client
    const systemPrompt = buildSystemPrompt(agentConfig, context)

    const result = streamText({
      model: openai('gpt-4o'),
      system: systemPrompt,
      messages: (messages ?? []).slice(-20),
    })

    return result.toTextStreamResponse()
  } catch (err) {
    console.error('[agents/stream]', err)
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Internal error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

function buildSystemPrompt(
  agent: typeof AGENT_CONFIGS[string],
  context: Record<string, unknown> | null
): string {
  const noContext = !context || !context.hasDiagnostic

  let prompt = `Você é ${agent.name} (${agent.role}) da plataforma MaturityIQ da Grow Platform.
Você é um consultor estratégico especializado que conhece profundamente o método de maturidade empresarial com 5 dimensões: Estratégia, Produto, Mercado, Finanças e Branding.
${agent.personality}

Responda sempre em português brasileiro. Seja direto, analítico e orientado a resultados.
Máximo 3-4 parágrafos por resposta, a menos que seja solicitado algo mais longo.
Nunca invente dados. Se não tiver informação, pergunte.`

  if (noContext) {
    prompt += `\n\nA empresa ainda não realizou um diagnóstico de maturidade.
Incentive o usuário a completar o diagnóstico para que você possa dar recomendações personalizadas.
Enquanto isso, ofereça orientações gerais sobre a sua área de especialidade.`
    return prompt
  }

  const ctx = context as Record<string, unknown>

  prompt += `\n\n## Empresa
Nome: ${ctx.companyName ?? 'não informado'}
Setor: ${ctx.industry ?? 'não informado'}`

  const ws = ctx.websiteContext as Record<string, string> | null
  if (ws) {
    prompt += `\n\n## Contexto extraído do site
- O que fazem: ${ws.description}
- Público-alvo: ${ws.targetAudience}
- Proposta de valor: ${ws.valueProposition}
- Tom de voz: ${ws.toneOfVoice}`
  }

  prompt += `\n\n## Diagnóstico de Maturidade
IME Score: ${ctx.imeScore}/5.0
Nível: ${ctx.maturityLevel}
Realizado em: ${ctx.diagnosedAt
    ? new Date(ctx.diagnosedAt as string).toLocaleDateString('pt-BR')
    : 'data não disponível'}`

  const dims = (ctx.dimensions ?? []) as Array<Record<string, unknown>>
  if (dims.length > 0) {
    prompt += `\n\n## Scores por Dimensão (ordenado do mais crítico ao mais maduro)`
    for (const dim of dims) {
      const pctC = dim.pctComportamental as number
      const pctF = dim.pctFerramental as number
      const pctT = dim.pctTecnica as number
      const defType = pctC >= pctF && pctC >= pctT
        ? 'Comportamental'
        : pctF >= pctT
          ? 'Ferramental'
          : 'Técnica'
      prompt += `\n- ${dim.name}: ${dim.score}/5.0 (gap: ${dim.gap}, prioridade: ${dim.priority}, deficiência predominante: ${defType})`
      if (dim.narrative) {
        prompt += `\n  Análise: ${dim.narrative}`
      }
    }
  }

  const rd = ctx.relevantDimension as Record<string, unknown> | null
  if (rd) {
    prompt += `\n\n## Sua dimensão especializada: ${rd.name}
Score: ${rd.score}/5.0
Gap: ${rd.gap} pontos
Prioridade: ${rd.priority}
Deficiência comportamental: ${rd.pctComportamental}%
Deficiência ferramental: ${rd.pctFerramental}%
Deficiência técnica: ${rd.pctTecnica}%`
    if (rd.narrative) {
      prompt += `\nAnálise qualitativa: ${rd.narrative}`
    }
  }

  prompt += `\n\n## Instruções
- Use os dados reais do diagnóstico nas suas respostas
- Quando citar scores, use os valores exatos acima
- Priorize as dimensões com maior gap nas recomendações
- Seja específico e prático, não genérico
- Quando sugerir uma ação, especifique: O QUÊ fazer + POR QUÊ é prioritário + COMO começar
- Se o usuário perguntar algo fora da sua área, indique qual agente seria mais adequado`

  return prompt
}
