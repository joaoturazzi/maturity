import { auth } from '@clerk/nextjs/server'
import { getCompanyId } from '@/lib/getCompanyId'
import { db } from '@/lib/db'
import { diagnosticResponses, diagnosticCycles } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const answerSchema = z.object({
  cycleId: z.string().uuid(),
  indicatorId: z.string().uuid(),
  dimensionId: z.string().uuid(),
  score: z.number().int().min(0).max(5),
  desiredScore: z.number().int().min(1).max(5).optional(),
  deficiencyType: z.string().optional(),
  feedbackShown: z.string(),
})

export async function POST(req: Request) {
  try {
    const { userId, sessionClaims } = await auth()
    if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const companyId = await getCompanyId()

    const body = await req.json()
    const parsed = answerSchema.parse(body)

    // Verify cycle belongs to this company
    if (companyId) {
      const cycle = await db.query.diagnosticCycles.findFirst({
        where: and(eq(diagnosticCycles.id, parsed.cycleId), eq(diagnosticCycles.companyId, companyId)),
      })
      if (!cycle) return Response.json({ error: 'Cycle not found' }, { status: 404 })
    }

    // Upsert: se já existe resposta para esse indicador no ciclo, atualiza
    const existing = await db.query.diagnosticResponses.findFirst({
      where: and(
        eq(diagnosticResponses.cycleId, parsed.cycleId),
        eq(diagnosticResponses.indicatorId, parsed.indicatorId),
      ),
    })

    if (existing) {
      await db.update(diagnosticResponses)
        .set({
          score: parsed.score,
          desiredScore: parsed.desiredScore,
          deficiencyType: parsed.deficiencyType,
          feedbackShown: parsed.feedbackShown,
        })
        .where(eq(diagnosticResponses.id, existing.id))
    } else {
      await db.insert(diagnosticResponses).values({
        ...parsed,
        companyId,
        answeredBy: userId,
      })
    }

    return Response.json({ ok: true })
  } catch (error) {
    console.error('[diagnostic/answer]', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
