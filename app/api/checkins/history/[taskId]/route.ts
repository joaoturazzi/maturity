import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { checkins } from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'

export async function GET(
  _req: Request,
  { params }: { params: { taskId: string } }
) {
  const { userId, sessionClaims } = await auth()
  if (!userId) return new Response('Unauthorized', { status: 401 })

  const companyId = (sessionClaims?.metadata as Record<string, string>)?.companyId as string

  const history = await db.query.checkins.findMany({
    where: and(
      eq(checkins.taskId, params.taskId),
      eq(checkins.companyId, companyId),
    ),
    orderBy: desc(checkins.weekStartDate),
  })

  return Response.json(history)
}
