export const dynamic = 'force-dynamic'

import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { diagnosticCycles, dimensionScores, companies } from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { getCompanyId } from '@/lib/getCompanyId'
import { AGENT_CONFIGS } from '@/lib/agents/config'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ agentType: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) return Response.json({ context: null }, { status: 401 })

    const companyId = await getCompanyId()
    if (!companyId) return Response.json({ context: null }, { status: 403 })

    const { agentType } = await params

    // Buscar empresa
    const company = await db.query.companies.findFirst({
      where: eq(companies.id, companyId),
      columns: {
        name: true, industry: true,
        websiteUrl: true, websiteSummary: true,
      },
    })

    // Buscar último diagnóstico
    const lastCycle = await db.query.diagnosticCycles.findFirst({
      where: and(
        eq(diagnosticCycles.companyId, companyId),
        eq(diagnosticCycles.status, 'Submitted'),
      ),
      orderBy: desc(diagnosticCycles.submittedAt),
      columns: {
        id: true,
        overallImeScore: true,
        maturityLevel: true,
        submittedAt: true,
      },
    })

    if (!lastCycle) {
      return Response.json({
        context: {
          companyName: company?.name ?? 'sua empresa',
          hasDiagnostic: false,
        },
      })
    }

    // Buscar scores das dimensões
    const scores = await db.query.dimensionScores.findMany({
      where: eq(dimensionScores.cycleId, lastCycle.id),
      with: { dimension: true },
    })

    // Ordenar por gap (maior primeiro)
    const sorted = [...scores].sort(
      (a, b) => Number(b.maturityGap ?? 0) - Number(a.maturityGap ?? 0)
    )

    const dimensionsContext = sorted.map(s => ({
      name: s.dimension?.name ?? '',
      score: Number(s.weightedScore ?? 0).toFixed(1),
      gap: Number(s.maturityGap ?? 0).toFixed(1),
      priority: s.priorityLevel ?? 'Medium',
      pctComportamental: Math.round(Number(s.pctComportamental ?? 0) * 100),
      pctFerramental: Math.round(Number(s.pctFerramental ?? 0) * 100),
      pctTecnica: Math.round(Number(s.pctTecnica ?? 0) * 100),
      narrative: s.narrative ?? null,
    }))

    const agentConfig = AGENT_CONFIGS[agentType]
    const agentDim = agentConfig?.dimension
    const relevantDim = agentDim
      ? dimensionsContext.find(d => d.name === agentDim)
      : null

    const ws = company?.websiteSummary as Record<string, string> | null
    const websiteContext = ws
      ? {
          description: ws.description,
          targetAudience: ws.targetAudience,
          valueProposition: ws.valueProposition,
          toneOfVoice: ws.toneOfVoice,
        }
      : null

    return Response.json({
      context: {
        companyName: company?.name ?? 'sua empresa',
        industry: company?.industry ?? null,
        hasDiagnostic: true,
        imeScore: Number(lastCycle.overallImeScore ?? 0).toFixed(1),
        maturityLevel: lastCycle.maturityLevel,
        diagnosedAt: lastCycle.submittedAt,
        dimensions: dimensionsContext,
        topGaps: dimensionsContext.slice(0, 3),
        relevantDimension: relevantDim,
        websiteContext,
      },
    })
  } catch (err) {
    console.error('[agent context]', err)
    return Response.json({ context: null })
  }
}
