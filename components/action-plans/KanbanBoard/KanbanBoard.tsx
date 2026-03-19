'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import styles from './KanbanBoard.module.css'

type Task = {
  id: string
  title: string
  description: string | null
  status: string | null
  dueDate: string | null
  assignedUser: { name: string | null } | null
}

const COLUMNS = [
  { status: 'To Do',       label: 'To Do',       color: '#555' },
  { status: 'In Progress', label: 'In Progress',  color: '#1a5276' },
  { status: 'In Review',   label: 'In Review',    color: '#8e44ad' },
  { status: 'Done',        label: 'Done',         color: '#1e8449' },
]

const BLOCKED_COL = { status: 'Blocked', label: 'Blocked', color: '#c0392b' }

const STATUS_BADGE: Record<string, { bg: string; color: string }> = {
  'To Do':       { bg: '#f4f4f3', color: '#555' },
  'In Progress': { bg: '#eaf2fb', color: '#1a5276' },
  'In Review':   { bg: '#f5eef8', color: '#8e44ad' },
  'Done':        { bg: '#eafaf1', color: '#1e8449' },
  'Blocked':     { bg: '#fdf2f2', color: '#c0392b' },
}

export function KanbanBoard({ planId, tasks: initialTasks }: { planId: string; tasks: Task[] }) {
  const router = useRouter()
  const [showNewTask, setShowNewTask] = useState(false)
  const [newTitle, setNewTitle] = useState('')

  const blockedTasks = initialTasks.filter(t => t.status === 'Blocked')
  const hasBlocked = blockedTasks.length > 0

  async function handleCreateTask() {
    if (!newTitle.trim()) return
    await fetch(`/api/action-plans/${planId}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTitle }),
    })
    setNewTitle('')
    setShowNewTask(false)
    router.refresh()
  }

  async function handleStatusChange(taskId: string, newStatus: string) {
    await fetch(`/api/action-plans/${planId}/tasks/${taskId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    router.refresh()
  }

  return (
    <div>
      <div className={styles.toolbar}>
        <button className={styles.newBtn} onClick={() => setShowNewTask(true)}>
          + Nova Task
        </button>
      </div>

      {showNewTask && (
        <div className={styles.inlineNew}>
          <input
            className={styles.input}
            placeholder="Título da task"
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreateTask()}
            autoFocus
          />
          <button className={styles.submitBtn} onClick={handleCreateTask}>Criar</button>
          <button className={styles.ghostBtn} onClick={() => setShowNewTask(false)}>Cancelar</button>
        </div>
      )}

      <div className={styles.board} style={{ gridTemplateColumns: hasBlocked ? 'repeat(4, 1fr) 200px' : 'repeat(4, 1fr)' }}>
        {COLUMNS.map(col => (
          <div key={col.status} className={styles.column}>
            <div className={styles.colHeader}>
              <span className={styles.colDot} style={{ background: col.color }} />
              <span className={styles.colLabel}>{col.label}</span>
              <span className={styles.colCount}>
                {initialTasks.filter(t => t.status === col.status).length}
              </span>
            </div>
            <div className={styles.colBody}>
              {initialTasks
                .filter(t => t.status === col.status)
                .map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onStatusChange={(s) => handleStatusChange(task.id, s)}
                  />
                ))}
            </div>
          </div>
        ))}

        {hasBlocked && (
          <div className={`${styles.column} ${styles.blockedCol}`}>
            <div className={styles.colHeader}>
              <span className={styles.colDot} style={{ background: BLOCKED_COL.color }} />
              <span className={styles.colLabel}>{BLOCKED_COL.label}</span>
              <span className={styles.colCount}>{blockedTasks.length}</span>
            </div>
            <div className={styles.colBody}>
              {blockedTasks.map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onStatusChange={(s) => handleStatusChange(task.id, s)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function TaskCard({ task, onStatusChange }: { task: Task; onStatusChange: (status: string) => void }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const badge = STATUS_BADGE[task.status ?? 'To Do'] ?? STATUS_BADGE['To Do']

  return (
    <div className={styles.taskCard}>
      <span className={styles.taskTitle}>{task.title}</span>
      {task.assignedUser?.name && (
        <span className={styles.taskAssignee}>{task.assignedUser.name}</span>
      )}
      {task.dueDate && (
        <span className={styles.taskDue}>
          {new Date(task.dueDate).toLocaleDateString('pt-BR')}
        </span>
      )}
      <div className={styles.taskFooter}>
        <span className={styles.statusBadge} style={{ background: badge.bg, color: badge.color }}>
          {task.status}
        </span>
        <div className={styles.menuWrap}>
          <button className={styles.menuBtn} onClick={() => setMenuOpen(o => !o)}>⋯</button>
          {menuOpen && (
            <div className={styles.menu}>
              {['To Do', 'In Progress', 'In Review', 'Done', 'Blocked']
                .filter(s => s !== task.status)
                .map(s => (
                  <button
                    key={s}
                    className={styles.menuItem}
                    onClick={() => { onStatusChange(s); setMenuOpen(false) }}
                  >
                    Mover para {s}
                  </button>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
