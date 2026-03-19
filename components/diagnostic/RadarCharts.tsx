'use client'

import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  ResponsiveContainer, Legend, Tooltip,
} from 'recharts'

type RadarDataItem = {
  dimension: string
  atual: number
  desejado: number
  recomendado: number
}

export default function RadarCharts({ radarData }: { radarData: RadarDataItem[] }) {
  const charts = [
    {
      title: 'Pontuação Atual',
      keys: [{ dataKey: 'atual' as const, color: '#1a5276', label: 'Atual' }],
    },
    {
      title: 'Mín. Recomendado GROW',
      keys: [{ dataKey: 'recomendado' as const, color: '#d68910', label: 'Mínimo GROW' }],
    },
    {
      title: 'Atual vs Desejado',
      keys: [
        { dataKey: 'atual' as const, color: '#1a5276', label: 'Atual' },
        { dataKey: 'desejado' as const, color: '#c0392b', label: 'Desejado' },
      ],
    },
  ]

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 20 }}>
      {charts.map(chart => (
        <div key={chart.title} style={{
          background: '#fff', border: '1px solid #eceae5', borderRadius: 8, padding: 16,
        }}>
          <p style={{
            fontSize: 11, fontWeight: 700, color: '#888',
            textTransform: 'uppercase', letterSpacing: '0.07em',
            marginBottom: 12, textAlign: 'center',
          }}>{chart.title}</p>
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart data={radarData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
              <PolarGrid stroke="#f0efec" />
              <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 10, fill: '#888' }} />
              {chart.keys.map(k => (
                <Radar key={k.dataKey} name={k.label} dataKey={k.dataKey}
                  stroke={k.color} fill={k.color} fillOpacity={0.15} strokeWidth={2} />
              ))}
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => [Number(v).toFixed(1), '']} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      ))}
    </div>
  )
}
