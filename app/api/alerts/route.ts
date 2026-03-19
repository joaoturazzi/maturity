import { auth } from '@/auth'
import { db } from '@/lib/db'
import { alerts } from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'

export async function GET(req: Request) {
  const session = await auth()
  if (!session) return new Response('Unauthorized', { status: 401 })

  const { searchParams } = new URL(req.url)
  const unreadOnly = searchParams.get('unreadOnly') === 'true'

  const conditions = [eq(alerts.companyId, session.user.companyId)]
  if (unreadOnly) conditions.push(eq(alerts.isRead, false))

  const result = await db.query.alerts.findMany({
    where: and(...conditions),
    orderBy: desc(alerts.createdAt),
    limit: 20,
  })

  return Response.json({
    alerts: result,
    count: result.length,
  })
}
