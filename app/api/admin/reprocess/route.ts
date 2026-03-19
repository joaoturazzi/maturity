export const dynamic = 'force-dynamic'

import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import {
  diagnosticCycles, diagnosticResponses,
  dimensionScores, indicators, dimensions,
} from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { getCompanyId } from '@/lib/getCompanyId'
import { generateNarrativeForDimension } from '@/lib/services/generateNarrative'
import { generateActionPlanForCycle } from '@/lib/services/generateActionPlan'

export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const companyId = await getCompanyId()
    if (!companyId) return Response.json({ error: 'Forbidden' }, { status: 403 })

    const { cycleId } = await req.json()
    if (!cycleId) return Response.json({ error: 'cycleId required' }, { status: 400 })

    const results: Record<string, unknown> = {}

    // 1. Verify cycle
    const cycle = await db.query.diagnosticCycles.findFirst({
      where: and(eq(diagnosticCycles.id, cycleId), eq(diagnosticCycles.companyId, companyId)),
    })
    if (!cycle) return Response.json({ error: 'Cycle not found' }, { status: 404 })

    // 2. Get responses
    const responses = await db.query.diagnosticResponses.findMany({
      where: eq(diagnosticResponses.cycleId, cycleId),
      with: { indicator: true, dimension: true },
    })
    results.totalResponses = responses.length

    // 3. Recalculate deficiency percentages
    const byDim: Record<string, typeof responses> = {}
    for (const r of responses) {
      const name = r.dimension?.name ?? ''
      if (!byDim[name]) byDim[name] = []
      byDim[name].push(r)
    }

    const pctResults: Record<string, Record<string, string>> = {}
    for (const [dimName, dimR] of Object.entries(byDim)) {
      const valid = dimR.filter(r => r.score && r.score > 0)
      const total = valid.length
      if (total === 0) continue

      let comp = 0, ferr = 0, tec = 0
      for (const r of valid) {
        const dt = (r.deficiencyType ?? '').toLowerCase()
        if (dt.includes('comportamental')) comp++
        else if (dt.includes('ferramental')) ferr++
        else if (dt.includes('técnica') || dt.includes('tecnica')) tec++
        else {
          const s = r.score ?? 0
          if (s === 1) comp++
          else if (s === 2) ferr++
          else if (s === 3) tec++
          else comp++
        }
      }

      const dim = await db.query.dimensions.findFirst({
        where: eq(dimensions.name, dimName),
        columns: { id: true },
      })
      if (!dim) continue

      await db.update(dimensionScores).set({
        pctComportamental: String(comp / total),
        pctFerramental: String(ferr / total),
        pctTecnica: String(tec / total),
        narrative: null, // Force regeneration
      }).where(and(eq(dimensionScores.cycleId, cycleId), eq(dimensionScores.dimensionId, dim.id)))

      pctResults[dimName] = {
        comp: Math.round((comp / total) * 100) + '%',
        ferr: Math.round((ferr / total) * 100) + '%',
        tec: Math.round((tec / total) * 100) + '%',
      }
    }
    results.pcts = pctResults

    // 4. Verify weights
    const estrategiaDim = await db.query.dimensions.findFirst({
      where: eq(dimensions.name, 'Estratégia'),
      columns: { id: true },
    })
    if (estrategiaDim) {
      const weightCheck = await db.query.indicators.findFirst({
        where: eq(indicators.dimensionId, estrategiaDim.id),
        columns: { weight: true },
      })
      if (Math.abs(Number(weightCheck?.weight ?? 0) - 1 / 6) > 0.01) {
        const allDims = await db.query.dimensions.findMany({ with: { indicators: { columns: { id: true } } } })
        for (const dim of allDims) {
          if (dim.indicators.length === 0) continue
          const w = String(1 / dim.indicators.length)
          for (const ind of dim.indicators) {
            await db.update(indicators).set({ weight: w }).where(eq(indicators.id, ind.id))
          }
        }
        results.weightsRecalculated = true
      } else {
        results.weightsOk = true
      }
    }

    // 5. Recalculate IME Score
    const scores = await db.query.dimensionScores.findMany({
      where: eq(dimensionScores.cycleId, cycleId),
      with: { dimension: true },
    })

    if (scores.length > 0) {
      const ime = scores.reduce((s, d) => s + Number(d.weightedScore), 0) / scores.length
      const level = ime < 2 ? 'Initial' : ime < 3 ? 'Developing' : ime < 3.5 ? 'Defined' : ime < 4.5 ? 'Managed' : 'Optimized'
      await db.update(diagnosticCycles).set({
        overallImeScore: String(ime), maturityLevel: level, status: 'Submitted',
      }).where(eq(diagnosticCycles.id, cycleId))
      results.imeScore = ime.toFixed(2)
      results.maturityLevel = level
    }

    // 6. Generate narratives — DIRECT call, no HTTP
    for (const score of scores) {
      try {
        await generateNarrativeForDimension(cycleId, score.dimensionId)
        await new Promise(r => setTimeout(r, 600))
      } catch {}
    }
    results.narrativesGenerated = scores.length

    // 7. Generate action plans — DIRECT call, no HTTP
    // Does NOT delete existing plans — skips if they exist
    const planResult = await generateActionPlanForCycle(cycleId, companyId)
    results.planGenerated = planResult.created > 0
    results.planSkipped = planResult.skipped
    results.plansCreated = planResult.created

    return Response.json({ ok: true, message: 'Diagnóstico reprocessado com sucesso', results })
  } catch (error) {
    console.error('[admin/reprocess]', error)
    return Response.json({ error: 'Internal error' }, { status: 500 })
  }
}
