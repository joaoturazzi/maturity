import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { aiConversations, aiMessages } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ agentType: string }> }
) {
  try {
    const { agentType } = await params
    const { userId, sessionClaims } = await auth()
    if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const companyId = (sessionClaims?.metadata as Record<string, string>)?.companyId as string

    const conversation = await db.query.aiConversations.findFirst({
      where: and(
        eq(aiConversations.companyId, companyId),
        eq(aiConversations.userId, userId),
        eq(aiConversations.agentType, decodeURIComponent(agentType)),
      ),
      with: {
        messages: {
          orderBy: aiMessages.createdAt,
        },
      },
    })

    return Response.json({
      messages: conversation?.messages ?? [],
      hasHistory: (conversation?.messages?.length ?? 0) > 0,
    })
  } catch (error) {
    console.error('[conversations/GET]', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
