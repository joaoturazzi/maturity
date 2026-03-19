import styles from './UpcomingCheckins.module.css'
import Link from 'next/link'

type TaskWithPlan = {
  id: string
  title: string
  dueDate: string | null
  actionPlan: {
    title: string
    dimension: { name: string; color: string | null } | null
  } | null
}

export function UpcomingCheckins({ tasks }: { tasks: TaskWithPlan[] }) {
  return (
    <div className={styles.card}>
      <span className={styles.label}>Check-ins pendentes</span>
      {tasks.length === 0 ? (
        <p className={styles.empty}>Todos os check-ins em dia.</p>
      ) : (
        <div className={styles.list}>
          {tasks.slice(0, 5).map(task => (
            <div key={task.id} className={styles.item}>
              <div className={styles.itemInfo}>
                <span className={styles.taskTitle}>{task.title}</span>
                {task.actionPlan?.dimension && (
                  <span
                    className={styles.dimBadge}
                    style={{
                      color: task.actionPlan.dimension.color ?? '#555',
                      background: (task.actionPlan.dimension.color ?? '#555') + '18',
                    }}
                  >
                    {task.actionPlan.dimension.name}
                  </span>
                )}
              </div>
              {task.dueDate && (
                <span className={styles.dueDate}>
                  {new Date(task.dueDate).toLocaleDateString('pt-BR')}
                </span>
              )}
            </div>
          ))}
          {tasks.length > 5 && (
            <Link href="/checkins" className={styles.seeAll}>
              Ver todos ({tasks.length})
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
