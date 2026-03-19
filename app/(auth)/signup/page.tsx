'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import styles from './page.module.css'

const INDUSTRIES = [
  'Tecnologia', 'Saúde', 'Educação', 'Varejo',
  'Indústria', 'Serviços', 'Outros',
]

const SIZES = ['1–10 pessoas', '11–50', '51–200', '200+']

export default function SignupPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    companyName: '',
    industry: '',
    size: '',
  })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function updateField(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      // Create account
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Erro ao criar conta')
        return
      }

      // Auto login
      const result = await signIn('credentials', {
        email: form.email,
        password: form.password,
        redirect: false,
      })

      if (result?.error) {
        setError('Conta criada, mas falha ao entrar. Tente fazer login.')
      } else {
        router.push('/dashboard')
        router.refresh()
      }
    } catch {
      setError('Erro de conexão')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.logo}>
          <strong className={styles.logoText}>MaturityIQ</strong>
          <span className={styles.logoSub}>Grow Platform</span>
        </div>

        <h1 className={styles.title}>Criar conta</h1>
        <p className={styles.subtitle}>Comece sua jornada de maturidade</p>

        <form className={styles.form} onSubmit={handleSubmit}>
          <label className={styles.fieldLabel}>
            Nome completo
            <input
              className={styles.input}
              value={form.name}
              onChange={e => updateField('name', e.target.value)}
              required
              minLength={2}
              placeholder="Seu nome"
            />
          </label>

          <label className={styles.fieldLabel}>
            Email
            <input
              className={styles.input}
              type="email"
              value={form.email}
              onChange={e => updateField('email', e.target.value)}
              required
              placeholder="seu@email.com"
            />
          </label>

          <label className={styles.fieldLabel}>
            Senha
            <input
              className={styles.input}
              type="password"
              value={form.password}
              onChange={e => updateField('password', e.target.value)}
              required
              minLength={8}
              placeholder="Mínimo 8 caracteres"
            />
          </label>

          <label className={styles.fieldLabel}>
            Nome da empresa
            <input
              className={styles.input}
              value={form.companyName}
              onChange={e => updateField('companyName', e.target.value)}
              required
              minLength={2}
              placeholder="Nome da sua empresa"
            />
          </label>

          <label className={styles.fieldLabel}>
            Setor
            <select
              className={styles.select}
              value={form.industry}
              onChange={e => updateField('industry', e.target.value)}
            >
              <option value="">Selecione o setor</option>
              {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
            </select>
          </label>

          <label className={styles.fieldLabel}>
            Tamanho da empresa
            <select
              className={styles.select}
              value={form.size}
              onChange={e => updateField('size', e.target.value)}
            >
              <option value="">Selecione o tamanho</option>
              {SIZES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>

          {error && <p className={styles.error}>{error}</p>}

          <button className={styles.submitBtn} type="submit" disabled={loading}>
            {loading ? 'Criando conta...' : 'Criar conta'}
          </button>
        </form>

        <p className={styles.footer}>
          Já tem conta? <Link href="/login" className={styles.link}>Entrar</Link>
        </p>
      </div>
    </div>
  )
}
