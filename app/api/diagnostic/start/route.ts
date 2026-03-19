import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { diagnosticCycles } from '@/lib/db/schema'

export async function POST() {
  const { userId, sessionClaims } = await auth()
  if (!userId) return new Response('Unauthorized', { status: 401 })

  const companyId = (sessionClaims?.metadata as Record<string, string>)?.companyId as string

  const [cycle] = await db.insert(diagnosticCycles).values({
    companyId,
    createdBy: userId,
    status: 'Draft',
  }).returning()

  return Response.json({ cycleId: cycle.id })
}
