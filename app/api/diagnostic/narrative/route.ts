export const dynamic = 'force-dynamic'

import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { dimensionScores, diagnosticResponses } from '@/lib/db/schema'
import { eq, and, asc } from 'drizzle-orm'
import { getCompanyId } from '@/lib/getCompanyId'

export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })
    const companyId = await getCompanyId()
    if (!companyId) return Response.json({ error: 'Forbidden' }, { status: 403 })

    const { cycleId, dimensionId } = await req.json()

    const score = await db.query.dimensionScores.findFirst({
      where: and(eq(dimensionScores.cycleId, cycleId), eq(dimensionScores.dimensionId, dimensionId)),
      with: { dimension: true },
    })
    if (!score) return Response.json({ error: 'Not found' }, { status: 404 })

    // Check if narrative already exists
    if (score.narrative) return Response.json({ narrative: score.narrative })

    const responses = await db.query.diagnosticResponses.findMany({
      where: and(eq(diagnosticResponses.cycleId, cycleId), eq(diagnosticResponses.dimensionId, dimensionId)),
      with: { indicator: true },
      orderBy: asc(diagnosticResponses.score),
    })

    const top3 = responses.filter(r => r.score && r.score > 0).slice(0, 3)
    const pctComp = Number(score.pctComportamental ?? 0)
    const pctFerr = Number(score.pctFerramental ?? 0)
    const pctTec = Number(score.pctTecnica ?? 0)
    const defTypes = [
      { label: 'Comportamental', pct: pctComp, meaning: 'o problema é de processo e cultura' },
      { label: 'Ferramental', pct: pctFerr, meaning: 'faltam ferramentas e sistemas adequados' },
      { label: 'Técnica', pct: pctTec, meaning: 'há gaps de conhecimento técnico' },
    ].sort((a, b) => b.pct - a.pct)

    const dominant = defTypes[0]
    const dimName = score.dimension?.name ?? ''
    const currentScore = Number(score.weightedScore).toFixed(1)
    const gap = Number(score.maturityGap).toFixed(1)
    const top3Names = top3.map(r => r.indicator?.title).filter(Boolean).join(', ')

    // Try OpenAI
    try {
      const aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` },
        body: JSON.stringify({
          model: 'gpt-4o-mini', max_tokens: 200, temperature: 0.7,
          messages: [{ role: 'user', content: `Escreva UM parágrafo curto (máx 4 frases) em português brasileiro analisando: dimensão ${dimName}, score ${currentScore}/5.0, gap ${gap}, deficiência ${dominant.label} (${Math.round(dominant.pct * 100)}%), indicadores críticos: ${top3Names || 'não identificados'}. Estilo: "Sua dimensão de [nome] está em [score]/5.0..."` }],
        }),
        signal: AbortSignal.timeout(12000),
      })

      if (aiRes.ok) {
        const data = await aiRes.json()
        const narrative = data.choices?.[0]?.message?.content?.trim() ?? ''
        if (narrative) {
          await db.update(dimensionScores).set({ narrative }).where(and(eq(dimensionScores.cycleId, cycleId), eq(dimensionScores.dimensionId, dimensionId)))
          return Response.json({ narrative })
        }
      }
    } catch {}

    // Fallback
    const fallback = `Sua dimensão de ${dimName} está em ${currentScore}/5.0 com gap de ${gap} pontos. A deficiência predominante é ${dominant.label}, indicando que ${dominant.meaning}. ${top3Names ? `Os indicadores mais críticos foram: ${top3Names}.` : ''} Priorize ações nesta dimensão para evoluir sua maturidade.`
    return Response.json({ narrative: fallback })
  } catch (error) {
    console.error('[narrative]', error)
    return Response.json({ error: 'Internal error' }, { status: 500 })
  }
}
