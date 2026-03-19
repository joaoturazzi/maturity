import { streamText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { auth } from '@/auth'
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
  { params }: { params: { agentType: string } }
) {
  const session = await auth()
  if (!session) return new Response('Unauthorized', { status: 401 })

  const agentType = decodeURIComponent(params.agentType) as AgentType
  if (!AGENT_CONFIG[agentType]) {
    return new Response('Agent not found', { status: 404 })
  }

  const { messages } = bodySchema.parse(await req.json())
  const companyId = session.user.companyId
  const userId = session.user.id!

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

  // Mock mode for development
  if (process.env.USE_AI_MOCK === 'true') {
    const mockText = `[MOCK - ${agentType}] Contexto carregado para ${context.companyName}. IME Score: ${context.imeScore}. Esta é uma resposta simulada para desenvolvimento local sem consumir tokens da OpenAI.`
    const words = mockText.split(' ')
    let i = 0
    const stream = new ReadableStream({
      async pull(controller) {
        if (i >= words.length) {
          // Persist mock response
          await persistMessage(companyId, userId, agentType, {
            role: 'assistant',
            content: mockText,
          })
          controller.close()
          return
        }
        controller.enqueue(new TextEncoder().encode(words[i++] + ' '))
        await new Promise(r => setTimeout(r, 30))
      },
    })
    return new Response(stream, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  }

  // Real OpenAI streaming
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
