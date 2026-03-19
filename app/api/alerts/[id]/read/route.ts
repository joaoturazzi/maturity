import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { alerts } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

export async function PATCH(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const { userId, sessionClaims } = await auth()
  if (!userId) return new Response('Unauthorized', { status: 401 })

  const companyId = (sessionClaims?.metadata as Record<string, string>)?.companyId as string

  await db.update(alerts)
    .set({ isRead: true })
    .where(and(
      eq(alerts.id, params.id),
      eq(alerts.companyId, companyId),
    ))

  return Response.json({ ok: true })
}
