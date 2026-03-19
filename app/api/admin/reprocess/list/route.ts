export const dynamic = 'force-dynamic'

import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { diagnosticCycles } from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { getCompanyId } from '@/lib/getCompanyId'

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })
    const companyId = await getCompanyId()
    if (!companyId) return Response.json({ cycles: [] })

    const cycles = await db.query.diagnosticCycles.findMany({
      where: and(eq(diagnosticCycles.companyId, companyId), eq(diagnosticCycles.status, 'Submitted')),
      orderBy: desc(diagnosticCycles.submittedAt),
    })

    return Response.json({
      cycles: cycles.map(c => ({
        id: c.id,
        score: Number(c.overallImeScore ?? 0).toFixed(1),
        level: c.maturityLevel ?? 'N/A',
        date: c.submittedAt ? new Date(c.submittedAt).toLocaleDateString('pt-BR') : '—',
      })),
    })
  } catch {
    return Response.json({ cycles: [] })
  }
}
