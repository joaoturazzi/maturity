import { auth } from '@clerk/nextjs/server'
import { getReportData } from '@/lib/db/queries/reports'

export async function GET(req: Request) {
  const { userId, sessionClaims } = await auth()
  if (!userId) return new Response('Unauthorized', { status: 401 })

  const companyId = (sessionClaims?.metadata as Record<string, string>)?.companyId as string

  const { searchParams } = new URL(req.url)
  const period = searchParams.get('period')
  if (!period) return new Response('Period required', { status: 400 })

  const data = await getReportData(companyId, period)
  if (!data) return new Response('Not found', { status: 404 })

  const header = 'Dimensão,Score Atual,Score Anterior,Variação,Gap,Priority\n'
  const rows = data.dimensionScores.map(d =>
    [
      d.dimension?.name ?? '',
      Number(d.weightedScore).toFixed(2),
      d.prevScore?.toFixed(2) ?? '-',
      d.delta !== null ? (d.delta >= 0 ? '+' : '') + d.delta.toFixed(2) : '-',
      Number(d.maturityGap).toFixed(2),
      d.priorityLevel ?? '',
    ].join(',')
  ).join('\n')

  const csv = header + rows

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="maturityiq-report-${period.replace('/', '-')}.csv"`,
    },
  })
}
