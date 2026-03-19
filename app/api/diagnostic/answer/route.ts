import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { diagnosticResponses } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'

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
  const { userId, sessionClaims } = await auth()
  if (!userId) return new Response('Unauthorized', { status: 401 })

  const companyId = (sessionClaims?.metadata as Record<string, string>)?.companyId as string

  const body = await req.json()
  const parsed = answerSchema.parse(body)

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
}
