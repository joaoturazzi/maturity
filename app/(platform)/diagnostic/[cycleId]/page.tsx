import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { diagnosticResponses } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { getIndicatorsWithDimensions } from '@/lib/db/queries'
import { DiagnosticFlow } from '@/components/diagnostic/DiagnosticFlow/DiagnosticFlow'

export default async function DiagnosticFlowPage({
  params,
}: {
  params: Promise<{ cycleId: string }>
}) {
  const { userId } = await auth()
  if (!userId) redirect('/login')

  const { cycleId } = await params

  const dimensionsData = await getIndicatorsWithDimensions()

  const dims = dimensionsData.map(d => ({
    id: d.id,
    name: d.name,
    orderIndex: d.orderIndex ?? 0,
    indicators: d.indicators.map(ind => ({
      id: ind.id,
      title: ind.title ?? '',
      description: ind.description ?? '',
      hasNaOption: (ind as Record<string, unknown>).hasNaOption as boolean ?? false,
      responseOptions: (ind.responseOptions as Array<{ level: number; text: string }>) ?? [],
      feedbackPerLevel: (ind.feedbackPerLevel as Array<{ level: number; feedback: string }>) ?? [],
    })),
  }))

  // Load existing responses for resumption
  const existing = await db.query.diagnosticResponses.findMany({
    where: eq(diagnosticResponses.cycleId, cycleId),
    columns: { indicatorId: true, score: true },
  })

  const responsesMap: Record<string, number> = {}
  for (const r of existing) {
    if (r.indicatorId && r.score != null) {
      responsesMap[r.indicatorId] = r.score
    }
  }

  return (
    <DiagnosticFlow
      cycleId={cycleId}
      dimensions={dims}
      existingResponses={responsesMap}
    />
  )
}
