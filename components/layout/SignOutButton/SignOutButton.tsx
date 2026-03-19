'use client'

import { useClerk } from '@clerk/nextjs'
import { useState } from 'react'
import styles from './SignOutButton.module.css'

export function SignOutButton() {
  const { signOut } = useClerk()
  const [loading, setLoading] = useState(false)

  async function handleSignOut() {
    setLoading(true)
    // 1. Delete httpOnly cookie on server
    await fetch('/api/auth/signout', { method: 'POST' }).catch(() => {})
    // 2. Clear sessionStorage flags
    try {
      sessionStorage.removeItem('maturityiq_cookie_refreshed')
    } catch {}
    // 3. Sign out via Clerk
    await signOut({ redirectUrl: '/login' })
  }

  return (
    <button
      onClick={handleSignOut}
      disabled={loading}
      className={styles.btn}
    >
      {loading ? '...' : 'Sair'}
    </button>
  )
}
