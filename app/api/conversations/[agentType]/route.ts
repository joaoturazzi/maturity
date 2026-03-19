import { auth } from '@/auth'
import { db } from '@/lib/db'
import { aiConversations, aiMessages } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

export async function GET(
  _req: Request,
  { params }: { params: { agentType: string } }
) {
  const session = await auth()
  if (!session) return new Response('Unauthorized', { status: 401 })

  const conversation = await db.query.aiConversations.findFirst({
    where: and(
      eq(aiConversations.companyId, session.user.companyId),
      eq(aiConversations.userId, session.user.id!),
      eq(aiConversations.agentType, decodeURIComponent(params.agentType)),
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
}
