'use client'

import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar,
  ResponsiveContainer, Tooltip,
} from 'recharts'

type DimensionScoreWithDimension = {
  dimension: { name: string } | null
  weightedScore: string | null
  desiredScore: string | null
}

type Props = {
  scores: DimensionScoreWithDimension[]
}

export function ResultRadar({ scores }: Props) {
  const data = scores.map(ds => ({
    dimension: ds.dimension?.name ?? '',
    atual: Number(ds.weightedScore ?? 0),
    desejado: Number(ds.desiredScore ?? 0),
    fullMark: 5,
  }))

  return (
    <div>
      <h3>Radar de maturidade</h3>
      <ResponsiveContainer width="100%" height={400}>
        <RadarChart data={data}>
          <PolarGrid />
          <PolarAngleAxis dataKey="dimension" />
          <Radar name="Atual" dataKey="atual" stroke="#1a5276" fill="#1a5276" fillOpacity={0.3} />
          <Radar name="Desejado" dataKey="desejado" stroke="#c0392b" fill="#c0392b" fillOpacity={0.1} />
          <Tooltip />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}
