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
  req: Request,
  { params }: { params: Promise<{ agentType: string }> }
) {
  try {
    const { agentType: rawAgentType } = await params
    const { userId, sessionClaims } = await auth()
    if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    // Read from JWT metadata (primary) or cookie header (fallback)
    const meta = sessionClaims?.metadata as Record<string, string> | undefined
    const jwtCompanyId = meta?.companyId ?? ''
    // Edge runtime: read cookie from request headers
    const cookieHeader = req.headers.get('cookie') ?? ''
    const cookieMatch = cookieHeader.match(/maturityiq_company=([^;]+)/)
    const companyId = jwtCompanyId || (cookieMatch ? cookieMatch[1] : '')

    const agentType = decodeURIComponent(rawAgentType) as AgentType
    const config = AGENT_CONFIG[agentType]
    if (!config) return Response.json({ error: 'Not found' }, { status: 404 })

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
  } catch (error) {
    console.error('[agents/init/GET]', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
