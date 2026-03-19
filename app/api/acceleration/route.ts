import { auth } from '@/auth'
import { db } from '@/lib/db'
import { accelerationEvents } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

const createSchema = z.object({
  eventType: z.enum(['Building Day', 'Expert Session', 'Board Meeting']),
  title: z.string().min(1),
  scheduledFor: z.string(),
  notes: z.string().optional(),
})

export async function GET(_req: Request) {
  const session = await auth()
  if (!session) return new Response('Unauthorized', { status: 401 })

  const events = await db.query.accelerationEvents.findMany({
    where: eq(accelerationEvents.companyId, session.user.companyId),
    orderBy: accelerationEvents.scheduledFor,
  })
  return Response.json(events)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return new Response('Unauthorized', { status: 401 })

  const body = createSchema.parse(await req.json())

  const [event] = await db.insert(accelerationEvents).values({
    ...body,
    scheduledFor: new Date(body.scheduledFor),
    companyId: session.user.companyId,
    createdBy: session.user.id,
    status: 'Scheduled',
  }).returning()

  return Response.json(event)
}
