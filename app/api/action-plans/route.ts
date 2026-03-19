import { auth } from '@clerk/nextjs/server'
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
  const { userId, sessionClaims } = await auth()
  if (!userId) return new Response('Unauthorized', { status: 401 })

  const companyId = (sessionClaims?.metadata as Record<string, string>)?.companyId as string

  const body = createSchema.parse(await req.json())

  const [plan] = await db.insert(actionPlans).values({
    ...body,
    companyId,
    createdBy: userId,
    status: 'Active',
  }).returning()

  return Response.json(plan)
}
