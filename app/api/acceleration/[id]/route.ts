import { auth } from '@clerk/nextjs/server'
import { getCompanyId } from '@/lib/getCompanyId'
import { db } from '@/lib/db'
import { accelerationEvents } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { userId, sessionClaims } = await auth()
    if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const companyId = await getCompanyId()

    const body = await req.json()

    const [updated] = await db.update(accelerationEvents)
      .set(body)
      .where(and(
        eq(accelerationEvents.id, id),
        eq(accelerationEvents.companyId, companyId),
      ))
      .returning()

    return Response.json(updated)
  } catch (error) {
    console.error('[acceleration/PATCH]', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { userId: delUserId, sessionClaims: delClaims } = await auth()
    if (!delUserId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const delCompanyId = await getCompanyId()

    await db.delete(accelerationEvents)
      .where(and(
        eq(accelerationEvents.id, id),
        eq(accelerationEvents.companyId, delCompanyId),
      ))

    return Response.json({ ok: true })
  } catch (error) {
    console.error('[acceleration/DELETE]', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
