'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import styles from './ActionPlanList.module.css'
import Link from 'next/link'

type Dimension = {
  id: string
  name: string
  color: string | null
  colorBg: string | null
}

type Task = {
  id: string
  status: string | null
}

type Plan = {
  id: string
  title: string
  description: string | null
  priority: string | null
  status: string | null
  dimension: Dimension | null
  tasks: Task[]
}

const PRIORITY_STYLES: Record<string, { bg: string; color: string }> = {
  Critical: { bg: '#fdf2f2', color: '#c0392b' },
  High:     { bg: '#fef9e7', color: '#d68910' },
  Medium:   { bg: '#eaf2fb', color: '#1a5276' },
  Low:      { bg: '#f4f4f3', color: '#555' },
}

export function ActionPlanList({ plans, dimensions }: { plans: Plan[]; dimensions: Dimension[] }) {
  const router = useRouter()
  const [showNew, setShowNew] = useState(false)

  async function handleCreatePlan(formData: FormData) {
    const res = await fetch('/api/action-plans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: formData.get('title'),
        description: formData.get('description') || undefined,
        dimensionId: formData.get('dimensionId') || undefined,
        priority: formData.get('priority') || 'Medium',
      }),
    })
    if (res.ok) {
      setShowNew(false)
      router.refresh()
    }
  }

  return (
    <div>
      <div className={styles.toolbar}>
        <button className={styles.newBtn} onClick={() => setShowNew(true)}>
          + Novo Plano
        </button>
      </div>

      {showNew && (
        <div className={styles.overlay} onClick={() => setShowNew(false)}>
          <form
            className={styles.modal}
            onClick={e => e.stopPropagation()}
            action={handleCreatePlan}
          >
            <h3 className={styles.modalTitle}>Novo Action Plan</h3>
            <label className={styles.fieldLabel}>
              Título
              <input name="title" required className={styles.input} />
            </label>
            <label className={styles.fieldLabel}>
              Descrição
              <textarea name="description" className={styles.textarea} rows={3} />
            </label>
            <label className={styles.fieldLabel}>
              Dimensão
              <select name="dimensionId" className={styles.select}>
                <option value="">— Nenhuma —</option>
                {dimensions.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </label>
            <label className={styles.fieldLabel}>
              Prioridade
              <select name="priority" className={styles.select} defaultValue="Medium">
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </label>
            <div className={styles.modalActions}>
              <button type="button" className={styles.ghostBtn} onClick={() => setShowNew(false)}>
                Cancelar
              </button>
              <button type="submit" className={styles.submitBtn}>
                Criar plano
              </button>
            </div>
          </form>
        </div>
      )}

      {plans.length === 0 ? (
        <p className={styles.empty}>Nenhum plano ativo.</p>
      ) : (
        <div className={styles.list}>
          {plans.map(plan => {
            const totalTasks = plan.tasks.length
            const doneTasks = plan.tasks.filter(t => t.status === 'Done').length
            const pct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0
            const priority = plan.priority ?? 'Low'
            const pStyle = PRIORITY_STYLES[priority] ?? PRIORITY_STYLES.Low
            const barColor = pct === 100 ? '#1e8449' : pct >= 60 ? '#d68910' : '#1a1a1a'

            return (
              <Link key={plan.id} href={`/action-plans/${plan.id}`} className={styles.card}>
                <div className={styles.cardHeader}>
                  <span className={styles.planTitle}>{plan.title}</span>
                  <div className={styles.badges}>
                    {plan.dimension && (
                      <span
                        className={styles.dimBadge}
                        style={{
                          color: plan.dimension.color ?? '#555',
                          background: (plan.dimension.colorBg ?? plan.dimension.color ?? '#555') + '18',
                        }}
                      >
                        {plan.dimension.name}
                      </span>
                    )}
                    <span
                      className={styles.priorityBadge}
                      style={{ background: pStyle.bg, color: pStyle.color }}
                    >
                      {priority}
                    </span>
                  </div>
                </div>
                {plan.description && (
                  <p className={styles.planDesc}>{plan.description}</p>
                )}
                <div className={styles.progressRow}>
                  <div className={styles.progressTrack}>
                    <div
                      className={styles.progressFill}
                      style={{ width: `${pct}%`, background: barColor }}
                    />
                  </div>
                  <span className={styles.pctLabel}>{pct}%</span>
                  <span className={styles.taskCount}>
                    {doneTasks}/{totalTasks} tasks
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
