// TODO: Implement option selector for descriptive paragraph options (levels 1-5)
'use client';

import type { ResponseOption } from '@/types/database';

export function OptionSelector({ options: _options, selected: _selected, onSelect: _onSelect }: { options: ResponseOption[]; selected: number | null; onSelect: (level: number) => void }) {
  return <div>{/* TODO: Render 5 descriptive options as selectable cards */}</div>;
}
