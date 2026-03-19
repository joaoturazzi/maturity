'use client'

import dynamic from 'next/dynamic'
import { GeneratePlanButton } from './GeneratePlanButton'
import { DimensionNarrative } from './DimensionNarrative'

const RadarCharts = dynamic(() => import('./RadarCharts'), { ssr: false,
  loading: () => <div style={{ height: 240, background: '#f0efec', borderRadius: 8 }} /> })
const DeficiencyChart = dynamic(() => import('./DeficiencyChart'), { ssr: false,
  loading: () => <div style={{ height: 240, background: '#f0efec', borderRadius: 8 }} /> })

const PRIORITY_COLORS: Record<string, { color: string; bg: string }> = {
  Critical: { color: '#c0392b', bg: '#fdf2f2' },
  High:     { color: '#d68910', bg: '#fef9e7' },
  Medium:   { color: '#1a5276', bg: '#eaf2fb' },
  Low:      { color: '#555',    bg: '#f4f4f3' },
}

const MATURITY_COLORS: Record<string, string> = {
  Initial: '#c0392b', Developing: '#d68910', Defined: '#555',
  Managed: '#1a5276', Optimized: '#1e8449',
}

const DIM_COLORS: Record<string, { color: string }> = {
  'Estratégia': { color: '#1a5276' },
  'Produto':    { color: '#8e44ad' },
  'Mercado':    { color: '#1e8449' },
  'Finanças':   { color: '#d68910' },
  'Branding':   { color: '#c0392b' },
}

type TableRow = {
  dimension: string
  color: string | null
  atual: number
  desejado: number
  recomendado: number
  gap: number
  priority: string | null
  comportamental: number
  ferramental: number
  tecnica: number
  dimensionId?: string
  narrative?: string | null
  prevScore?: number | null
  delta?: number | null
  criticals?: Array<{ title: string; score: number; chosenText: string }>
}

type Props = {
  cycle: { overallImeScore: string | null; maturityLevel: string | null; submittedAt: Date | null }
  radarData: Array<{ dimension: string; atual: number; desejado: number; recomendado: number }>
  deficiencyData: Array<{ dimension: string; comportamental: number; ferramental: number; tecnica: number }>
  tableData: TableRow[]
  cycleId: string
  prevDiagnosticDate?: string | null
  prevImeScore?: number | null
  companyId: string
  hasExistingPlan: boolean
}

export function DiagnosticResult({ cycle, radarData, deficiencyData, tableData, cycleId, companyId, hasExistingPlan, prevDiagnosticDate, prevImeScore }: Props) {
  const mc = MATURITY_COLORS[cycle.maturityLevel ?? ''] ?? '#555'
  const imeScore = Number(cycle.overallImeScore ?? 0)

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif', padding: '0 16px 40px' }}>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 4 }}>
          Resultado do diagnóstico
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <span style={{ fontSize: 13, color: '#888' }}>IME Score </span>
            <span style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-1px' }}>{imeScore.toFixed(1)}</span>
            <span style={{ fontSize: 18, color: '#bbb', fontWeight: 400 }}>/5.0</span>
          </div>
          <div style={{ padding: '4px 14px', borderRadius: 20, background: `${mc}18`, border: `1px solid ${mc}40` }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: mc }}>{cycle.maturityLevel}</span>
          </div>
          {cycle.submittedAt && (
            <span style={{ fontSize: 12, color: '#bbb', marginLeft: 'auto' }}>
              {new Date(cycle.submittedAt).toLocaleDateString('pt-BR')}
            </span>
          )}
        </div>
        <div style={{ height: 6, background: '#eceae5', borderRadius: 3, overflow: 'hidden', marginTop: 12 }}>
          <div style={{ height: '100%', width: `${(imeScore / 5) * 100}%`, background: mc, borderRadius: 3, transition: 'width 0.5s' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
          {['Initial', 'Developing', 'Defined', 'Managed', 'Optimized'].map(l => (
            <span key={l} style={{ fontSize: 10, color: cycle.maturityLevel === l ? mc : '#bbb', fontWeight: cycle.maturityLevel === l ? 700 : 400 }}>{l}</span>
          ))}
        </div>
      </div>

      {/* Radars */}
      <RadarCharts radarData={radarData} />

      {/* Table */}
      <div style={{ background: '#fff', border: '1px solid #eceae5', borderRadius: 8, overflow: 'hidden', marginBottom: 20 }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #eceae5', background: '#f7f6f3' }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.09em' }}>Análise por dimensão</p>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f7f6f3' }}>
              {['Dimensão', 'Atual', 'Desejado', 'Mín. GROW', 'Gap', 'Prioridade'].map(h => (
                <th key={h} style={{ padding: '10px 16px', fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: h === 'Dimensão' ? 'left' : 'center', borderBottom: '1px solid #eceae5' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableData.map((row, i) => {
              const dc = DIM_COLORS[row.dimension] ?? { color: '#bbb' }
              const pc = PRIORITY_COLORS[row.priority ?? 'Low'] ?? PRIORITY_COLORS.Low
              return (
                <tr key={row.dimension} style={{ borderBottom: i < tableData.length - 1 ? '1px solid #f0efec' : 'none' }}>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: dc.color, flexShrink: 0 }} />
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{row.dimension}</span>
                    </div>
                    <div style={{ height: 3, background: '#f0efec', borderRadius: 2, marginTop: 6, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${(row.atual / 5) * 100}%`, background: dc.color, borderRadius: 2 }} />
                    </div>
                  </td>
                  <td style={{ textAlign: 'center', fontSize: 13, fontWeight: 700 }}>{row.atual.toFixed(1)}</td>
                  <td style={{ textAlign: 'center', fontSize: 13, color: '#888' }}>{row.desejado.toFixed(1)}</td>
                  <td style={{ textAlign: 'center', fontSize: 13, color: '#888' }}>{row.recomendado.toFixed(1)}</td>
                  <td style={{ textAlign: 'center' }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: row.gap > 2 ? '#c0392b' : row.gap > 1 ? '#d68910' : '#1e8449' }}>{row.gap.toFixed(1)}</span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: pc.bg, color: pc.color }}>{row.priority}</span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Deficiency chart */}
      <DeficiencyChart deficiencyData={deficiencyData} />

      {/* Deficiency breakdown */}
      <div style={{ background: '#fff', border: '1px solid #eceae5', borderRadius: 8, padding: '20px 24px', marginBottom: 20 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 16 }}>
          Tipo de deficiência por dimensão
        </p>
        {tableData.map(row => {
          const dc = DIM_COLORS[row.dimension] ?? { color: '#bbb' }
          const types = [
            { label: 'Comportamental', value: row.comportamental, color: '#8e44ad' },
            { label: 'Ferramental', value: row.ferramental, color: '#1a5276' },
            { label: 'Técnica', value: row.tecnica, color: '#d68910' },
          ].sort((a, b) => b.value - a.value)
          const dominant = types[0]
          const total = row.comportamental + row.ferramental + row.tecnica

          return (
            <div key={row.dimension} style={{ marginBottom: 14, paddingBottom: 14, borderBottom: '1px solid #f0efec' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: dc.color }}>{row.dimension}</span>
                {dominant.value > 0 && (
                  <span style={{ fontSize: 11, color: dominant.color, fontWeight: 700 }}>
                    Predominante: {dominant.label} ({dominant.value}%)
                  </span>
                )}
              </div>
              {total > 0 && (
                <>
                  <div style={{ height: 8, display: 'flex', borderRadius: 4, overflow: 'hidden' }}>
                    {types.map(t => t.value > 0 && (
                      <div key={t.label} style={{ width: `${(t.value / total) * 100}%`, background: t.color }} />
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
                    <span style={{ fontSize: 10, color: '#8e44ad' }}>■ Comportamental {row.comportamental}%</span>
                    <span style={{ fontSize: 10, color: '#1a5276' }}>■ Ferramental {row.ferramental}%</span>
                    <span style={{ fontSize: 10, color: '#d68910' }}>■ Técnica {row.tecnica}%</span>
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>

      {/* Qualitative analysis per dimension */}
      <div style={{ background: '#fff', border: '1px solid #eceae5', borderRadius: 8, padding: '20px 24px', marginBottom: 20 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 16 }}>
          Análise qualitativa por dimensão
        </p>
        {tableData.map(row => {
          const dc = DIM_COLORS[row.dimension] ?? { color: '#bbb' }
          return (
            <div key={row.dimension + '-narrative'} style={{ marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid #f0efec' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: dc.color }}>{row.dimension} — {row.atual.toFixed(1)}/5.0</span>
                {row.delta != null && (
                  <span style={{ fontSize: 12, fontWeight: 600, color: row.delta > 0 ? '#1e8449' : row.delta < 0 ? '#c0392b' : '#bbb' }}>
                    {row.delta > 0 ? '↑' : row.delta < 0 ? '↓' : '→'} {Math.abs(row.delta).toFixed(1)} vs anterior
                  </span>
                )}
              </div>
              {row.dimensionId && (
                <DimensionNarrative cycleId={cycleId} dimensionId={row.dimensionId} existingNarrative={row.narrative ?? null} dimColor={dc.color} />
              )}
              {row.criticals && row.criticals.length > 0 && (
                <div style={{ marginTop: 10 }}>
                  <p style={{ fontSize: 10, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                    Indicadores mais críticos
                  </p>
                  {row.criticals.map((ind, i) => (
                    <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 6 }}>
                      <span style={{ width: 22, height: 22, borderRadius: '50%', background: ind.score <= 2 ? '#fdf2f2' : '#fef9e7', color: ind.score <= 2 ? '#c0392b' : '#d68910', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{ind.score}</span>
                      <div>
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#1a1a1a' }}>{ind.title}</span>
                        {ind.chosenText && (
                          <p style={{ fontSize: 11, color: '#888', lineHeight: 1.4, marginTop: 2 }}>
                            &ldquo;{ind.chosenText.length > 120 ? ind.chosenText.slice(0, 120) + '...' : ind.chosenText}&rdquo;
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Evolution banner */}
      {prevDiagnosticDate && prevImeScore != null && (
        <div style={{
          background: Number(cycle.overallImeScore) > prevImeScore ? '#eafaf1' : '#fef9e7',
          border: `1px solid ${Number(cycle.overallImeScore) > prevImeScore ? '#b7dfc6' : '#f5deb3'}`,
          borderRadius: 8, padding: '14px 20px', marginBottom: 20,
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span style={{ fontSize: 18 }}>{Number(cycle.overallImeScore) > prevImeScore ? '📈' : '📊'}</span>
          <span style={{ fontSize: 13, color: '#1a1a1a' }}>
            {Number(cycle.overallImeScore) > prevImeScore
              ? `Evolução desde ${prevDiagnosticDate}: IME Score subiu de ${prevImeScore.toFixed(1)} para ${Number(cycle.overallImeScore).toFixed(1)}`
              : `Comparação com ${prevDiagnosticDate}: IME Score ${Number(cycle.overallImeScore).toFixed(1)} (anterior: ${prevImeScore.toFixed(1)})`}
          </span>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', alignItems: 'center' }}>
        <a href="/diagnostic" style={{ fontSize: 13, fontWeight: 600, color: '#555', textDecoration: 'none', padding: '9px 20px', border: '1px solid #e5e4e0', borderRadius: 6 }}>← Voltar</a>
        <GeneratePlanButton cycleId={cycleId} companyId={companyId} hasExistingPlan={hasExistingPlan} />
      </div>
    </div>
  )
}
