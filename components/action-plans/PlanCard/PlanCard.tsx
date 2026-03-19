'use client';

import Link from 'next/link';
import type { ActionPlanWithTasks } from '@/types/actionPlan';
import type { PriorityLevel } from '@/types/database';
import styles from './PlanCard.module.css';

const PRIORITY_COLORS: Record<PriorityLevel, string> = {
  Critical: '#c0392b',
  High: '#d68910',
  Medium: '#1a5276',
  Low: '#555',
};

export function PlanCard({ plan }: { plan: ActionPlanWithTasks }) {
  const priorityColor = plan.priority
    ? PRIORITY_COLORS[plan.priority]
    : '#999';

  return (
    <Link href={`/action-plans/${plan.id}`} className={styles.card}>
      <div className={styles.header}>
        <h3 className={styles.title}>{plan.title}</h3>
        {plan.priority && (
          <span
            className={styles.priorityBadge}
            style={{ backgroundColor: priorityColor }}
          >
            {plan.priority}
          </span>
        )}
      </div>
      <div className={styles.progressWrapper}>
        <div className={styles.progressBar}>
          <div
            className={styles.progressFill}
            style={{ width: `${plan.completionPercentage}%` }}
          />
        </div>
      </div>
      <p className={styles.taskCount}>
        {plan.completedTasks}/{plan.totalTasks} tasks concluídas
      </p>
    </Link>
  );
}
