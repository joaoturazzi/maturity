export const dynamic = 'force-dynamic'

import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { tasks, checkins } from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { getCompanyId } from '@/lib/getCompanyId'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })
    const companyId = await getCompanyId()
    if (!companyId) return Response.json({ error: 'Forbidden' }, { status: 403 })

    const { taskId } = await params

    const task = await db.query.tasks.findFirst({
      where: and(eq(tasks.id, taskId), eq(tasks.companyId, companyId)),
      with: {
        actionPlan: { with: { dimension: true } },
        checkins: { orderBy: desc(checkins.submittedAt) },
      },
    })

    if (!task) return Response.json({ error: 'Not found' }, { status: 404 })

    return Response.json({ task })
  } catch (error) {
    console.error('[tasks/GET]', error)
    return Response.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })
    const companyId = await getCompanyId()
    if (!companyId) return Response.json({ error: 'Forbidden' }, { status: 403 })

    const { taskId } = await params
    const body = await req.json()

    const update: Record<string, unknown> = {}
    if (body.title !== undefined) update.title = body.title
    if (body.description !== undefined) update.description = body.description
    if (body.dueDate !== undefined) update.dueDate = body.dueDate
    if (body.status !== undefined) {
      update.status = body.status
      update.completedAt = body.status === 'Done' ? new Date() : null
    }

    await db.update(tasks)
      .set(update)
      .where(and(eq(tasks.id, taskId), eq(tasks.companyId, companyId)))

    return Response.json({ ok: true })
  } catch (error) {
    console.error('[tasks/PATCH]', error)
    return Response.json({ error: 'Internal error' }, { status: 500 })
  }
}
