'use client'

import { useState, useCallback } from 'react'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'

const DIM_COLORS: Record<string, { color: string; bg: string }> = {
  'Estratégia': { color: '#1a5276', bg: '#eaf2fb' },
  'Produto':    { color: '#8e44ad', bg: '#f5eef8' },
  'Mercado':    { color: '#1e8449', bg: '#eafaf1' },
  'Finanças':   { color: '#d68910', bg: '#fef9e7' },
  'Branding':   { color: '#c0392b', bg: '#fdedec' },
}

const COLUMNS = [
  { id: 'To Do',       label: 'A Fazer',      color: '#555' },
  { id: 'In Progress', label: 'Em Progresso', color: '#1a5276' },
  { id: 'In Review',   label: 'Em Revisão',   color: '#8e44ad' },
  { id: 'Done',        label: 'Concluído',    color: '#1e8449' },
  { id: 'Blocked',     label: 'Bloqueado',    color: '#c0392b' },
]

type Plan = {
  id: string; title: string; priority: string | null
  dimension: { name: string; color: string | null } | null
  tasks: Array<{ id: string; title: string; status: string | null; dueDate: string | null }>
}

export function ActionPlanKanban({ plans, stats }: { plans: Plan[]; stats: { totalTasks: number; doneTasks: number; lateTasks: number } }) {
  const [activeDim, setActiveDim] = useState<string | null>(null)
  const [taskStatus, setTaskStatus] = useState<Record<string, string>>(() => {
    const m: Record<string, string> = {}
    for (const p of plans) for (const t of p.tasks) m[t.id] = t.status ?? 'To Do'
    return m
  })

  const dims = Array.from(new Set(plans.map(p => p.dimension?.name).filter(Boolean))) as string[]

  const allTasks = plans
    .filter(p => !activeDim || p.dimension?.name === activeDim)
    .flatMap(p => p.tasks.map(t => ({ ...t, status: taskStatus[t.id] ?? t.status, dimName: p.dimension?.name ?? '', planPriority: p.priority })))

  const byStatus: Record<string, typeof allTasks> = {}
  for (const col of COLUMNS) byStatus[col.id] = []
  for (const t of allTasks) (byStatus[t.status ?? 'To Do'] ?? byStatus['To Do']).push(t)

  const done = Object.values(taskStatus).filter(s => s === 'Done').length
  const total = Object.keys(taskStatus).length
  const pct = total > 0 ? Math.round((done / total) * 100) : 0

  const handleDragEnd = useCallback(async (result: { destination: { droppableId: string; index: number } | null; source: { droppableId: string; index: number }; draggableId: string }) => {
    if (!result.destination) return
    if (result.destination.droppableId === result.source.droppableId && result.destination.index === result.source.index) return

    const newStatus = result.destination.droppableId
    setTaskStatus(prev => ({ ...prev, [result.draggableId]: newStatus }))

    try {
      await fetch(`/api/action-plans/tasks/${result.draggableId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
    } catch {
      setTaskStatus(prev => ({ ...prev, [result.draggableId]: result.source.droppableId }))
    }
  }, [])

  return (
    <div style={{ fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 4 }}>Execução</p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.3px' }}>Planos de Ação</h1>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: '#888' }}>{done}/{total} concluídas</span>
            {stats.lateTasks > 0 && <span style={{ fontSize: 11, fontWeight: 700, color: '#c0392b', background: '#fdf2f2', padding: '2px 8px', borderRadius: 4 }}>{stats.lateTasks} atrasada{stats.lateTasks > 1 ? 's' : ''}</span>}
          </div>
        </div>
        <div style={{ height: 4, background: '#eceae5', borderRadius: 2, overflow: 'hidden', marginTop: 10 }}>
          <div style={{ height: '100%', width: `${pct}%`, background: pct === 100 ? '#1e8449' : '#1a5276', borderRadius: 2, transition: 'width 0.4s' }} />
        </div>
        <p style={{ fontSize: 11, color: '#bbb', marginTop: 4 }}>{pct}% concluído</p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        <button onClick={() => setActiveDim(null)} style={{ padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', border: `1.5px solid ${!activeDim ? '#1a1a1a' : '#e5e4e0'}`, background: !activeDim ? '#1a1a1a' : '#fff', color: !activeDim ? '#fff' : '#555' }}>Todas</button>
        {dims.map(d => { const dc = DIM_COLORS[d] ?? { color: '#555', bg: '#f4f4f3' }; const on = activeDim === d; return (
          <button key={d} onClick={() => setActiveDim(on ? null : d)} style={{ padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', border: `1.5px solid ${on ? dc.color : '#e5e4e0'}`, background: on ? dc.bg : '#fff', color: on ? dc.color : '#555' }}>{d}</button>
        )})}
      </div>

      {/* Kanban */}
      {plans.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 24px', color: '#bbb' }}>
          <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Nenhum plano de ação ainda</p>
          <p style={{ fontSize: 13, marginBottom: 16 }}>Complete um diagnóstico para gerar seu plano.</p>
          <a href="/diagnostic" style={{ display: 'inline-block', background: '#1a1a1a', color: '#fff', textDecoration: 'none', padding: '8px 20px', borderRadius: 6, fontSize: 13, fontWeight: 600 }}>Iniciar diagnóstico →</a>
        </div>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(180px, 1fr))', gap: 12, overflowX: 'auto' }}>
            {COLUMNS.map(col => (
              <div key={col.id} style={{ background: '#f7f6f3', borderRadius: 8, padding: '12px 10px', minWidth: 180 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: col.color }}>{col.label}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, background: '#fff', color: '#888', padding: '1px 7px', borderRadius: 10, border: '1px solid #eceae5' }}>{(byStatus[col.id] ?? []).length}</span>
                </div>
                <Droppable droppableId={col.id}>
                  {(provided, snapshot) => (
                    <div ref={provided.innerRef} {...provided.droppableProps} style={{ minHeight: 60, maxHeight: 'calc(100vh - 340px)', overflowY: 'auto', background: snapshot.isDraggingOver ? `${col.color}10` : 'transparent', borderRadius: 6, transition: 'background 0.15s', padding: 2 }}>
                      {(byStatus[col.id] ?? []).map((task, index) => {
                        const dc = DIM_COLORS[task.dimName] ?? { color: '#bbb' }
                        const late = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'Done' && task.status !== 'Blocked'
                        return (
                          <Draggable key={task.id} draggableId={task.id} index={index}>
                            {(prov, snap) => (
                              <div ref={prov.innerRef} {...prov.draggableProps} {...prov.dragHandleProps} style={{
                                background: '#fff', border: `1px solid ${late ? '#fdf2f2' : '#eceae5'}`, borderLeft: `3px solid ${dc.color}`,
                                borderRadius: 6, padding: '10px 12px', marginBottom: 8, cursor: 'grab',
                                opacity: snap.isDragging ? 0.85 : 1,
                                boxShadow: snap.isDragging ? '0 4px 16px rgba(0,0,0,0.12)' : 'none',
                                transform: snap.isDragging ? 'rotate(1.5deg)' : 'none',
                                ...prov.draggableProps.style,
                              }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                  <span style={{ fontSize: 10, fontWeight: 700, color: dc.color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{task.dimName}</span>
                                  <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                                    {late && <span style={{ fontSize: 9, fontWeight: 700, color: '#c0392b', background: '#fdf2f2', padding: '1px 5px', borderRadius: 3 }}>ATRASADA</span>}
                                    <span style={{ fontSize: 12, color: '#bbb', cursor: 'grab' }}>⠿</span>
                                  </div>
                                </div>
                                <p style={{ fontSize: 12, fontWeight: 600, color: '#1a1a1a', lineHeight: 1.4, marginBottom: 6 }}>{task.title}</p>
                                {task.dueDate && <p style={{ fontSize: 11, color: late ? '#c0392b' : '#bbb' }}>{new Date(task.dueDate).toLocaleDateString('pt-BR')}</p>}
                              </div>
                            )}
                          </Draggable>
                        )
                      })}
                      {provided.placeholder}
                      {(byStatus[col.id] ?? []).length === 0 && (
                        <div style={{ padding: '20px 0', textAlign: 'center', color: '#bbb', fontSize: 12, border: `1.5px dashed ${snapshot.isDraggingOver ? col.color : '#e5e4e0'}`, borderRadius: 6 }}>
                          {snapshot.isDraggingOver ? 'Soltar aqui' : 'Nenhuma task'}
                        </div>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </div>
        </DragDropContext>
      )}
    </div>
  )
}
