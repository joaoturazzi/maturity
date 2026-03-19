import type { DimensionScore } from '@/types/database';
import type { GapItem } from '@/types/diagnostic';
import { determinePriority } from './determinePriority';

/**
 * maturity_gap = desired_score - weighted_score (NOT 5 - score)
 */
export function calculateGaps(dimensionScores: DimensionScore[], dimensionNames: Record<string, string>): GapItem[] {
  return dimensionScores
    .map((ds) => {
      const gap = (ds.desired_score ?? 0) - (ds.weighted_score ?? 0);
      return {
        dimensionId: ds.dimension_id!,
        dimensionName: dimensionNames[ds.dimension_id!] ?? '',
        gap: Number(gap.toFixed(2)),
        priority: determinePriority(gap),
        currentScore: ds.weighted_score ?? 0,
        desiredScore: ds.desired_score ?? 0,
      };
    })
    .sort((a, b) => b.gap - a.gap);
}
