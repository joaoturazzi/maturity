'use client'

import { useState } from 'react'
import { useUser, useClerk } from '@clerk/nextjs'

export default function OnboardingPage() {
  const { user } = useUser()
  const { session } = useClerk()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    companyName: '',
    industry: 'Tecnologia',
    size: '1-10',
    websiteUrl: '',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.companyName.trim()) {
      setError('Nome da empresa é obrigatório.')
      return
    }
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      let data: Record<string, unknown> = {}
      try { data = await res.json() } catch {}

      if (!res.ok) {
        setError(String(data.error ?? `Erro ${res.status}. Tente novamente.`))
        setLoading(false)
        return
      }

      // Refresh JWT so middleware sees the new companyId
      try { await session?.reload() } catch {}
      try { await user?.reload() } catch {}

      // Poll /api/onboarding/check until JWT has companyId (max 5s)
      let ready = false
      for (let i = 0; i < 10; i++) {
        try {
          const check = await fetch('/api/onboarding/check')
          const checkData = await check.json()
          if (checkData.hasCompanyId) { ready = true; break }
        } catch {}
        await new Promise(r => setTimeout(r, 500))
      }

      // Redirect — use fallback flag if JWT not ready yet
      window.location.href = ready ? '/dashboard' : '/dashboard?onboarding=complete'
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'tente novamente'
      setError(`Erro inesperado: ${msg}`)
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: '#f7f6f3',
      fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif',
    }}>
      <div style={{
        background: '#fff', border: '1px solid #eceae5',
        borderRadius: 10, padding: '40px 44px',
        width: '100%', maxWidth: 460,
      }}>
        <p style={{
          fontSize: 11, fontWeight: 700, color: '#aaa',
          textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 8,
        }}>Configuração inicial</p>
        <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.3px', marginBottom: 6 }}>
          Bem-vindo ao MaturityIQ
        </h1>
        <p style={{ fontSize: 13, color: '#888', marginBottom: 32, lineHeight: 1.6 }}>
          Vamos configurar sua empresa antes de começar o diagnóstico.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 8 }}>
              Nome da empresa *
            </label>
            <input type="text" value={form.companyName} onChange={e => setForm(f => ({ ...f, companyName: e.target.value }))}
              placeholder="Ex: Grow Platform" required disabled={loading}
              style={{ width: '100%', fontSize: 13, padding: '8px 12px', border: '1px solid #e5e4e0', borderRadius: 6, background: '#fff', color: '#1a1a1a', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
          </div>

          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 8 }}>Setor</label>
            <select value={form.industry} onChange={e => setForm(f => ({ ...f, industry: e.target.value }))} disabled={loading}
              style={{ width: '100%', fontSize: 13, padding: '8px 12px', border: '1px solid #e5e4e0', borderRadius: 6, background: '#fff', color: '#1a1a1a', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}>
              <option>Tecnologia</option><option>Saúde</option><option>Educação</option>
              <option>Varejo</option><option>Indústria</option><option>Serviços</option><option>Outros</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 8 }}>Tamanho da equipe</label>
            <select value={form.size} onChange={e => setForm(f => ({ ...f, size: e.target.value }))} disabled={loading}
              style={{ width: '100%', fontSize: 13, padding: '8px 12px', border: '1px solid #e5e4e0', borderRadius: 6, background: '#fff', color: '#1a1a1a', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}>
              <option value="1-10">1–10 pessoas</option><option value="11-50">11–50 pessoas</option>
              <option value="51-200">51–200 pessoas</option><option value="200+">200+ pessoas</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 8 }}>
              Site da empresa <span style={{ fontWeight: 400, color: '#aaa', marginLeft: 6, textTransform: 'none' }}>opcional</span>
            </label>
            <input type="url" value={form.websiteUrl} onChange={e => setForm(f => ({ ...f, websiteUrl: e.target.value }))}
              placeholder="https://minhaempresa.com.br" disabled={loading}
              style={{ width: '100%', fontSize: 13, padding: '8px 12px', border: '1px solid #e5e4e0', borderRadius: 6, background: '#fff', color: '#1a1a1a', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
          </div>

          {error && (
            <p style={{ fontSize: 12, color: '#c0392b', margin: 0, background: '#fdf2f2', padding: '8px 12px', borderRadius: 6 }}>{error}</p>
          )}

          <button type="submit" disabled={loading} style={{
            background: loading ? '#888' : '#1a1a1a', color: '#fff', border: 'none',
            borderRadius: 6, padding: '11px 0', fontSize: 13, fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', marginTop: 4,
          }}>
            {loading ? 'Configurando sua conta...' : 'Começar →'}
          </button>
        </form>
      </div>
    </div>
  )
}
