import { auth } from '@clerk/nextjs/server'
import { getCompanyId } from '@/lib/getCompanyId'
import { db } from '@/lib/db'
import { checkins, tasks } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const checkinSchema = z.object({
  taskId: z.string().uuid(),
  actionPlanId: z.string().uuid().optional(),
  progressNotes: z.string().min(1),
  blockerNotes: z.string().optional(),
  confidenceRating: z.number().int().min(1).max(5),
  newStatus: z.enum(['To Do', 'In Progress', 'In Review', 'Done', 'Blocked']),
})

function getWeekStart(): string {
  const now = new Date()
  const day = now.getDay()
  const diff = now.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(now)
  monday.setDate(diff)
  monday.setHours(0, 0, 0, 0)
  return monday.toISOString().split('T')[0]
}

export async function POST(req: Request) {
  try {
    const { userId, sessionClaims } = await auth()
    if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const companyId = await getCompanyId()

    const body = checkinSchema.parse(await req.json())
    const weekStartDate = getWeekStart()

    // Check for existing check-in this week
    const existing = await db.query.checkins.findFirst({
      where: and(
        eq(checkins.taskId, body.taskId),
        eq(checkins.submittedBy, userId),
        eq(checkins.weekStartDate, weekStartDate),
      ),
    })
    if (existing) {
      return Response.json({ error: 'Check-in já enviado esta semana' }, { status: 409 })
    }

    // Insert check-in
    const [checkin] = await db.insert(checkins).values({
      taskId: body.taskId,
      actionPlanId: body.actionPlanId,
      progressNotes: body.progressNotes,
      blockerNotes: body.blockerNotes,
      confidenceRating: body.confidenceRating,
      newStatus: body.newStatus,
      companyId,
      submittedBy: userId,
      weekStartDate,
    }).returning()

    // Update task status
    await db.update(tasks)
      .set({
        status: body.newStatus,
        completedAt: body.newStatus === 'Done' ? new Date() : null,
      })
      .where(and(
        eq(tasks.id, body.taskId),
        eq(tasks.companyId, companyId),
      ))

    return Response.json(checkin)
  } catch (error) {
    console.error('[checkins/POST]', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
