import { auth } from '@/auth'
import { db } from '@/lib/db'
import { checkins } from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'

export async function GET(
  _req: Request,
  { params }: { params: { taskId: string } }
) {
  const session = await auth()
  if (!session) return new Response('Unauthorized', { status: 401 })

  const history = await db.query.checkins.findMany({
    where: and(
      eq(checkins.taskId, params.taskId),
      eq(checkins.companyId, session.user.companyId),
    ),
    orderBy: desc(checkins.weekStartDate),
  })

  return Response.json(history)
}
