import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { actionPlans } from '@/lib/db/schema'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const createSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  dimensionId: z.string().uuid().optional(),
  priority: z.enum(['Critical', 'High', 'Medium', 'Low']).default('Medium'),
})

export async function POST(req: Request) {
  try {
    const { userId, sessionClaims } = await auth()
    if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const companyId = (sessionClaims?.metadata as Record<string, string>)?.companyId as string

    const body = createSchema.parse(await req.json())

    const [plan] = await db.insert(actionPlans).values({
      ...body,
      companyId,
      createdBy: userId,
      status: 'Active',
    }).returning()

    return Response.json(plan)
  } catch (error) {
    console.error('[action-plans/POST]', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
