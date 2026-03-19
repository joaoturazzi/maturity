'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import styles from './Sidebar.module.css'

const NAV_ITEMS = [
  { href: '/dashboard',    label: 'Dashboard',    icon: '◈' },
  { href: '/diagnostic',   label: 'Diagnóstico',  icon: '◎' },
  { href: '/action-plans', label: 'Action Plans',  icon: '✦' },
  { href: '/checkins',     label: 'Check-ins',     icon: '◷' },
  { href: '/reports',      label: 'Reports',       icon: '↗' },
  { href: '/ai-agents',    label: 'AI Agents',     icon: '⬡' },
]

const MANAGEMENT_ITEMS = [
  { href: '/dimensions',   label: 'Dimensões',    icon: '⬡' },
  { href: '/acceleration', label: 'Tabuleiro',     icon: '◈' },
  { href: '/admin',        label: 'Admin',         icon: '⊕' },
]

type Props = { userRole: string }

export function Sidebar({ userRole }: Props) {
  const pathname = usePathname()

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + '/')

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <strong className={styles.logoText}>MaturityIQ</strong>
        <span className={styles.logoSub}>Grow Platform</span>
      </div>

      <nav className={styles.nav}>
        {NAV_ITEMS.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={`${styles.navItem} ${isActive(item.href) ? styles.active : ''}`}
          >
            <span className={styles.icon}>{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}

        {(userRole === 'SuperUser' || userRole === 'Admin') && (
          <>
            <div className={styles.sectionLabel}>Gestão</div>
            {MANAGEMENT_ITEMS.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.navItem} ${isActive(item.href) ? styles.active : ''}`}
              >
                <span className={styles.icon}>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </>
        )}
      </nav>
    </aside>
  )
}
