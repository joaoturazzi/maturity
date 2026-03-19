'use client';

import type { Task, TaskStatus } from '@/types/database';
import styles from './TaskCard.module.css';

const STATUS_COLORS: Record<TaskStatus, string> = {
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

function isOverdue(task: Task): boolean {
  if (!task.due_date || task.status === 'Done') return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(task.due_date);
  due.setHours(0, 0, 0, 0);
  return due < today;
}

export function TaskCard({ task }: { task: Task }) {
  const overdue = isOverdue(task);

  return (
    <div className={styles.card}>
      <p className={styles.title}>{task.title}</p>
      <div className={styles.meta}>
        <span
          className={styles.statusBadge}
          style={{ backgroundColor: STATUS_COLORS[task.status] }}
        >
          {task.status}
        </span>
        {task.due_date && (
          <span className={`${styles.dueDate} ${overdue ? styles.overdue : ''}`}>
            {overdue ? 'Atrasada: ' : ''}{formatDate(task.due_date)}
          </span>
        )}
      </div>
    </div>
  );
}
