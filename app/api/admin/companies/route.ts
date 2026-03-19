import { auth } from '@clerk/nextjs/server'
import { parseClerkMeta } from '@/lib/clerkMeta'
import { db } from '@/lib/db'
import { diagnosticCycles } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const { userId, sessionClaims } = await auth()
    if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const role = parseClerkMeta(sessionClaims).role ?? ''
    if (!role || !['SuperUser', 'Admin'].includes(role)) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
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
  } catch (error) {
    console.error('[admin/companies/GET]', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
