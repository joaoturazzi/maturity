import { streamText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { auth } from '@clerk/nextjs/server'
import { AGENT_CONFIG, type AgentType } from '@/lib/agents/config'
import { buildAgentContext, buildSystemPrompt } from '@/lib/agents/context'
import { db } from '@/lib/db'
import { companies } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export const runtime = 'edge'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ agentType: string }> }
) {
  const { agentType: rawAgentType } = await params
  const { userId, sessionClaims } = await auth()
  if (!userId) return new Response('Unauthorized', { status: 401 })

  const companyId = (sessionClaims?.metadata as Record<string, string>)?.companyId as string

  const agentType = decodeURIComponent(rawAgentType) as AgentType
  const config = AGENT_CONFIG[agentType]
  if (!config) return new Response('Not found', { status: 404 })

  const company = await db.query.companies.findFirst({
    where: eq(companies.id, companyId),
    columns: { name: true },
  })

  const context = await buildAgentContext(
    companyId,
    company?.name ?? 'Empresa',
    agentType
  )

  const systemPrompt = buildSystemPrompt(agentType, context)

  const result = streamText({
    model: openai('gpt-4o'),
    system: systemPrompt,
    messages: [{
      role: 'user',
      content: `Inicie a conversa com uma mensagem proativa curta (máximo 3 frases) baseada no diagnóstico atual da empresa. Identifique o gap mais crítico da ${config.dimensionName ?? 'análise geral'} e sugira um próximo passo concreto. Não se apresente — vá direto ao ponto.`,
    }],
    maxOutputTokens: 200,
  })

  const text = await result.text
  return Response.json({ message: text })
}
