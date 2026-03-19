import { auth } from '@/auth'
import { db } from '@/lib/db'
import { diagnosticCycles } from '@/lib/db/schema'

export async function POST() {
  const session = await auth()
  if (!session) return new Response('Unauthorized', { status: 401 })

  const [cycle] = await db.insert(diagnosticCycles).values({
    companyId: session.user.companyId,
    createdBy: session.user.id,
    status: 'Draft',
  }).returning()

  return Response.json({ cycleId: cycle.id })
}
