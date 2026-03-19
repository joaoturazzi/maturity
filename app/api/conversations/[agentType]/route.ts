export const dynamic = 'force-dynamic'

import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { aiConversations, aiMessages } from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { getCompanyId } from '@/lib/getCompanyId'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ agentType: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) return Response.json({ messages: [] })

    const companyId = await getCompanyId()
    if (!companyId) return Response.json({ messages: [] })

    const { agentType } = await params

    const conversation = await db.query.aiConversations.findFirst({
      where: and(
        eq(aiConversations.companyId, companyId),
        eq(aiConversations.userId, userId),
        eq(aiConversations.agentType, agentType),
      ),
      with: {
        messages: {
          orderBy: desc(aiMessages.createdAt),
          limit: 50,
        },
      },
    })

    return Response.json({
      messages: (conversation?.messages ?? []).reverse(),
      conversationId: conversation?.id ?? null,
    })
  } catch (err) {
    console.error('[conversations/GET]', err)
    return Response.json({ messages: [] })
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ agentType: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) return Response.json({ ok: false })

    const companyId = await getCompanyId()
    if (!companyId) return Response.json({ ok: false })

    const { agentType } = await params
    const { userMessage, assistantMessage } = await req.json()

    // Buscar ou criar conversa
    let conversation = await db.query.aiConversations.findFirst({
      where: and(
        eq(aiConversations.companyId, companyId),
        eq(aiConversations.userId, userId),
        eq(aiConversations.agentType, agentType),
      ),
    })

    if (!conversation) {
      const [newConv] = await db.insert(aiConversations).values({
        companyId,
        userId,
        agentType,
        lastMessageAt: new Date(),
      }).returning()
      conversation = newConv
    } else {
      await db.update(aiConversations)
        .set({ lastMessageAt: new Date() })
        .where(eq(aiConversations.id, conversation.id))
    }

    // Salvar mensagens
    await db.insert(aiMessages).values([
      { conversationId: conversation.id, role: 'user', content: userMessage },
      { conversationId: conversation.id, role: 'assistant', content: assistantMessage },
    ])

    return Response.json({ ok: true })
  } catch (err) {
    console.error('[conversations/POST]', err)
    return Response.json({ ok: false })
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ agentType: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) return Response.json({ ok: false })

    const companyId = await getCompanyId()
    if (!companyId) return Response.json({ ok: false })

    const { agentType } = await params

    const conversation = await db.query.aiConversations.findFirst({
      where: and(
        eq(aiConversations.companyId, companyId),
        eq(aiConversations.userId, userId),
        eq(aiConversations.agentType, agentType),
      ),
    })

    if (conversation) {
      // Delete messages first, then conversation
      await db.delete(aiMessages)
        .where(eq(aiMessages.conversationId, conversation.id))
      await db.delete(aiConversations)
        .where(eq(aiConversations.id, conversation.id))
    }

    return Response.json({ ok: true })
  } catch (err) {
    console.error('[conversations/DELETE]', err)
    return Response.json({ ok: false })
  }
}
