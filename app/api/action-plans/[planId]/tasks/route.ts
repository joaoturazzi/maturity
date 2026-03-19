import { auth } from '@clerk/nextjs/server'
import { getCompanyId } from '@/lib/getCompanyId'
import { db } from '@/lib/db'
import { tasks, actionPlans } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const createTaskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  assignedTo: z.string().uuid().optional(),
  dueDate: z.string().optional(),
  status: z.enum(['To Do', 'In Progress', 'In Review', 'Done', 'Blocked']).default('To Do'),
  requiresWeeklyCheckin: z.boolean().default(true),
})

export async function POST(req: Request, { params }: { params: Promise<{ planId: string }> }) {
  try {
    const { planId } = await params
    const { userId, sessionClaims } = await auth()
    if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const companyId = await getCompanyId()

    const plan = await db.query.actionPlans.findFirst({
      where: eq(actionPlans.id, planId),
    })
    if (!plan || plan.companyId !== companyId) {
      return Response.json({ error: 'Not found' }, { status: 404 })
    }

    const body = createTaskSchema.parse(await req.json())

    const [task] = await db.insert(tasks).values({
      ...body,
      actionPlanId: planId,
      dimensionId: plan.dimensionId ?? undefined,
      companyId,
    }).returning()

    return Response.json(task)
  } catch (error) {
    console.error('[action-plans/tasks/POST]', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
