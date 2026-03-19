'use client'

import { useState, useEffect } from 'react'
import { UserButton } from '@clerk/nextjs'
import Link from 'next/link'
import { SignOutButton } from '../SignOutButton/SignOutButton'
import styles from './PlatformHeader.module.css'

export function PlatformHeader() {
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    fetch('/api/alerts?unreadOnly=true')
      .then(r => r.json())
      .then(d => setUnreadCount(d.count ?? 0))
      .catch(() => {})
  }, [])

  return (
    <header className={styles.header}>
      <div className={styles.spacer} />

      <div className={styles.actions}>
        <Link href="/dashboard" className={styles.alertBtn}>
          <span>◎</span>
          {unreadCount > 0 && (
            <span className={styles.badge}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>

        <UserButton />
        <SignOutButton />
      </div>
    </header>
  )
}
