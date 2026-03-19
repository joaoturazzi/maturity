import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { tasks, actionPlans } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

const createTaskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  assignedTo: z.string().uuid().optional(),
  dueDate: z.string().optional(),
  status: z.enum(['To Do', 'In Progress', 'In Review', 'Done', 'Blocked']).default('To Do'),
  requiresWeeklyCheckin: z.boolean().default(true),
})

export async function POST(req: Request, { params }: { params: { planId: string } }) {
  const { userId, sessionClaims } = await auth()
  if (!userId) return new Response('Unauthorized', { status: 401 })

  const companyId = (sessionClaims?.metadata as Record<string, string>)?.companyId as string

  const plan = await db.query.actionPlans.findFirst({
    where: eq(actionPlans.id, params.planId),
  })
  if (!plan || plan.companyId !== companyId) {
    return new Response('Not found', { status: 404 })
  }

  const body = createTaskSchema.parse(await req.json())

  const [task] = await db.insert(tasks).values({
    ...body,
    actionPlanId: params.planId,
    dimensionId: plan.dimensionId ?? undefined,
    companyId,
  }).returning()

  return Response.json(task)
}
