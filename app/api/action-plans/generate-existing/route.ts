export const dynamic = 'force-dynamic'

import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { diagnosticCycles, actionPlans } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { getCompanyId } from '@/lib/getCompanyId'
import { generateActionPlanForCycle } from '@/lib/services/generateActionPlan'

export async function POST() {
  try {
    const { userId } = await auth()
    if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const companyId = await getCompanyId()
    if (!companyId) return Response.json({ error: 'Forbidden' }, { status: 403 })

    const cycles = await db.query.diagnosticCycles.findMany({
      where: and(
        eq(diagnosticCycles.companyId, companyId),
        eq(diagnosticCycles.status, 'Submitted'),
      ),
      columns: { id: true },
    })

    let generated = 0
    const results: Array<{ cycleId: string; status: string; plans?: number }> = []

    for (const cycle of cycles) {
      const existing = await db.query.actionPlans.findFirst({
        where: and(
          eq(actionPlans.companyId, companyId),
          eq(actionPlans.cycleId, cycle.id),
        ),
        columns: { id: true },
      })

      if (existing) {
        results.push({ cycleId: cycle.id, status: 'skipped' })
        continue
      }

      const result = await generateActionPlanForCycle(cycle.id, companyId)
      generated += result.created
      results.push({
        cycleId: cycle.id,
        status: result.created > 0 ? 'generated' : 'no_gaps',
        plans: result.created,
      })

      // Delay between cycles to respect rate limits
      await new Promise(r => setTimeout(r, 2000))
    }

    return Response.json({ ok: true, generated, results })
  } catch (error) {
    console.error('[generate-existing]', error)
    return Response.json({ error: 'Internal error' }, { status: 500 })
  }
}
