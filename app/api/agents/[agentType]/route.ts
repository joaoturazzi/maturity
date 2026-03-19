import { streamText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { auth } from '@clerk/nextjs/server'
import { AGENT_CONFIG, type AgentType } from '@/lib/agents/config'
import { buildAgentContext, buildSystemPrompt } from '@/lib/agents/context'
import { db } from '@/lib/db'
import { aiConversations, aiMessages, companies } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { z } from 'zod'

export const runtime = 'edge'

const bodySchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })),
})

export async function POST(
  req: Request,
  { params }: { params: Promise<{ agentType: string }> }
) {
  try {
    const { agentType: rawAgentType } = await params
    const { userId, sessionClaims } = await auth()
    if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const agentType = decodeURIComponent(rawAgentType) as AgentType
    if (!AGENT_CONFIG[agentType]) {
      return Response.json({ error: 'Agent not found' }, { status: 404 })
    }

    const { messages: rawMessages } = bodySchema.parse(await req.json())
    // Limit history to prevent context overflow
    const messages = rawMessages.slice(-20)
    // Read from JWT metadata (primary) or cookie header (fallback)
    const meta = sessionClaims?.metadata as Record<string, string> | undefined
    const jwtCompanyId = meta?.companyId ?? ''
    // Edge runtime: read cookie from request headers
    const cookieHeader = req.headers.get('cookie') ?? ''
    const cookieMatch = cookieHeader.match(/maturityiq_company=([^;]+)/)
    const companyId = jwtCompanyId || (cookieMatch ? cookieMatch[1] : '')

    // Get company name
    const company = await db.query.companies.findFirst({
      where: eq(companies.id, companyId),
      columns: { name: true },
    })

    // Build context
    const context = await buildAgentContext(companyId, company?.name ?? 'Empresa', agentType)
    const systemPrompt = buildSystemPrompt(agentType, context)

    // Persist user message
    await persistMessage(companyId, userId, agentType, {
      role: 'user',
      content: messages[messages.length - 1].content,
    })

    // OpenAI streaming
    const result = streamText({
      model: openai('gpt-4o'),
      system: systemPrompt,
      messages,
      maxOutputTokens: 1000,
      temperature: 0.7,
      onFinish: async ({ text }) => {
        await persistMessage(companyId, userId, agentType, {
          role: 'assistant',
          content: text,
        })
      },
    })

    return result.toTextStreamResponse()
  } catch (error) {
    console.error('[agents/POST]', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function persistMessage(
  companyId: string,
  userId: string,
  agentType: AgentType,
  message: { role: 'user' | 'assistant'; content: string }
) {
  let conversation = await db.query.aiConversations.findFirst({
    where: and(
      eq(aiConversations.companyId, companyId),
      eq(aiConversations.userId, userId),
      eq(aiConversations.agentType, agentType),
    ),
  })

  if (!conversation) {
    const [created] = await db.insert(aiConversations).values({
      companyId,
      userId,
      agentType,
      lastMessageAt: new Date(),
    }).returning()
    conversation = created
  } else {
    await db.update(aiConversations)
      .set({ lastMessageAt: new Date() })
      .where(eq(aiConversations.id, conversation.id))
  }

  await db.insert(aiMessages).values({
    conversationId: conversation.id,
    role: message.role,
    content: message.content,
  })
}
