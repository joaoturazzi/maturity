import { auth } from '@/auth'
import { db } from '@/lib/db'
import { accelerationEvents } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session) return new Response('Unauthorized', { status: 401 })

  const body = await req.json()

  const [updated] = await db.update(accelerationEvents)
    .set(body)
    .where(and(
      eq(accelerationEvents.id, params.id),
      eq(accelerationEvents.companyId, session.user.companyId),
    ))
    .returning()

  return Response.json(updated)
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session) return new Response('Unauthorized', { status: 401 })

  await db.delete(accelerationEvents)
    .where(and(
      eq(accelerationEvents.id, params.id),
      eq(accelerationEvents.companyId, session.user.companyId),
    ))

  return Response.json({ ok: true })
}
