/**
 * Score ponderado de uma dimensão
 * weighted_score = soma(score * weight) / soma(weight)
 * Exclui respostas N/A (score === 0)
 */
export function calculateDimensionScore(
  responses: Array<{ score: number; indicator: { weight: string } }>
): number {
  // Exclude N/A responses (score === 0)
  const validResponses = responses.filter(r => r.score > 0)
  if (validResponses.length === 0) return 0

  const totalWeightedScore = validResponses.reduce((sum, r) => {
    return sum + (r.score * Number(r.indicator.weight))
  }, 0)

  const totalWeight = validResponses.reduce((sum, r) => {
    return sum + Number(r.indicator.weight)
  }, 0)

  if (totalWeight === 0) return 0
  return Math.round((totalWeightedScore / totalWeight) * 100) / 100
}

/**
 * IME Score geral = média simples dos scores das dimensões
 */
export function calculateIME(dimensionScores: number[]): number {
  if (!dimensionScores.length) return 0
  const avg = dimensionScores.reduce((a, b) => a + b, 0) / dimensionScores.length
  return Math.round(avg * 10) / 10
}

/**
 * Maturity level based on IME score:
 * 1.0–1.9 = Initial
 * 2.0–2.9 = Developing
 * 3.0–3.4 = Defined
 * 3.5–4.4 = Managed
 * 4.5–5.0 = Optimized
 */
export function getMaturityLevel(score: number): string {
  if (score >= 4.5) return 'Optimized'
  if (score >= 3.5) return 'Managed'
  if (score >= 3.0) return 'Defined'
  if (score >= 2.0) return 'Developing'
  return 'Initial'
}
