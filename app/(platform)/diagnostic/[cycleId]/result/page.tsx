import { auth } from '@clerk/nextjs/server'
import { getLatestCycleById } from '@/lib/db/queries'
import { ResultRadar } from '@/components/diagnostic/ResultRadar/ResultRadar'
import { redirect } from 'next/navigation'
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
