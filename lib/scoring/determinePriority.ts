import type { PriorityLevel } from '@/types/database';

/**
 * Priority based on gap:
 * gap >= 3.0 → Critical
 * 2.0–2.9   → High
 * 1.0–1.9   → Medium
 * < 1.0     → Low
 */
export function determinePriority(gap: number): PriorityLevel {
  if (gap >= 3.0) return 'Critical';
  if (gap >= 2.0) return 'High';
  if (gap >= 1.0) return 'Medium';
  return 'Low';
}
