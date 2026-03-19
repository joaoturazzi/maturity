export const dynamic = 'force-dynamic'

import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { tasks } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'
import { getCompanyId } from '@/lib/getCompanyId'

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
    const { status } = await req.json()

    await db.update(tasks)
      .set({ status, completedAt: status === 'Done' ? new Date() : null })
      .where(and(eq(tasks.id, taskId), eq(tasks.companyId, companyId)))

    return Response.json({ ok: true })
  } catch (error) {
    console.error('[tasks/status]', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
