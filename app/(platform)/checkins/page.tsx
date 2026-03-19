import { auth } from '@clerk/nextjs/server'
import { parseClerkMeta } from '@/lib/clerkMeta'
import { redirect } from 'next/navigation'
import { getMyActiveTasks, getThisWeekCheckins } from '@/lib/db/queries'
import { CheckinPageClient } from '@/components/checkins/CheckinPageClient/CheckinPageClient'
import styles from './page.module.css'

export default async function CheckinsPage({
  searchParams,
}: {
  searchParams: Promise<{ taskId?: string }>
}) {
  const { userId, sessionClaims } = await auth()
  if (!userId) redirect('/login')

  const { companyId = '' } = parseClerkMeta(sessionClaims)
  if (!companyId) redirect('/onboarding')

  const [myTasks, thisWeekCheckins] = await Promise.all([
    getMyActiveTasks(userId, companyId),
    getThisWeekCheckins(userId, companyId),
  ])

  const checkedInTaskIds = thisWeekCheckins.map(c => c.taskId)
  const params = await searchParams
  const preselectedTaskId = params.taskId ?? null

  return (
    <div className={styles.page}>
      <div>
        <span className={styles.sectionLabel}>Acompanhamento</span>
        <h1 className={styles.title}>Check-ins semanais</h1>
        <p className={styles.subtitle}>Semana de {getWeekLabel()}</p>
      </div>

      <CheckinPageClient
        tasks={myTasks}
        checkedInTaskIds={checkedInTaskIds}
        preselectedTaskId={preselectedTaskId}
      />
    </div>
  )
}

function getWeekLabel(): string {
  const now = new Date()
  const day = now.getDay()
  const diff = now.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(now)
  monday.setDate(diff)
  return monday.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })
}
