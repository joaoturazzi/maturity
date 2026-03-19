// TODO: Implement question card displaying indicator title and description
'use client';

import type { Indicator } from '@/types/database';

export function QuestionCard({ indicator: _indicator, onAnswer: _onAnswer }: { indicator: Indicator; onAnswer: (score: number) => void }) {
  return <div>{/* TODO: Display question with response options */}</div>;
}
