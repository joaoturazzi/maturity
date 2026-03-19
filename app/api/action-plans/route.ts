import { auth } from '@/auth'
import { db } from '@/lib/db'
import { actionPlans } from '@/lib/db/schema'
import { z } from 'zod'

const createSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  dimensionId: z.string().uuid().optional(),
  priority: z.enum(['Critical', 'High', 'Medium', 'Low']).default('Medium'),
})

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return new Response('Unauthorized', { status: 401 })

  const body = createSchema.parse(await req.json())

  const [plan] = await db.insert(actionPlans).values({
    ...body,
    companyId: session.user.companyId,
    createdBy: session.user.id,
    status: 'Active',
  }).returning()

  return Response.json(plan)
}
