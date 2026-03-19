'use client';

import type { KanbanColumn } from '@/types/actionPlan';
import type { TaskStatus } from '@/types/database';
import styles from './KanbanView.module.css';

const COLUMN_COLORS: Record<TaskStatus, string> = {
  'To Do': '#555',
  'In Progress': '#1a5276',
  'In Review': '#8e44ad',
  'Done': '#1e8449',
  'Blocked': '#c0392b',
};

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function KanbanView({ columns }: { columns: KanbanColumn[] }) {
  return (
    <div className={styles.board}>
      {columns.map((column) => {
        const color = COLUMN_COLORS[column.status];
        return (
          <div key={column.status} className={styles.column}>
            <div
              className={styles.columnHeader}
              style={{ borderBottomColor: color }}
            >
              <span className={styles.columnLabel}>{column.label}</span>
              <span
                className={styles.countBadge}
                style={{ backgroundColor: color }}
              >
                {column.tasks.length}
              </span>
            </div>
            <div className={styles.tasks}>
              {column.tasks.map((task) => (
                <div key={task.id} className={styles.taskCard}>
                  <p className={styles.taskTitle}>{task.title}</p>
                  <div className={styles.taskMeta}>
                    <span
                      className={styles.statusBadge}
                      style={{ backgroundColor: color }}
                    >
                      {task.status}
                    </span>
                    {task.due_date && (
                      <span className={styles.taskDueDate}>
                        {formatDate(task.due_date)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
