'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts'

type DeficiencyItem = {
  dimension: string
  comportamental: number
  ferramental: number
  tecnica: number
}

export default function DeficiencyChart({ deficiencyData }: { deficiencyData: DeficiencyItem[] }) {
  return (
    <div style={{
      background: '#fff', border: '1px solid #eceae5',
      borderRadius: 8, padding: '20px 24px', marginBottom: 20,
    }}>
      <p style={{
        fontSize: 11, fontWeight: 700, color: '#aaa',
        textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 16,
      }}>Deficiências por dimensão</p>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={deficiencyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0efec" vertical={false} />
          <XAxis dataKey="dimension" tick={{ fontSize: 11, fill: '#888' }} axisLine={false} tickLine={false} />
          <YAxis tickFormatter={v => `${v}%`} tick={{ fontSize: 10, fill: '#bbb' }} axisLine={false} tickLine={false} domain={[0, 100]} />
          <Tooltip formatter={(v, name) => [`${v}%`, String(name)]} contentStyle={{ fontSize: 12 }} />
          <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
          <Bar dataKey="comportamental" name="Comportamental" fill="#8e44ad" radius={[3, 3, 0, 0]} maxBarSize={32} />
          <Bar dataKey="ferramental" name="Ferramental" fill="#1a5276" radius={[3, 3, 0, 0]} maxBarSize={32} />
          <Bar dataKey="tecnica" name="Técnica" fill="#d68910" radius={[3, 3, 0, 0]} maxBarSize={32} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
