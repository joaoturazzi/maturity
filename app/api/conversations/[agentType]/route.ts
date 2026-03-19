import { auth } from '@clerk/nextjs/server'
import { getCompanyId } from '@/lib/getCompanyId'
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

    const companyId = await getCompanyId()

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

    const allMessages = conversation?.messages ?? []
    // Return last 50 messages to prevent payload bloat
    const messages = allMessages.slice(-50)

    return Response.json({
      messages,
      hasHistory: allMessages.length > 0,
    })
  } catch (error) {
    console.error('[conversations/GET]', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
