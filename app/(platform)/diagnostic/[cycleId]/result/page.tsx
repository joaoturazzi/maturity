import { auth } from '@clerk/nextjs/server'
import { getLatestCycleById } from '@/lib/db/queries'
import dynamic from 'next/dynamic'
import { redirect } from 'next/navigation'

const ResultRadar = dynamic(
  () => import('@/components/diagnostic/ResultRadar/ResultRadar').then(m => m.ResultRadar),
  { ssr: false, loading: () => <div style={{ height: 400, background: '#f0efec', borderRadius: 8 }} /> }
)
import Link from 'next/link'

export default async function ResultPage({ params }: { params: Promise<{ cycleId: string }> }) {
  const { cycleId } = await params
  const { userId } = await auth()
  if (!userId) redirect('/login')

  const cycle = await getLatestCycleById(cycleId)
  if (!cycle) redirect('/diagnostic')

  return (
    <div>
      <div>
        <h1>Resultado do diagnóstico</h1>
        <p>
          IME Score: <strong>{cycle.overallImeScore}</strong>/5.0
        </p>
        <p>
          Nível de maturidade: <strong>{cycle.maturityLevel}</strong>
          {cycle.submittedAt && ` · ${new Date(cycle.submittedAt).toLocaleDateString('pt-BR')}`}
        </p>
      </div>

      <ResultRadar scores={cycle.dimensionScores} />

      <div>
        <Link href="/action-plans">Ver plano de ação →</Link>
        <Link href="/diagnostic">Voltar</Link>
      </div>
    </div>
  )
}
