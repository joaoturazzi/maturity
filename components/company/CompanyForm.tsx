'use client'

import { useState } from 'react'

type Company = {
  id: string
  name: string
  industry: string | null
  size: string | null
  websiteUrl: string | null
  websiteSummary: unknown
  createdAt: Date
}

export function CompanyForm({ company }: { company: Company }) {
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: company.name,
    industry: company.industry ?? 'Tecnologia',
    size: company.size ?? '1-10',
    websiteUrl: company.websiteUrl ?? '',
  })

  async function handleSave() {
    setLoading(true)
    setError('')
    setSuccess(false)

    try {
      const res = await fetch('/api/company/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Erro ao salvar.')
        return
      }

      setSuccess(true)
      setEditing(false)
      setTimeout(() => setSuccess(false), 3000)
    } catch {
      setError('Erro inesperado. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const labelStyle: React.CSSProperties = {
    fontSize: 11, fontWeight: 700, color: '#555',
    textTransform: 'uppercase', letterSpacing: '0.06em',
    display: 'block', marginBottom: 6,
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', fontSize: 13, padding: '8px 12px',
    border: '1px solid #e5e4e0', borderRadius: 6,
    background: editing ? '#fff' : '#f7f6f3',
    color: '#1a1a1a', outline: 'none',
    fontFamily: 'inherit', boxSizing: 'border-box',
  }

  const summary = company.websiteSummary as Record<string, string> | null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Main card */}
      <div style={{ background: '#fff', border: '1px solid #eceae5', borderRadius: 8, padding: '24px 28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.09em' }}>
            Informações da empresa
          </p>
          {!editing ? (
            <button onClick={() => setEditing(true)} style={{
              background: 'transparent', border: '1px solid #e5e4e0', borderRadius: 6,
              padding: '5px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
              color: '#555', fontFamily: 'inherit',
            }}>Editar</button>
          ) : (
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => { setEditing(false); setError('') }} disabled={loading} style={{
                background: 'transparent', border: '1px solid #e5e4e0', borderRadius: 6,
                padding: '5px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                color: '#555', fontFamily: 'inherit',
              }}>Cancelar</button>
              <button onClick={handleSave} disabled={loading} style={{
                background: loading ? '#888' : '#1a1a1a', color: '#fff', border: 'none',
                borderRadius: 6, padding: '5px 14px', fontSize: 12, fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
              }}>{loading ? 'Salvando...' : 'Salvar'}</button>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <label style={labelStyle}>Nome da empresa</label>
            <input type="text" value={form.name} disabled={!editing}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={inputStyle} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={labelStyle}>Setor</label>
              <select value={form.industry} disabled={!editing}
                onChange={e => setForm(f => ({ ...f, industry: e.target.value }))} style={inputStyle}>
                <option>Tecnologia</option><option>Saúde</option><option>Educação</option>
                <option>Varejo</option><option>Indústria</option><option>Serviços</option><option>Outros</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Tamanho da equipe</label>
              <select value={form.size} disabled={!editing}
                onChange={e => setForm(f => ({ ...f, size: e.target.value }))} style={inputStyle}>
                <option value="1-10">1–10 pessoas</option><option value="11-50">11–50 pessoas</option>
                <option value="51-200">51–200 pessoas</option><option value="200+">200+ pessoas</option>
              </select>
            </div>
          </div>

          <div>
            <label style={labelStyle}>Site da empresa</label>
            <input type="url" value={form.websiteUrl} disabled={!editing}
              placeholder="https://minhaempresa.com.br"
              onChange={e => setForm(f => ({ ...f, websiteUrl: e.target.value }))} style={inputStyle} />
            {!editing && company.websiteUrl && (
              <a href={company.websiteUrl} target="_blank" rel="noopener noreferrer"
                style={{ fontSize: 11, color: '#1a5276', textDecoration: 'none', marginTop: 4, display: 'inline-block' }}>
                Abrir site →
              </a>
            )}
          </div>
        </div>

        {error && (
          <p style={{ fontSize: 12, color: '#c0392b', marginTop: 16, background: '#fdf2f2', padding: '8px 12px', borderRadius: 6 }}>
            {error}
          </p>
        )}
        {success && (
          <p style={{ fontSize: 12, color: '#1e8449', marginTop: 16, background: '#eafaf1', padding: '8px 12px', borderRadius: 6 }}>
            Informações salvas com sucesso.
          </p>
        )}
      </div>

      {/* AI context card */}
      {summary && (
        <div style={{ background: '#fff', border: '1px solid #eceae5', borderRadius: 8, padding: '24px 28px' }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 16 }}>
            Contexto extraído do site
          </p>
          <p style={{ fontSize: 11, color: '#bbb', marginBottom: 16 }}>
            Usado pelos agentes de IA para personalizar as respostas.
          </p>
          {[
            { label: 'O que fazem', value: summary.description },
            { label: 'Público-alvo', value: summary.targetAudience },
            { label: 'Proposta de valor', value: summary.valueProposition },
            { label: 'Tom de voz', value: summary.toneOfVoice },
            { label: 'Destaques', value: summary.highlights },
          ].filter(i => i.value).map(item => (
            <div key={item.label} style={{ padding: '10px 0', borderBottom: '1px solid #f0efec' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {item.label}
              </span>
              <p style={{ fontSize: 13, color: '#1a1a1a', marginTop: 4, lineHeight: 1.5 }}>{item.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Footer info */}
      <div style={{
        background: '#f7f6f3', border: '1px solid #eceae5', borderRadius: 8,
        padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span style={{ fontSize: 12, color: '#888' }}>
          ID: <code style={{ background: '#ebebea', padding: '1px 6px', borderRadius: 3, fontSize: 11 }}>{company.id}</code>
        </span>
        <span style={{ fontSize: 11, color: '#bbb' }}>
          Criada em {new Date(company.createdAt).toLocaleDateString('pt-BR')}
        </span>
      </div>
    </div>
  )
}
