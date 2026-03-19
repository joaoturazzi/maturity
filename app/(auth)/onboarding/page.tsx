'use client'

import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

const INDUSTRIES = ['Tecnologia', 'Saúde', 'Educação', 'Varejo', 'Indústria', 'Serviços', 'Outros']
const SIZES = ['1–10', '11–50', '51–200', '200+']

export default function OnboardingPage() {
  const { user } = useUser()
  const router = useRouter()
  const [form, setForm] = useState({ companyName: '', industry: '', size: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/onboarding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    if (res.ok) {
      await user?.reload()
      router.push('/dashboard')
    } else {
      const data = await res.json()
      setError(data.error ?? 'Erro ao criar empresa.')
    }
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: '#f7f6f3',
      fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif',
    }}>
      <div style={{
        background: '#fff', border: '1px solid #eceae5',
        borderRadius: 10, padding: 32, width: 400,
      }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>Sobre sua empresa</h1>
        <p style={{ fontSize: 13, color: '#888', marginBottom: 24 }}>
          Precisamos de algumas informações para configurar sua conta.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Nome da empresa</span>
            <input
              type="text"
              placeholder="Ex: Acme Ltda"
              value={form.companyName}
              onChange={e => setForm(p => ({ ...p, companyName: e.target.value }))}
              required
              style={{ fontSize: 13, padding: '7px 10px', border: '1px solid #e5e4e0', borderRadius: 6, outline: 'none', fontFamily: 'inherit' }}
            />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Setor</span>
            <select
              value={form.industry}
              onChange={e => setForm(p => ({ ...p, industry: e.target.value }))}
              required
              style={{ fontSize: 13, padding: '7px 10px', border: '1px solid #e5e4e0', borderRadius: 6, outline: 'none', fontFamily: 'inherit', background: '#fff' }}
            >
              <option value="">Selecionar...</option>
              {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
            </select>
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Tamanho</span>
            <select
              value={form.size}
              onChange={e => setForm(p => ({ ...p, size: e.target.value }))}
              required
              style={{ fontSize: 13, padding: '7px 10px', border: '1px solid #e5e4e0', borderRadius: 6, outline: 'none', fontFamily: 'inherit', background: '#fff' }}
            >
              <option value="">Selecionar...</option>
              {SIZES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>

          {error && (
            <p style={{ fontSize: 12, color: '#c0392b', background: '#fdf2f2', padding: '8px 12px', borderRadius: 6 }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              background: loading ? '#888' : '#1a1a1a', color: '#fff',
              border: 'none', padding: '9px 0', borderRadius: 6,
              fontSize: 13, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit', marginTop: 6,
            }}
          >
            {loading ? 'Criando...' : 'Continuar →'}
          </button>
        </form>
      </div>
    </div>
  )
}
