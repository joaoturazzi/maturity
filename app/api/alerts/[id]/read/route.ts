import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { alerts } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { userId, sessionClaims } = await auth()
    if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const companyId = (sessionClaims?.metadata as Record<string, string>)?.companyId as string

    await db.update(alerts)
      .set({ isRead: true })
      .where(and(
        eq(alerts.id, id),
        eq(alerts.companyId, companyId),
      ))

    return Response.json({ ok: true })
  } catch (error) {
    console.error('[alerts/read/PATCH]', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
