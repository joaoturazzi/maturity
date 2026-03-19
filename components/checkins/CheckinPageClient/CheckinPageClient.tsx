'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckinModal } from '../CheckinModal/CheckinModal'
import { CheckinHistoryModal } from '../CheckinHistory/CheckinHistory'
import styles from './CheckinPageClient.module.css'

type Task = {
  id: string
  title: string
  status: string | null
  dueDate: string | null
  actionPlan: {
    title: string
    dimension: { name: string; color: string | null; colorBg: string | null } | null
  } | null
}

export function CheckinPageClient({
  tasks,
  checkedInTaskIds,
}: {
  tasks: Task[]
  checkedInTaskIds: string[]
}) {
  const router = useRouter()
  const [checkinTaskId, setCheckinTaskId] = useState<string | null>(null)
  const [historyTaskId, setHistoryTaskId] = useState<string | null>(null)
  const [localCheckedIds, setLocalCheckedIds] = useState<Set<string>>(new Set(checkedInTaskIds))

  const pendingTasks = tasks.filter(t => t.status !== 'Done' && t.status !== 'Blocked')

  function handleCheckinComplete(taskId: string) {
    setLocalCheckedIds(prev => new Set([...Array.from(prev), taskId]))
    setCheckinTaskId(null)
    router.refresh()
  }

  return (
    <div>
      {pendingTasks.length === 0 ? (
        <p className={styles.empty}>Nenhuma task atribuída a você.</p>
      ) : (
        <div className={styles.list}>
          {pendingTasks.map(task => {
            const isCheckedIn = localCheckedIds.has(task.id)
            const isOverdue = task.dueDate && new Date(task.dueDate) < new Date()

            return (
              <div key={task.id} className={styles.card}>
                <div className={styles.cardMain}>
                  <div className={styles.cardInfo}>
                    <span className={styles.taskTitle}>{task.title}</span>
                    <div className={styles.meta}>
                      {task.actionPlan && (
                        <span className={styles.planName}>{task.actionPlan.title}</span>
                      )}
                      {task.actionPlan?.dimension && (
                        <span
                          className={styles.dimBadge}
                          style={{
                            color: task.actionPlan.dimension.color ?? '#555',
                            background: task.actionPlan.dimension.colorBg ?? '#f4f4f3',
                          }}
                        >
                          {task.actionPlan.dimension.name}
                        </span>
                      )}
                      {task.dueDate && (
                        <span className={styles.dueDate}>
                          {new Date(task.dueDate).toLocaleDateString('pt-BR')}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className={styles.cardActions}>
                    {isCheckedIn ? (
                      <span className={styles.checkedBadge}>Check-in enviado ✓</span>
                    ) : isOverdue ? (
                      <span className={styles.overdueBadge}>Atrasada</span>
                    ) : (
                      <span className={styles.pendingBadge}>Pendente</span>
                    )}

                    {!isCheckedIn && (
                      <button
                        className={styles.checkinBtn}
                        onClick={() => setCheckinTaskId(task.id)}
                      >
                        Fazer check-in
                      </button>
                    )}

                    <button
                      className={styles.historyBtn}
                      onClick={() => setHistoryTaskId(task.id)}
                    >
                      Ver histórico
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {checkinTaskId && (
        <CheckinModal
          task={pendingTasks.find(t => t.id === checkinTaskId)!}
          onClose={() => setCheckinTaskId(null)}
          onComplete={() => handleCheckinComplete(checkinTaskId)}
        />
      )}

      {historyTaskId && (
        <CheckinHistoryModal
          taskId={historyTaskId}
          onClose={() => setHistoryTaskId(null)}
        />
      )}
    </div>
  )
}
