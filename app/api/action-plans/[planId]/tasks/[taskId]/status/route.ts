import { auth } from '@/auth'
import { db } from '@/lib/db'
import { tasks } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

export async function PATCH(
  req: Request,
  { params }: { params: { planId: string; taskId: string } }
) {
  const session = await auth()
  if (!session) return new Response('Unauthorized', { status: 401 })

  const { status } = await req.json()

  const [updated] = await db.update(tasks)
    .set({
      status,
      completedAt: status === 'Done' ? new Date() : null,
    })
    .where(and(
      eq(tasks.id, params.taskId),
      eq(tasks.companyId, session.user.companyId),
    ))
    .returning()

  return Response.json(updated)
}
