'use client';

import type { Task } from '@/types/database';
import { TaskCard } from '@/components/action-plans/TaskCard/TaskCard';
import styles from './TaskList.module.css';

export function TaskList({ tasks }: { tasks: Task[] }) {
  if (tasks.length === 0) {
    return <p className={styles.empty}>Nenhuma task encontrada</p>;
  }

  return (
    <div className={styles.list}>
      {tasks.map((task) => (
        <TaskCard key={task.id} task={task} />
      ))}
    </div>
  );
}
