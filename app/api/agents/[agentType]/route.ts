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
  const { agentType: rawAgentType } = await params
  const { userId, sessionClaims } = await auth()
  if (!userId) return new Response('Unauthorized', { status: 401 })

  const agentType = decodeURIComponent(rawAgentType) as AgentType
  if (!AGENT_CONFIG[agentType]) {
    return new Response('Agent not found', { status: 404 })
  }

  const { messages } = bodySchema.parse(await req.json())
  const companyId = (sessionClaims?.metadata as Record<string, string>)?.companyId as string

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
