import { auth } from '@clerk/nextjs/server'
import { getCompanyId } from '@/lib/getCompanyId'
import { db } from '@/lib/db'
import { accelerationEvents } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const createSchema = z.object({
  eventType: z.enum(['Building Day', 'Expert Session', 'Board Meeting']),
  title: z.string().min(1),
  scheduledFor: z.string(),
  notes: z.string().optional(),
})

export async function GET(_req: Request) {
  try {
    const { userId, sessionClaims } = await auth()
    if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const companyId = await getCompanyId()

    const events = await db.query.accelerationEvents.findMany({
      where: eq(accelerationEvents.companyId, companyId),
      orderBy: accelerationEvents.scheduledFor,
    })
    return Response.json(events)
  } catch (error) {
    console.error('[acceleration/GET]', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const { userId: postUserId, sessionClaims: postClaims } = await auth()
    if (!postUserId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const postCompanyId = await getCompanyId()

    const body = createSchema.parse(await req.json())

    const [event] = await db.insert(accelerationEvents).values({
      ...body,
      scheduledFor: new Date(body.scheduledFor),
      companyId: postCompanyId,
      createdBy: postUserId,
      status: 'Scheduled',
    }).returning()

    return Response.json(event)
  } catch (error) {
    console.error('[acceleration/POST]', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
