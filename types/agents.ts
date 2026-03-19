import type { AgentType } from './database';

export interface AgentConfig {
  type: AgentType;
  name: string;
  description: string;
  icon: string;
  color: string;
  systemPrompt: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

export interface AgentContext {
  companyId: string;
  cycleId?: string;
  dimensionScores?: Record<string, number>;
  currentGaps?: Array<{ dimension: string; gap: number }>;
}
