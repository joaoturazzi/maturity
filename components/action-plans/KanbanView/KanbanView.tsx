// TODO: Implement Kanban board view for tasks
'use client';

import type { KanbanColumn } from '@/types/actionPlan';

export function KanbanView({ columns: _columns }: { columns: KanbanColumn[] }) {
  return <div>{/* TODO: Kanban columns: To Do, In Progress, In Review, Done, Blocked */}</div>;
}
