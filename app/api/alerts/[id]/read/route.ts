import { auth } from '@/auth'
import { db } from '@/lib/db'
import { alerts } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

export async function PATCH(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session) return new Response('Unauthorized', { status: 401 })

  await db.update(alerts)
    .set({ isRead: true })
    .where(and(
      eq(alerts.id, params.id),
      eq(alerts.companyId, session.user.companyId),
    ))

  return Response.json({ ok: true })
}
