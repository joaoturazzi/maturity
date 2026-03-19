'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'

export default function OnboardingPage() {
  const router = useRouter()
  const { user } = useUser()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    companyName: '',
    industry: 'Tecnologia',
    size: '1-10',
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

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Erro ao salvar empresa.')
        return
      }

      // Reload Clerk session to pick up new metadata
      await user?.reload()

      router.push('/dashboard')
    } catch {
      setError('Erro inesperado. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f7f6f3',
      fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif',
    }}>
      <div style={{
        background: '#fff',
        border: '1px solid #eceae5',
        borderRadius: 10,
        padding: '36px 40px',
        width: '100%',
        maxWidth: 460,
      }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>
          Bem-vindo ao MaturityIQ
        </h1>
        <p style={{ fontSize: 13, color: '#888', marginBottom: 28 }}>
          Antes de começar, precisamos de algumas informações sobre sua empresa.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#555', display: 'block', marginBottom: 6 }}>
              Nome da empresa *
            </label>
            <input
              type="text"
              value={form.companyName}
              onChange={e => setForm(f => ({ ...f, companyName: e.target.value }))}
              placeholder="Ex: Grow Platform"
              required
              style={{
                width: '100%',
                fontSize: 13,
                padding: '8px 12px',
                border: '1px solid #e5e4e0',
                borderRadius: 6,
                background: '#fff',
                color: '#1a1a1a',
                outline: 'none',
                fontFamily: 'inherit',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#555', display: 'block', marginBottom: 6 }}>
              Setor
            </label>
            <select
              value={form.industry}
              onChange={e => setForm(f => ({ ...f, industry: e.target.value }))}
              style={{
                width: '100%',
                fontSize: 13,
                padding: '8px 12px',
                border: '1px solid #e5e4e0',
                borderRadius: 6,
                background: '#fff',
                color: '#1a1a1a',
                outline: 'none',
                fontFamily: 'inherit',
                boxSizing: 'border-box',
              }}
            >
              <option>Tecnologia</option>
              <option>Saúde</option>
              <option>Educação</option>
              <option>Varejo</option>
              <option>Indústria</option>
              <option>Serviços</option>
              <option>Outros</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#555', display: 'block', marginBottom: 6 }}>
              Tamanho da equipe
            </label>
            <select
              value={form.size}
              onChange={e => setForm(f => ({ ...f, size: e.target.value }))}
              style={{
                width: '100%',
                fontSize: 13,
                padding: '8px 12px',
                border: '1px solid #e5e4e0',
                borderRadius: 6,
                background: '#fff',
                color: '#1a1a1a',
                outline: 'none',
                fontFamily: 'inherit',
                boxSizing: 'border-box',
              }}
            >
              <option value="1-10">1–10 pessoas</option>
              <option value="11-50">11–50 pessoas</option>
              <option value="51-200">51–200 pessoas</option>
              <option value="200+">200+ pessoas</option>
            </select>
          </div>

          {error && (
            <p style={{ fontSize: 12, color: '#c0392b', margin: 0 }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              background: loading ? '#888' : '#1a1a1a',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              padding: '10px 0',
              fontSize: 13,
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
              marginTop: 8,
            }}
          >
            {loading ? 'Salvando...' : 'Começar →'}
          </button>
        </form>
      </div>
    </div>
  )
}
