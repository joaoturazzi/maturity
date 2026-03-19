import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { tasks } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ planId: string; taskId: string }> }
) {
  try {
    const { taskId } = await params
    const { userId, sessionClaims } = await auth()
    if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const companyId = (sessionClaims?.metadata as Record<string, string>)?.companyId as string

    const { status } = await req.json()

    const [updated] = await db.update(tasks)
      .set({
        status,
        completedAt: status === 'Done' ? new Date() : null,
      })
      .where(and(
        eq(tasks.id, taskId),
        eq(tasks.companyId, companyId),
      ))
      .returning()

    return Response.json(updated)
  } catch (error) {
    console.error('[action-plans/tasks/status/PATCH]', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
