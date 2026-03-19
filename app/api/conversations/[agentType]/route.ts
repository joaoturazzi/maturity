import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { aiConversations, aiMessages } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

export async function GET(
  _req: Request,
  { params }: { params: { agentType: string } }
) {
  const { userId, sessionClaims } = await auth()
  if (!userId) return new Response('Unauthorized', { status: 401 })

  const companyId = (sessionClaims?.metadata as Record<string, string>)?.companyId as string

  const conversation = await db.query.aiConversations.findFirst({
    where: and(
      eq(aiConversations.companyId, companyId),
      eq(aiConversations.userId, userId),
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
