import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { diagnosticCycles } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'

export async function GET() {
  const { userId, sessionClaims } = await auth()
  if (!userId) return new Response('Unauthorized', { status: 401 })

  const role = (sessionClaims?.metadata as Record<string, string>)?.role
  if (!role || !['SuperUser', 'Admin'].includes(role)) {
    return new Response('Forbidden', { status: 403 })
  }

  const companies = await db.query.companies.findMany({
    with: {
      diagnosticCycles: {
        where: eq(diagnosticCycles.status, 'Submitted'),
        orderBy: desc(diagnosticCycles.submittedAt),
        limit: 1,
        columns: { id: true, overallImeScore: true, maturityLevel: true, submittedAt: true },
      },
    },
  })

  return Response.json(companies)
}
