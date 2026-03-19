import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { checkins } from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const { taskId } = await params
    const { userId, sessionClaims } = await auth()
    if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const companyId = (sessionClaims?.metadata as Record<string, string>)?.companyId as string

    const history = await db.query.checkins.findMany({
      where: and(
        eq(checkins.taskId, taskId),
        eq(checkins.companyId, companyId),
      ),
      orderBy: desc(checkins.weekStartDate),
    })

    return Response.json(history)
  } catch (error) {
    console.error('[checkins/history/GET]', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
