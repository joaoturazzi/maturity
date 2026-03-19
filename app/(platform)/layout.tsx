import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar/Sidebar'
import { PlatformHeader } from '@/components/layout/PlatformHeader/PlatformHeader'
import styles from './layout.module.css'

export default async function PlatformLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userId, sessionClaims } = await auth()
  if (!userId) redirect('/login')

  const role = (sessionClaims?.metadata as Record<string, string> | undefined)?.role ?? 'User'

  return (
    <div className={styles.shell}>
      <Sidebar userRole={role} />
      <div className={styles.main}>
        <PlatformHeader />
        <main className={styles.content}>
          {children}
        </main>
      </div>
    </div>
  )
}
