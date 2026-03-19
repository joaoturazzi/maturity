import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar/Sidebar'
import { PlatformHeader } from '@/components/layout/PlatformHeader/PlatformHeader'
import styles from './layout.module.css'

export default async function PlatformLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session) redirect('/login')

  return (
    <div className={styles.shell}>
      <Sidebar userRole={session.user.role ?? 'User'} />
      <div className={styles.main}>
        <PlatformHeader userName={session.user.name ?? session.user.email ?? 'U'} />
        <main className={styles.content}>
          {children}
        </main>
      </div>
    </div>
  )
}
