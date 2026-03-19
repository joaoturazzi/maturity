'use client'

import { useState, useMemo } from 'react'
import styles from './AdminDashboard.module.css'

const MATURITY_COLORS: Record<string, string> = {
  Initial: '#c0392b', Developing: '#d68910', Defined: '#555', Managed: '#1a5276', Optimized: '#1e8449',
}

const MATURITY_LEVELS = ['All', 'Initial', 'Developing', 'Defined', 'Managed', 'Optimized']

type DimScore = {
  weightedScore: string | null
  priorityLevel: string | null
  dimension: { name: string; color: string | null } | null
}

type CompanySummary = {
  id: string
  name: string
  industry: string | null
  userCount: number
  imeScore: number | null
  maturityLevel: string | null
  criticalDimensions: number
  lastDiagnosticAt: Date | null
  dimensionScores: DimScore[]
}

export function AdminDashboard({ companies }: { companies: CompanySummary[] }) {
  const [search, setSearch] = useState('')
  const [levelFilter, setLevelFilter] = useState('All')
  const [sortBy, setSortBy] = useState<'score' | 'name' | 'recent'>('score')

  const withDiagnostic = companies.filter(c => c.imeScore != null)
  const avgIME = withDiagnostic.length
    ? withDiagnostic.reduce((s, c) => s + c.imeScore!, 0) / withDiagnostic.length
    : 0
  const totalCritical = companies.reduce((s, c) => s + c.criticalDimensions, 0)

  const filtered = useMemo(() => {
    let result = companies
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(c => c.name.toLowerCase().includes(q))
    }
    if (levelFilter !== 'All') {
      result = result.filter(c => c.maturityLevel === levelFilter)
    }
    result = [...result].sort((a, b) => {
      if (sortBy === 'score') return (b.imeScore ?? 0) - (a.imeScore ?? 0)
      if (sortBy === 'name') return a.name.localeCompare(b.name)
      return ((b.lastDiagnosticAt?.getTime() ?? 0) - (a.lastDiagnosticAt?.getTime() ?? 0))
    })
    return result
  }, [companies, search, levelFilter, sortBy])

  const topStats = [
    { label: 'Total empresas',      value: companies.length },
    { label: 'Com diagnóstico',     value: withDiagnostic.length },
    { label: 'Média IME Score',     value: avgIME.toFixed(1) },
    { label: 'Dimensões Critical',  value: totalCritical },
  ]

  return (
    <div>
      {/* Top stats */}
      <div className={styles.statsRow}>
        {topStats.map(s => (
          <div key={s.label} className={styles.statCard}>
            <span className={styles.statLabel}>{s.label}</span>
            <span className={styles.statValue}>{s.value}</span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        <input
          className={styles.searchInput}
          placeholder="Buscar empresa..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div className={styles.pills}>
          {MATURITY_LEVELS.map(level => (
            <button
              key={level}
              className={`${styles.pill} ${levelFilter === level ? styles.pillActive : ''}`}
              onClick={() => setLevelFilter(level)}
            >
              {level}
            </button>
          ))}
        </div>
        <select
          className={styles.sortSelect}
          value={sortBy}
          onChange={e => setSortBy(e.target.value as 'score' | 'name' | 'recent')}
        >
          <option value="score">Ordenar por IME Score</option>
          <option value="name">Ordenar por Nome</option>
          <option value="recent">Ordenar por Atividade</option>
        </select>
      </div>

      {/* Company list */}
      {filtered.length === 0 ? (
        <p className={styles.empty}>Nenhuma empresa encontrada.</p>
      ) : (
        <div className={styles.list}>
          {filtered.map(company => {
            const color = MATURITY_COLORS[company.maturityLevel ?? 'Initial'] ?? '#555'
            return (
              <div key={company.id} className={styles.companyCard}>
                <div className={styles.companyHeader}>
                  <div>
                    <span className={styles.companyName}>{company.name}</span>
                    {company.industry && (
                      <span className={styles.industryBadge}>{company.industry}</span>
                    )}
                  </div>
                  <div className={styles.scoreArea}>
                    <span className={styles.imeScore} style={{ color }}>
                      {company.imeScore != null ? company.imeScore.toFixed(1) : '—'}
                    </span>
                    {company.maturityLevel && (
                      <span className={styles.matBadge} style={{ background: color + '18', color }}>
                        {company.maturityLevel}
                      </span>
                    )}
                  </div>
                </div>

                {/* Mini dimension bars */}
                {company.dimensionScores.length > 0 && (
                  <div className={styles.dimBars}>
                    {company.dimensionScores.map((ds, i) => {
                      const score = Number(ds.weightedScore ?? 0)
                      const dimColor = ds.dimension?.color ?? '#555'
                      return (
                        <div key={i} className={styles.dimBar}>
                          <span className={styles.dimBarLabel} style={{ color: dimColor }}>
                            {ds.dimension?.name?.substring(0, 3)}
                          </span>
                          <div className={styles.dimBarTrack}>
                            <div className={styles.dimBarFill} style={{ width: `${(score / 5) * 100}%`, background: dimColor }} />
                          </div>
                          <span className={styles.dimBarScore}>{score.toFixed(1)}</span>
                        </div>
                      )
                    })}
                  </div>
                )}

                <div className={styles.companyFooter}>
                  {company.criticalDimensions > 0 && (
                    <span className={styles.criticalNote}>
                      {company.criticalDimensions} dimensões críticas
                    </span>
                  )}
                  <span className={styles.lastActivity}>
                    {company.lastDiagnosticAt
                      ? `Último diagnóstico: ${new Date(company.lastDiagnosticAt).toLocaleDateString('pt-BR')}`
                      : 'Sem diagnóstico'}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
