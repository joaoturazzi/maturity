'use client'

import { useState, useEffect, useCallback } from 'react'

const DIM_COLORS: Record<string, { color: string; bg: string }> = {
  'Estratégia': { color: '#1a5276', bg: '#eaf2fb' },
  'Produto':    { color: '#8e44ad', bg: '#f5eef8' },
  'Mercado':    { color: '#1e8449', bg: '#eafaf1' },
  'Finanças':   { color: '#d68910', bg: '#fef9e7' },
  'Branding':   { color: '#c0392b', bg: '#fdedec' },
}

const STATUSES = [
  { value: 'To Do',       label: 'A Fazer',      color: '#555' },
  { value: 'In Progress', label: 'Em Progresso', color: '#1a5276' },
  { value: 'In Review',   label: 'Em Revisão',   color: '#8e44ad' },
  { value: 'Done',        label: 'Concluído',    color: '#1e8449' },
  { value: 'Blocked',     label: 'Bloqueado',    color: '#c0392b' },
]

const PRI_COLORS: Record<string, { color: string; bg: string }> = {
  Critical: { color: '#c0392b', bg: '#fdf2f2' },
  High: { color: '#d68910', bg: '#fef9e7' },
  Medium: { color: '#1a5276', bg: '#eaf2fb' },
  Low: { color: '#555', bg: '#f4f4f3' },
}

export function TaskSlidePanel({ taskId, onClose, onStatusChange }: {
  taskId: string | null
  onClose: () => void
  onStatusChange: (taskId: string, newStatus: string) => void
}) {
  const [task, setTask] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleDraft, setTitleDraft] = useState('')

  useEffect(() => {
    if (!taskId) { setTask(null); return }
    setLoading(true)
    fetch(`/api/action-plans/tasks/${taskId}`)
      .then(r => r.json())
      .then(d => setTask(d.task ?? null))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [taskId])

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  const handleStatus = useCallback(async (s: string) => {
    if (!task) return
    setSaving(true)
    setTask(prev => prev ? { ...prev, status: s } : null)
    onStatusChange(task.id as string, s)
    await fetch(`/api/action-plans/tasks/${task.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: s }),
    }).finally(() => setSaving(false))
  }, [task, onStatusChange])

  const handleSaveTitle = useCallback(async () => {
    if (!task || !titleDraft.trim()) return
    setSaving(true)
    setTask(prev => prev ? { ...prev, title: titleDraft } : null)
    setEditingTitle(false)
    await fetch(`/api/action-plans/tasks/${task.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: titleDraft }),
    }).finally(() => setSaving(false))
  }, [task, titleDraft])

  if (!taskId) return null

  const ap = (task?.actionPlan as Record<string, unknown>) ?? {}
  const dim = (ap?.dimension as Record<string, string>) ?? {}
  const dimName = dim?.name ?? ''
  const dc = DIM_COLORS[dimName] ?? { color: '#1a1a1a', bg: '#f4f4f3' }
  const pc = PRI_COLORS[(ap?.priority as string) ?? ''] ?? PRI_COLORS.Low
  const checkins = (task?.checkins as Array<Record<string, unknown>>) ?? []
  const isLate = task?.dueDate && new Date(task.dueDate as string) < new Date() && task.status !== 'Done' && task.status !== 'Blocked'

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 40, animation: 'fadeIn 0.15s ease' }} />
      <div style={{
        position: 'fixed', top: 0, right: 0, width: '100%', maxWidth: 520, height: '100vh',
        background: '#fff', zIndex: 50, overflowY: 'auto', boxShadow: '-4px 0 40px rgba(0,0,0,0.12)',
        animation: 'slideIn 0.2s ease', fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif',
      }}>
        <style>{`@keyframes fadeIn{from{opacity:0}to{opacity:1}}@keyframes slideIn{from{transform:translateX(100%)}to{transform:translateX(0)}}`}</style>

        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #eceae5', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, background: '#fff', zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {task && <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: dc.bg, color: dc.color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{dimName}</span>}
            {saving && <span style={{ fontSize: 11, color: '#bbb' }}>Salvando...</span>}
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', fontSize: 20, cursor: 'pointer', color: '#888', padding: '4px 8px' }}>×</button>
        </div>

        {loading && <div style={{ padding: 32, textAlign: 'center', color: '#bbb' }}>Carregando...</div>}

        {task && !loading && (
          <div style={{ padding: '24px 24px 40px' }}>
            {/* Title */}
            <div style={{ marginBottom: 20 }}>
              {editingTitle ? (
                <div>
                  <input autoFocus value={titleDraft} onChange={e => setTitleDraft(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleSaveTitle(); if (e.key === 'Escape') setEditingTitle(false) }}
                    style={{ width: '100%', fontSize: 18, fontWeight: 700, border: 'none', borderBottom: `2px solid ${dc.color}`, outline: 'none', background: 'transparent', fontFamily: 'inherit', padding: '4px 0', letterSpacing: '-0.3px' }} />
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <button onClick={handleSaveTitle} style={{ fontSize: 11, fontWeight: 600, padding: '4px 12px', background: '#1a1a1a', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontFamily: 'inherit' }}>Salvar</button>
                    <button onClick={() => setEditingTitle(false)} style={{ fontSize: 11, fontWeight: 600, padding: '4px 12px', background: 'transparent', color: '#888', border: '1px solid #eceae5', borderRadius: 4, cursor: 'pointer', fontFamily: 'inherit' }}>Cancelar</button>
                  </div>
                </div>
              ) : (
                <h2 onClick={() => { setTitleDraft(task.title as string); setEditingTitle(true) }}
                  title="Clique para editar"
                  style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.3px', lineHeight: 1.4, cursor: 'text', color: '#1a1a1a' }}>
                  {task.title as string}
                </h2>
              )}
            </div>

            {/* Status pills */}
            <div style={{ marginBottom: 20 }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 8 }}>Status</p>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {STATUSES.map(s => (
                  <button key={s.value} onClick={() => handleStatus(s.value)} style={{
                    padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                    border: `1.5px solid ${String(task.status) === s.value ? s.color : '#e5e4e0'}`,
                    background: String(task.status) === s.value ? `${s.color}18` : '#fff',
                    color: String(task.status) === s.value ? s.color : '#888',
                  }}>{s.label}</button>
                ))}
              </div>
            </div>

            {/* Metadata grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
              <div style={{ padding: '12px 14px', background: '#f7f6f3', borderRadius: 8 }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>Prioridade</p>
                <span style={{ fontSize: 12, fontWeight: 700, color: pc.color, background: pc.bg, padding: '2px 8px', borderRadius: 4 }}>{String(ap.priority ?? '—')}</span>
              </div>
              <div style={{ padding: '12px 14px', background: '#f7f6f3', borderRadius: 8 }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>Prazo</p>
                <p style={{ fontSize: 12, fontWeight: 600, color: isLate ? '#c0392b' : '#1a1a1a' }}>
                  {task.dueDate ? new Date(task.dueDate as string).toLocaleDateString('pt-BR') : '—'}
                  {!!isLate && <span style={{ fontSize: 10, color: '#c0392b', background: '#fdf2f2', padding: '1px 5px', borderRadius: 3, marginLeft: 4 }}>ATRASADA</span>}
                </p>
              </div>
              <div style={{ padding: '12px 14px', background: '#f7f6f3', borderRadius: 8 }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>Criada em</p>
                <p style={{ fontSize: 12, fontWeight: 600 }}>{task.createdAt ? new Date(task.createdAt as string).toLocaleDateString('pt-BR') : '—'}</p>
              </div>
              <div style={{ padding: '12px 14px', background: '#f7f6f3', borderRadius: 8 }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>Concluída em</p>
                <p style={{ fontSize: 12, fontWeight: 600 }}>{task.completedAt ? new Date(task.completedAt as string).toLocaleDateString('pt-BR') : '—'}</p>
              </div>
            </div>

            {/* Description */}
            {task.description != null && (
              <div style={{ marginBottom: 20 }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 8 }}>Contexto</p>
                <div style={{ background: `${dc.color}10`, borderLeft: `3px solid ${dc.color}`, borderRadius: '0 6px 6px 0', padding: '12px 14px', fontSize: 13, color: '#1a1a1a', lineHeight: 1.6 }}>
                  {task.description as string}
                </div>
              </div>
            )}

            {/* Plan */}
            <div style={{ marginBottom: 20 }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 8 }}>Plano de ação</p>
              <div style={{ padding: '10px 14px', background: '#f7f6f3', borderRadius: 6, fontSize: 12, color: '#555' }}>{String(ap.title ?? '')}</div>
            </div>

            {/* Checkins */}
            <div style={{ marginBottom: 20 }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 12 }}>Check-ins ({checkins.length})</p>
              {checkins.length === 0 ? (
                <div style={{ padding: 16, textAlign: 'center', color: '#bbb', fontSize: 12, border: '1.5px dashed #eceae5', borderRadius: 6 }}>Nenhum check-in ainda.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {checkins.map((ci: Record<string, unknown>) => (
                    <div key={ci.id as string} style={{ padding: '12px 14px', background: '#f7f6f3', borderRadius: 8, borderLeft: `3px solid ${dc.color}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <span style={{ fontSize: 11, color: '#888' }}>{ci.submittedAt ? new Date(ci.submittedAt as string).toLocaleDateString('pt-BR') : '—'}</span>
                        {ci.confidenceRating != null && (
                          <div style={{ display: 'flex', gap: 2 }}>
                            {[1,2,3,4,5].map(n => <div key={n} style={{ width: 8, height: 8, borderRadius: '50%', background: n <= (ci.confidenceRating as number) ? dc.color : '#eceae5' }} />)}
                          </div>
                        )}
                      </div>
                      {ci.progressNotes != null && <p style={{ fontSize: 12, color: '#1a1a1a', lineHeight: 1.5, marginBottom: 6 }}>{String(ci.progressNotes)}</p>}
                      {ci.evidenceUrl != null && (
                        <a href={String(ci.evidenceUrl)} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: dc.color, textDecoration: 'none' }}>
                          🔗 {String(ci.evidenceNote || 'Ver evidência')}
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <a href={`/checkins?taskId=${task.id}`} style={{ display: 'block', textAlign: 'center', padding: 10, background: dc.bg, color: dc.color, fontWeight: 700, fontSize: 13, borderRadius: 6, textDecoration: 'none', border: `1px solid ${dc.color}30` }}>
              Fazer check-in nesta task →
            </a>
          </div>
        )}
      </div>
    </>
  )
}
