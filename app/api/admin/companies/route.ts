import { auth } from '@/auth'
import { db } from '@/lib/db'
import { diagnosticCycles } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'

export async function GET() {
  const session = await auth()
  if (!session) return new Response('Unauthorized', { status: 401 })

  if (!['SuperUser', 'Admin'].includes(session.user.role)) {
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
