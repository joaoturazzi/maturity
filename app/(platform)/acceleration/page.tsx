import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { accelerationEvents } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { AccelerationBoard } from '@/components/acceleration/AccelerationBoard/AccelerationBoard'
import styles from './page.module.css'

export default async function AccelerationPage() {
  const { userId, sessionClaims } = await auth()
  if (!userId) redirect('/login')

  const companyId = (sessionClaims?.metadata as Record<string, string> | undefined)?.companyId ?? ''
  if (!companyId) redirect('/onboarding')
  const role = (sessionClaims?.metadata as Record<string, string>)?.role

  const events = await db.query.accelerationEvents.findMany({
    where: eq(accelerationEvents.companyId, companyId),
    orderBy: accelerationEvents.scheduledFor,
  })

  return (
    <div className={styles.page}>
      <div>
        <span className={styles.sectionLabel}>Mentoria</span>
        <h1 className={styles.title}>Tabuleiro de Aceleração</h1>
        <p className={styles.subtitle}>Jornada de 10 meses — rituais de evolução</p>
      </div>

      <AccelerationBoard events={events} userRole={role ?? 'User'} />
    </div>
  )
}
