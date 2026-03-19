import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { diagnosticCycles, dimensionScores, diagnosticResponses } from '@/lib/db/schema'
import { calculateDimensionScore, calculateIME, getMaturityLevel, determinePriority } from '@/lib/scoring'
import { eq } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const { userId, sessionClaims } = await auth()
    if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const companyId = (sessionClaims?.metadata as Record<string, string>)?.companyId as string
    if (!companyId) return Response.json({ error: 'Onboarding incomplete' }, { status: 403 })

    const { cycleId } = await req.json()

    // 1. Buscar todas as respostas do ciclo com indicadores
    const responses = await db.query.diagnosticResponses.findMany({
      where: eq(diagnosticResponses.cycleId, cycleId),
      with: { indicator: true, dimension: true },
    })

    // 2. Agrupar por dimensão
    const byDimension: Record<string, typeof responses> = {}
    for (const r of responses) {
      const dimId = r.dimensionId
      if (!byDimension[dimId]) byDimension[dimId] = []
      byDimension[dimId].push(r)
    }

    // 3. Calcular score ponderado por dimensão
    const dimScores = []
    for (const [dimensionId, dimResponses] of Object.entries(byDimension)) {
      const validResponses = dimResponses.filter(r => r.score != null && r.score > 0)
      const weightedScore = calculateDimensionScore(
        validResponses.map(r => ({
          score: r.score!,
          indicator: { weight: r.indicator.weight ?? '0.0333' },
        }))
      )

      const desiredScores = dimResponses.filter(r => r.desiredScore != null)
      const desiredScore = desiredScores.length
        ? desiredScores.reduce((sum, r) => sum + r.desiredScore!, 0) / desiredScores.length
        : 5

      const maturityGap = Math.round((desiredScore - weightedScore) * 100) / 100
      const priorityLevel = determinePriority(maturityGap)

      // Deficiency breakdown
      const deficiency = calcDeficiencyBreakdown(dimResponses)

      dimScores.push({
        cycleId,
        dimensionId,
        companyId,
        weightedScore: String(weightedScore),
        desiredScore: String(desiredScore),
        maturityGap: String(maturityGap),
        priorityLevel,
        pctComportamental: deficiency.pctComportamental,
        pctFerramental: deficiency.pctFerramental,
        pctTecnica: deficiency.pctTecnica,
        reportPeriod: new Date().toLocaleDateString('pt-BR', { month: '2-digit', year: 'numeric' }),
      })
    }

    // 4. Calcular IME Score e Maturity Level
    const overallImeScore = calculateIME(dimScores.map(d => Number(d.weightedScore)))
    const maturityLevel = getMaturityLevel(overallImeScore)

    // 5. Inserir dimensionScores e atualizar ciclo
    if (dimScores.length > 0) {
      await db.insert(dimensionScores).values(dimScores)
    }
    await db.update(diagnosticCycles).set({
      status: 'Submitted',
      overallImeScore: String(overallImeScore),
      maturityLevel,
      submittedAt: new Date(),
    }).where(eq(diagnosticCycles.id, cycleId))

    return Response.json({ ok: true, overallImeScore, maturityLevel })
  } catch (error) {
    console.error('[diagnostic/submit]', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function calcDeficiencyBreakdown(responses: Array<{ score: number | null; deficiencyType: string | null }>) {
  const valid = responses.filter(r => r.score && r.score > 0)
  const total = valid.length
  if (total === 0) return { pctComportamental: '0', pctFerramental: '0', pctTecnica: '0' }

  let comp = 0, ferr = 0, tec = 0

  for (const r of valid) {
    if (!r.deficiencyType) continue
    const dt = r.deficiencyType.toLowerCase()
    if (dt.includes('comportamental')) comp++
    if (dt.includes('ferramental')) ferr++
    if (dt.includes('técnica') || dt.includes('tecnica')) tec++
  }

  return {
    pctComportamental: String(Math.round((comp / total) * 100) / 100),
    pctFerramental: String(Math.round((ferr / total) * 100) / 100),
    pctTecnica: String(Math.round((tec / total) * 100) / 100),
  }
}
