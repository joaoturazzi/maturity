import type { ActionPlan, Task, PriorityLevel, TaskStatus } from './database';

export interface ActionPlanWithTasks extends ActionPlan {
  tasks: Task[];
  completionPercentage: number;
  totalTasks: number;
  completedTasks: number;
}

export interface TaskWithPlan extends Task {
  actionPlanTitle: string;
  dimensionName: string;
}

export interface KanbanColumn {
  status: TaskStatus;
  label: string;
  tasks: Task[];
}

export interface TaskFilter {
  dimensionId?: string;
  priority?: PriorityLevel;
  status?: TaskStatus;
  assignedTo?: string;
}
