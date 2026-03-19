'use client'

import dynamic from 'next/dynamic'

const ResultRadar = dynamic(
  () => import('@/components/diagnostic/ResultRadar/ResultRadar').then(m => m.ResultRadar),
  {
    ssr: false,
    loading: () => (
      <div style={{
        height: 400, background: '#f0efec',
        borderRadius: 8, display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        color: '#bbb', fontSize: 13,
      }}>
        Carregando gráfico...
      </div>
    ),
  }
)

type Props = {
  scores: Array<{
    dimension: { name: string; color: string | null } | null
    weightedScore: string | null
    desiredScore: string | null
  }>
}

export function ResultRadarWrapper(props: Props) {
  return <ResultRadar {...props} />
}
