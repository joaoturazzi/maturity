import { db } from '@/lib/db'
import { dimensionScores, diagnosticResponses } from '@/lib/db/schema'
import { eq, and, asc } from 'drizzle-orm'

export async function generateNarrativeForDimension(
  cycleId: string,
  dimensionId: string
): Promise<string | null> {
  try {
    const score = await db.query.dimensionScores.findFirst({
      where: and(
        eq(dimensionScores.cycleId, cycleId),
        eq(dimensionScores.dimensionId, dimensionId),
      ),
      with: { dimension: true },
    })
    if (!score) return null

    // Skip if narrative already exists
    if (score.narrative) return score.narrative

    const responses = await db.query.diagnosticResponses.findMany({
      where: and(
        eq(diagnosticResponses.cycleId, cycleId),
        eq(diagnosticResponses.dimensionId, dimensionId),
      ),
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
    const desiredScore = Number(score.desiredScore ?? 5).toFixed(1)
    const gap = Number(score.maturityGap).toFixed(1)
    const top3Names = top3.map(r => r.indicator?.title).filter(Boolean).join(', ')

    // Try OpenAI
    try {
      const aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          max_tokens: 250,
          temperature: 0.7,
          messages: [{
            role: 'user',
            content:
              `Você é consultor estratégico. Escreva UM parágrafo ` +
              `(máximo 4 frases) em português brasileiro, sem markdown.\n\n` +
              `Dimensão: ${dimName}\n` +
              `Score: ${currentScore}/5.0\n` +
              `Desejado: ${desiredScore}\n` +
              `Gap: ${gap}\n` +
              `Deficiência principal: ${dominant.label} (${Math.round(dominant.pct * 100)}%) — ${dominant.meaning}\n` +
              `Indicadores críticos: ${top3Names || 'não identificados'}\n\n` +
              `Comece com: "Sua dimensão de ${dimName} está em..."`,
          }],
        }),
        signal: AbortSignal.timeout(15000),
      })

      if (aiRes.ok) {
        const data = await aiRes.json()
        const text = data.choices?.[0]?.message?.content?.trim() ?? ''
        const englishWords = ['your', 'the ', 'this ', 'with ']
        const looksEnglish = englishWords.filter(w =>
          text.toLowerCase().includes(w)
        ).length >= 2

        if (text && !looksEnglish) {
          await db.update(dimensionScores)
            .set({ narrative: text })
            .where(and(
              eq(dimensionScores.cycleId, cycleId),
              eq(dimensionScores.dimensionId, dimensionId),
            ))
          return text
        }
      }
    } catch {}

    // Fallback
    const fallback =
      `Sua dimensão de ${dimName} está em ${currentScore}/5.0, ` +
      `com gap de ${gap} pontos para atingir ${desiredScore}. ` +
      `A deficiência predominante é ${dominant.label}, ` +
      `indicando que ${dominant.meaning}. ` +
      (top3Names ? `Os indicadores mais críticos foram: ${top3Names}. ` : '') +
      `Priorize ações concretas nesta dimensão no próximo ciclo.`

    await db.update(dimensionScores)
      .set({ narrative: fallback })
      .where(and(
        eq(dimensionScores.cycleId, cycleId),
        eq(dimensionScores.dimensionId, dimensionId),
      ))

    return fallback
  } catch (err) {
    console.error('[generateNarrative]', err)
    return null
  }
}
