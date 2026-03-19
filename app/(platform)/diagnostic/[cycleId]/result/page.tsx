import { auth } from '@clerk/nextjs/server'
import { getLatestCycleById } from '@/lib/db/queries'
import { getCompanyId } from '@/lib/getCompanyId'
import { redirect } from 'next/navigation'
import { ResultRadarWrapper } from '@/components/diagnostic/ResultRadarWrapper'
import Link from 'next/link'

export default async function ResultPage({ params }: { params: Promise<{ cycleId: string }> }) {
  const { cycleId } = await params
  const { userId } = await auth()
  if (!userId) redirect('/login')

  const companyId = await getCompanyId()
  if (!companyId) redirect('/onboarding')

  const cycle = await getLatestCycleById(cycleId)
  if (!cycle || cycle.companyId !== companyId) redirect('/diagnostic')

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

      <ResultRadarWrapper scores={cycle.dimensionScores} />

      <div>
        <Link href="/action-plans">Ver plano de ação →</Link>
        <Link href="/diagnostic">Voltar</Link>
      </div>
    </div>
  )
}
