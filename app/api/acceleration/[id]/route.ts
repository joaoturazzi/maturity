import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { accelerationEvents } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { userId, sessionClaims } = await auth()
  if (!userId) return new Response('Unauthorized', { status: 401 })

  const companyId = (sessionClaims?.metadata as Record<string, string>)?.companyId as string

  const body = await req.json()

  const [updated] = await db.update(accelerationEvents)
    .set(body)
    .where(and(
      eq(accelerationEvents.id, id),
      eq(accelerationEvents.companyId, companyId),
    ))
    .returning()

  return Response.json(updated)
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { userId: delUserId, sessionClaims: delClaims } = await auth()
  if (!delUserId) return new Response('Unauthorized', { status: 401 })

  const delCompanyId = (delClaims?.metadata as Record<string, string>)?.companyId as string

  await db.delete(accelerationEvents)
    .where(and(
      eq(accelerationEvents.id, id),
      eq(accelerationEvents.companyId, delCompanyId),
    ))

  return Response.json({ ok: true })
}
