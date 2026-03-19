import { auth } from '@clerk/nextjs/server'
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
  const { userId, sessionClaims } = await auth()
  if (!userId) return new Response('Unauthorized', { status: 401 })

  const companyId = (sessionClaims?.metadata as Record<string, string>)?.companyId as string

  const events = await db.query.accelerationEvents.findMany({
    where: eq(accelerationEvents.companyId, companyId),
    orderBy: accelerationEvents.scheduledFor,
  })
  return Response.json(events)
}

export async function POST(req: Request) {
  const { userId: postUserId, sessionClaims: postClaims } = await auth()
  if (!postUserId) return new Response('Unauthorized', { status: 401 })

  const postCompanyId = (postClaims?.metadata as Record<string, string>)?.companyId as string

  const body = createSchema.parse(await req.json())

  const [event] = await db.insert(accelerationEvents).values({
    ...body,
    scheduledFor: new Date(body.scheduledFor),
    companyId: postCompanyId,
    createdBy: postUserId,
    status: 'Scheduled',
  }).returning()

  return Response.json(event)
}
