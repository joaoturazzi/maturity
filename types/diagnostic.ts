import type { Dimension, Indicator, DiagnosticCycle, DiagnosticResponse, DimensionScore, MaturityLevel, PriorityLevel } from './database';

export interface DiagnosticFlowState {
  cycleId: string;
  currentDimensionIndex: number;
  currentIndicatorIndex: number;
  responses: Map<string, DiagnosticResponseInput>;
  isSubmitting: boolean;
}

export interface DiagnosticResponseInput {
  indicatorId: string;
  dimensionId: string;
  score: number;
  desiredScore: number;
  deficiencyType: string | null;
}

export interface DiagnosticResult {
  cycle: DiagnosticCycle;
  dimensionScores: DimensionScore[];
  overallIME: number;
  maturityLevel: MaturityLevel;
  topGaps: GapItem[];
}

export interface GapItem {
  dimensionId: string;
  dimensionName: string;
  gap: number;
  priority: PriorityLevel;
  currentScore: number;
  desiredScore: number;
}

export interface DimensionProgress {
  dimension: Dimension;
  totalIndicators: number;
  answeredIndicators: number;
  isComplete: boolean;
}
