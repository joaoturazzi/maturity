import { auth } from '@clerk/nextjs/server'
import { getCompanyId } from '@/lib/getCompanyId'
import { getReportData } from '@/lib/db/queries/reports'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    const { userId, sessionClaims } = await auth()
    if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const companyId = await getCompanyId()

    const { searchParams } = new URL(req.url)
    const period = searchParams.get('period')
    if (!period) return Response.json({ error: 'Period required' }, { status: 400 })

    const data = await getReportData(companyId, period)
    if (!data) return Response.json({ error: 'Not found' }, { status: 404 })

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
  } catch (error) {
    console.error('[reports/export/GET]', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
