/**
 * Validate that indicator weights for a dimension sum to 1.0
 * Returns error message or null if valid
 */
export function validateWeightsSum(weights: number[]): string | null {
  const sum = weights.reduce((acc, w) => acc + w, 0);
  const rounded = Math.round(sum * 1000) / 1000;
  if (rounded !== 1.0) {
    return `A soma dos pesos deve ser 1.0, mas é ${rounded.toFixed(3)}`;
  }
  return null;
}

/**
 * Validate score is between 1 and 5
 */
export function validateScore(score: number): boolean {
  return Number.isInteger(score) && score >= 1 && score <= 5;
}

/**
 * Validate that desired_score >= score
 */
export function validateDesiredScore(score: number, desiredScore: number): boolean {
  return desiredScore >= score;
}
