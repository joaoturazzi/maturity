import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { getIndicatorsWithDimensions } from '@/lib/db/queries'
import { DiagnosticFlow } from '@/components/diagnostic/DiagnosticFlow/DiagnosticFlow'

export default async function DiagnosticFlowPage({
  params,
}: {
  params: Promise<{ cycleId: string }>
}) {
  const session = await auth()
  if (!session) redirect('/login')

  const { cycleId } = await params

  const dimensionsData = await getIndicatorsWithDimensions()

  const dims = dimensionsData.map((d) => ({
    id: d.id,
    name: d.name,
    color: d.color,
    indicators: d.indicators.map((ind) => ({
      id: ind.id,
      title: ind.title,
      description: ind.description,
      responseOptions: (ind.responseOptions as any[]) ?? [],
      feedbackPerLevel: (ind.feedbackPerLevel as any[]) ?? [],
    })),
  }))

  return <DiagnosticFlow cycleId={cycleId} dimensions={dims} />
}
